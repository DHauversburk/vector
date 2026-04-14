<!--
Project Vector PR template. Mirrors the roadmap's per-surface validation model
(docs/ENTERPRISE_ROADMAP.md §7) so every change is traceable on each of the
three deployment surfaces: GitHub, Supabase, Vercel.
-->

## Context

<!-- What problem does this solve? Link to the roadmap epic (P1-P9, or Product
Epic A-F) or issue this delivers. One or two sentences. -->

## Change

<!-- What does this PR actually change? Bullet list of material changes.
Not a line-by-line diff narration — describe the intent. -->

-

## Per-surface impact

<!-- Check all that apply. Delete sections that do not apply. -->

### GitHub

- [ ] Workflows changed (`.github/workflows/*`)
- [ ] Branch protection or secrets changed (describe below)
- [ ] No GitHub surface impact

### Supabase (`tvwicdlxljqijoikioln` / staging)

- [ ] Migration added (`supabase/migrations/*.sql`)
- [ ] RLS policy changed
- [ ] Edge function changed (`supabase/functions/*`)
- [ ] RPC signature changed
- [ ] No Supabase surface impact

### Vercel (`d-hauversburks-projects`)

- [ ] `vercel.json` changed (headers, rewrites, build config)
- [ ] Env var expectations changed
- [ ] Bundle size meaningfully changed (> 5%)
- [ ] No Vercel surface impact

## Test plan

<!-- How was this verified? Be specific. "Tested locally" is not enough. -->

- [ ] Unit tests added/updated — `npm run test`
- [ ] Typecheck clean — `npm run typecheck`
- [ ] Lint clean — `npm run lint`
- [ ] Build succeeds — `npm run build`
- [ ] E2E (Playwright) covers new user flow (if applicable)
- [ ] ## Manual verification steps:

## Validation after deploy

<!-- How will a reviewer confirm this landed correctly on each surface in
production? Copy the relevant row from docs/ENTERPRISE_ROADMAP.md §7 if
applicable. -->

-

## Security / privacy

- [ ] No secrets added to source
- [ ] No PII or PHI logged
- [ ] No `service_role` Supabase key used client-side
- [ ] CSP not weakened
- [ ] RLS still enforced for all new tables/columns

## Rollback plan

<!-- If this goes wrong in production, what is the rollback step? Reference
docs/ROLLBACK_RUNBOOK.md when it exists. -->

-

## Screenshots / recordings

<!-- For UI changes, include before/after. For edge function changes, include
a `curl` trace or Supabase Logs Explorer screenshot. -->
