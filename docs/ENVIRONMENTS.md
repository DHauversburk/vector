# Environments — Project Vector

**Status:** PLANNING. Staging environment (§ Staging) does not yet exist; provisioning is Sprint 14 / P9.
**Owner:** Engineering Team.
**Referenced from:** `docs/ENTERPRISE_ROADMAP.md` §5 P9, §7 (P9 validation row).

---

## Environment inventory

| Environment    | Who uses it        | Supabase project                | Vercel deploy target       | Purpose                                            |
| -------------- | ------------------ | ------------------------------- | -------------------------- | -------------------------------------------------- |
| **Local dev**  | Engineers only     | Local CLI (optional) or staging | `npm run dev` on localhost | Feature work, debugging                            |
| **CI**         | GitHub Actions     | Staging (post-P9)               | N/A                        | Automated verification on every PR                 |
| **Preview**    | Reviewers, QA      | Staging (post-P9)               | Vercel Preview per PR      | Review a PR as a real deploy before merge          |
| **Staging**    | Team smoke testing | `vector-staging` (TBD, P9)      | Vercel `Preview` scope     | Catch environment-specific regressions before prod |
| **Production** | End users (DoD)    | `tvwicdlxljqijoikioln`          | Vercel `Production` scope  | The live app                                       |

**Hard rule:** CI, Preview, and Staging MUST NOT share a Supabase project with Production. Until P9 completes, this rule is violated — every preview deploy today exercises production data. P9 is P0 in Sprint 14 for exactly this reason.

---

## Env-var matrix

Each variable's value differs per environment. The **where it lives** column tells you which surface to configure it on.

| Variable                    | Local dev         | CI                   | Preview / Staging    | Production                                                          | Where it lives                                | Notes                                                                                           |
| --------------------------- | ----------------- | -------------------- | -------------------- | ------------------------------------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `VITE_SUPABASE_URL`         | Staging URL       | Staging URL          | Staging URL          | `https://tvwicdlxljqijoikioln.supabase.co`                          | Vercel env vars (scoped) + local `.env.local` | Exposed to client (prefix `VITE_`). Safe.                                                       |
| `VITE_SUPABASE_ANON_KEY`    | Staging anon key  | Staging anon key     | Staging anon key     | Prod anon key                                                       | Vercel env vars (scoped) + local `.env.local` | Exposed to client. Safe — RLS enforces access.                                                  |
| `SUPABASE_SERVICE_ROLE_KEY` | —                 | Staging service-role | Staging service-role | Prod service-role                                                   | Supabase Functions secrets ONLY               | **NEVER prefix with `VITE_`. NEVER commit. Client code must never see this.**                   |
| `VITE_SENTRY_DSN`           | — (or dev DSN)    | —                    | Preview DSN          | Prod DSN                                                            | Vercel env vars (scoped)                      | Safe to expose. Create separate Sentry projects per env (Sprint 16 / P6).                       |
| `VITE_MOCK_MODE`            | `false` (default) | `false`              | `false`              | `false`                                                             | `.env.local` (dev only if needed)             | Explicit boolean. Production build aborts at startup if `true` (Risk #1 mitigation).            |
| `SUPABASE_FUNCTION_PEPPER`  | —                 | Staging pepper       | Staging pepper       | Prod pepper                                                         | Supabase Functions secrets ONLY               | Server-side hashing pepper for `exchange-token` edge fn (Sprint 14 / P4).                       |
| `VITE_LEGACY_ONBOARDING`    | `false`           | `false`              | `false`              | `false`                                                             | Vercel env vars (scoped)                      | Feature flag during Epic F rollout (Sprints 15-16). Flip to `true` to fall back to legacy tour. |
| `VITE_UX_V2`                | `true`            | `true`               | `true`               | Start `false`, flip `true` after Sprint 16 visual regression passes | Vercel env vars (scoped)                      | Feature flag for Epic F modal migration. Mitigates Risk #7.                                     |

### Scoping in Vercel

Vercel environment variables have three scopes: **Development**, **Preview**, **Production**. To configure:

1. Go to `https://vercel.com/d-hauversburks-projects/<project>/settings/environment-variables`.
2. Add each variable above.
3. Tick the appropriate scope(s). Variables scoped to `Preview` apply to every PR preview _and_ to `Preview` branch deploys.
4. **Do NOT tick multiple scopes with different values.** Create separate rows if the value differs per env.

### Scoping in Supabase

Supabase Edge Function secrets are per-project (one secret set per project ref). Set via:

```bash
# Against staging (post-P9):
supabase secrets set SUPABASE_FUNCTION_PEPPER=<value> --project-ref <staging-ref>

# Against production:
supabase secrets set SUPABASE_FUNCTION_PEPPER=<value> --project-ref tvwicdlxljqijoikioln
```

Never put `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_FUNCTION_PEPPER` in the Vercel env-var list. They are edge-function-side only. If they ever leak to a client-exposed variable (prefix `VITE_`), **rotate immediately**.

---

## Local dev setup

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Populate with staging credentials (ask the repo admin; do NOT put production values here).
3. **`.env.local` is gitignored. `.env` is tracked — see `docs/SEC-001-env-in-git.md`.** Use `.env.local` for your personal overrides until SEC-001 is remediated.
4. Run `npm run dev`.

---

## CI secrets

GitHub Actions needs a subset of the above to run. Configure in **Settings → Secrets and variables → Actions**:

| Secret name                    | Value                                    | Used by                                        |
| ------------------------------ | ---------------------------------------- | ---------------------------------------------- |
| `VITE_SUPABASE_URL`            | Staging URL                              | `ci.yml` build step                            |
| `VITE_SUPABASE_ANON_KEY`       | Staging anon key                         | `ci.yml` build step, E2E                       |
| `SUPABASE_ACCESS_TOKEN`        | Personal access token with staging perms | `supabase-migrate.yml` (Sprint 14 / P3)        |
| `SUPABASE_PROJECT_REF_STAGING` | Staging project ref                      | `supabase-migrate.yml`, `deploy-functions.yml` |
| `SUPABASE_PROJECT_REF_PROD`    | `tvwicdlxljqijoikioln`                   | `supabase-migrate.yml`, `deploy-functions.yml` |
| `VERCEL_TOKEN`                 | Vercel token with team access            | `release.yml` (Sprint 21 / P8)                 |
| `SENTRY_AUTH_TOKEN`            | Sentry auth token for source map upload  | `release.yml` (Sprint 21 / P8)                 |

**None of these exist in the repo today.** Configuring them is the first Sprint 14 action after the staging project is provisioned.

---

## Rotation policy

| Secret                                  | Rotate on                                                            | Owner      |
| --------------------------------------- | -------------------------------------------------------------------- | ---------- |
| `SUPABASE_SERVICE_ROLE_KEY`             | Leak suspicion, annually, after any contractor offboarding           | Repo admin |
| `SUPABASE_FUNCTION_PEPPER`              | Never, unless leaked — rotating invalidates all hashed token lookups | Repo admin |
| `VITE_SUPABASE_ANON_KEY`                | Leak suspicion (but low impact — RLS mediates)                       | Repo admin |
| Sentry DSNs                             | Project deletion                                                     | Repo admin |
| `VERCEL_TOKEN`, `SUPABASE_ACCESS_TOKEN` | Quarterly, after any access-list change                              | Repo admin |

Document every rotation in `docs/ROLLBACK_RUNBOOK.md` (Sprint 21 / P8) so the on-call can identify whether a recent rotation is the cause of an incident.

---

## Validation (§7 P9 row)

After P9 lands, confirm:

1. `curl https://<staging-ref>.supabase.co/rest/v1/` responds with Supabase metadata using the staging ref — not `tvwicdlxljqijoikioln`.
2. Vercel preview deploy of a trivial PR loads, and browser DevTools Network tab shows requests going to `<staging-ref>.supabase.co`, **not** `tvwicdlxljqijoikioln`.
3. Vercel production deploy still targets `tvwicdlxljqijoikioln` — confirm in DevTools on the prod URL.
4. `supabase db push --project-ref <staging-ref>` applies migrations; `supabase db push --project-ref tvwicdlxljqijoikioln` is gated on manual approval in `supabase-migrate.yml`.
