# Contributing

## Prerequisites

- Node.js 20+ (see `.nvmrc`)
- npm

## Install & run

```bash
npm install
npm run dev
```

## Workflow

1. Branch from `main`: `git checkout -b <type>/<short-description>` (e.g. `feat/provider-notes`, `fix/pin-retry`).
2. Keep changes focused — one logical concern per PR.
3. Run `npm run typecheck && npm run lint && npm run test` before pushing.
4. Commit using Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `ci:`, `build:`, `test:`). Commit hooks enforce this via `commitlint`.

## Pull requests

- Describe the change and link the issue/sprint item.
- Include screenshots for UI changes.
- Ensure CI is green (lint, typecheck, tests, build).
- Keep the forward roadmap ([`docs/ENTERPRISE_ROADMAP.md`](./docs/ENTERPRISE_ROADMAP.md)) in sync when landing sprint work.

## Coding standards

- **TypeScript:** strict mode. Use type-only imports (`import type { … }`) for types.
- **Styling:** Tailwind utility classes. Avoid custom CSS unless required for animations.
- **API:** add new calls under `src/lib/api/<domain>/` with both `mock.ts` and `supabase.ts` implementations.
- **Tests:** co-locate unit tests next to source (`foo.ts` + `foo.test.ts`). Integration tests live in `tests/integration/`, E2E in `tests/e2e/`.
- **Copy:** plain English. No marketing jargon, no military-ism, no SHOUTING CAPS. See `docs/UX_AUDIT_2026-04.md` for the principles.
