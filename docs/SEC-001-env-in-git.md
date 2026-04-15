# SEC-001 — `.env` tracked in git despite `.gitignore`

**Severity:** HIGH
**Status:** Open. Remediation queued as Sprint 14 P0 story.
**Discovered:** 2026-04-14 during Sprint 13 PR preparation.
**Referenced from:** `docs/ENTERPRISE_ROADMAP.md` §8 (Risks).

---

## Finding

The file `.env` is tracked by git — it appears in `git ls-files` — despite being listed in `.gitignore`. This means `.env` has been committed at least once in the past, and every subsequent `git push` potentially ships updated secrets to the remote.

Once a file is tracked, adding it to `.gitignore` does **not** untrack it. The ignore rule only applies to files not already in the index.

Evidence captured during Sprint 13:

```bash
$ git ls-files --error-unmatch .env
.env
$ grep -E '^\.env' .gitignore
.env
.env.local
.env.production
.env.staging
```

---

## Impact

Without full `git log -p .env` audit (not executed during discovery — requires the owner's consent because the output contains secrets), the blast radius is:

- **All values ever placed in `.env`** may be present in the git history, in one or more commits.
- **Cloned repos** (local dev machines, CI runners, forks if any) all have the history.
- **Push to origin** publishes history to GitHub, which persists it until the repo is rewritten.

Specific secrets that historically live in `.env` per the codebase:

| Variable                    | Secret?            | Exposure impact if leaked                                                                                        |
| --------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `VITE_SUPABASE_URL`         | No                 | Public anyway                                                                                                    |
| `VITE_SUPABASE_ANON_KEY`    | Low (RLS mediates) | Anyone can hit the REST API; RLS is the defense line                                                             |
| `SUPABASE_SERVICE_ROLE_KEY` | **YES** — critical | Full admin access to the Supabase project: read, write, delete any row, bypassing RLS. **Full data compromise.** |
| `VITE_MOCK_PASSWORD`        | Medium             | Allows local-mode login, only useful if mock mode is active (per Risk #1 it should never be active in prod)      |
| `VITE_SENTRY_DSN`           | Low                | Attacker can flood the project's Sentry quota                                                                    |

**If `SUPABASE_SERVICE_ROLE_KEY` has ever been in `.env`**, this is treated as a **full disclosure** and the key must be rotated immediately.

---

## Remediation plan

Ordered. Each step gates the next — do not skip ahead.

### Phase 1: Stop the bleeding (Sprint 14, day 1)

1. **Audit the history** — find every commit that touches `.env`:
   ```bash
   git log --all --full-history --pretty='%h %ai %s' -- .env
   ```
2. **Determine what secrets have been in `.env`** by examining the diffs. Record in a private note (NOT in this repo, NOT in any tracked file). If `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_FUNCTION_PEPPER` appear anywhere: **proceed to Phase 2 rotation first.**
3. **Untrack `.env`** (keeps the file locally, removes it from the index):
   ```bash
   git rm --cached .env
   git commit -m "security(SEC-001): untrack .env; see docs/SEC-001-env-in-git.md"
   ```
4. **Confirm `.env` stays ignored for future changes:**
   ```bash
   echo "test" >> .env && git status
   # .env must NOT appear in the status output
   ```
5. **Add `.env.example`** (if not present) to document required keys without values.

### Phase 2: Rotate any secret that ever lived in `.env`

Do this in parallel with Phase 3. Order matters — rotate the highest-impact first to close the exposure window.

1. **`SUPABASE_SERVICE_ROLE_KEY`** — Supabase Dashboard → Settings → API → JWT Settings → Reset. Update:
   - Supabase Edge Function secrets (`supabase secrets set`) for `exchange-token` once P4 lands.
   - GitHub Actions secrets (once P3/P4 lands).
2. **`VITE_SUPABASE_ANON_KEY`** — Supabase Dashboard → Settings → API → JWT Settings → Reset. Update:
   - Vercel env vars (Production + Preview scopes).
   - CI secrets.
3. **Sentry DSN** — Sentry → Settings → Client Keys → Revoke + Create new. Update Vercel env vars.
4. **`VITE_MOCK_PASSWORD`** — if in `.env` at all: rotate, and plan its retirement (Risk #1 mitigation: replace with `VITE_MOCK_MODE` boolean in Sprint 14 / P4).

### Phase 3: Purge from history (optional but recommended)

This rewrites git history. **Coordinate with every contributor before proceeding**, because it forces everyone to re-clone or rebase.

1. Use `git filter-repo` (NOT `filter-branch` — deprecated):
   ```bash
   pip install git-filter-repo
   git filter-repo --path .env --invert-paths
   git push --force-with-lease origin --all
   ```
2. Tell GitHub to purge cached views: after force-push, open a support ticket per [GitHub docs](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository) to clear PR views and fork cache.

**Skip Phase 3 if** (a) only low-impact secrets lived in `.env` and (b) Phase 2 rotation completed — the exposed values are then worthless.

### Phase 4: Prevent recurrence

1. Add a pre-commit check (extend the Sprint 13 husky hook) that blocks `git commit` if `.env` appears in the index:
   ```bash
   # .husky/pre-commit (append)
   if git diff --cached --name-only | grep -qE '^\.env$'; then
     echo "ERROR: .env is tracked. See docs/SEC-001-env-in-git.md."
     exit 1
   fi
   ```
2. Add a CI check (extend `ci.yml`) that fails if `.env` is in the repo:
   ```yaml
   - name: Verify .env is not tracked
     run: |
       if git ls-files --error-unmatch .env 2>/dev/null; then
         echo "::error::.env is tracked in git. See docs/SEC-001-env-in-git.md."
         exit 1
       fi
   ```
3. Add a periodic secret-scan workflow (Sprint 18 / P1.3 ties into this with GitHub's built-in secret scanning + CodeQL).

---

## Verification

After remediation:

- [ ] `git ls-files --error-unmatch .env` exits non-zero (file no longer tracked).
- [ ] `.env` continues to exist locally (devs can still run `npm run dev`).
- [ ] Adding a line to `.env` does NOT appear in `git status`.
- [ ] Pre-commit hook rejects `git add .env`.
- [ ] CI check fails a PR that accidentally re-adds `.env`.
- [ ] Rotated secrets confirmed via:
  - Supabase: old anon key rejected on `curl` test.
  - Sentry: old DSN returns 401 on test POST.

---

## Owner acknowledgements required

Before executing Phase 2 rotation:

- [ ] Repo admin confirms they have permission to rotate Supabase keys.
- [ ] Repo admin confirms Vercel env vars are writable.
- [ ] On-call is aware that Supabase key rotation may invalidate any live user session held by a service-role-authenticated path (should be zero — but verify).
- [ ] Communications plan in place if anything breaks during rotation (most likely: a Vercel redeploy is needed to pick up new anon key; plan a maintenance window of ≤ 5 min).

---

## Timeline

| Phase                        | Sprint            | Owner action required?                                |
| ---------------------------- | ----------------- | ----------------------------------------------------- |
| Phase 1 (untrack, audit)     | Sprint 14 day 1   | No — can be done via PR                               |
| Phase 2 (rotate secrets)     | Sprint 14 day 1-2 | Yes — Supabase + Vercel + Sentry UI access            |
| Phase 3 (history purge)      | Sprint 14 day 3-5 | Yes — force-push authority + contributor coordination |
| Phase 4 (prevent recurrence) | Sprint 14 day 5   | No — CI + hook updates                                |

Total: 5 business days, fits inside Sprint 14 as a dedicated P0 story.
