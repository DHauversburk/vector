-- supabase/migrations/0001_baseline_schema.sql
-- Baseline schema for project tvwicdlxljqijoikioln (Project Vector)
--
-- Sourced from production via Supabase Management API on 2026-04-17.
-- Replaces stub created in S14.4.
--
-- Tables (10):
--   public.users              — auth identity mirror (role, service_type, token_alias)
--   public.appointments       — provider time slots + member bookings
--   public.encounter_notes    — provider clinical encounter records
--   public.feedback           — member post-appointment ratings
--   public.help_requests      — member support tickets
--   public.waitlist           — appointment waitlist entries
--   public.resources          — provider-shared resource links
--   public.user_pins          — bcrypt PIN hashes for PIN-protected accounts
--   public.note_statistics    — monthly aggregate stats for encounter notes
--   public.audit_logs         — insert-only system event trail
--
-- RLS policies: 0002_rls_policies.sql (32 policies)
-- RPC functions + triggers: 0003_rpc_functions.sql (20 functions, 1 trigger)
--
-- Security audit (2026-04-17):
--   All 19 SECURITY DEFINER functions include SET search_path TO 'public'.
--   update_note_statistics() is NOT SECURITY DEFINER (trigger function) — no guard needed.

-- ────────────────────────────────────────────────────────────────────────────
-- Extensions
-- ────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ────────────────────────────────────────────────────────────────────────────
-- public.users
-- One row per authenticated identity. Populated by handle_new_user trigger.
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.users (
  id           uuid        NOT NULL DEFAULT gen_random_uuid(),
  token_alias  text        NOT NULL,
  role         text        NOT NULL,
  status       text        NOT NULL,
  service_type text,
  created_at   timestamptz          DEFAULT now(),
  created_by   uuid,

  CONSTRAINT users_pkey            PRIMARY KEY (id),
  CONSTRAINT users_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────────────────────────────────────
-- public.appointments
-- Unbooked slot: member_id IS NULL, is_booked = false, status = 'pending'
-- Booked slot:   member_id = <uuid>, is_booked = true, status = 'confirmed'
-- Blocked slot:  status = 'blocked', is_booked = true, member_id IS NULL
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.appointments (
  id          uuid        NOT NULL DEFAULT uuid_generate_v4(),
  provider_id uuid        NOT NULL,
  member_id   uuid,
  start_time  timestamptz NOT NULL,
  end_time    timestamptz NOT NULL,
  status      text                 DEFAULT 'pending'::text,
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  is_booked   boolean              DEFAULT false,

  CONSTRAINT appointments_pkey                  PRIMARY KEY (id),
  CONSTRAINT appointments_provider_id_fkey      FOREIGN KEY (provider_id) REFERENCES public.users(id),
  CONSTRAINT appointments_member_id_fkey        FOREIGN KEY (member_id)   REFERENCES public.users(id),
  CONSTRAINT appointments_provider_start_unique UNIQUE (provider_id, start_time)
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────────────────────────────────────
-- public.encounter_notes
-- Provider-owned clinical notes. member_id is text (token alias), not uuid.
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.encounter_notes (
  id                       uuid        NOT NULL DEFAULT gen_random_uuid(),
  provider_id              uuid        NOT NULL,
  member_id                text        NOT NULL,
  member_name              text,
  category                 text        NOT NULL,
  content                  text        NOT NULL,
  status                   text        NOT NULL DEFAULT 'active'::text,
  resolved                 boolean              DEFAULT false,
  archived                 boolean              DEFAULT false,
  archived_at              timestamptz,
  follow_up_appointment_id uuid,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz,

  CONSTRAINT encounter_notes_pkey                           PRIMARY KEY (id),
  CONSTRAINT encounter_notes_provider_id_fkey               FOREIGN KEY (provider_id)              REFERENCES public.users(id),
  CONSTRAINT encounter_notes_follow_up_appointment_id_fkey  FOREIGN KEY (follow_up_appointment_id) REFERENCES public.appointments(id)
);

ALTER TABLE public.encounter_notes ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────────────────────────────────────
-- public.feedback
-- Member ratings submitted after an appointment completes.
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.feedback (
  id             uuid        NOT NULL DEFAULT gen_random_uuid(),
  appointment_id uuid        NOT NULL,
  rating         integer     NOT NULL,
  comment        text,
  created_at     timestamptz          DEFAULT now(),

  CONSTRAINT feedback_pkey               PRIMARY KEY (id),
  CONSTRAINT feedback_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id)
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────────────────────────────────────
-- public.help_requests
-- Member support tickets. provider_id → public.users; member_id is auth.users uuid.
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.help_requests (
  id              uuid        NOT NULL DEFAULT gen_random_uuid(),
  member_id       uuid        NOT NULL,
  member_name     text,
  provider_id     uuid,
  category        text        NOT NULL,
  subject         text        NOT NULL,
  message         text        NOT NULL,
  status          text        NOT NULL DEFAULT 'pending'::text,
  resolution_note text,
  resolved_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT help_requests_pkey             PRIMARY KEY (id),
  CONSTRAINT help_requests_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.users(id)
);

ALTER TABLE public.help_requests ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────────────────────────────────────
-- public.waitlist
-- Appointment waitlist. preferred_days is int[] (0=Sun … 6=Sat).
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.waitlist (
  id             uuid        NOT NULL DEFAULT gen_random_uuid(),
  member_id      uuid        NOT NULL,
  member_name    text,
  provider_id    uuid        NOT NULL,
  service_type   text,
  preferred_days integer[],
  note           text,
  status         text        NOT NULL DEFAULT 'active'::text,
  created_at     timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT waitlist_pkey              PRIMARY KEY (id),
  CONSTRAINT waitlist_provider_id_fkey  FOREIGN KEY (provider_id) REFERENCES public.users(id)
);

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────────────────────────────────────
-- public.resources
-- Provider-curated links. No FK on provider_id to allow service-role inserts.
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.resources (
  id          uuid        NOT NULL DEFAULT gen_random_uuid(),
  provider_id uuid        NOT NULL,
  title       text        NOT NULL,
  url         text        NOT NULL,
  category    text        NOT NULL,
  description text,
  created_at  timestamptz          DEFAULT now(),

  CONSTRAINT resources_pkey PRIMARY KEY (id)
);

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────────────────────────────────────
-- public.user_pins
-- One PIN per user. pin_hash is bcrypt via pgcrypto.crypt(). user_id → auth.users.
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_pins (
  user_id    uuid        NOT NULL,
  pin_hash   text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz,

  CONSTRAINT user_pins_pkey PRIMARY KEY (user_id)
);

ALTER TABLE public.user_pins ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────────────────────────────────────
-- public.note_statistics
-- Monthly rollup of encounter_notes per provider. Written by trigger.
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.note_statistics (
  id                    uuid        NOT NULL DEFAULT gen_random_uuid(),
  period                text        NOT NULL,
  provider_id           uuid        NOT NULL,
  total_encounters      integer              DEFAULT 0,
  unique_patients       integer              DEFAULT 0,
  requires_action_count integer              DEFAULT 0,
  by_category           jsonb                DEFAULT '{"other":0,"urgent":0,"routine":0,"question":0,"follow_up":0,"counseling":0,"reschedule":0,"administrative":0}'::jsonb,
  created_at            timestamptz          DEFAULT now(),
  updated_at            timestamptz          DEFAULT now(),

  CONSTRAINT note_statistics_pkey                   PRIMARY KEY (id),
  CONSTRAINT note_statistics_period_provider_id_key UNIQUE (period, provider_id)
);

ALTER TABLE public.note_statistics ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────────────────────────────────────
-- public.audit_logs
-- Insert-only trail. Authenticated users may insert; only admins may read.
-- user_id → auth.users (cross-schema).
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id          uuid        NOT NULL DEFAULT gen_random_uuid(),
  user_id     uuid,
  action_type text        NOT NULL,
  description text,
  metadata    jsonb                DEFAULT '{}'::jsonb,
  severity    text                 DEFAULT 'INFO'::text,
  created_at  timestamptz          DEFAULT now(),

  CONSTRAINT audit_logs_pkey         PRIMARY KEY (id),
  CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
