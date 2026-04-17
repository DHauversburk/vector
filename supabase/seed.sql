-- supabase/seed.sql
-- Deterministic test data for the staging Supabase project.
--
-- Applied automatically by: supabase db reset (local dev)
-- Applied manually for staging: supabase db seed --linked
--
-- ⚠ STAGING ONLY — never run against the production project
--   (tvwicdlxljqijoikioln).
--
-- The users seeded here match the mock credentials in src/lib/supabase.ts
-- so that integration tests written in S14.3 can authenticate against
-- staging using the same token→email mapping as the mock.
--
-- OWNER ACTION REQUIRED (S14.4 / S14.1):
--   1. Provision the staging Supabase project (see docs/ENVIRONMENTS.md §S14.1).
--   2. Add real user records via Supabase admin UI or `supabase db seed --linked`.
--   3. Confirm auth.users has at least: admin, doc1, mh1, pt1, patient001.

-- Placeholder — real seed data goes here after staging is provisioned.
SELECT 1;
