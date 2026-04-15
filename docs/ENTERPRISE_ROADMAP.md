# VECTOR: Enterprise Roadmap

**Status:** AUTHORITATIVE — single source of truth for forward planning.
**Current version:** `2.2.0-beta` (per `package.json`)
**Target:** `3.0.0-ga` (enterprise-ready GA)
**Owner:** Engineering Team
**Review cadence:** End of each sprint; full re-baseline after Sprint 21.
**Last updated:** 2026-04-14

Contributing inputs (historic / scoped):

- `docs/ENTERPRISE_GAP_ANALYSIS.md` — product PICK analysis (a11y, comms, analytics). Sprint 10–12 proposals there are superseded by §Sprint Plan below.
- `docs/PRODUCT_BACKLOG.md` — user personas, Epics 1–5 (complete), and the historic "Phase 2 Roadmap" (Sprints 9–11). Superseded by §Sprint Plan below.
- `docs/ACCESSIBILITY_CHECKLIST.md`, `docs/TEST_PLAN_SPRINT_7_8.md` — tactical checklists; remain valid.

---

## 1. Executive Summary

Project Vector is a zero-trust anonymous medical scheduling system for DoD/military use. The **product feature layer** (offline PWA, security primitives, core scheduling) is in strong shape — ~78% against enterprise medical-software standards per the existing gap analysis. The **UX/design-system layer** is materially weaker than the feature coverage suggests: terminology fragments across roles ("Mission" for members vs "Appointment" for providers), 12 ad-hoc modal implementations with inconsistent patterns, provider nav has 7 tabs vs member 3, onboarding tours attempt to paper over unclear information architecture. Estimated ~45% against enterprise UX-consistency standards. The **platform layer** (CI/CD, infrastructure-as-code, observability, release engineering, environment discipline) is the furthest behind — estimated ~35% against enterprise DevSecOps standards.

This roadmap closes all three gaps over 18 weeks (Sprints 13–21) by interleaving product features with platform foundations, with a dedicated UX Foundation epic (F) front-loaded before the accessibility and communications epics because WCAG labels applied to unclear workflows compound rather than fix the problem. Platform work is front-loaded _just enough_ to make every subsequent sprint verifiable end-to-end across GitHub, Supabase, and Vercel — but not so much that product velocity stalls.

### Readiness snapshot

| Layer                                    | Current | GA target | Primary evidence                                                                                                                                                                       |
| ---------------------------------------- | ------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Product — core scheduling                | 90%     | 95%       | Epic 1–5 in `PRODUCT_BACKLOG.md` complete                                                                                                                                              |
| Product — UX consistency / design system | 45%     | 90%       | Terminology splits by role ("Mission" vs "Appointment"); 12 modal implementations; IA divergence (3/7/5 nav tabs across roles); onboarding tours compensating for IA gaps — see Epic F |
| Product — accessibility (WCAG 2.1 AA)    | 40%     | 100%      | `ENTERPRISE_GAP_ANALYSIS.md` §Critical Gaps — blocked by UX Foundation (Epic F)                                                                                                        |
| Product — communications                 | 55%     | 90%       | No SMS/email reminders in repo — UI patterns blocked by Epic F                                                                                                                         |
| Product — analytics/reporting            | 50%     | 85%       | No export, no no-show tracking                                                                                                                                                         |
| Platform — CI/CD                         | 0%      | 100%      | `.github/` directory does not exist                                                                                                                                                    |
| Platform — IaC (Supabase)                | 10%     | 100%      | No `supabase/migrations/` in repo                                                                                                                                                      |
| Platform — security headers              | 40%     | 95%       | `vercel.json` CSP uses `unsafe-inline`/`unsafe-eval`                                                                                                                                   |
| Platform — observability                 | 5%      | 90%       | No Sentry, no Web Vitals, no uptime                                                                                                                                                    |
| Platform — release engineering           | 10%     | 90%       | Manual deploys, no tags, no CHANGELOG                                                                                                                                                  |
| Platform — environments                  | 33%     | 100%      | Single Supabase project; staging unclear                                                                                                                                               |

---

## 2. Deployment Surface Inventory

All enterprise changes must land on one or more of these three surfaces. Validation criteria per surface are defined in §7.

| Surface      | Reference                                                                                          | Notes                                                                                                                                             |
| ------------ | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vercel**   | Team `d-hauversburks-projects` — `https://vercel.com/d-hauversburks-projects`                      | Hosts the SPA. Preview deploys exist; env-var scoping (Preview vs Production) is the lever for safe staging once a separate Supabase is in place. |
| **Supabase** | Project ref `tvwicdlxljqijoikioln` — `https://supabase.com/dashboard/project/tvwicdlxljqijoikioln` | Only known project. Hosts Postgres, Auth, Edge Functions. Staging project to be provisioned in Epic P9.                                           |
| **GitHub**   | Source repo (no `.github/` directory yet)                                                          | CI/CD surface. All automation lands here via workflows, Dependabot, CODEOWNERS, branch protection.                                                |

---

## 3. Sprint Numbering Reset

Sprints **9–12 are historic.** The record is:

- Sprints 0–8: foundation through patient-notes system — complete (`docs/archive/SPRINT_*`).
- Sprint 9: offline PWA foundation ("The Bunker") — complete (Epic 4, `PRODUCT_BACKLOG.md` §Epic 4).
- Sprints 10–11 (as named in `PRODUCT_BACKLOG.md` Phase 2 Roadmap): "Sync or Swim" and "Fort Knox" — complete (Epic 4.2, Epic 5 per the status checkboxes there).
- Sprint 10–12 (as proposed in `ENTERPRISE_GAP_ANALYSIS.md`): accessibility / comms / analytics — **renumbered below as Sprints 17–18, 19, 20** respectively, after Epic F (UX Foundation) takes Sprints 15–16. The original numbering is deprecated.

Forward sprints begin at **Sprint 13.** Use the §Sprint Plan table below as the authoritative sequence.

---

## 4. Product Epics Carried Forward

These epics originated in `docs/ENTERPRISE_GAP_ANALYSIS.md` and are restated here with clean sprint numbers. Scope and effort estimates remain as specified there.

### Product Epic A — Accessibility (WCAG 2.1 AA)

Scope per `ENTERPRISE_GAP_ANALYSIS.md` §1 and the "Compliance Ready" sprint proposal (stories 10.1–10.7): ARIA labels, skip-nav + keyboard audit, focus management, screen-reader live regions, color contrast + high-contrast mode, touch-target audit (44px), failed-login lockout feedback. **Lands in Sprints 17–18** (pushed from 15–16 because Epic F must settle the UX primitives a11y is applied to).

### Product Epic B — Connected Care (Communications)

Scope per `ENTERPRISE_GAP_ANALYSIS.md` "Connected Care" sprint (stories 11.1–11.6): Supabase Edge Function for email, 24h + 1h reminders, confirmation email, waitlist auto-notify, post-visit feedback, pre-visit notes UI. **Lands in Sprint 19** (pushed from 17 — same reason as Epic A).

### Product Epic C — Data Command (Analytics & Reporting)

Scope per `ENTERPRISE_GAP_ANALYSIS.md` "Data Command" sprint (stories 12.1–12.5): no-show rate tracking, provider utilization %, CSV export, enhanced audit-log UI + export, appointment-type analytics. **Lands in Sprint 20** (pushed from 19).

### Product Epic D — Client-Side Encryption & HIPAA Readiness

Scope per `ENTERPRISE_GAP_ANALYSIS.md` "Challenge" tier: client-side encryption of IndexedDB/LocalStorage (AES-GCM; already partially shipped per Epic 5.2 in `PRODUCT_BACKLOG.md` but needs audit), explicit BAA documentation readiness, data-export audit trail, failed-login lockout at the Auth layer. Lands in Sprint 18 (co-sprints with Epic A Part II).

### Product Epic E — Pre-Visit Workflow

Scope per `ENTERPRISE_GAP_ANALYSIS.md` §3: pre-visit notes field (patient-authored), demographics confirmation, pre-appointment checklist. Lands in Sprint 14 alongside backend truth work (it's the first product feature that exercises the real exchange-token edge fn).

### Product Epic F — UX Foundation & Design System Reset

**Priority:** P0 (blocks Epic A, B) · **Effort:** ~48h · **Surfaces:** src/, GitHub (tests), Vercel (visual regression on preview)

A UX audit (2026-04-14) surfaced that the product's feature completeness masks a brittle UX layer. Applying WCAG 2.1 AA labels (Epic A) to workflows that use inconsistent terminology and IA would cement the inconsistency in accessibility tests, making future reconciliation harder. This epic runs _before_ Epic A and B and establishes the primitives they depend on.

**Findings (HIGH severity):**

1. **Terminology fragmentation.** The member dashboard calls scheduled visits "Missions" (`src/pages/MemberDashboard.tsx:106-108, 162`); the provider dashboard calls the same entity "Appointments"; audit logs mix both. Mental model for anyone switching roles (admins, testers, docs writers) is incoherent.
2. **Modal proliferation.** ~12 distinct modal implementations exist (`ConfirmModal`, `WelcomeModal`, `HelpRequestModal`, `QuickNoteModal`, `AppointmentModal`, `SlotGeneratorModal`, `BulkArchiveModal`, and more inline). Focus-trap behavior, escape-to-close, backdrop-click, scroll-lock all differ. Impossible to WCAG-certify without first unifying.
3. **Information architecture divergence.** Member role exposes 3 nav tabs; provider exposes 7; admin has 5 ad-hoc views not represented in any nav. No shared pattern for primary vs secondary vs destructive actions.
4. **Onboarding tours as anti-pattern.** `src/components/onboarding/` exists to explain the IA _at first use_ — a symptom of the IA not being self-explanatory. The fix is not more tour, it's fewer decisions to teach.

**Findings (MED severity):**

5. **Dark-mode coverage incomplete.** Several surfaces hardcode light-mode colors; toggling dark mode reveals low-contrast text and broken containers.
6. **Form input pattern fragmentation.** Only `Input.tsx` has size/state variants; other controls (select, textarea, checkbox) are inline-styled per-use-site.
7. **Width / max-width inconsistency.** Page containers vary 640px–1280px with no documented rationale.

**Deliverables:**

- `docs/UX_AUDIT_2026-04.md` — the audit, cited in findings above.
- `docs/DESIGN_SYSTEM.md` — canonical vocabulary decision (e.g., "Appointment" as the domain term across all roles; "Mission" deprecated) and IA reset (shared top-level primary actions per role).
- `src/components/ui/` — consolidated primitives: `Modal`, `Dialog`, `ConfirmDialog` (exactly 3 modal shapes, not 12); `Button` with variants; `Input`/`Select`/`Textarea`/`Checkbox` with shared size + state props; `PageContainer` with one documented max-width.
- `src/components/ui/tokens.ts` — spacing, typography, color, radius tokens surfaced as Tailwind theme extensions so dark-mode parity is enforced at the token layer, not per-component.
- Codemod or manual migration removing the 12 bespoke modals in favor of the 3 primitives. Every replaced call site tested visually.
- Rename member-surface "Mission" to "Appointment" across code, strings, and audit-log events. Back-compat for stored audit rows via a display-layer mapper; DB column names unchanged unless trivial.
- Retire the onboarding tour in favor of inline empty-state guidance ("You have no upcoming appointments. [Book one]") where the tour was previously needed. Keep the tour component as a fallback behind a feature flag for one release.
- `tests/visual/` — Playwright + `toHaveScreenshot()` baseline for each primitive and each of the 10 highest-traffic pages. Preview deploys compute a visual diff comment on the PR.
- `.github/workflows/visual-regression.yml` — runs the visual suite against Vercel preview; failures block merge unless a reviewer explicitly approves the diff.

**Validation:**

- `grep -r "Mission" src/` returns only the migration mapper and the deprecation comment.
- `grep -r "from ['\"].*Modal['\"]" src/` shows every import resolves to `src/components/ui/Modal` (or `Dialog`/`ConfirmDialog`).
- Member, provider, admin nav all share a common `<NavShell>` component; tab counts may differ by role but the structure is one component.
- Visual regression job green on the 10 highest-traffic pages.
- Onboarding tour component exists only behind `VITE_LEGACY_ONBOARDING=true`; default user never sees it.

**Lands in:** Sprints 15–16. Epic A (accessibility) shifts to Sprint 17–18 because a11y is built _on top of_ the new primitives, not retrofitted into the old ones. Epic B (comms) shifts to Sprint 19.

Depends on: P2 (scripts for the visual test workflow), P5.2 (Playwright config).

---

## 5. Platform Epics (P1–P9)

The new content in this roadmap. Every epic specifies concrete files, the surface(s) they land on, and validation steps.

### P1 — CI/CD Foundation

**Priority:** P0 · **Effort:** ~28h · **Surfaces:** GitHub

The repo has no `.github/` directory (verified). Every merge is currently unverified.

Artifacts:

- `.github/workflows/ci.yml` — PR matrix (Node 20 + 22): `npm ci`, `npm run lint`, `npm run typecheck`, `npm run test -- --coverage`, `npm run build`.
- `.github/workflows/preview-deploy.yml` — on Vercel preview success: Lighthouse CI + axe against the preview URL; attach reports as PR artifacts.
- `.github/workflows/codeql.yml` — weekly cron + PR-triggered JavaScript/TypeScript SAST.
- `.github/dependabot.yml` — npm weekly, actions weekly; grouped updates.
- `.github/CODEOWNERS` — directory-level ownership.
- `.github/PULL_REQUEST_TEMPLATE.md` — structured PR description (context / change / test plan / validation per surface).
- `.github/ISSUE_TEMPLATE/bug_report.yml`, `feature_request.yml`.
- `docs/BRANCH_PROTECTION.md` — documents the GitHub UI rules: require CI checks green, 1 reviewer, signed commits, no force-push to `main`. Enforcement lives in the GitHub Settings UI.

Depends on: P2 (scripts must exist before `ci.yml` can call them).

Validation: see P1 row in §7.

### P2 — Developer Toolchain & Quality Gates

**Priority:** P0 · **Effort:** ~16h · **Surfaces:** GitHub (via repo root files)

`package.json` currently has only `dev`, `build`, `lint`, `preview`. `vitest` is installed but not wired to a script.

Artifacts:

- Scripts added to `package.json`: `test`, `test:coverage`, `typecheck` (`tsc --noEmit`), `format`, `format:check`, `lint:fix`, `prepare` (husky install), `e2e`, `e2e:ui`.
- devDependencies added: `prettier`, `husky`, `lint-staged`, `@commitlint/{cli,config-conventional}`, `@playwright/test`, `@axe-core/playwright`, `@lhci/cli`, `eslint-plugin-jsx-a11y`, `eslint-plugin-security`.
- Config: `.prettierrc.json`, `.prettierignore`, `.editorconfig`, `.nvmrc` (pin the CI Node version).
- Git hooks: `.husky/pre-commit` (runs `lint-staged`), `.husky/commit-msg` (runs `commitlint`).
- `lint-staged.config.js`, `commitlint.config.js` (extends `@commitlint/config-conventional`).
- Extract `vitest.config.ts` out of `vite.config.ts` so the app build graph and the test graph are independent. Set coverage thresholds to the **measured baseline** initially (not 80% — see Risk #5 in §8); ratchet +5 points per sprint.

Depends on: nothing; unblocks P1 and everything else.

### P3 — Supabase Infrastructure-as-Code

**Priority:** P0 · **Effort:** ~36h · **Surfaces:** Supabase (`tvwicdlxljqijoikioln`), GitHub

Database schema, RLS policies, and RPCs exist only in the Supabase dashboard. They are unreviewable, un-diffable, and cannot be reliably replicated into a staging project.

Artifacts:

- `supabase/config.toml` — from `supabase init`; project ref pinned.
- `supabase/migrations/0001_baseline_schema.sql` — `supabase db dump --schema public --linked` against the prod project; covers tables (`users`, `appointments`, `audit_logs`, `user_pins`, `encounter_notes`, `help_requests`, `waitlist_entries`, `note_statistics`, `provider_resources`, `feedback`), indexes, foreign keys.
- `supabase/migrations/0002_rls_policies.sql` — every policy explicit; one policy per (table, role, operation) tuple. All sensitive tables MUST have RLS enabled; no silent bypasses.
- `supabase/migrations/0003_rpc_functions.sql` — all 8 RPCs referenced from the client: `admin_create_user`, `provision_member`, `fix_duplicate_users`, `log_event`, `get_audit_logs`, `get_system_stats`, `admin_delete_user`, `admin_prune_unused_accounts`. Each declared with both `SECURITY DEFINER` **and** `SET search_path = public, pg_temp`. **Manual audit required before merge** — see Risk #4 in §8.
- `supabase/seed.sql` — deterministic test data for CI and local dev (not prod).
- `.github/workflows/supabase-migrate.yml` — on push to `main`, run `supabase db push --linked` against staging (P9 prereq); require manual approval to apply to prod project ref `tvwicdlxljqijoikioln`.

Depends on: P1 (workflows infra), P2 (scripts). Blocks: P9 (staging needs migrations), P5 (contract tests need schema in CI).

### P4 — Real `exchange-token` Edge Function + Rate Limiting

**Priority:** P0 · **Effort:** ~20h · **Surfaces:** Supabase, GitHub, src/

`supabase/functions/exchange-token/` is **empty** (verified by `ls`). The client-side mock in `src/lib/supabase.ts:203-237` uses a hardcoded `VITE_MOCK_PASSWORD || 'mock_access'` and silently activates when env vars are missing.

Artifacts:

- `supabase/functions/exchange-token/index.ts` — real Deno handler: validates token format against allowlist regex, hashes server-side with a pepper stored in Supabase function secrets, calls `supabase.auth.admin.generateLink()` (or equivalent) with the service-role key, returns a session. Returns 401 on bad token, 429 on rate limit, 500 with structured JSON on internal error.
- `supabase/functions/_shared/ratelimit.ts` — token-bucket: 10 requests/min per IP, 3 requests/min per token prefix. Backed by an in-memory LRU seeded from a Supabase table so replicas coordinate.
- `supabase/functions/exchange-token/index.test.ts` — Deno test suite; runs in CI via `supabase functions serve` in a container step.
- `supabase/functions/exchange-token/deno.json` — import map + Deno permissions.
- Edit `src/lib/supabase.ts:203-237` — gate mock branch behind an explicit `VITE_MOCK_MODE` boolean (not "missing env vars"); production builds abort at startup if `VITE_MOCK_MODE=true`.
- `.github/workflows/deploy-functions.yml` — tag-triggered deploy: `supabase functions deploy exchange-token --project-ref tvwicdlxljqijoikioln` (prod) or the staging ref.

Depends on: P3 (service-role secret needs to be in GitHub secrets), P1 (workflow infra). Pairs with: P9 (deploy to staging first).

### P5 — Test Strategy (unit, integration, E2E, a11y, perf, RLS contract)

**Priority:** P1 · **Effort:** ~40h · **Surfaces:** GitHub, Vercel

Current tests: 3 files totaling ~1,600 lines, all integration-style inside `src/*.test.ts`. No unit tests, no E2E, no a11y, no perf budgets, no RLS contract tests.

Artifacts:

- Co-locate new unit tests next to source (`src/lib/**/*.test.ts`). Move existing integration-style tests to `tests/integration/`.
- `tests/e2e/` + `playwright.config.ts` — smoke suite: token-login, book appointment, cancel, provider schedule view, encounter-note create. Runs against the Vercel preview URL from PR webhook.
- `.github/workflows/e2e.yml` — triggered by preview-ready signal.
- `@axe-core/playwright` inside every E2E spec: `expect(results.violations).toEqual([])`.
- `lighthouserc.json` with budgets: LCP < 2.5s, a11y ≥ 95, TBT < 300ms, bundle JS ≤ 200KB gzipped. `.github/workflows/lighthouse.yml`.
- `tests/contract/supabase-rls.spec.ts` — logs in as each role (admin/provider/member) and confirms RLS denies cross-tenant reads. Runs against the **staging** Supabase, not prod.
- Coverage ratchet: start at measured baseline; +5 points per sprint until 80/70 (lines/branches).

Depends on: P1, P2, P3, P9.

### P6 — Observability

**Priority:** P1 · **Effort:** ~20h · **Surfaces:** src/, Supabase, GitHub

No Sentry, no Web Vitals reporting, no uptime monitoring. `src/lib/logger.ts` wraps console.

Artifacts:

- `src/main.tsx` — `@sentry/react` initialized behind `VITE_SENTRY_DSN`. Source maps uploaded by `release.yml` via `@sentry/vite-plugin`.
- `src/components/ErrorBoundary.tsx` — new; wraps `<App />`; sends caught errors to Sentry with user role tag.
- `src/lib/telemetry.ts` — new; `web-vitals` package → Sentry performance (or a separate endpoint).
- `src/lib/logger.ts` — upgraded: structured JSON in prod, shipped to Sentry breadcrumbs.
- Edge function structured logging: `console.log(JSON.stringify({level, event, ...}))` in every handler path; queried via Supabase Logs Explorer.
- `public/healthz.json` — static `{"ok": true, "version": "..."}` (version replaced by release workflow).
- `.github/workflows/uptime.yml` — cron every 5 min, `curl -f https://<prod-domain>/healthz.json`; on failure, `actions/github-script` opens a GitHub Issue labeled `incident`.
- `docs/ON_CALL_RUNBOOK.md` — top 5 alerts + response steps.

Depends on: P1, P4 (edge fn exists to instrument).

### P7 — Hardened CSP & Vercel Config

**Priority:** P0 · **Effort:** ~12h · **Surfaces:** Vercel, GitHub

Current `vercel.json` `script-src 'self' 'unsafe-inline' 'unsafe-eval'` — defeats core XSS protection and is not acceptable for a medical app.

Artifacts:

- Vite build-time nonce plugin (or hash-based CSP for built JS). Dev build keeps permissive CSP so Vite HMR survives (see Risk #2 in §8).
- `vercel.json` edits:
  - Remove `'unsafe-inline' 'unsafe-eval'` from prod `script-src`. Replace with `'strict-dynamic' 'nonce-...'` or hash-based.
  - Add `Permissions-Policy: camera=(), microphone=(), geolocation=(), usb=(), payment=()`.
  - Add `Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Resource-Policy: same-origin`.
  - Add explicit `buildCommand: "npm run build"`, `outputDirectory: "dist"`, `framework: "vite"`.
  - Per-env header variance (dev preview vs prod) via two `vercel.json` variants selected at build time, or via Vercel project-level env-specific headers if available.
- `.github/workflows/headers-check.yml` — post-deploy: `curl -I` against the promoted prod URL; assert CSP contains no `unsafe-*`, Permissions-Policy is present, HSTS is present.

Depends on: P5.2 (E2E must still pass under stricter CSP, including PWA service-worker registration — see Risk #2).

### P8 — Release Engineering

**Priority:** P2 · **Effort:** ~16h · **Surfaces:** GitHub, Vercel, Supabase

Today: manual deploys per `DEPLOY.md`; no git tags, no `CHANGELOG.md`, no rollback procedure, no atomic frontend+backend release.

Artifacts:

- `release-please` (or `changesets`) via `.github/workflows/release.yml`: Conventional-Commit-driven version bumps → tag → `CHANGELOG.md` update → GitHub Release.
- On tag: promote Vercel prod + deploy edge functions via `deploy-functions.yml` (P4).
- `CHANGELOG.md` — seeded from `2.2.0-beta` going forward.
- `docs/ROLLBACK_RUNBOOK.md` — three-part procedure:
  1. **Vercel:** "Promote previous deployment" from the Deployments UI; < 1 min to execute.
  2. **Edge functions:** `supabase functions deploy exchange-token --project-ref <ref>` from the previous tag.
  3. **DB migrations:** forward-only revert pattern — no `down.sql`. Each migration ships with a paired compensation migration if reversible.
- `docs/RELEASE_CHECKLIST.md` — gate list: CI green, Lighthouse thresholds met, E2E green against preview, RLS contract tests green, CHANGELOG updated, release notes drafted.
- Add a `/version` JSON endpoint (static file updated by `release.yml`) returning `{tag, sha, buildTime}`.

Depends on: P1, P3, P4.

### P9 — Staging Environment Provisioning

**Priority:** P0 · **Effort:** ~16h · **Surfaces:** Supabase, Vercel, GitHub

Status of a separate staging environment is unconfirmed. This roadmap does not assume one exists. Until P9 lands, every CI run and preview deploy would exercise the production Supabase `tvwicdlxljqijoikioln` — unacceptable blast radius.

Artifacts:

- Provision a second Supabase project (suggested name `vector-staging`) in the same org as `tvwicdlxljqijoikioln`. Record the ref in `docs/ENVIRONMENTS.md`.
- Configure Vercel Preview env vars (team `d-hauversburks-projects` → project → Settings → Environment Variables, scoped `Preview`) to point at the staging Supabase. Production env vars remain on `tvwicdlxljqijoikioln`.
- `docs/ENVIRONMENTS.md` — matrix of required env vars per environment (dev/preview/prod):
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (edge-fn side only; never exposed to client)
  - `VITE_SENTRY_DSN`
  - `VITE_MOCK_MODE` (explicit, defaults to `false`; prod build aborts if `true`)
  - `SUPABASE_FUNCTION_PEPPER` (edge-fn side only)
- Apply P3 migrations to staging first, then prod (via the manual-gate workflow).
- Smoke-test a Vercel preview against staging Supabase before any prod cutover.

Depends on: P3 (needs migrations to apply anywhere). Blocks: P5.5 (RLS contract tests), P4 staging deploy.

---

## 6. Sprint Plan (Authoritative Sequence)

Sprint 13 is next. Eighteen-week plan, interleaved platform + product + UX. Two sprints longer than the original 16 because Epic F (UX Foundation) was inserted before Epic A — WCAG labels on unclear workflows compound rather than fix the problem.

| Sprint | Weeks | Theme                   | Product scope                                                                                                                                      | Platform scope                                                                                                                                                                                                            |
| ------ | ----- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **13** | 1–2   | Foundation              | —                                                                                                                                                  | P2 (toolchain) full; P1 partial (`ci.yml`, CODEOWNERS, PR template)                                                                                                                                                       |
| **14** | 3–4   | Backend truth           | Product Epic E (pre-visit workflow) — **may defer to Sprint 15 week 1 per `docs/SPRINT_14_KICKOFF.md` PICK chart**                                 | P3 (migrations), P9 (staging provision), P4 (real exchange-token); **SEC-001** (`.env` untrack + secret rotation — see `docs/SEC-001-env-in-git.md`); **test-corpus triage** (unblocks P2 coverage ratchet — see Risk #9) |
| **15** | 5–6   | UX Foundation I         | Product Epic F part 1 — vocabulary reset ("Appointment" canonical), `src/components/ui/` primitives (Modal/Dialog/Button/Input), tokens.ts         | P7 groundwork (nonce plumbing, doesn't break dev yet)                                                                                                                                                                     |
| **16** | 7–8   | UX Foundation II        | Product Epic F part 2 — modal migration (retire 12 bespoke modals), nav shell unification, onboarding tour retirement, visual regression baselines | P5.2 (Playwright config) + visual-regression workflow                                                                                                                                                                     |
| **17** | 9–10  | Accessibility I         | Product Epic A, stories 10.1–10.4 (ARIA, skip-nav, focus, live regions) — applied to stable Epic F primitives                                      | P5.3 (axe in CI)                                                                                                                                                                                                          |
| **18** | 11–12 | Observability + a11y II | Product Epic A, stories 10.5–10.7 (contrast, touch targets, lockout); Product Epic D (client-side encryption audit + BAA readiness)                | P6 full (Sentry, web-vitals, uptime)                                                                                                                                                                                      |
| **19** | 13–14 | Comms                   | Product Epic B (SMS/email reminders; UI built on Epic F primitives)                                                                                | P5.2 extended (E2E of comms flows)                                                                                                                                                                                        |
| **20** | 15–16 | Hardening + analytics   | Product Epic C (no-show, utilization, CSV export)                                                                                                  | P7 final (strict prod CSP), P1.3 (Dependabot + CodeQL live), P5.4/P5.5 (Lighthouse thresholds + RLS contract tests)                                                                                                       |
| **21** | 17–18 | Release discipline      | Audit-trail export UI + BAA documentation                                                                                                          | P8 (release-please, rollback runbook, release checklist)                                                                                                                                                                  |

**Sequencing rationale:**

1. One sprint of platform-only (13) is the minimum to make everything after verifiable.
2. P3 (migrations) and P4 (real edge fn) land in Sprint 14 because every subsequent product feature depends on a real backend that's reviewable in PR.
3. P9 (staging) lands in Sprint 14, before any product sprint uses the preview deploy for E2E — eliminates the blast-radius risk.
4. **Epic F (UX Foundation) precedes Epic A (accessibility).** Applying WCAG labels, focus management, and screen-reader announcements to workflows whose terminology, modal behavior, and IA are about to change would ship accessibility regressions _into_ the a11y sprint. Two UX sprints up front let a11y be built _on top of_ stable primitives, not retrofitted under them.
5. A11y work still splits across two sprints (17, 18) because WCAG 2.1 AA has both structural work (ARIA, focus, skip-nav) and visual work (contrast, targets).
6. P7 (CSP) finalizes in Sprint 20 — after the nonce groundwork (Sprint 15) and after comms work (Sprint 19) has exercised the PWA under stricter policies.
7. P8 (release engineering) is last because it codifies the discipline built up through Sprints 13–20.

**Out of scope for this plan:** EHR/FHIR integration, payment processing (N/A for military), native video visits, AI triage, calendar sync. See `ENTERPRISE_GAP_ANALYSIS.md` §K (Kill).

---

## 7. Per-Surface Validation Matrix

How to confirm each epic actually landed on each of the three deployment surfaces.

| Epic                     | GitHub                                                                                                            | Supabase (`tvwicdlxljqijoikioln` / staging)                                                                                                            | Vercel (`d-hauversburks-projects`)                                                                                                                                            | Browser/runtime                                                                                                                                                                                                                     |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **P1 CI**                | PR shows required checks green; attempted push to `main` rejected                                                 | —                                                                                                                                                      | —                                                                                                                                                                             | —                                                                                                                                                                                                                                   |
| **P2 Toolchain**         | `typecheck` and `test:coverage` CI jobs pass; coverage comment on PR                                              | —                                                                                                                                                      | —                                                                                                                                                                             | Local `git commit` with lint error is rejected by pre-commit hook                                                                                                                                                                   |
| **P3 Migrations**        | `supabase-migrate.yml` green on merge                                                                             | Database → Migrations tab shows `0001`, `0002`, `0003`. SQL Editor `SELECT count(*) FROM pg_policies WHERE schemaname='public'` matches migration file | —                                                                                                                                                                             | RLS contract test denies cross-role reads (P5.5)                                                                                                                                                                                    |
| **P4 Edge fn**           | `deploy-functions.yml` green on tag                                                                               | Functions page shows `exchange-token` version hash matching Git SHA; Logs Explorer contains structured JSON with rate-limit events                     | —                                                                                                                                                                             | `curl -X POST https://<ref>.supabase.co/functions/v1/exchange-token` 11th call in 60s returns 429; bad token returns 401 (not 200 with error payload)                                                                               |
| **P5 Tests**             | E2E + Lighthouse + axe artifacts attached to every PR; coverage-delta bot comment                                 | —                                                                                                                                                      | Playwright runs against Preview URL; Preview comment in PR                                                                                                                    | Manual smoke of booking flow matches E2E recording                                                                                                                                                                                  |
| **P6 Observability**     | `uptime.yml` last-run green; a failure auto-opens a GitHub Issue labeled `incident`                               | Logs Explorer contains structured JSON from edge functions; queryable by event field                                                                   | —                                                                                                                                                                             | Intentional `throw` in staging produces a Sentry issue within 60s; DevTools Network tab shows web-vitals beacon to the Sentry endpoint                                                                                              |
| **P7 CSP**               | `headers-check.yml` green post-deploy                                                                             | —                                                                                                                                                      | Deployment Inspector → Headers tab shows the expected CSP, Permissions-Policy, COOP, CORP. `curl -sI https://<prod>/` on the command line confirms strict CSP (no `unsafe-*`) | Full app tour in Chromium DevTools shows zero CSP violations in the Console                                                                                                                                                         |
| **P8 Release**           | Tag push → GitHub Release created with auto-generated notes                                                       | Functions page version matches the tag; Migrations tab shows the tag's migrations applied                                                              | Production deployment's commit SHA matches the tag                                                                                                                            | `curl https://<prod>/version` returns `{tag, sha, buildTime}` matching the release                                                                                                                                                  |
| **P9 Staging**           | `supabase-migrate.yml` applies to staging first, manual gate to prod                                              | A second Supabase project is listed in the org, not `tvwicdlxljqijoikioln`; its Migrations tab catches up first                                        | Project → Settings → Environment Variables shows `VITE_SUPABASE_URL` scoped `Preview` pointing at staging and scoped `Production` pointing at `tvwicdlxljqijoikioln`          | Preview URL successfully authenticates against staging Supabase; prod URL continues to hit `tvwicdlxljqijoikioln`                                                                                                                   |
| **Epic F UX Foundation** | `visual-regression.yml` green on PRs; diffs surface as PR comment; `tests/visual/` screenshot baselines committed | —                                                                                                                                                      | Preview deploy shows the refreshed IA; old onboarding tour gated behind `VITE_LEGACY_ONBOARDING` env var in project settings                                                  | `grep -r "Mission" src/` returns only migration mapper + deprecation comment; DevTools → Components shows every modal resolves to one of `Modal`/`Dialog`/`ConfirmDialog`; nav structure is one `<NavShell>` component across roles |

---

## 8. Risks & Mitigations

1. **Mock-mode fail-open.** `src/lib/supabase.ts:203-237` silently activates a mock client when env vars are missing. CI without real credentials will pass falsely and hide broken integrations. **Mitigation:** in P4, introduce an explicit `VITE_MOCK_MODE` boolean (not "missing env vars"); production builds abort at startup if `VITE_MOCK_MODE=true`. CI must always set real (staging) creds.

2. **CSP hardening breaks Vite HMR and PWA service-worker registration.** `vite-plugin-pwa` with `injectManifest` emits inline scripts; removing `'unsafe-inline'` without nonce or hash plumbing will red-screen both dev and prod. **Mitigation:** keep dev CSP permissive; ship nonce/hash-based prod CSP only; add explicit E2E assertions for SW registration under the prod CSP before release. P7 depends on P5.2.

3. **Edge-function and frontend deploys are not atomic.** Vercel (frontend) and Supabase (edge fn) deploy independently. Any response-shape change to `exchange-token` that ships on frontend before the function breaks every login. **Mitigation:** deploy function first; maintain backward-compatible response shape for one release; `release.yml` (P8) gates frontend promotion on a function health-check.

4. **`SECURITY DEFINER` audit debt.** All 8 RPCs (`admin_create_user`, `provision_member`, `fix_duplicate_users`, `log_event`, `get_audit_logs`, `get_system_stats`, `admin_delete_user`, `admin_prune_unused_accounts`) live only in the Supabase dashboard. `supabase db dump` imports current definitions verbatim — if any lack `SET search_path`, the first commit codifies a privilege-escalation vector. **Mitigation:** in Sprint 14 (P3) manually review every dumped function and add `SET search_path = public, pg_temp` where missing. Do not merge `0003_rpc_functions.sql` until review is complete and signed off.

5. **Coverage-threshold red wall.** The current test corpus almost certainly covers well under 20% of lines. Setting a threshold of 80% on day one turns `main` red and halts all work. **Mitigation:** set the initial floor at the **measured baseline** (run once, record the number). Require every PR to not decrease it. Ratchet up by 5 points per sprint.

6. **Single Supabase project = blast radius.** Until P9 lands, every CI run, every preview deploy, every E2E test, and every RLS contract test would touch production data in `tvwicdlxljqijoikioln`. **Mitigation:** P9 is P0 in Sprint 14. Do not start P5 contract tests (Sprint 20) until staging exists. Treat "we don't have staging yet" as a hard gate for any destructive test.

7. **UX churn during Epic F breaks in-flight bookings.** Renaming "Mission" → "Appointment", migrating 12 modals to 3 primitives, and retiring the onboarding tour all change user-visible strings and focus flows. If a user has a booking flow open when a rename ships, partial translations can leave them staring at an incoherent screen. **Mitigation:** ship vocabulary rename as a single atomic release with a display-layer mapper for historical audit-log rows; migrate modals behind a feature flag (`VITE_UX_V2`) so both old and new render paths coexist for one release; run visual regression against a matrix of logged-in sessions for each role; keep the legacy onboarding tour behind `VITE_LEGACY_ONBOARDING` for one release cycle. Back out path is a single env-var flip, not a redeploy.

8. **A11y tests hard-pinned to current DOM.** If axe-core or Lighthouse baselines are captured in Sprint 15–16 against the _new_ Epic F primitives and the primitives then get adjusted for WCAG findings in Sprint 17, baselines must be regenerated. **Mitigation:** capture the Epic F visual-regression baseline at end of Sprint 16 explicitly (tagged `v0-epic-f-complete`); regenerate axe + Lighthouse baselines at the start of Sprint 17 as the first Epic A task; treat baseline drift between the two sprints as expected, not as a regression.

9. **Test corpus is not runnable in isolation.** Discovered at Sprint 13 close: `npm run test:coverage` fails with 16 of 22 tests erroring because the suite calls `supabase.auth.signInWithPassword` with credentials the test harness does not inject. No `coverage/` directory is produced, so the measured-baseline approach in Risk #5 is currently **unexecutable**. **Mitigation:** in Sprint 14, first pass — triage the three integration-style files (`src/mvp_enhancements.test.ts`, `verification.test.ts`, `verification_10_stories.test.ts`). For each test: either (a) supply fixture-based Supabase creds via a `tests/fixtures/` helper that the test-harness loads from staging (post-P9), or (b) mark with `.skip` and file a Sprint-15 "rewrite as unit test" debt ticket. Target: suite passes green with 0 skips or a documented skip count by end of Sprint 14 week 1. Only then is coverage baseline measurable and the P2 ratchet unblockable.

---

## 9. Change Log

| Date       | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Author           |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| 2026-04-13 | Initial roadmap created. Consolidates `ENTERPRISE_GAP_ANALYSIS.md` product epics with new platform epics P1–P9. Resets sprint numbering to 13.                                                                                                                                                                                                                                                                                                                                                           | Engineering Team |
| 2026-04-14 | Added **Product Epic F — UX Foundation & Design System Reset** based on UX audit findings (terminology fragmentation, 12-modal proliferation, IA divergence across roles, onboarding-tour anti-pattern). Epic F inserted in Sprints 15–16; Epics A, B, C pushed back by two sprints. Plan extended from 16 to 18 weeks (Sprint 21 is now the final sprint). Added Risks #7 (UX churn mid-flight bookings) and #8 (a11y baselines vs Epic F primitive drift). Added Epic F row to validation matrix (§7). | Engineering Team |
| 2026-04-14 | Sprint 14 kickoff planning: added **SEC-001** (`.env` tracked in git) and **test-corpus triage** to the Sprint 14 row (§6). Added Risk #9 (test suite not runnable in isolation; coverage baseline blocked). Promoted `docs/ENVIRONMENTS.md`, `docs/SEC-001-env-in-git.md`, `docs/UX_AUDIT_2026-04.md`, and `docs/SPRINT_14_KICKOFF.md` out of "Future" in §10 — all now exist on the `sprint-14/planning` branch. Epic E may defer to Sprint 15 week 1 per the PICK chart in the Sprint 14 kickoff doc. | Engineering Team |

---

## 10. Related Documents

- `docs/ENTERPRISE_GAP_ANALYSIS.md` — product PICK analysis (contributing input).
- `docs/PRODUCT_BACKLOG.md` — personas, user stories, historic Phase 2 roadmap (contributing input).
- `docs/ACCESSIBILITY_CHECKLIST.md` — tactical WCAG checklist for Sprints 17–18.
- `docs/TEST_PLAN_SPRINT_7_8.md` — reference for test-plan authoring style.
- `docs/BRANCH_PROTECTION.md` — required settings for `main`; pre-merge gate for P1. _Exists._
- `docs/ENVIRONMENTS.md` — env-var matrix and deployment-surface scoping for P9. _Exists on `sprint-14/planning`._
- `docs/SEC-001-env-in-git.md` — security incident: `.env` tracked despite gitignore; 4-phase remediation planned for Sprint 14. _Exists on `sprint-14/planning`._
- `docs/UX_AUDIT_2026-04.md` — full UX audit that produced Epic F. _Exists on `sprint-14/planning`._
- `docs/SPRINT_14_KICKOFF.md` — PICK chart and sprint-14 stories with acceptance criteria. _Exists on `sprint-14/planning`._
- `ARCHITECTURE.md`, `DEPLOY.md`, `CONTRIBUTING.md` — ambient project docs.
- Future: `docs/ON_CALL_RUNBOOK.md` (P6, Sprint 18), `docs/ROLLBACK_RUNBOOK.md` (P8, Sprint 21), `docs/RELEASE_CHECKLIST.md` (P8, Sprint 21), `docs/DESIGN_SYSTEM.md` (Epic F, Sprint 15), `CHANGELOG.md` (P8, Sprint 21) — each listed against the platform or product epic that creates it.
