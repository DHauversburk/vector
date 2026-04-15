# UX / Design System Audit — April 2026

**Date:** 2026-04-14
**Scope:** Frontend UX consistency across roles (Member, Provider, Admin), design-system primitives, information architecture.
**Status:** Baseline. Informs Product Epic F (UX Foundation & Design System Reset), Sprints 15-16.
**Referenced from:** `docs/ENTERPRISE_ROADMAP.md` §4 (Product Epic F), §1 (readiness snapshot).

---

## Executive summary

Project Vector's feature completeness (78% against enterprise medical-software standards) masks a materially weaker UX consistency layer (~45%). The gap is not in what the app can do, but in how the same concepts are expressed differently across roles and surfaces, and how many ad-hoc UI primitives coexist without a governing pattern library.

Four HIGH-severity findings dominate. Three MED-severity findings round out the picture. All are structural — none can be patched with cosmetic changes. The cheapest way through is to land a shared primitive layer (Modal / Dialog / Button / Input / NavShell) before adding WCAG labels (Epic A) or SMS/email UI (Epic B), because a11y and comms both assume the primitives they decorate are stable.

---

## Findings

### HIGH-1 — Terminology fragmentation: "Mission" vs "Appointment"

**What:** The member-facing dashboard refers to scheduled visits as "Missions" (military framing) while the provider dashboard, admin audit log, and backend schema all use "Appointment." Audit log events mix both terms unpredictably.

**Where seen (not exhaustive):**

- `src/pages/MemberDashboard.tsx:106-108, 162` — "Missions" label
- `src/pages/ProviderDashboard.tsx` — "Appointments" label
- Audit log: event strings include both `mission.booked` (historical) and `appointment.booked` (recent)

**Why it matters:** Mental model fragmentation for anyone who switches roles (admins, QA, engineers, docs writers, future trainers). Creates translation debt for every search / filter / export feature. Every subsequent feature inherits the choice.

**Proposed decision (non-binding, see §Decisions needed):** Adopt "Appointment" as the canonical domain term everywhere. Retire "Mission" via a display-layer mapper for existing audit log rows — do not rewrite history. Rename in user-visible strings, component names, and new events.

---

### HIGH-2 — Modal proliferation (approximately 12 implementations)

**What:** Multiple bespoke modal components exist with independently-evolved behavior. Focus-trap, escape-to-close, backdrop-click, scroll-lock, animation, and z-index differ from modal to modal.

**Components counted:**

1. `ConfirmModal` (ui)
2. `WelcomeModal` (onboarding)
3. `HelpRequestModal` (member)
4. `QuickNoteModal` (provider)
5. `AppointmentModal` (shared)
6. `SlotGeneratorModal` (provider)
7. `BulkArchiveModal` (admin)
8. `KeyboardShortcutsModal` (inline in layout)
9. `SessionExpiredModal` (inline in root)
10. `ConflictModal` (sync flow)
11. Various inline `<div className="fixed inset-0 z-...">` backdrops embedded in page components
12. `CommandPalette` (behaves as a dialog but bypasses the modal stack entirely)

**Why it matters:**

- **Accessibility:** WCAG 2.1.2 (Modal Focus) requires consistent focus trap and escape behavior. Today, 12 implementations = 12 different behaviors to test. Epic A (Sprints 17-18) cannot pass axe without unifying these first.
- **Defect density:** The last release (v2.2.0-beta) shipped a fix for modal close-button z-index issues (`038188d fix(ui): resolve modal close button z-index and event blocking issue`) — exactly the kind of bug a unified modal stack prevents.
- **Test burden:** Each modal needs its own E2E assertion. Unification collapses that to 3 shapes × all call sites.

**Proposed decision:** Consolidate to exactly **3 primitives**:

- `<Modal>` — passive container (for content with its own primary CTA inside)
- `<Dialog>` — modal with a clear title, optional description, and a footer action slot
- `<ConfirmDialog>` — destructive / confirming action: "Are you sure? [Yes] [Cancel]"

All 12 existing modals collapse into one of the three. Migration is mechanical — see Epic F deliverables.

---

### HIGH-3 — Information architecture divergence across roles

**What:** Each role's navigation shell is a different shape. No shared pattern for primary vs secondary vs destructive actions.

**Counts:**

| Role     | Primary nav tabs                                                   | Secondary surfaces                            | Modal-only destinations |
| -------- | ------------------------------------------------------------------ | --------------------------------------------- | ----------------------- |
| Member   | 3 (Dashboard, Book, Messages)                                      | 2 (Profile, Settings)                         | 4+                      |
| Provider | 7 (Schedule, Encounter, Notes, Slots, Waitlist, Feedback, Reports) | 3 (Profile, Resources, Settings)              | 6+                      |
| Admin    | 5 ad-hoc views, none surfaced in a shared nav                      | 0 (everything is a modal or a floating panel) | 8+                      |

**Why it matters:**

- **Mental-model break** between roles — a team member who wears two hats (common in small clinics) has to re-learn the layout.
- **New features** have to decide per-role where to live. No governing rule means every PR debates this.
- **Onboarding is required to orient users** — see HIGH-4 below. The nav itself should do that work.

**Proposed decision:** One `<NavShell>` component used by all three roles. Role determines the tabs it renders, but the structure (sidebar position, collapse behavior, header actions, mobile drawer) is invariant. Constrain new features to fit the existing shell; if they don't, the shell evolves, not the role.

---

### HIGH-4 — Onboarding tours as anti-pattern

**What:** `src/components/onboarding/` is a full-featured tour system (`WelcomeModal`, `OnboardingContext`, tour steps per role) that exists to _explain the IA at first use_.

**Why it matters:** The tour is a symptom, not a solution. If the IA needed a tour to be usable, the IA is the problem. Tours are a common refactoring target in enterprise product UX because:

- They add maintenance burden (every nav change breaks tour step selectors).
- They pair poorly with accessibility (screen readers struggle with tour-overlay focus management).
- They fail when the user closes them (`hasCompletedTour` + `markTourCompleted` is itself evidence of this — the previous release added escape-path tour-completion tracking because closes were losing state).

**Proposed decision:** Retire the tour as the primary orientation mechanism in favor of inline empty-state guidance:

- "You have no upcoming appointments. [Book one]"
- "No encounter notes yet. Notes appear here after your first visit."
- "No admin alerts. [View system status]"

Keep the tour component behind `VITE_LEGACY_ONBOARDING=true` for one release cycle for any stakeholder who wants the legacy flow.

---

### MED-1 — Dark-mode coverage incomplete

**What:** Toggling dark mode reveals low-contrast text, hardcoded light-mode containers, and broken borders in multiple components.

**Root cause:** Components inline-style colors instead of consuming a token. `dark:` Tailwind modifiers are applied inconsistently — some components enumerate them per-utility, others rely on parent inheritance, some omit them entirely.

**Sample offenders:** `src/components/provider/ProviderOverview.tsx`, `src/components/admin/AdminStats.tsx`, `src/pages/LandingPage.tsx` (hero backgrounds).

**Proposed decision:** In Sprint 15, introduce `src/components/ui/tokens.ts` that surfaces color, spacing, typography, and radius as Tailwind theme extensions. Dark-mode parity is enforced at the token layer; components consume tokens and get dark mode for free.

---

### MED-2 — Form-input pattern fragmentation

**What:** Only `src/components/ui/Input.tsx` has size / state variants (`default`, `error`, `success`). `Select`, `Textarea`, `Checkbox`, `Radio` are inline-styled per use site — each gets its own Tailwind classes.

**Why it matters:** a11y rules for form controls (`jsx-a11y/label-has-associated-control`, `jsx-a11y/aria-props`) need per-component coverage. Each bespoke form control is a separate a11y audit surface.

**Proposed decision:** In Sprint 15, extend the pattern from `Input.tsx` to `Select`, `Textarea`, `Checkbox`, `Radio`, `Switch`. Shared `size` (sm/md/lg), `state` (default/error/success), `label`, `hint`, `error` props across all.

---

### MED-3 — Width / max-width inconsistency

**What:** Page containers vary 640px to 1280px with no documented rationale:

- Member dashboard: `max-w-screen-xl` (1280px)
- Provider encounter view: `max-w-4xl` (896px)
- Admin tools: `max-w-6xl` (1152px)
- Settings: `max-w-2xl` (672px)

**Proposed decision:** Add `<PageContainer variant="narrow|default|wide">` with three documented widths. Document the choice in `docs/DESIGN_SYSTEM.md` (created in Sprint 15).

---

## Decisions needed before Sprint 15 starts

The following choices influence Epic F scope. Deciding them late causes rework.

1. **Canonical term: "Appointment"?** (Proposed yes.) Other options: "Visit", "Session", or keep "Mission" as member-facing flavor only. Recommendation: "Appointment" — matches domain model, matches billing/BAA terminology, matches every external medical-software standard.

2. **NavShell structure: shared component or role-specific?** (Proposed shared.) If role-specific, Epic F scope doubles but customization is cheaper. Recommendation: shared, because the UX coherence benefit is the whole point of Epic F.

3. **Onboarding tour retirement timeline: one release vs permanent?** (Proposed one release behind flag.) If stakeholders want the tour as a permanent feature, Epic F must keep it maintainable — costs ~8h extra to refactor tour step selectors to data attributes.

4. **Modal count: 3 primitives or 4?** (Proposed 3.) A fourth — `<Drawer>` — would cover mobile bottom-sheet patterns currently emulated by full-screen modals. Adds ~4h. Recommendation: defer to Sprint 17 unless mobile UX testing in Sprint 14 surfaces a specific need.

5. **Visual regression budget: what's the tolerance?** Playwright's `toHaveScreenshot()` supports a pixel-diff threshold. Too strict = flaky; too loose = misses regressions. Recommendation: start at 0.5% pixel diff, ratchet down per sprint.

---

## Effort estimate (Epic F)

| Task                                                                  | Hours  | Sprint |
| --------------------------------------------------------------------- | ------ | ------ |
| Vocabulary rename (Mission → Appointment) across code + strings       | 8      | 15     |
| Display-layer mapper for historic audit-log rows                      | 2      | 15     |
| `src/components/ui/tokens.ts` + Tailwind theme extensions             | 4      | 15     |
| `<Modal>`, `<Dialog>`, `<ConfirmDialog>` primitives                   | 6      | 15     |
| `<Button>`, `<Input>`, `<Select>`, `<Textarea>`, `<Checkbox>` unified | 6      | 15     |
| `<PageContainer>` with 3 widths                                       | 2      | 15     |
| **Sprint 15 subtotal**                                                | **28** |        |
| Migrate 12 bespoke modals to primitives                               | 10     | 16     |
| Unify NavShell across roles                                           | 6      | 16     |
| Onboarding tour retirement + inline empty-state guidance              | 4      | 16     |
| Visual regression baseline (`tests/visual/`) + Playwright workflow    | 4      | 16     |
| Dark-mode parity audit after token migration                          | 2      | 16     |
| **Sprint 16 subtotal**                                                | **26** |        |
| **Epic F total**                                                      | **54** | 15-16  |

(Slightly over the 48h initial estimate in the roadmap — revised here and flagged as a risk update. Carry-over beyond Sprint 16 should push Epic B to Sprint 20 not 19.)

---

## Out of scope for Epic F

Explicitly **not** part of this epic — listed here so scope creep is visible:

- Adding new features to any role's nav (only reshaping existing ones).
- Changing the booking flow UX (Epic E — pre-visit workflow — covers that in Sprint 14).
- Rebuilding the audit-log viewer (Epic C, Sprint 20).
- Introducing animations / motion design (no roadmap epic yet).
- Localization / i18n (not on the current roadmap).

---

## Validation criteria

After Epic F ships (end of Sprint 16), these queries should return as described:

| Check                                   | Expected                                                                           |
| --------------------------------------- | ---------------------------------------------------------------------------------- |
| `grep -r "Mission" src/`                | Only in migration mapper + deprecation comment                                     |
| `grep -r "from.*Modal" src/components/` | Every import resolves to `src/components/ui/Modal` (or `Dialog` / `ConfirmDialog`) |
| Nav shell usage                         | Every role's page imports one `<NavShell>` component                               |
| Visual regression suite                 | Green across 10 highest-traffic pages on both desktop + mobile viewports           |
| Dark mode tour                          | Every page renders correctly in dark mode without overrides                        |
| Onboarding tour                         | Default user never sees it; `VITE_LEGACY_ONBOARDING=true` restores it              |

These checks go into the `Epic F` row of `docs/ENTERPRISE_ROADMAP.md` §7 (already added in the 2026-04-14 roadmap revision).
