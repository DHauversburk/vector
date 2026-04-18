# Environments — Project Vector

**Last updated:** 2026-04-17 — staging provisioned, all env vars wired.
**Owner:** @DHauversburk
**Referenced from:** `docs/ENTERPRISE_ROADMAP.md` §5 P9, §7 (P9 validation row).

Three environments are in use. Every Vercel deploy targets the environment that
matches its scope; the Supabase project is isolated per environment so a staging
test cannot touch production data.

---

## Surfaces

| Surface            | Development                           | Preview (Vercel)                              | Production (Vercel)          |
| ------------------ | ------------------------------------- | --------------------------------------------- | ---------------------------- |
| **Vercel**         | `localhost:5173` (Vite dev server)    | Auto-deploy on every PR branch                | `vector-health.vercel.app`   |
| **Supabase**       | Local (`supabase start`) or dev creds | **`vector-staging`** (`svwtosrsxgvrlstclbmr`) | **`tvwicdlxljqijoikioln`**   |
| **Edge functions** | `supabase functions serve` (local)    | Staging project functions                     | Production project functions |

---

## Environment Variables

Variables prefixed `VITE_` are baked into the Vite bundle at build time.
Variables without `VITE_` are server-side only (GitHub Actions, edge functions).

| Variable                    | Development (`.env.local`)              | Preview (Vercel)                           | Production (Vercel)                                    |
| --------------------------- | --------------------------------------- | ------------------------------------------ | ------------------------------------------------------ |
| `VITE_SUPABASE_URL`         | `http://127.0.0.1:54321`                | `https://svwtosrsxgvrlstclbmr.supabase.co` | `https://tvwicdlxljqijoikioln.supabase.co`             |
| `VITE_SUPABASE_ANON_KEY`    | local anon key (from `supabase status`) | staging anon key                           | production anon key                                    |
| `VITE_MOCK_MODE`            | `false` or omit                         | must be absent or `false`                  | must be absent or `false` — **build aborts if `true`** |
| `SUPABASE_SERVICE_ROLE_KEY` | n/a (edge fn local only)                | staging service role key                   | production service role key                            |
| `VITE_SENTRY_DSN`           | omit                                    | staging DSN (P6, Sprint 16)                | production DSN (P6, Sprint 16)                         |

### Never commit to git

`.env`, `.env.local`, `.env.production`, `.env.staging` — all blocked by
`.gitignore` and the pre-commit hook (see `docs/SEC-001-env-in-git.md`).
Only `.env.example` may be committed (documents keys without values).

---

## Project References

| Environment | Supabase Project       | Project Ref            | Region   |
| ----------- | ---------------------- | ---------------------- | -------- |
| Production  | `tvwicdlxljqijoikioln` | `tvwicdlxljqijoikioln` | Americas |
| Staging     | `vector-staging`       | `svwtosrsxgvrlstclbmr` | Americas |

Staging provisioned: **2026-04-17**. Organization: `19 CABS`.

---

## GitHub Actions Secrets

Set at `github.com/DHauversburk/vector/settings/secrets/actions`:

| Secret                         | Purpose                                    | Set                 |
| ------------------------------ | ------------------------------------------ | ------------------- |
| `SUPABASE_ACCESS_TOKEN`        | Supabase CLI + Management API auth         | ✅ 2026-04-17       |
| `SUPABASE_STAGING_PROJECT_REF` | Staging project ref for migration workflow | ✅ 2026-04-17       |
| `SUPABASE_STAGING_DB_PASSWORD` | Staging DB password for `supabase db push` | ✅ 2026-04-17       |
| `SUPABASE_PROD_PROJECT_REF`    | Production project ref                     | set on provisioning |
| `SUPABASE_DB_PASSWORD`         | Production DB password                     | set on provisioning |

---

## Staging Migration State (2026-04-17)

Migrations applied to `vector-staging` (`svwtosrsxgvrlstclbmr`):

| File                       | Contents                  | Status                                      |
| -------------------------- | ------------------------- | ------------------------------------------- |
| `0001_baseline_schema.sql` | Extensions + 10 tables    | ✅ Applied                                  |
| `0002_rls_policies.sql`    | 32 RLS policies           | ✅ Applied — 32 confirmed via `pg_policies` |
| `0003_rpc_functions.sql`   | 20 functions + 2 triggers | ✅ Applied                                  |

> **Dependency note:** `0002_rls_policies.sql` references `get_my_role()` which is defined
> in `0003_rpc_functions.sql`. Applied manually as 0001 → 0003 → 0002. The CI workflow
> (`supabase-migrate.yml`) applies in filename order; a future fix should extract `get_my_role()`
> into `0002_rls_policies.sql` header or reorder the files. Tracked as tech-debt.

---

## Vercel Environment Scoping

Preview env vars set in Vercel → project-vector-beta → Settings → Environment Variables:

| Variable                 | Production scope                           | Preview scope                                 |
| ------------------------ | ------------------------------------------ | --------------------------------------------- |
| `VITE_SUPABASE_URL`      | `https://tvwicdlxljqijoikioln.supabase.co` | `https://svwtosrsxgvrlstclbmr.supabase.co` ✅ |
| `VITE_SUPABASE_ANON_KEY` | production anon key                        | staging anon key ✅                           |

Every Vercel preview deploy (PR branch) automatically hits the staging Supabase project.
Production deploys continue hitting the production project unchanged.

---

## Adding a New Environment Variable

1. Add to `.env.example` with a description (no value).
2. Set in Vercel → Environment Variables for the appropriate scope(s).
3. If used in GitHub Actions: add as a repository secret.
4. Update this document.
5. If it affects a production build: trigger a Vercel redeploy.
