# Sprint 14 — Owner Action Checklist

**Sprint:** 14 (Backend Truth)
**Date:** 2026-04-16
**Status:** Code-side work complete (PRs #8 + #9). Actions below require owner credentials.

This document lists every step that cannot be automated because it requires:

- Access to the Supabase dashboard / CLI with your credentials
- Access to Vercel environment variable settings
- A production database dump (never committed to CI)
- Secret rotation with live service keys

Complete these in order. Each step has a verification test.

---

## S14.1 — Provision Staging Supabase Project

**Why:** Until staging exists, every CI run, preview deploy, and E2E test hits the production database. This is Risk #6 in the roadmap.

**Steps:**

1. Go to https://supabase.com/dashboard → New Project
2. Create project in the same org as `tvwicdlxljqijoikioln`
3. Suggested name: `vector-staging`
4. Record the new project ref (e.g. `abcdefghij1234567890`)
5. Open `docs/ENVIRONMENTS.md` and fill in the staging ref under `SUPABASE_STAGING_PROJECT_REF`

**Vercel config (after staging is provisioned):** 6. Go to https://vercel.com/d-hauversburks-projects → Project Settings → Environment Variables 7. Add/update the following vars scoped to **Preview** only:

```
VITE_SUPABASE_URL        = https://<staging-ref>.supabase.co
VITE_SUPABASE_ANON_KEY   = <staging anon key>
VITE_MOCK_MODE           = false   (or omit — false is the default)
```

8. Confirm Production vars still point at `tvwicdlxljqijoikioln`:
   ```
   VITE_SUPABASE_URL        = https://tvwicdlxljqijoikioln.supabase.co
   VITE_SUPABASE_ANON_KEY   = <prod anon key>
   VITE_MOCK_MODE           = (not set — never set this in production)
   ```

**GitHub secrets (for supabase-migrate.yml workflow):** 9. Go to https://github.com/DHauversburk/vector/settings/secrets/actions → New repository secret

- `SUPABASE_ACCESS_TOKEN` — from https://supabase.com/dashboard/account/tokens
- `SUPABASE_DB_PASSWORD` — your Supabase database password
- `SUPABASE_STAGING_PROJECT_REF` — the staging project ref
- `SUPABASE_PROD_PROJECT_REF` — `tvwicdlxljqijoikioln`

**Verification:**

- Open a PR → Vercel preview URL loads and authenticates against staging Supabase
- Production deployment unaffected

---

## S14.4 — Dump Production Schema into Migration Files

**Why:** The migration stubs in `supabase/migrations/` are placeholders. The real schema must be committed so the staging environment can be seeded identically.

**Prerequisites:** Supabase CLI installed (`npm install -g supabase`) and S14.1 staging provisioned.

**Steps:**

```bash
# 1. Authenticate
supabase login

# 2. Link to production project
supabase link --project-ref tvwicdlxljqijoikioln

# 3. Dump baseline schema (tables, indexes, sequences)
supabase db dump --schema public --linked \
  > supabase/migrations/0001_baseline_schema.sql

# 4. Dump RLS policies
supabase db dump --schema public --linked --role-only \
  > supabase/migrations/0002_rls_policies.sql

# 5. Dump RPC functions
supabase db dump --schema public --linked \
  > supabase/migrations/0003_rpc_functions.sql
```

**⚠ CRITICAL SECURITY AUDIT before committing `0003_rpc_functions.sql`:**

Every `SECURITY DEFINER` function MUST have this line in its body:

```sql
SET search_path = public, pg_temp;
```

Without this, a user with CREATE SCHEMA privilege can create a `public` schema in a temp location and hijack the function's search path, escalating to the definer's privileges.

Check each of the 8 known RPCs:

- `admin_create_user`
- `provision_member`
- `fix_duplicate_users`
- `log_event`
- `get_audit_logs`
- `get_system_stats`
- `admin_delete_user`
- `admin_prune_unused_accounts`

For any that lack `SET search_path`, add it manually in the dump file before committing.

**Verification:**

```sql
-- Run in Supabase SQL Editor on staging after applying migrations:
SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public';
-- Should match the number of policies in 0002_rls_policies.sql
```

**Then apply to staging:**

```bash
supabase db push --project-ref <staging-ref>
```

---

## S14.5 — Deploy exchange-token Edge Function

**Why:** The real Deno handler in `supabase/functions/exchange-token/index.ts` replaces the mock in `src/lib/supabase.ts`. Until it's deployed, production authentication still uses the mock fallback.

**Prerequisites:** S14.1 staging confirmed working, edge function code reviewed.

**Steps:**

```bash
# 1. Set required secrets on production project
supabase secrets set \
  --project-ref tvwicdlxljqijoikioln \
  TOKEN_PEPPER=$(openssl rand -hex 32)

# Note: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are auto-injected
# by the Supabase runtime — do NOT set them manually.

# 2. Deploy to staging first (S14.1 staging must exist)
supabase functions deploy exchange-token \
  --project-ref <staging-ref>

# 3. Smoke test against staging
curl -X POST \
  https://<staging-ref>.supabase.co/functions/v1/exchange-token \
  -H "Content-Type: application/json" \
  -d '{"token": "M-001"}'
# Expected: {"session": {...}} with a valid access token

# 4. Rate limit test (should 429 on 11th call in 60s)
for i in $(seq 1 11); do
  curl -s -o /dev/null -w "%{http_code}\n" \
    -X POST https://<staging-ref>.supabase.co/functions/v1/exchange-token \
    -H "Content-Type: application/json" \
    -d '{"token": "M-001"}'
done
# First 10: 200, 11th: 429

# 5. Deploy to production after staging validation
supabase functions deploy exchange-token \
  --project-ref tvwicdlxljqijoikioln
```

**Verification:**

- Supabase dashboard → Functions → exchange-token → version hash matches latest Git SHA
- Login to vector-health.vercel.app with a real token → session created without mock

---

## S14.6 — Rotate SUPABASE_SERVICE_ROLE_KEY

**Why:** If the service role key was ever in `.env` (which was tracked in git until SEC-001 untracked it on 2026-04-15), it must be rotated. Even if only in git history, the key should be considered compromised.

**Per `docs/SEC-001-env-in-git.md` §Phase 2:**

**Steps:**

1. Go to https://supabase.com/dashboard/project/tvwicdlxljqijoikioln/settings/api
2. Scroll to **Service Role Key** → Reveal → copy current key
3. Check if this key appears in git history:
   ```bash
   git log -p --all -- .env | grep -i service_role
   ```
   If it appears: rotate immediately.
4. Click **Rotate** on the service role key in the Supabase dashboard
5. Update the key in any place it's used:
   - Vercel → Settings → Environment Variables → `SUPABASE_SERVICE_ROLE_KEY`
   - GitHub Actions secrets (if used in supabase-migrate.yml)
   - Any local `.env.local` files on developer machines
6. Verify the edge function and supabase-migrate workflow still work after rotation

**History purge (Phase 3 — do after rotation):**

```bash
# DESTRUCTIVE — coordinate with all contributors first
git filter-repo --path .env --invert-paths --force
git push --force-with-lease origin main
```

Only run the history purge if the key was actually in git history AND after rotation so the old key is already invalid.

---

## Summary of what's already done (code-side)

| Story                                    | Status                                  | PR  |
| ---------------------------------------- | --------------------------------------- | --- |
| S14.2 SEC-001: untrack .env + guards     | ✅ Merged to main                       | #8  |
| S14.3 Unit tests (codenames, utils)      | ✅ Merged in PR #9                      | #9  |
| S14.4 Supabase IaC scaffolding (stubs)   | ✅ Stubs in repo (PR #9)                | #9  |
| S14.5a VITE_MOCK_MODE guard + prod-abort | ✅ In PR #9                             | #9  |
| S14.5b exchange-token Deno handler       | ✅ Code written (PR #9)                 | #9  |
| S14.1 Staging provisioning               | ⏳ Requires owner                       | —   |
| S14.4 Schema dump + audit                | ⏳ Requires owner CLI + security review | —   |
| S14.5 Edge fn deploy                     | ⏳ Requires owner + staging first       | —   |
| S14.6 Key rotation                       | ⏳ Requires owner if key was in git     | —   |
