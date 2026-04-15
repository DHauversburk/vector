# VECTOR — Architecture

## Overview

VECTOR is an anonymous medical scheduling PWA for high-compliance environments. Three user roles (patient, provider, admin) share a single React app that talks to Supabase for auth, data, and RPCs. The app also runs without a backend (mock mode) for local development and demos.

## Stack

- **Frontend:** React 19, TypeScript 5, Vite 7
- **Styling:** Tailwind CSS 3
- **Backend:** Supabase (Postgres, Auth, RPCs, Edge Functions)
- **Client state:** React Context (auth, theme) + SWR for server cache
- **PWA:** `vite-plugin-pwa` (Workbox under the hood)

## Key patterns

### Dual-mode API

`src/lib/api/` switches between a mock in-memory store and Supabase based on `IS_MOCK` (exported from `src/lib/supabase.ts`). Each domain (`admin`, `appointments`, `auth`, `interactions`, `providers`) has a `mock.ts` and a `supabase.ts`; the sibling `<domain>.ts` picks the right strategy at import time.

Mock mode is selected when `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` are missing, or when `VITE_FORCE_MOCK=true`. Data is persisted in `localStorage`.

### Role-based routing

`AuthContext` resolves the user's role (`admin` / `provider` / `member`) and the router guards each dashboard:

- `/dashboard` — member (patient) view
- `/provider` — provider view
- `/admin` — admin view

### UI primitives

`src/components/ui/` holds the primitives (Button, Input, Badge, Card, TacticalPinField, etc.). Feature-specific components live in `src/components/<feature>/` (auth, offline, dashboard).

### PWA

`vite-plugin-pwa` handles service-worker registration and offline caching. Sync and notification logic lives in `src/sw.ts` and `src/components/offline/`.

## Performance

- **Code splitting:** routes use `React.lazy` + `Suspense`.
- **Server cache:** SWR dedupes and caches RPC responses.
- **Virtualised lists:** `react-window` for long appointment / user lists.

## Security

- **Token-alias auth:** patients sign in with a short token instead of an email.
- **PIN:** 4-digit PIN on every sign-in.
- **Biometric:** optional WebAuthn unlock after the first PIN.
- **RLS:** row-level security policies enforce role boundaries in Postgres.
- **Audit log:** `log_event` RPC records every write path.

## Source layout

```
src/
├── components/   # UI (primitives in ui/, feature-specific in <feature>/)
├── contexts/     # Auth, Theme, Onboarding
├── hooks/        # Reusable hooks (useMemberDashboard, useBootSequence, …)
├── lib/          # api/, supabase.ts, logger, crypto, utils
├── pages/        # Top-level routes
└── main.tsx      # Entry
```

## Related docs

- [`../README.md`](../README.md) — quickstart
- [`../DEPLOY.md`](../DEPLOY.md) — deployment
- [`docs/ENTERPRISE_ROADMAP.md`](./docs/ENTERPRISE_ROADMAP.md) — forward roadmap
