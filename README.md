# VECTOR

> Anonymous medical scheduling for high-compliance environments.

**Version:** `2.2.0-beta` · **Status:** Beta · **Stack:** React 19 + TypeScript + Vite + Supabase

---

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173.

The app ships in **mock mode** by default — no backend required. Data persists in `localStorage` and resets when you clear it.

## Sign in (mock mode)

On the landing page, pick an entry point, then use any password (demo access). For token mode, use one of these demo tokens:

| Token      | Role                      |
| ---------- | ------------------------- |
| `M-001`    | Patient                   |
| `PT-01`    | Physical Therapy Provider |
| `DOC-1`    | Primary Care Provider     |
| `MH-1`     | Mental Health Provider    |
| `TECH-1`   | Medical Technician        |
| `ADMIN-01` | Admin                     |

When prompted for a PIN on first sign-in, pick any 4 digits — the mock accepts whatever you set.

## Scripts

| Command             | Purpose                      |
| ------------------- | ---------------------------- |
| `npm run dev`       | Vite dev server              |
| `npm run build`     | Production build + typecheck |
| `npm run typecheck` | TypeScript only              |
| `npm run lint`      | ESLint                       |
| `npm run test`      | Vitest                       |
| `npm run e2e`       | Playwright smoke tests       |

## Deploy to production

Set two env vars and run `npm run build`. See [`DEPLOY.md`](./DEPLOY.md) for the full checklist.

```bash
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

Leaving these unset ships the build in mock mode.

## Docs

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — high-level design
- [`DEPLOY.md`](./DEPLOY.md) — deployment steps
- [`CONTRIBUTING.md`](./CONTRIBUTING.md) — dev workflow
- [`docs/ENTERPRISE_ROADMAP.md`](./docs/ENTERPRISE_ROADMAP.md) — forward roadmap (source of truth)

## License

Internal / Confidential.
