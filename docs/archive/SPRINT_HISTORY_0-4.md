# Sprint History — Sprints 0 through 4 (Jan 2026)

> Consolidated record. Replaces:
> `SPRINT_0_COMPLETE.md`, `SPRINT_1_PROGRESS.md`, `SPRINT_2_PROGRESS.md`, `SPRINT_3_PROGRESS.md`, `SPRINT_4_PROGRESS.md`, `SPRINT_PLANNING.md`, `LINT_ANALYSIS_AND_PLAN.md`.
>
> For forward work, see [`../ENTERPRISE_ROADMAP.md`](../ENTERPRISE_ROADMAP.md). Sprint numbering restarts at 13 in the forward roadmap.

## Sprint 0 — Design System Foundation (2026-01-24)

**Outcome:** Established "Vector Dark" design system.

- Color scheme CSS variables in `src/index.css` — Electric Blue → Purple → Magenta gradient, status colors (emerald/amber/red/blue), light/dark modes.
- Button component gradient + destructive variants with glow.
- Tailwind config extended with design tokens.
- Lucide-react adopted as sole icon library.

## Sprint 1 — Core Auth & Routing

**Outcome:** Role-based routing live; `AuthContext` resolves role and redirects.

- `AuthContext.tsx` with role resolution for admin / provider / member.
- Route guards in `App.tsx`.
- Loading-state safety valve to prevent infinite spinners.

## Sprint 2 — Mock API Layer

**Outcome:** Full mock store with localStorage persistence; all three roles functional offline.

- `mockStore` persisted under `MOCK_DB_V1`.
- Mock implementations for `appointments`, `providers`, `admin`, `auth`, `interactions`.
- Auto-automation: past-due appointments marked no-show / completed on load.

## Sprint 3 — Provider Dashboard

**Outcome:** Providers can view schedule, generate slots, block/unblock.

- `ProviderSchedule.tsx` slot grid.
- `generateSlots` RPC + mock loop.
- Block/unblock action on individual slots.

## Sprint 4 — Admin Dashboard

**Outcome:** Admin Master View + Token Station.

- `AdminDashboard.tsx` with master appointment list.
- Member provisioning via `admin_create_user` RPC.
- Token generation + QR handoff flow.

## Lint remediation (sprint-parallel)

**Outcome:** ~60 ESLint warnings → 0 in critical paths.

- Strict `no-explicit-any` enforcement in `src/lib/api/`.
- React Hooks deps rules raised from warn → error (later relaxed back to warn in `88e75f6` for iteration speed).
- Unused imports and vars swept via `eslint --fix`.

## Takeaways for subsequent sprints

- The `MOCK_DB_V1` persistence key is stable and should not change without a migration story.
- The design-system gradient tokens are load-bearing — changing them requires a visual-regression pass.
- Role resolution in `AuthContext` assumes email-keyword heuristics in mock mode — swapping to real Supabase requires the `users.role` column to be the source of truth.
