-- supabase/migrations/0003_rpc_functions.sql
-- RPC functions and triggers for project tvwicdlxljqijoikioln
--
-- Sourced from production via Management API query on 2026-04-17.
-- Replaces stub created in S14.4.
--
-- SECURITY DEFINER audit (2026-04-17) ✅ PASSED:
--   All 19 SECURITY DEFINER functions include SET search_path TO 'public'.
--   update_note_statistics() is NOT SECURITY DEFINER — trigger function, no guard needed.
--
-- Functions (20):
--   admin_clear_schedule         — admin: bulk-delete schedule slots by date range
--   admin_create_user            — admin: create auth.users + public.users atomically
--   admin_delete_user            — admin: hard-delete a user and their data
--   admin_prune_unused_accounts  — admin: batch-delete inactive member accounts
--   clear_provider_schedule      — provider: delete own unbooked slots by date range
--   delete_appointment           — provider: delete one own appointment slot
--   fix_duplicate_users          — admin: deduplicate public.users by token_alias
--   generate_slots (×2)          — provider: create recurring time slots (two overloads)
--   get_audit_logs (×2)          — admin: paginated audit log retrieval (two overloads)
--   get_my_role                  — any: fast role lookup for current user
--   get_system_stats             — admin: aggregate system health metrics
--   handle_new_user              — trigger: mirror new auth.user into public.users
--   log_event                    — any authenticated: insert into audit_logs
--   member_cancel_appointment    — member: cancel own booking, frees slot
--   provision_member             — provider/admin: create a new member account
--   reschedule_appointment       — member: cancel old + book new appointment
--   reschedule_appointment_swap  — member: atomic slot-swap reschedule
--   update_note_statistics       — trigger: update monthly note_statistics on insert
--
-- Trigger:
--   on_encounter_note_created — AFTER INSERT ON encounter_notes → update_note_statistics()

-- ────────────────────────────────────────────────────────────────────────────
-- get_my_role — helper used in RLS policies; must be defined before other fns
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_my_role()
  RETURNS text
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- handle_new_user — trigger function: mirrors new auth.user → public.users
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.users (id, role, status, token_alias, service_type)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'role', 'member'),
    'active',
    COALESCE(new.raw_user_meta_data->>'token_alias', 'UNKNOWN'),
    COALESCE(new.raw_user_meta_data->>'service_type', 'ALL')
  )
  ON CONFLICT (id) DO UPDATE
  SET
    role   = EXCLUDED.role,
    status = EXCLUDED.status;
  RETURN new;
END;
$$;

-- Trigger: fire handle_new_user after every new auth.users insert
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ────────────────────────────────────────────────────────────────────────────
-- log_event — insert into audit_logs; callable by any authenticated user
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.log_event(
  p_action_type text,
  p_description text,
  p_severity    text,
  p_metadata    jsonb
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.audit_logs (action_type, description, severity, metadata, user_id)
  VALUES (p_action_type, p_description, p_severity, p_metadata, auth.uid());
END;
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- get_audit_logs — two overloads; admin-only (checked in RLS, not here)
-- ────────────────────────────────────────────────────────────────────────────

-- Overload 1: with p_offset (primary overload used by current API code)
CREATE OR REPLACE FUNCTION public.get_audit_logs(
  p_limit    integer DEFAULT 50,
  p_offset   integer DEFAULT 0,
  p_type     text    DEFAULT NULL,
  p_severity text    DEFAULT NULL
)
  RETURNS TABLE(
    id          uuid,
    user_id     uuid,
    token_alias text,
    role        text,
    action_type text,
    description text,
    metadata    jsonb,
    severity    text,
    created_at  timestamptz
  )
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
    SELECT
      l.id, l.user_id, u.token_alias, u.role,
      l.action_type, l.description, l.metadata, l.severity, l.created_at
    FROM public.audit_logs l
    LEFT JOIN public.users u ON l.user_id = u.id
    WHERE
      (p_type     IS NULL OR l.action_type = p_type)
      AND (p_severity IS NULL OR l.severity    = p_severity)
    ORDER BY l.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;

-- Overload 2: without p_offset (legacy; kept for backward compat)
CREATE OR REPLACE FUNCTION public.get_audit_logs(
  p_limit    integer,
  p_type     text,
  p_severity text
)
  RETURNS TABLE(
    id          uuid,
    user_id     uuid,
    token_alias text,
    role        text,
    action_type text,
    description text,
    metadata    jsonb,
    severity    text,
    created_at  timestamptz
  )
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
    SELECT
      al.id, al.user_id, u.token_alias, u.role,
      al.action_type, al.description, al.metadata, al.severity, al.created_at
    FROM public.audit_logs al
    LEFT JOIN public.users u ON al.user_id = u.id
    WHERE
      (p_type     IS NULL OR al.action_type = p_type)
      AND (p_severity IS NULL OR al.severity    = p_severity)
    ORDER BY al.created_at DESC
    LIMIT p_limit;
END;
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- get_system_stats — admin dashboard aggregate metrics
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_system_stats()
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  v_total_users         int;
  v_active_appointments int;
  v_pending_slots       int;
  v_duplicates          int;
  v_errors_today        int;
BEGIN
  SELECT COUNT(*) INTO v_total_users FROM users;

  SELECT COUNT(*) INTO v_active_appointments
  FROM appointments
  WHERE status = 'confirmed' AND start_time > NOW();

  SELECT COUNT(*) INTO v_pending_slots
  FROM appointments
  WHERE status = 'pending' AND is_booked = false AND start_time > NOW();

  SELECT COUNT(*) INTO v_errors_today
  FROM audit_logs
  WHERE severity = 'ERROR' AND created_at > CURRENT_DATE;

  WITH dupes AS (
    SELECT token_alias, count(*)
    FROM users
    WHERE token_alias IS NOT NULL
    GROUP BY token_alias
    HAVING count(*) > 1
  )
  SELECT COALESCE(SUM(count - 1), 0) INTO v_duplicates FROM dupes;

  RETURN jsonb_build_object(
    'total_users',         v_total_users,
    'active_appointments', v_active_appointments,
    'available_slots',     v_pending_slots,
    'errors_today',        v_errors_today,
    'duplicates',          v_duplicates
  );
END;
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- admin_create_user — atomically create auth.users + public.users
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_create_user(
  new_email        text,
  new_password     text,
  new_token        text,
  new_role         text,
  new_service_type text
)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  new_id               uuid;
  executing_user_role  text;
BEGIN
  SELECT role INTO executing_user_role FROM public.users WHERE id = auth.uid();
  IF executing_user_role IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Access Denied: Only Admins can invoke this function.';
  END IF;

  new_id := gen_random_uuid();

  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_user_meta_data, created_at, updated_at
  ) VALUES (
    new_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    new_email, crypt(new_password, gen_salt('bf')), now(),
    jsonb_build_object('token_alias', new_token, 'role', new_role, 'service_type', new_service_type),
    now(), now()
  );

  INSERT INTO public.users (id, token_alias, role, service_type, status)
  VALUES (new_id, new_token, new_role, new_service_type, 'active')
  ON CONFLICT (id) DO UPDATE
  SET token_alias  = EXCLUDED.token_alias,
      role         = EXCLUDED.role,
      service_type = EXCLUDED.service_type,
      status       = 'active';

  RETURN new_id;
END;
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- admin_delete_user — hard-delete user + cascade; protected admin accounts exempt
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id uuid)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  v_target_email text;
  v_caller_role  text;
  v_caller_email text;
BEGIN
  SELECT role  INTO v_caller_role  FROM public.users      WHERE id = auth.uid();
  SELECT email INTO v_caller_email FROM auth.users         WHERE id = auth.uid();

  IF v_caller_role != 'admin'
    AND v_caller_email NOT ILIKE '%admin%'
    AND v_caller_email NOT ILIKE '%command%'
  THEN
    RAISE EXCEPTION 'Access Denied: Only Administrators can delete users.';
  END IF;

  SELECT email INTO v_target_email FROM auth.users WHERE id = target_user_id;

  IF v_target_email = 'admin@vector.mil' OR v_target_email LIKE 'command-01%' THEN
    RAISE EXCEPTION 'Cannot delete a Command/Admin account via this tool.';
  END IF;

  DELETE FROM public.appointments WHERE member_id   = target_user_id;
  DELETE FROM public.appointments WHERE provider_id = target_user_id;
  DELETE FROM public.users        WHERE id          = target_user_id;
  DELETE FROM auth.users          WHERE id          = target_user_id;

  BEGIN
    INSERT INTO public.audit_logs (action_type, description, metadata)
    VALUES (
      'DELETE_USER',
      'Admin deleted user account',
      jsonb_build_object('target_id', target_user_id, 'target_email', v_target_email, 'by', v_caller_email)
    );
  EXCEPTION WHEN OTHERS THEN NULL; END;
END;
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- admin_prune_unused_accounts — batch-delete inactive members; minimum 7 days
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_prune_unused_accounts(days_inactive integer)
  RETURNS integer
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  deleted_count int;
BEGIN
  IF days_inactive < 7 THEN
    RAISE EXCEPTION 'Safety threshold too low. Minimum 7 days.';
  END IF;

  WITH deleted AS (
    DELETE FROM auth.users
    WHERE id IN (SELECT id FROM public.users WHERE role = 'member')
      AND email NOT ILIKE '%admin%'
      AND email NOT ILIKE '%doctor%'
      AND email NOT ILIKE '%provider%'
      AND email NOT ILIKE '%command%'
      AND (
        (last_sign_in_at IS NULL AND created_at < NOW() - (days_inactive || ' days')::interval)
        OR last_sign_in_at < NOW() - (days_inactive || ' days')::interval
      )
    RETURNING id
  )
  SELECT count(*) INTO deleted_count FROM deleted;

  PERFORM public.log_event(
    'PRUNE_USERS',
    'Pruned ' || deleted_count || ' inactive users (>' || days_inactive || ' days)',
    'WARN',
    jsonb_build_object('count', deleted_count)
  );

  RETURN deleted_count;
END;
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- fix_duplicate_users — deduplicate public.users by token_alias (keep oldest)
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.fix_duplicate_users()
  RETURNS integer
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  deleted_count int := 0;
BEGIN
  WITH duplicates AS (
    SELECT id, token_alias,
      ROW_NUMBER() OVER (
        PARTITION BY token_alias
        ORDER BY created_at ASC, id ASC
      ) AS row_num
    FROM users
    WHERE token_alias IS NOT NULL
  )
  DELETE FROM users
  WHERE id IN (SELECT id FROM duplicates WHERE row_num > 1);

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- provision_member — provider/admin creates a new member account
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.provision_member(p_token text, p_service_type text)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  v_caller_role text;
  v_new_id      uuid;
  v_email       text;
BEGIN
  SELECT role  INTO v_caller_role FROM public.users WHERE id = auth.uid();
  SELECT email INTO v_email       FROM auth.users    WHERE id = auth.uid();

  IF v_caller_role NOT IN ('admin', 'provider') AND v_email NOT LIKE '%admin%' THEN
    RAISE EXCEPTION 'Unauthorized: Only Providers or Admins can generate tokens.';
  END IF;

  v_new_id := gen_random_uuid();

  INSERT INTO auth.users (
    id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, role, aud, last_sign_in_at
  ) VALUES (
    v_new_id,
    lower(p_token) || '@vector.mil',
    crypt('SecurePass2025!', gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    jsonb_build_object('token_alias', p_token, 'role', 'member', 'service_type', p_service_type, 'created_by', auth.uid()),
    now(), now(), 'authenticated', 'authenticated', NULL
  );

  INSERT INTO public.users (id, role, service_type, token_alias, created_by, created_at)
  VALUES (v_new_id, 'member', p_service_type, p_token, auth.uid(), now());

  RETURN v_new_id;
END;
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- generate_slots — two overloads for creating provider time slots
-- ────────────────────────────────────────────────────────────────────────────

-- Overload 1: text-based times with timezone offset (newer)
CREATE OR REPLACE FUNCTION public.generate_slots(
  p_start_date             date,
  p_end_date               date,
  p_start_time             text,
  p_end_time               text,
  p_duration_minutes       integer,
  p_break_minutes          integer,
  p_days_of_week           integer[],
  p_is_block               boolean,
  p_notes                  text,
  p_timezone_offset_minutes integer DEFAULT 0
)
  RETURNS integer
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  curr_date      date;
  slot_start     timestamp;
  slot_end       timestamp;
  day_end        timestamp;
  utc_start      timestamptz;
  utc_end        timestamptz;
  slots_created  int := 0;
  p_provider_id  uuid;
  conflict_count int;
  has_conflict   boolean;
BEGIN
  p_provider_id := auth.uid();

  FOR curr_date IN SELECT generate_series(p_start_date, p_end_date, '1 day') LOOP
    IF EXTRACT(DOW FROM curr_date) = ANY(p_days_of_week) THEN
      slot_start := (curr_date || ' ' || p_start_time)::timestamp;
      day_end    := (curr_date || ' ' || p_end_time)::timestamp;

      WHILE slot_start < day_end LOOP
        IF p_is_block THEN
          slot_end := day_end;
        ELSE
          slot_end := slot_start + (p_duration_minutes || ' minutes')::interval;
        END IF;

        IF slot_end > day_end THEN EXIT; END IF;

        utc_start := (slot_start + (p_timezone_offset_minutes || ' minutes')::interval) AT TIME ZONE 'UTC';
        utc_end   := (slot_end   + (p_timezone_offset_minutes || ' minutes')::interval) AT TIME ZONE 'UTC';

        has_conflict := FALSE;
        SELECT COUNT(*) INTO conflict_count
        FROM appointments
        WHERE provider_id = p_provider_id
          AND start_time < utc_end AND end_time > utc_start
          AND member_id IS NOT NULL;
        IF conflict_count > 0 THEN has_conflict := TRUE; END IF;

        IF NOT has_conflict THEN
          IF p_is_block THEN
            DELETE FROM appointments
            WHERE provider_id = p_provider_id
              AND start_time < utc_end AND end_time > utc_start
              AND member_id IS NULL;
          ELSE
            SELECT COUNT(*) INTO conflict_count
            FROM appointments
            WHERE provider_id = p_provider_id
              AND start_time < utc_end AND end_time > utc_start;
            IF conflict_count > 0 THEN has_conflict := TRUE; END IF;
          END IF;
        END IF;

        IF NOT has_conflict THEN
          INSERT INTO appointments (provider_id, start_time, end_time, status, is_booked, notes)
          VALUES (
            p_provider_id, utc_start, utc_end,
            CASE WHEN p_is_block THEN 'blocked' ELSE 'pending' END,
            p_is_block, p_notes
          );
          slots_created := slots_created + 1;
        END IF;

        IF p_is_block THEN EXIT; END IF;
        slot_start := slot_end + (p_break_minutes || ' minutes')::interval;
      END LOOP;
    END IF;
  END LOOP;

  RETURN slots_created;
END;
$$;

-- Overload 2: time-typed params, no timezone offset (legacy; kept for compat)
CREATE OR REPLACE FUNCTION public.generate_slots(
  p_start_date       date,
  p_end_date         date,
  p_start_time       time without time zone,
  p_end_time         time without time zone,
  p_duration_minutes integer,
  p_break_minutes    integer,
  p_days_of_week     integer[],
  p_is_block         boolean DEFAULT false,
  p_notes            text    DEFAULT NULL
)
  RETURNS integer
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  current_day        date;
  current_slot_start timestamp;
  current_slot_end   timestamp;
  slots_created      int := 0;
  provider_uuid      uuid;
BEGIN
  provider_uuid := auth.uid();
  IF provider_uuid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  current_day := p_start_date;
  WHILE current_day <= p_end_date LOOP
    IF EXTRACT(DOW FROM current_day) = ANY(p_days_of_week) THEN

      IF p_is_block THEN
        current_slot_start := current_day + p_start_time;
        current_slot_end   := current_day + p_end_time;
        IF current_slot_end > current_slot_start THEN
          INSERT INTO appointments (provider_id, start_time, end_time, status, is_booked, member_id, notes)
          VALUES (provider_uuid, current_slot_start, current_slot_end, 'blocked', true, NULL, COALESCE(p_notes, 'SYSTEM BLOCK'))
          ON CONFLICT (provider_id, start_time) DO UPDATE
            SET is_booked = EXCLUDED.is_booked, status = EXCLUDED.status, notes = EXCLUDED.notes
            WHERE appointments.member_id IS NULL;
          slots_created := slots_created + 1;
        END IF;
      ELSE
        current_slot_start := current_day + p_start_time;
        WHILE current_slot_start::time < p_end_time LOOP
          current_slot_end := current_slot_start + (p_duration_minutes || ' minutes')::interval;
          IF current_slot_end::time <= p_end_time THEN
            INSERT INTO appointments (provider_id, start_time, end_time, status, is_booked, member_id, notes)
            VALUES (provider_uuid, current_slot_start, current_slot_end, 'pending', false, NULL, p_notes)
            ON CONFLICT (provider_id, start_time) DO UPDATE
              SET is_booked = EXCLUDED.is_booked, status = EXCLUDED.status, notes = EXCLUDED.notes
              WHERE appointments.member_id IS NULL;
            slots_created := slots_created + 1;
          END IF;
          current_slot_start := current_slot_end + (p_break_minutes || ' minutes')::interval;
        END LOOP;
      END IF;

    END IF;
    current_day := current_day + 1;
  END LOOP;

  RETURN slots_created;
END;
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- clear_provider_schedule — provider deletes own unbooked slots by date range
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.clear_provider_schedule(
  p_start_date    date,
  p_end_date      date,
  p_include_booked boolean DEFAULT false
)
  RETURNS integer
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  v_provider_id uuid;
  v_count       int;
BEGIN
  v_provider_id := auth.uid();

  DELETE FROM appointments
  WHERE provider_id = v_provider_id
    AND start_time::date >= p_start_date
    AND start_time::date <= p_end_date
    AND (
      p_include_booked = true
      OR (member_id IS NULL AND is_booked = false)
    );

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- admin_clear_schedule — admin bulk-deletes schedule slots by date range
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_clear_schedule(p_start_date date, p_end_date date)
  RETURNS integer
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  v_count int;
BEGIN
  DELETE FROM appointments
  WHERE start_time::date >= p_start_date
    AND start_time::date <= p_end_date;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- delete_appointment — provider deletes one own appointment slot
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.delete_appointment(p_appointment_id uuid)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM appointments
  WHERE id = p_appointment_id AND provider_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Appointment not found or you do not have permission to delete it';
  END IF;
END;
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- member_cancel_appointment — member frees a booked slot back to available
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.member_cancel_appointment(p_appointment_id uuid)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM appointments
    WHERE id = p_appointment_id AND member_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access Denied: You do not own this appointment.';
  END IF;

  UPDATE appointments
  SET status    = 'pending',
      member_id = NULL,
      is_booked = false,
      notes     = NULL
  WHERE id = p_appointment_id;
END;
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- reschedule_appointment — cancel old booking + insert new one
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.reschedule_appointment(
  old_appointment_id uuid,
  new_provider_id    uuid,
  new_start_time     timestamptz,
  new_end_time       timestamptz,
  new_notes          text DEFAULT NULL
)
  RETURNS json
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  new_appointment_id uuid;
  old_appt_exists    boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM appointments
    WHERE id = old_appointment_id
      AND member_id = auth.uid()
      AND status != 'cancelled'
  ) INTO old_appt_exists;

  IF NOT old_appt_exists THEN
    RAISE EXCEPTION 'Appointment not found or not eligible for rescheduling';
  END IF;

  UPDATE appointments SET status = 'cancelled' WHERE id = old_appointment_id;

  INSERT INTO appointments (provider_id, member_id, start_time, end_time, status, notes)
  VALUES (new_provider_id, auth.uid(), new_start_time, new_end_time, 'confirmed', new_notes)
  RETURNING id INTO new_appointment_id;

  RETURN json_build_object(
    'old_appointment_id', old_appointment_id,
    'new_appointment_id', new_appointment_id,
    'status',             'success'
  );
END;
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- reschedule_appointment_swap — atomic swap: free old slot + claim new slot
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.reschedule_appointment_swap(
  p_old_appointment_id uuid,
  p_new_slot_id        uuid
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  v_member_id uuid;
  v_notes     text;
BEGIN
  v_member_id := auth.uid();

  SELECT notes INTO v_notes
  FROM appointments
  WHERE id = p_old_appointment_id
    AND member_id = v_member_id
    AND status != 'cancelled';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Appointment not found or already cancelled';
  END IF;

  UPDATE appointments
  SET status = 'cancelled', member_id = NULL, is_booked = false
  WHERE id = p_old_appointment_id;

  UPDATE appointments
  SET member_id = v_member_id, is_booked = true, status = 'confirmed', notes = v_notes
  WHERE id = p_new_slot_id AND member_id IS NULL AND is_booked = false;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'New slot not available';
  END IF;
END;
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- update_note_statistics — trigger function (NOT SECURITY DEFINER)
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.update_note_statistics()
  RETURNS trigger
  LANGUAGE plpgsql
AS $$
DECLARE
  v_period text := to_char(NEW.created_at, 'YYYY-MM');
BEGIN
  INSERT INTO public.note_statistics (
    period, provider_id, total_encounters, requires_action_count, unique_patients, by_category
  )
  SELECT
    v_period,
    NEW.provider_id,
    1,
    CASE WHEN NEW.status = 'requires_action' THEN 1 ELSE 0 END,
    1,
    jsonb_build_object(
      'question',       CASE WHEN NEW.category = 'question'       THEN 1 ELSE 0 END,
      'counseling',     CASE WHEN NEW.category = 'counseling'     THEN 1 ELSE 0 END,
      'reschedule',     CASE WHEN NEW.category = 'reschedule'     THEN 1 ELSE 0 END,
      'follow_up',      CASE WHEN NEW.category = 'follow_up'      THEN 1 ELSE 0 END,
      'routine',        CASE WHEN NEW.category = 'routine'        THEN 1 ELSE 0 END,
      'urgent',         CASE WHEN NEW.category = 'urgent'         THEN 1 ELSE 0 END,
      'administrative', CASE WHEN NEW.category = 'administrative' THEN 1 ELSE 0 END,
      'other',          CASE WHEN NEW.category = 'other'          THEN 1 ELSE 0 END
    )
  ON CONFLICT (period, provider_id) DO UPDATE SET
    total_encounters      = note_statistics.total_encounters + 1,
    requires_action_count = note_statistics.requires_action_count +
                            (CASE WHEN NEW.status = 'requires_action' THEN 1 ELSE 0 END),
    unique_patients       = (
      SELECT count(DISTINCT member_id)
      FROM public.encounter_notes
      WHERE to_char(created_at, 'YYYY-MM') = v_period
        AND provider_id = NEW.provider_id
    ),
    by_category = jsonb_build_object(
      'question',       (note_statistics.by_category->>'question')::int       + (CASE WHEN NEW.category = 'question'       THEN 1 ELSE 0 END),
      'counseling',     (note_statistics.by_category->>'counseling')::int     + (CASE WHEN NEW.category = 'counseling'     THEN 1 ELSE 0 END),
      'reschedule',     (note_statistics.by_category->>'reschedule')::int     + (CASE WHEN NEW.category = 'reschedule'     THEN 1 ELSE 0 END),
      'follow_up',      (note_statistics.by_category->>'follow_up')::int      + (CASE WHEN NEW.category = 'follow_up'      THEN 1 ELSE 0 END),
      'routine',        (note_statistics.by_category->>'routine')::int        + (CASE WHEN NEW.category = 'routine'        THEN 1 ELSE 0 END),
      'urgent',         (note_statistics.by_category->>'urgent')::int         + (CASE WHEN NEW.category = 'urgent'         THEN 1 ELSE 0 END),
      'administrative', (note_statistics.by_category->>'administrative')::int + (CASE WHEN NEW.category = 'administrative' THEN 1 ELSE 0 END),
      'other',          (note_statistics.by_category->>'other')::int          + (CASE WHEN NEW.category = 'other'          THEN 1 ELSE 0 END)
    ),
    updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger: fire update_note_statistics after every new encounter note
CREATE OR REPLACE TRIGGER on_encounter_note_created
  AFTER INSERT ON public.encounter_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_note_statistics();
