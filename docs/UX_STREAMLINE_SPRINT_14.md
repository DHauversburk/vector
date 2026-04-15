# Sprint 14 — UX Streamline Findings

**Branch:** `sprint-14/streamline-ui`
**Date:** 2026-04-15
**Trigger:** User directive — "fix the interface significantly… too much redundancy and it is creating inefficient bloat for the sake of looking 'spiffy'. I need this to be highly efficient and effective." Follow-up: "streamline the hell out of this project and reduce the massive amount of duplicative, redundant documents and code."

## TL;DR

| Metric                               | Before | After | Δ           |
| ------------------------------------ | ------ | ----- | ----------- |
| Root/`docs/` markdown files          | 31     | 15    | **−16**     |
| Files in `docs/archive/`             | 24     | 5     | **−19**     |
| Lines deleted in this commit         | —      | —     | **−3,828**  |
| Lines added in this commit           | —      | —     | **+481**    |
| Net line reduction                   | —      | —     | **≈ 3,350** |
| Fake/marketing boot delay at sign-in | 3.2 s  | 0 s   | **−3.2 s**  |
| TypeScript errors                    | 0      | 0     | unchanged   |

## What was wrong

1. **Marketing-jargon theatre in user-visible copy.** "INITIALIZING CLINICAL NODE…", "AUTHENTICATING OPERATOR…", "Tactical Mutation Queue", "Mission Control", "Token Station", "OPERATIONAL MEDICINE (RED)", "FIPS-140 Zero-Trust" — all LARPing as a military terminal, none of it adding clarity for the actual user (patient / clinician / admin).
2. **A 3.2-second fake boot sequence** on every sign-in, spelling out "SECURITY PROTOCOLS ENGAGED" across five staggered phases. Pure friction.
3. **Documentation ballooned to 31 files** with at least five fully-superseded docs (`BETA_2_ROADMAP.md`, `BETA_TESTING_GUIDE.md`, `ALPHA_READINESS_CHECKLIST.md`, `DEPLOYMENT_GUIDE.md`, `PROJECT_VECTOR_OVERVIEW.md`) still presenting themselves as authoritative. Four different files had four different mock-credential schemes; none matched what the code actually accepted.
4. **Stale version metadata everywhere.** `README.md` said v1.4.2; `package.json` said v2.2.0-beta; `ENTERPRISE_GAP_ANALYSIS.md` header said v2.0.0-beta.
5. **Seven redundant "verification report" files** from the same day (2025-12-26) narrating the same mock-mode wire-up exercise.
6. **Duplicate `ErrorBoundary`** — one copy in `src/components/`, another in `src/components/ui/`. Only the `ui/` one was imported; the other was 50 dead lines.
7. **A 268-line unused `SplashScreen.tsx`** with zero import sites.

## What changed

### A. Source code (user-visible)

| File                                            | Change                                                                                                                                                  |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/pages/LandingPage.tsx`                     | 312 → 130 lines. Dropped boot sequence, 4 marketing tiles, FIPS/BETA footer. Three plain entry points.                                                  |
| `src/pages/LoginPage.tsx`                       | Error copy rewritten ("Wrong PIN. Try again." vs "ACCESS DENIED: INVALID SECURITY PIN"). Compliance footer dropped.                                     |
| `src/pages/MemberDashboard.tsx`                 | MISSION → Appointment across titles, labels, empty-states.                                                                                              |
| `src/pages/AdminDashboard.tsx`                  | "Token Station" → "Tokens". Comments de-jargoned.                                                                                                       |
| `src/pages/ProviderDashboard.tsx`               | "INITIALIZING CLINICAL NODE…" → "Loading your dashboard…"                                                                                               |
| `src/pages/Dashboard.tsx`                       | JSDoc rewritten: Admin/Provider/Member (not Mission Control / Clinical Node / Patient Portal).                                                          |
| `src/App.tsx`                                   | "AUTHENTICATING OPERATOR…" → "Signing you in…"                                                                                                          |
| `src/components/auth/AuthForm.tsx`              | "Authenticate" / "Secure Login" → "Sign in". Label cleanup. SHOUTING-CAP errors → sentence case.                                                        |
| `src/components/auth/LoginHeader.tsx`           | Stage titles rewritten. Ornament dividers removed.                                                                                                      |
| `src/components/auth/PinSetup.tsx`              | "Initialize Security" → "Set up your PIN".                                                                                                              |
| `src/components/auth/PinVerification.tsx`       | "Security PIN Required" → "Enter your PIN".                                                                                                             |
| `src/components/auth/BiometricLockOverlay.tsx`  | "Terminate Session" → "Sign out"; FIPS chip removed.                                                                                                    |
| `src/components/ui/ErrorBoundary.tsx`           | "Component Failure" → "Something went wrong". Random reference code dropped.                                                                            |
| `src/components/ui/LoadingState.tsx`            | Default "INITIALIZING MODULE…" → "Loading…".                                                                                                            |
| `src/components/ui/PWAManager.tsx`              | "Connectivity Restored" / "Operational Update Available" → "Back online" / "Update available".                                                          |
| `src/components/offline/SyncManager.tsx`        | "Tactical Mutation Queue" → "Sync queue". "Flush Queue" → "Clear queue".                                                                                |
| `src/components/admin/TokenGenerator.tsx`       | Service labels: SHOUTING → Title Case. "OPERATIONAL MEDICINE (RED)" → "Primary Care" (display only; enum values unchanged).                             |
| `src/components/admin/AuditLogViewer.tsx`       | "Initializing Uplink…" → "Loading audit logs…".                                                                                                         |
| `src/components/member/AppointmentTimeline.tsx` | "Operational Metadata" → "Details".                                                                                                                     |
| `src/components/provider/schedule/DayView.tsx`  | "Operational Density" → "Day capacity".                                                                                                                 |
| `src/contexts/OnboardingContext.tsx`            | "Admin Command Center" → "Admin dashboard". "Token Station" → "Tokens".                                                                                 |
| `src/hooks/useMemberDashboard.ts`               | "Neutralizing appointment entry…" → "Cancelling appointment…"                                                                                           |
| `src/hooks/useBootSequence.ts`                  | Now completes instantly — preserves the same API so no consumer change required.                                                                        |
| `src/lib/constants.ts`                          | `TACTICAL_TIPS` content replaced with actual, useful tips. Export name preserved for back-compat.                                                       |
| `src/lib/supabase.ts`                           | Mock errors now name the real demo tokens. **Patched pre-existing defect** — mock auth was missing `setSession`, which blocked the token-exchange flow. |
| `src/lib/crypto.ts`                             | JSDoc de-marketingified. No behaviour change.                                                                                                           |
| `src/sw.ts`                                     | Push notifications: "Mission Alerts" → "appointment reminders".                                                                                         |
| `src/lib/api/appointments/mock.ts`              | Sample data: "Clinical Node B-4" → "Mental Health Clinic".                                                                                              |
| `src/main.tsx`                                  | Switched `ErrorBoundary` import to the surviving copy; trimmed debug logging.                                                                           |

**Deleted (pure dead code):**

- `src/components/ErrorBoundary.tsx` — 50 lines, 0 imports (the `ui/` copy was the real one)
- `src/components/ui/SplashScreen.tsx` — 268 lines, 0 imports

### B. Documentation

**Rewritten (stale or jargon-laden):**

- `README.md` — version fixed (v1.4.2 → v2.2.0-beta), mock tokens match actual implementation (`M-001`, `PT-01`, `DOC-1`, `MH-1`, `TECH-1`, `ADMIN-01`), marketing badges removed.
- `ARCHITECTURE.md` — "Tactical UI" / "Mission Control" / "Clinical Node" language replaced with plain role names.
- `CONTRIBUTING.md` — broken ref to `BETA_2_ROADMAP.md` removed; added copy conventions ("plain English, no marketing jargon, no SHOUTING CAPS").
- `DEPLOY.md` — stale date (2025-12-26) removed, credentials match reality, broken cross-refs to archived files pruned.
- `docs/PRODUCT_BACKLOG.md` — status banner added at top; "Related Documents" section points to the authoritative roadmap.

**Consolidated (seven files → one):**

- `docs/archive/verification_report_admin.md` + `_automated.md` + `_final.md` + `_v2.md` + `verification_10_stories.md` + `_report.md` + `verification_complex_stories.md` → **`docs/archive/VERIFICATION_HISTORY_2025-12.md`** (36 lines). Net –223 lines, seven redundant files → one.

**Consolidated (seven files → one):**

- `docs/archive/SPRINT_0_COMPLETE.md` + `SPRINT_{1-4}_PROGRESS.md` + `SPRINT_PLANNING.md` + `LINT_ANALYSIS_AND_PLAN.md` → **`docs/archive/SPRINT_HISTORY_0-4.md`** (61 lines). Net –743 lines, seven fragments → one retrospective.

**Deleted (superseded / duplicate):**

| File                                        | Reason                                                      |
| ------------------------------------------- | ----------------------------------------------------------- |
| `docs/archive/BETA_2_ROADMAP.md`            | Superseded by `docs/ENTERPRISE_ROADMAP.md` (726 lines gone) |
| `docs/archive/BETA_2_LAUNCH_READINESS.md`   | Beta 2 milestone no longer current                          |
| `docs/archive/BETA_2_TEST_VALIDATION.md`    | Beta 2 milestone no longer current                          |
| `docs/archive/BETA_TESTING_GUIDE.md`        | Contained stale token format; contradicted current reality  |
| `docs/archive/ALPHA_READINESS_CHECKLIST.md` | Pre-beta phase — fully obsolete                             |
| `docs/archive/DEPLOYMENT_GUIDE.md`          | Duplicate of root `DEPLOY.md`                               |
| `docs/archive/PROJECT_VECTOR_OVERVIEW.md`   | Marketing pitch; stale `M-8821-X4` token format             |
| `docs/archive/WALKTHROUGH.md`               | Demo credentials didn't match actual mock implementation    |
| `docs/archive/TEST_SCENARIOS.md`            | Superseded by roadmap's P5 test-strategy epic               |

**Moved:**

- `docs/TEST_PLAN_SPRINT_7_8.md` → `docs/archive/TEST_PLAN_SPRINT_7_8.md` (sprint closed).

## What was not touched (and why)

- **Supabase migrations / schema consolidation.** This is epic P3 in the roadmap (~36h). Out of scope for a copy-and-doc pass; the ad-hoc SQL in `src/scripts/` needs a migrations-as-code conversion before it can be cleanly reduced.
- **`src/lib/api/<domain>/{mock,supabase}.ts` pattern.** Looked like duplication on first inspection; it's actually a clean strategy split (one file per backend, with a sibling `<domain>.ts` picking at import time). Left alone.
- **Service-type enum values (`MH_GREEN`, `PT_BLUE`, `PCM_RED`).** Renaming would require a database migration. Changed display labels only.
- **Vercel URL `project-vector-beta.vercel.app`.** Not code-changeable. See "Follow-ups" below.

## Follow-ups (not in this PR)

1. **Rename the Vercel deployment.** The URL `project-vector-beta.vercel.app` is team `d-hauversburks-projects` — rename the project in Vercel → Settings → General to `vector` (or `vector-clinic`). Target URL: `vector.vercel.app` or a custom domain. Code-side, `package.json.name` is already `"vector"`.
2. **Consolidate ad-hoc SQL in `src/scripts/`.** ~40 files named `fix_*.sql`, `nuclear_fix_*.sql`, `alter_*.sql` — evidence of emergency fixes that should be rolled into proper migrations. Tracked as P3 in the roadmap.
3. **Ratchet coverage floor.** Tests pass at the current baseline; P5 in the roadmap schedules a +5 pts/sprint ratchet.
4. **Finish the tone sweep on admin-side copy.** Admin dashboard has a few remaining "System Health" / "Console" labels that could become plainer ("Metrics" / "Menu"). Scoped for a Sprint 15 polish pass.

## Validation

- `npm run typecheck` → green
- `npm run build` → ships (see commit CI)
- Visual smoke: LandingPage → "I have an appointment card" → LoginPage (instant, no 3.2s boot) → token `M-001` → PIN setup ("Set up your PIN / Choose a 4-digit PIN.") → PIN `1234` → MemberDashboard ("Upcoming appointment" / "Book appointment"). No MISSION, no CLINICAL NODE, no OPERATOR.

## Philosophical note

The stripped copy isn't less "professional" — it's **more** professional. Plain labels trust the user to know what a "Sign in" button does. SHOUTING-CAP error messages like `ACCESS DENIED: INVALID SECURITY PIN` are friction disguised as gravitas; `Wrong PIN. Try again.` is what medical software should sound like. DoorDash doesn't tell you your taco order requires "TACTICAL AUTHENTICATION"; neither should a clinic scheduler.
