-- supabase/migrations/0002_rls_policies.sql
-- Row-Level Security policies for project tvwicdlxljqijoikioln
--
-- Sourced from production via Management API query on 2026-04-17.
-- Replaces stub created in S14.4.
--
-- DEPENDENCY NOTE: users_select and users_admin_insert reference get_my_role(),
-- which is fully defined in 0003_rpc_functions.sql. The stub below ensures this
-- file can be applied to a fresh database in filename order (0001→0002→0003).
-- 0003's CREATE OR REPLACE will overwrite this stub with the identical body.
-- See docs/ENVIRONMENTS.md §Staging Migration State for history.

CREATE OR REPLACE FUNCTION public.get_my_role()
  RETURNS text
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;
-- Total: 32 policies across 10 tables.
--
-- Design principles (do not regress):
--   members: read/write own appointments, help_requests, waitlist, user_pins
--   providers: read/write own appointments, encounter_notes, resources
--   admins (role = 'admin' in public.users): bypass via additional OR branch
--   audit_logs: any authenticated user can INSERT; only admins can SELECT
--   resources: global SELECT (public read), provider-only INSERT/UPDATE/DELETE
--   note_statistics: provider reads own rows only
--
-- Verification after apply:
--   SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public';
--   -- Expected: 32

-- ────────────────────────────────────────────────────────────────────────────
-- appointments (4 policies)
-- ────────────────────────────────────────────────────────────────────────────

CREATE POLICY appointments_select_policy ON public.appointments
  FOR SELECT USING (
    (member_id IS NULL)
    OR (member_id = (SELECT auth.uid()))
    OR (provider_id = (SELECT auth.uid()))
    OR (EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid()) AND users.role = 'admin'::text
    ))
  );

CREATE POLICY appointments_provider_insert ON public.appointments
  FOR INSERT WITH CHECK (
    (SELECT auth.uid()) = provider_id
  );

CREATE POLICY appointments_update_policy ON public.appointments
  FOR UPDATE USING (
    (member_id = (SELECT auth.uid()))
    OR (provider_id = (SELECT auth.uid()))
    OR ((member_id IS NULL) AND (NOT is_booked))
    OR (EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid()) AND users.role = 'admin'::text
    ))
  );

CREATE POLICY appointments_delete_policy ON public.appointments
  FOR DELETE USING (
    ((provider_id = (SELECT auth.uid())) AND (member_id IS NULL))
    OR (EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid()) AND users.role = 'admin'::text
    ))
  );

-- ────────────────────────────────────────────────────────────────────────────
-- audit_logs (2 policies)
-- Any authenticated user may insert (user_id = auth.uid() OR NULL for system).
-- Only admins may select.
-- ────────────────────────────────────────────────────────────────────────────

CREATE POLICY audit_logs_auth_insert ON public.audit_logs
  FOR INSERT WITH CHECK (
    (user_id = (SELECT auth.uid())) OR (user_id IS NULL)
  );

CREATE POLICY audit_logs_admin_view ON public.audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid()) AND users.role = 'admin'::text
    )
  );

-- ────────────────────────────────────────────────────────────────────────────
-- encounter_notes (4 policies)
-- Provider owns their own notes. Admins can read all.
-- ────────────────────────────────────────────────────────────────────────────

CREATE POLICY encounter_notes_select ON public.encounter_notes
  FOR SELECT USING (
    (provider_id = (SELECT auth.uid()))
    OR (EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid()) AND users.role = 'admin'::text
    ))
  );

CREATE POLICY encounter_notes_insert ON public.encounter_notes
  FOR INSERT WITH CHECK (
    provider_id = (SELECT auth.uid())
  );

CREATE POLICY encounter_notes_update ON public.encounter_notes
  FOR UPDATE USING (
    provider_id = (SELECT auth.uid())
  );

CREATE POLICY encounter_notes_delete ON public.encounter_notes
  FOR DELETE USING (
    provider_id = (SELECT auth.uid())
  );

-- ────────────────────────────────────────────────────────────────────────────
-- feedback (2 policies)
-- Members insert for their own appointments. Providers + admins can read.
-- ────────────────────────────────────────────────────────────────────────────

CREATE POLICY feedback_member_insert ON public.feedback
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.id = feedback.appointment_id
        AND a.member_id = (SELECT auth.uid())
    )
  );

CREATE POLICY feedback_select ON public.feedback
  FOR SELECT USING (
    (EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.id = feedback.appointment_id
        AND a.provider_id = (SELECT auth.uid())
    ))
    OR (EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid()) AND users.role = 'admin'::text
    ))
  );

-- ────────────────────────────────────────────────────────────────────────────
-- help_requests (4 policies)
-- Members own their requests. Providers see assigned requests + open queue.
-- Admins full access.
-- ────────────────────────────────────────────────────────────────────────────

CREATE POLICY help_requests_select ON public.help_requests
  FOR SELECT USING (
    (member_id = (SELECT auth.uid()))
    OR (provider_id = (SELECT auth.uid()))
    OR (status = ANY (ARRAY['pending'::text, 'in_progress'::text]))
    OR (EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid()) AND users.role = 'admin'::text
    ))
  );

CREATE POLICY help_requests_insert ON public.help_requests
  FOR INSERT WITH CHECK (
    (member_id = (SELECT auth.uid()))
    OR (EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid()) AND users.role = 'admin'::text
    ))
  );

CREATE POLICY help_requests_update ON public.help_requests
  FOR UPDATE USING (
    (member_id = (SELECT auth.uid()))
    OR (EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid())
        AND users.role = ANY (ARRAY['provider'::text, 'admin'::text])
    ))
  );

CREATE POLICY help_requests_delete ON public.help_requests
  FOR DELETE USING (
    (member_id = (SELECT auth.uid()))
    OR (EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid()) AND users.role = 'admin'::text
    ))
  );

-- ────────────────────────────────────────────────────────────────────────────
-- note_statistics (1 policy)
-- Providers read their own aggregate rows only.
-- ────────────────────────────────────────────────────────────────────────────

CREATE POLICY "Users can only view their own note statistics" ON public.note_statistics
  FOR SELECT USING (
    auth.uid() = provider_id
  );

-- ────────────────────────────────────────────────────────────────────────────
-- resources (4 policies)
-- Global SELECT (no auth required). Provider owns their own rows for CUD.
-- ────────────────────────────────────────────────────────────────────────────

CREATE POLICY resources_select ON public.resources
  FOR SELECT USING (true);

CREATE POLICY resources_insert ON public.resources
  FOR INSERT WITH CHECK (
    provider_id = (SELECT auth.uid())
  );

CREATE POLICY resources_update ON public.resources
  FOR UPDATE USING (
    provider_id = (SELECT auth.uid())
  );

CREATE POLICY resources_delete ON public.resources
  FOR DELETE USING (
    provider_id = (SELECT auth.uid())
  );

-- ────────────────────────────────────────────────────────────────────────────
-- user_pins (4 policies)
-- Users read/write/delete their own PIN. Admins may delete any.
-- ────────────────────────────────────────────────────────────────────────────

CREATE POLICY user_pins_select ON public.user_pins
  FOR SELECT USING (
    user_id = (SELECT auth.uid())
  );

CREATE POLICY user_pins_insert ON public.user_pins
  FOR INSERT WITH CHECK (
    user_id = (SELECT auth.uid())
  );

CREATE POLICY user_pins_update ON public.user_pins
  FOR UPDATE USING (
    user_id = (SELECT auth.uid())
  );

CREATE POLICY user_pins_delete ON public.user_pins
  FOR DELETE USING (
    (user_id = (SELECT auth.uid()))
    OR (EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid()) AND users.role = 'admin'::text
    ))
  );

-- ────────────────────────────────────────────────────────────────────────────
-- users (3 policies)
-- Users see themselves + all providers (for booking). Admins see all.
-- Users update only their own row. Only admins can insert (create accounts).
-- ────────────────────────────────────────────────────────────────────────────

CREATE POLICY users_select ON public.users
  FOR SELECT USING (
    (id = auth.uid())
    OR (role = 'provider'::text)
    OR (get_my_role() = 'admin'::text)
  );

CREATE POLICY users_update_own ON public.users
  FOR UPDATE
  USING   ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY users_admin_insert ON public.users
  FOR INSERT WITH CHECK (
    get_my_role() = 'admin'::text
  );

-- ────────────────────────────────────────────────────────────────────────────
-- waitlist (4 policies)
-- Members own their own entries. Admins full access.
-- ────────────────────────────────────────────────────────────────────────────

CREATE POLICY waitlist_select ON public.waitlist
  FOR SELECT USING (
    (member_id = (SELECT auth.uid()))
    OR (provider_id = (SELECT auth.uid()))
    OR (EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid()) AND users.role = 'admin'::text
    ))
  );

CREATE POLICY waitlist_insert ON public.waitlist
  FOR INSERT WITH CHECK (
    (member_id = (SELECT auth.uid()))
    OR (EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid()) AND users.role = 'admin'::text
    ))
  );

CREATE POLICY waitlist_update ON public.waitlist
  FOR UPDATE USING (
    (member_id = (SELECT auth.uid()))
    OR (EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid()) AND users.role = 'admin'::text
    ))
  );

CREATE POLICY waitlist_delete ON public.waitlist
  FOR DELETE USING (
    (member_id = (SELECT auth.uid()))
    OR (EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid()) AND users.role = 'admin'::text
    ))
  );
