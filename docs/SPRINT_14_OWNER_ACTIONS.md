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

## S14.6 — Rotate SUPABASE_SERVICE_ROLE_KEY 🔴 URGENT

**Audit result (2026-04-16):** `VITE_SUPABASE_SERVICE_ROLE_KEY` **was confirmed in commit `4653c4d`**, pushed to GitHub.
The key must be treated as **fully compromised**. Rotation is non-negotiable.
Full audit details: `docs/SEC-001-env-in-git.md` §Audit results.

**Steps:**

1. **Rotate the JWT secret now:**
   - Go to https://supabase.com/dashboard/project/tvwicdlxljqijoikioln/settings/api
   - Scroll to **JWT Settings** → **Generate new JWT secret**
   - ⚠ This rotates BOTH the anon key and service role key. All existing long-lived tokens will be invalidated. This is intentional.

2. **Update Vercel env vars with new anon key** (service role key does NOT go in Vercel):
   - Go to https://vercel.com/d-hauversburks-projects/project-vector-beta/settings/environment-variables
   - Update `VITE_SUPABASE_ANON_KEY` for Production and Preview scopes
   - The env vars were already set correctly on 2026-04-16 — only the key value needs updating after rotation

3. **Update GitHub Actions secrets** with new service role key:
   - Go to https://github.com/DHauversburk/vector/settings/secrets/actions
   - After S14.1 staging is done: add `SUPABASE_STAGING_PROJECT_REF`, `SUPABASE_PROD_PROJECT_REF`, `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`

4. **Redeploy on Vercel** (done automatically when you update env vars and push to main)

5. **History purge (Phase 3 — do after rotation):**
   ```bash
   # DESTRUCTIVE — coordinate with all contributors first
   pip install git-filter-repo
   git filter-repo --path .env --invert-paths --force
   git push --force-with-lease origin main
   ```
   After force-push: open a GitHub support ticket to purge caches.

---

## Summary of what's already done (code-side + session 2026-04-16)

| Story                                       | Status                                                        | PR  |
| ------------------------------------------- | ------------------------------------------------------------- | --- |
| S14.2 SEC-001: untrack .env + guards        | ✅ Merged to main                                             | #8  |
| S14.3 Unit tests (codenames, utils)         | ✅ Merged in PR #9                                            | #9  |
| S14.4 Supabase IaC scaffolding (stubs)      | ✅ Stubs in repo (PR #9)                                      | #9  |
| S14.5a VITE_MOCK_MODE guard + prod-abort    | ✅ In PR #9                                                   | #9  |
| S14.5b exchange-token Deno handler          | ✅ Code written (PR #9)                                       | #9  |
| S14.6 Git history audit                     | ✅ DONE (2026-04-16) — key confirmed in `4653c4d`             | —   |
| Vercel env vars (URL, anon key, mock=false) | ✅ DONE (2026-04-16) — set on project-vector-beta             | —   |
| .vercel/project.json → project-vector-beta  | ✅ DONE (2026-04-16)                                          | —   |
| Production redeployment with real env vars  | ✅ DONE (2026-04-16) — dpl_HcfHcpnc1UUo7HccaiBjPqbJZGEY READY | —   |
| S14.1 Staging provisioning                  | ⏳ Requires owner                                             | —   |
| S14.4 Schema dump + audit                   | ⏳ Requires owner CLI + security review                       | —   |
| S14.5 Edge fn deploy                        | ⏳ Requires owner + staging first                             | —   |
| S14.6 Key rotation (service role key)       | 🔴 **URGENT — key was in git history**                        | —   |
| S14.6 History purge (Phase 3)               | ⏳ After rotation                                             | —   |
