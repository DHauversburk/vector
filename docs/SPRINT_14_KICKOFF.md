# Sprint 14 Kickoff — Backend Truth

**Sprint window:** 2026-04-15 → 2026-04-28 (2 weeks)
**Theme:** Backend truth. Stop pretending — real schema in repo, real edge function, real staging environment, real secrets hygiene.
**Referenced from:** `docs/ENTERPRISE_ROADMAP.md` §6 (Sprint 14 row), §8 Risks #1, #4, #6, #9.
**Inputs:** `docs/UX_AUDIT_2026-04.md` (decisions list), `docs/SEC-001-env-in-git.md` (security remediation), `docs/ENVIRONMENTS.md` (staging target).

---

## Why this sprint is load-bearing

Sprint 13 closed the toolchain and CI holes. Every sprint after Sprint 14 depends on three things this sprint makes real:

1. **A staging Supabase project** that is not `tvwicdlxljqijoikioln`. Until this exists, every preview deploy, every CI run, and every future E2E test exercises production data. This is Risk #6 (single-project blast radius) and it is P0.
2. **Schema, RLS, and RPCs checked into the repo.** Today they live only in the Supabase dashboard. Without this, no PR can meaningfully review a backend change. This is P3 and it closes Risk #4 (`SECURITY DEFINER` audit debt).
3. **A real `exchange-token` edge function.** Today the login path runs a mock in `src/lib/supabase.ts:203-237` with a hardcoded password. Real auth must land before Epic A (a11y) or Epic B (comms) can be tested. This is P4 and it closes Risk #1 (mock-mode fail-open).

Layered on top are two findings surfaced during Sprint 13 close that must resolve in Sprint 14 or we ship known debt into Sprint 15:

4. **SEC-001** — `.env` is tracked in git. Potentially ships secrets on every push. See `docs/SEC-001-env-in-git.md`. P0.
5. **Test-corpus instability** — `npm run test:coverage` fails 16 of 22 tests; coverage baseline is unmeasurable, which blocks the Risk #5 ratchet plan that Sprint 15+ depends on. See roadmap Risk #9. P1.

---

## PICK chart

Candidate work ranked on payoff × effort. The chart forces the conversation about what _doesn't_ fit before committing to a sprint plan — better than overcommitting and carrying over.

```
                 LOW effort                    HIGH effort
HIGH        ┌─────────────────────────┬─────────────────────────┐
payoff      │  IMPLEMENT              │  CHALLENGE              │
            │                         │                         │
            │  • P9 staging (16h)     │  • P3 migrations (36h)  │
            │  • SEC-001 P1+P4 (8h)   │  • P4 exchange-token    │
            │  • Test triage (8h)     │    (20h)                │
            │                         │  • SEC-001 P2 rotation  │
            │                         │    (8h + owner time)    │
            ├─────────────────────────┼─────────────────────────┤
LOW         │  POSSIBLE               │  KILL / DEFER           │
payoff      │                         │                         │
            │  • Epic E pre-visit     │  • SEC-001 P3 history   │
            │    notes (12h) —        │    purge — only if P2   │
            │    deferrable to        │    rotation confirms    │
            │    Sprint 15 wk 1       │    low-impact secrets   │
            │                         │  • Dependabot / CodeQL  │
            │                         │    live-scan (Sprint    │
            │                         │    18 per roadmap)      │
            │                         │  • Full test-corpus     │
            │                         │    rewrite (Sprint 15   │
            │                         │    debt work)           │
            └─────────────────────────┴─────────────────────────┘
```

**Effort totals by quadrant:**

| Quadrant   | Hours | What it buys                                       |
| ---------- | ----- | -------------------------------------------------- |
| Implement  | 32    | Quick, unblocking, low-risk wins. Do all three.    |
| Challenge  | 64    | High-payoff structural work. Carries the sprint.   |
| Possible   | 12    | Nice-to-have. Defer if capacity tight.             |
| Kill/Defer | —     | Do not schedule. Revisit after dependencies clear. |

**Implement + Challenge = 96h.** Two-engineer sprint capacity ≈ 80h (2 × 80h nominal × 0.5 realization rate after meetings, reviews, carryover, and context-switch tax). **The sprint is 16h over capacity.** See §Sprint width decision below.

---

## Stories

Each story has an owner-facing acceptance criterion and a per-surface validation method. Story IDs align with the platform epic numbering in `docs/ENTERPRISE_ROADMAP.md` §5 for easy cross-reference.

### S14.1 — P9: Provision staging Supabase project [P0, 16h, IMPLEMENT]

**As the** on-call engineer, **I want** a second Supabase project behind every CI run, preview deploy, and destructive test, **so that** a bad migration, a leaked service-role key, or a runaway E2E cannot damage production data.

**Acceptance:**

- [ ] A new Supabase project exists in the same org as `tvwicdlxljqijoikioln`. Working name: `vector-staging`.
- [ ] Project ref recorded in `docs/ENVIRONMENTS.md` (replace the `TBD` placeholder).
- [ ] Vercel project (`d-hauversburks-projects/<project>`) has three env-var scopes populated: Development, Preview, Production. Preview + Development point at staging; Production unchanged (still `tvwicdlxljqijoikioln`).
- [ ] A trivial preview deploy (e.g. `docs:` PR) loads and DevTools Network tab confirms requests go to `<staging-ref>.supabase.co`, not `tvwicdlxljqijoikioln`.
- [ ] Production deploy from `main` still targets `tvwicdlxljqijoikioln` (confirm via DevTools on the prod URL).

**Dependencies:** none. Start day 1.
**Blocks:** S14.3 (migrations applied to staging first), S14.4 (edge function deployed to staging first).
**Owner:** repo admin (Supabase org + Vercel team access).

---

### S14.2 — SEC-001 Phases 1 & 4: Untrack `.env` and prevent recurrence [P0, 8h, IMPLEMENT]

**As a** security-conscious contributor, **I want** `.env` to be removed from git's index and blocked from ever returning, **so that** the next `git push` cannot ship the file's contents to the remote.

**Acceptance:**

- [ ] `git rm --cached .env` + commit executed on `sprint-14/hotfix/sec-001` branch.
- [ ] `.env.example` present and documents every key without values.
- [ ] `.husky/pre-commit` appended: reject commit if `.env` appears in staged index.
- [ ] `.github/workflows/ci.yml` extended: a step fails the PR if `git ls-files --error-unmatch .env` succeeds.
- [ ] Verification steps 1–4 in `docs/SEC-001-env-in-git.md` §Verification pass locally.
- [ ] PR merged to `main` ahead of any work that requires rotating keys (S14.3 pushes migrations to prod).

**Dependencies:** branch protection _optional_ during this story — if enforced, admin must merge the hotfix themselves.
**Blocks:** S14.5 (key rotation cannot start until file is untracked).
**Owner:** any engineer.

---

### S14.3 — Test-corpus triage [P1, 8h, IMPLEMENT]

**As the** CI maintainer, **I want** `npm run test:coverage` to run green and produce a measurable baseline, **so that** the Risk #5 coverage ratchet can begin in Sprint 15.

**Acceptance:**

- [ ] For each of `src/mvp_enhancements.test.ts`, `src/verification.test.ts`, `src/verification_10_stories.test.ts`: either (a) tests pass using fixture creds loaded from staging via `tests/fixtures/supabase.ts` (post-S14.1), or (b) specific failing tests are marked `.skip` with a `// TODO(Sprint 15): rewrite as unit test — see SPRINT_14_KICKOFF.md S14.3` comment and a tally of skipped tests added to `docs/ENTERPRISE_ROADMAP.md` §8 Risk #9.
- [ ] `npm run test:coverage` exits 0 and writes a `coverage/` directory.
- [ ] Measured baseline (lines/branches/functions/statements) recorded in `vitest.config.ts` replacing the four `0` values, with a comment noting the date measured.
- [ ] CI `test:coverage` job green on the resulting PR.

**Dependencies:** Option (a) requires S14.1 (staging must exist for fixture creds). Option (b) has no dependencies.
**Blocks:** Sprint 15 coverage ratchet.
**Owner:** any engineer. Pair with S14.5 (CI + P2 touchpoints).

---

### S14.4 — P3: Supabase migrations baseline [P0, 36h, CHALLENGE]

**As** any engineer, **I want** the live Supabase schema, RLS policies, and RPCs checked into `supabase/migrations/`, **so that** a PR can review a backend change instead of having to diff against the dashboard.

**Acceptance:**

- [ ] `supabase init` committed (`supabase/config.toml`).
- [ ] `supabase/migrations/0001_baseline_schema.sql` — produced via `supabase db dump --schema public --linked` then reviewed.
- [ ] `supabase/migrations/0002_rls_policies.sql` — every RLS policy enumerated explicitly.
- [ ] `supabase/migrations/0003_rpc_functions.sql` — all 8 RPCs: `admin_create_user`, `provision_member`, `fix_duplicate_users`, `log_event`, `get_audit_logs`, `get_system_stats`, `admin_delete_user`, `admin_prune_unused_accounts`.
  - [ ] **Each RPC manually reviewed** for `SECURITY DEFINER` + `SET search_path = public, pg_temp`. Per Risk #4, dumped definitions may omit the search_path guard — if missing, add it before commit. **Do not merge this migration until a second engineer signs off on the audit.**
- [ ] `supabase/seed.sql` — deterministic test data (member, provider, admin; 1 appointment; 1 slot).
- [ ] `.github/workflows/supabase-migrate.yml` — on merge to `main`, `supabase db push --project-ref <staging>` runs first; manual gate for `<prod>`.
- [ ] Applied to staging (S14.1) and verified: Supabase dashboard → Database → Migrations shows `0001`, `0002`, `0003` with matching timestamps.
- [ ] Applied to prod behind manual approval; same verification against `tvwicdlxljqijoikioln`.
- [ ] `SELECT count(*) FROM pg_policies WHERE schemaname='public';` on staging equals the count derived from `0002_rls_policies.sql`.

**Dependencies:** S14.1 (staging exists to apply to first). Scheduled to start day 3.
**Blocks:** every future backend PR. Do not ship new backend features in Sprint 15+ until this lands.
**Owner:** backend-leaning engineer. Pair-review required on the SECURITY DEFINER audit.

---

### S14.5 — P4: Real `exchange-token` edge function [P0, 20h, CHALLENGE]

**As a** member logging in with a token, **I want** the server to validate my token with a real handler instead of a mock, **so that** authentication is actually enforced in production and rate limits are actually applied.

**Acceptance:**

- [ ] `supabase/functions/exchange-token/index.ts` — real Deno handler: token-format validation (regex), server-side HMAC-SHA256 with `SUPABASE_FUNCTION_PEPPER`, call `supabase.auth.admin` with service-role, return a session or a 401 (not a 200 with error payload).
- [ ] `supabase/functions/_shared/ratelimit.ts` — token bucket: 10 requests/min per IP, 3/min per token prefix. Persisted in a `rate_limits` table with 60-second TTL.
- [ ] `supabase/functions/exchange-token/index.test.ts` — Deno test covering: happy path, bad token → 401, 11th request in 60s → 429, malformed body → 400.
- [ ] `src/lib/supabase.ts:203-237` — mock client gated behind explicit `VITE_MOCK_MODE=true`; production build aborts at startup if `VITE_MOCK_MODE=true` in `import.meta.env.PROD` context. Closes Risk #1.
- [ ] `.github/workflows/deploy-functions.yml` — tag-triggered `supabase functions deploy exchange-token --project-ref <ref>`. Staging first, prod behind manual approval (mirrors S14.4 pattern).
- [ ] Supabase dashboard → Functions → `exchange-token` shows version hash matching the merge commit SHA.
- [ ] `curl -X POST https://<staging-ref>.supabase.co/functions/v1/exchange-token` with bad token returns 401.
- [ ] Same endpoint, 11th call within 60s returns 429.

**Dependencies:** S14.1 (staging target for deploy), S14.2 (no `.env` pollution before rotating), S14.6 (new secrets must be in Supabase Functions secrets, not the repo).
**Blocks:** Epic E product work, Epic A testing (real auth required for authenticated-only a11y checks).
**Owner:** backend-leaning engineer (can be same as S14.4 if split across both sprint weeks).

---

### S14.6 — SEC-001 Phase 2: Rotate potentially-exposed secrets [P0, 8h, CHALLENGE]

**As the** repo admin, **I want** every secret that has ever lived in `.env` rotated, **so that** values captured in git history are worthless to anyone who cloned or forked.

**Acceptance:**

- [ ] Phase 1 (S14.2) merged first — otherwise rotations will just get re-exposed on the next push.
- [ ] `git log -p .env` examined privately; list of ever-present secrets recorded in an off-repo note.
- [ ] For each secret on the list:
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` rotated via Supabase Dashboard → Settings → API. New key pushed to Supabase Functions secrets via `supabase secrets set`. Old key confirmed rejected by a test `curl`.
  - [ ] `VITE_SUPABASE_ANON_KEY` rotated. Vercel env vars updated across Development/Preview/Production scopes. CI secret updated.
  - [ ] `VITE_SENTRY_DSN` rotated (revoke + new key in Sentry UI). Vercel env vars updated.
  - [ ] `VITE_MOCK_PASSWORD` rotated if present (deprecated in S14.5; set to a random string until the code path is removed).
- [ ] Each rotation logged in a private note with timestamp + who rotated (input to Sprint 21 / P8 `ROLLBACK_RUNBOOK.md`).
- [ ] Decision captured: execute SEC-001 Phase 3 (history purge) or skip? **Skip if** only low-impact secrets lived in `.env` and all rotations succeeded.

**Dependencies:** S14.2 must merge first.
**Blocks:** none structurally, but leaving this undone keeps Risk (security) wide open.
**Owner:** repo admin (requires Supabase dashboard, Vercel dashboard, Sentry dashboard, and CI secrets access).

---

### S14.7 — Epic E: Pre-visit notes [P2, 12h, POSSIBLE]

**As a** member booking an appointment, **I want** to add a pre-visit note visible to the provider, **so that** the provider walks in already oriented to my reason for visit.

**Acceptance:** per `docs/ENTERPRISE_GAP_ANALYSIS.md` §3 — patient-authored free-text field, demographics confirmation step, pre-appointment checklist UI. **Note: constrain the UI to existing components. Do not introduce new modal patterns — Epic F (Sprint 15) will reshape all modals.**

**Recommendation:** defer to **Sprint 15 week 1** unless capacity surfaces unexpectedly. Rationale: Epic E is low-risk incremental product work; the challenge-tier platform work is higher-leverage and higher-risk. Better to ship the platform cleanly than to also ship a product feature that ends up re-done in Epic F.

**Dependencies:** S14.4 (migration must include any new columns), S14.5 (real auth required for provider-side test).
**Owner:** product-leaning engineer.

---

## Sprint width decision — split or hold?

**Total Implement + Challenge effort = 96h. Two-engineer capacity ≈ 80h. 16h over.**

Three options:

### Option A — Single Sprint 14, hold the line (recommended)

Drop S14.7 (Epic E) to Sprint 15 week 1. Implement + Challenge only.

- Week 1: S14.1 (P9 staging), S14.2 (SEC-001 P1+P4), S14.3 (test triage), S14.5 (exchange-token). Total: 52h.
- Week 2: S14.4 (migrations + SECURITY DEFINER audit), S14.6 (secret rotation). Total: 44h.
- **Total: 96h split 52/44. Still 16h over 80h cap.** Mitigation: accept 1 week of modest overtime or descope the seed file in S14.4 (saves ~4h) and skip/defer P4 tests to a follow-up PR (saves ~4h). If still tight, push S14.6 Phase 2 rotation into Sprint 15 week 1 (rotation can happen any time after S14.2 merges).

**Pro:** single sprint, single retrospective, single set of PRs.
**Con:** tight. Requires discipline to actually defer S14.7.

### Option B — Split into 14a / 14b

Week 1 = Sprint 14a, week 2 = Sprint 14b, each with its own standups and retro.

- 14a: S14.1, S14.2, S14.3, S14.5 — "make the truth testable."
- 14b: S14.4, S14.6 — "lock the backend and secrets in."

**Pro:** clearer success criteria per micro-sprint; easier to rebalance if week 1 slips.
**Con:** doubles the ceremony overhead; single sprint cycles are already compressed.

### Option C — Carry Sprint 14 to 3 weeks

Absorb the 16h overage explicitly. S14.7 fits.

**Pro:** realistic effort, no carryover into Sprint 15.
**Con:** slides Epic F (Sprint 15) by a week; full roadmap slides by a week; Sprint 21 becomes Sprint 22.

**Recommendation: Option A.** It preserves the 18-week plan established on 2026-04-14, and the overtime risk is manageable because the Implement tier (32h) is genuinely front-loadable to a single engineer in week 1 while the other starts S14.5. Revisit Option C only if the SECURITY DEFINER audit in S14.4 surfaces real debt (multiple RPCs needing rewrites rather than search_path additions).

---

## Decisions the repo owner must make before Sprint 14 starts

These block or gate the sprint. Ordered by urgency.

### Day 0 (before sprint starts)

1. **Replace `@OWNER` in `.github/CODEOWNERS` and `.github/dependabot.yml`** with the real GitHub handle. Without this, Dependabot PRs will fail on open, and the CODEOWNERS review enforcement is inert.
2. **Confirm the sprint-width option** (A/B/C above). Recommendation: A.
3. **Confirm scope of SEC-001 Phase 3** (history purge). Default: defer to after Phase 2 audit. Only required if `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_FUNCTION_PEPPER` are confirmed in history.

### Day 1–2 (gate S14.1 and S14.4)

4. **Name of the staging Supabase project.** Proposed: `vector-staging`. Any preference?
5. **Who runs secret rotation** (S14.6)? Needs Supabase dashboard + Vercel dashboard + Sentry dashboard admin access.

### Before Sprint 15 starts (asked here to give 2 weeks lead time)

6. **UX audit §Decisions needed** (from `docs/UX_AUDIT_2026-04.md` §Decisions needed before Sprint 15 starts):
   a. **Canonical term:** "Appointment"? (Proposed yes.)
   b. **NavShell:** shared component across roles or role-specific? (Proposed shared.)
   c. **Onboarding tour retirement timeline:** one release behind flag, or permanent feature? (Proposed one release.)
   d. **Modal primitives:** 3 (Modal/Dialog/ConfirmDialog) or 4 (add Drawer)? (Proposed 3, revisit in Sprint 17 if mobile UX testing surfaces a need.)
   e. **Visual regression pixel-diff threshold:** (Proposed 0.5%, ratchet per sprint.)

These inform the Epic F scope fixed on Day 1 of Sprint 15. Deciding late = rework.

### After Sprint 13 merges

7. **Enable branch protection on `main`** per `docs/BRANCH_PROTECTION.md`. Stagger per that doc's rollout table — don't enable everything at once. Required before Sprint 14 hotfix PRs can be properly gated.

---

## Risks specific to Sprint 14

Beyond roadmap Risks #1, #4, #6, #9 which this sprint directly mitigates:

### R14-α — Migration dump reveals schema that cannot be re-applied

**What:** `supabase db dump` of a project that has been hand-edited in the dashboard may produce SQL that fails on a clean Supabase instance (missing extensions, implicit ownership assumptions). S14.4 could burn a day just making the baseline apply.

**Mitigation:** apply `0001_baseline_schema.sql` to staging on Day 1 of Week 2, not Day 5. Bail out to Option C (carry Sprint 14 to 3 weeks) if the dump is materially broken rather than jamming a half-baseline in.

### R14-β — SECURITY DEFINER audit reveals privilege-escalation bug in production

**What:** Risk #4 scenario materializes during S14.4 audit. One or more RPCs lack `SET search_path`. A malicious user could plant a function in a mutable schema and hijack a `SECURITY DEFINER` call.

**Mitigation:** if found, treat as a production incident (not a sprint story): patch the live RPC first via a hotfix migration applied directly to prod; include the patched definition in `0003_rpc_functions.sql`; document in `docs/ROLLBACK_RUNBOOK.md` backlog.

### R14-γ — Vercel env-var swap mid-sprint breaks existing preview URLs

**What:** When S14.1 flips Preview scope from prod Supabase to staging, any in-flight PR preview stops working for reviewers who were using it with production credentials.

**Mitigation:** schedule the flip at start of Week 1 Day 2 (not Day 1 — let Day 1 land S14.1 cleanly). Announce in the team channel. Re-trigger existing preview deploys after the flip.

### R14-δ — `exchange-token` rate-limit store doesn't exist yet

**What:** S14.5's rate limiter needs a persistence store. If a `rate_limits` table doesn't exist in staging Supabase (likely — it's not in the current dashboard schema), S14.5 is blocked until S14.4's `0001_baseline_schema.sql` lands.

**Mitigation:** add a new migration `0004_rate_limits.sql` as part of S14.5 scope (not S14.4). Keeps the two stories independently shippable.

---

## Validation (end-of-sprint checklist)

On the Friday of Week 2, before the retro, confirm all of these:

| #   | Check                                      | Where                                                                   | Expected                                                                                       |
| --- | ------------------------------------------ | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 1   | Staging Supabase project exists in the org | Supabase org page                                                       | Second project listed alongside `tvwicdlxljqijoikioln`                                         |
| 2   | Preview deploy hits staging                | Vercel Preview URL → DevTools Network                                   | `<staging-ref>.supabase.co` requests, not `tvwicdlxljqijoikioln`                               |
| 3   | Prod deploy still hits prod                | Prod URL → DevTools Network                                             | `tvwicdlxljqijoikioln` requests                                                                |
| 4   | `git ls-files --error-unmatch .env`        | Local shell                                                             | Exits non-zero (file untracked)                                                                |
| 5   | `.env` in staged commit                    | Local: `git add .env && git commit`                                     | Pre-commit hook rejects                                                                        |
| 6   | `.env` in a PR                             | GitHub Actions                                                          | CI check `Verify .env is not tracked` fails                                                    |
| 7   | `npm run test:coverage`                    | Local + CI                                                              | Exits 0; `coverage/` directory written; baseline in `vitest.config.ts`                         |
| 8   | Migrations applied to staging              | Supabase staging → Database → Migrations                                | `0001`, `0002`, `0003`, `0004` visible                                                         |
| 9   | Migrations applied to prod                 | Supabase prod → Database → Migrations                                   | Same set visible after manual approval in `supabase-migrate.yml`                               |
| 10  | RLS policy count matches                   | Staging SQL Editor                                                      | `SELECT count(*) FROM pg_policies WHERE schemaname='public';` equals count derived from `0002` |
| 11  | `exchange-token` deployed to staging       | Supabase staging → Functions → `exchange-token`                         | Version hash visible                                                                           |
| 12  | Rate limit works                           | `curl -X POST https://<staging>/functions/v1/exchange-token` 11× in 60s | 11th call returns 429                                                                          |
| 13  | Bad token rejected                         | Same endpoint with garbage body                                         | Returns 401 (not 200 with error payload)                                                       |
| 14  | Mock mode fails in prod build              | Set `VITE_MOCK_MODE=true` in prod build env, run build                  | Build or runtime aborts with explicit error                                                    |
| 15  | Old secrets rejected                       | `curl` against old Supabase anon key                                    | Returns 401                                                                                    |
| 16  | Old Sentry DSN rejected                    | Test POST to old DSN                                                    | Returns 401                                                                                    |

---

## Out of scope for Sprint 14

Explicitly **not** this sprint (listed to keep scope creep visible):

- Epic F (UX Foundation) — Sprint 15.
- Epic A (Accessibility) — Sprint 17.
- Full test-corpus rewrite (only triage in Sprint 14) — Sprint 15 debt story.
- SEC-001 Phase 3 (`git filter-repo`) — defer pending Phase 2 audit outcome.
- `ON_CALL_RUNBOOK.md` — Sprint 18 with P6.
- `ROLLBACK_RUNBOOK.md` — Sprint 21 with P8.
- Branch-protection incremental rollout per `docs/BRANCH_PROTECTION.md` — happens in parallel (owned by admin, not an engineer story).

---

## Sprint retrospective prompts

Come to the retro prepared to answer:

1. Did the SECURITY DEFINER audit (S14.4) find real privilege-escalation debt? If yes, how did we handle it and did Risk #4's mitigation plan hold?
2. Did the 96h-into-80h overcommit manifest as overtime, as descope, or as carryover? Which is healthiest going into Sprint 15?
3. Did S14.1 → S14.4 → S14.5 sequencing hold, or did blockers force re-ordering? Anything to learn for future sprints with platform dependencies?
4. Did the test-corpus triage (S14.3) reveal that tests-as-written are the wrong shape? If so, what does Sprint 15's rewrite story need to account for?
5. What is the next Sprint 14-like "make the truth real" lurking? (Candidate: observability — P6 in Sprint 18.)
