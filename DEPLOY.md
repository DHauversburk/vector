# VECTOR — Deploy

## Mock mode (default)

```bash
npm install
npm run dev
```

No env vars required. See [`README.md`](./README.md#sign-in-mock-mode) for demo credentials.

---

## Production (Supabase + Vercel)

### 1. Create the Supabase project

Dashboard → New Project. Note the Project URL and `anon` key from Settings → API.

### 2. Configure env

In Vercel (Settings → Environment Variables) or locally in `.env`:

```bash
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

Leaving these unset ships the build in mock mode.

See [`docs/ENVIRONMENTS.md`](./docs/ENVIRONMENTS.md) for the full env matrix across dev / preview / production.

### 3. Apply the schema

Run the current SQL in the Supabase SQL editor. Baseline (tables + RLS + RPCs) lives in `src/scripts/`; the authoritative list is:

- `beta_baseline_audit.sql` — tables
- `enforce_active_member_policy.sql` — RLS
- `admin_create_user_rpc.sql` + other `*_rpc.sql` — RPC functions
- `add_*_table.sql` — feature tables (feedback, resources)

> **Note:** migrations are not yet checked in as Supabase CLI artifacts. Epic P3 in [`docs/ENTERPRISE_ROADMAP.md`](./docs/ENTERPRISE_ROADMAP.md) tracks converting these scripts to `supabase/migrations/`.

### 4. Build + deploy

```bash
npm run build
```

Deploy the `dist/` folder:

- **Vercel:** push to `main` (auto-deploy) or `npx vercel --prod`
- **Netlify:** drag `dist/` or connect the repo
- **Other static hosts:** upload `dist/`

### 5. Verify

```bash
curl -I https://<your-domain>/                             # expect 200
curl https://<your-domain>/pwa-manifest.webmanifest        # PWA manifest
```

Sign in with a real account; confirm you do **not** see the "Demo mode" badge on the login screen. If you do, the Supabase env vars didn't make it into the build.

---

## Security notes

- **Zero PII in the client:** patients authenticate with short tokens, not emails.
- **RLS:** patients see their own appointments only; providers see their own schedule only; admin has full access.
- **Session:** 15-minute inactivity timeout; PIN on sign-in; optional biometric unlock.
- **CSP:** `vercel.json` sets the prod CSP. Epic P7 in the roadmap tightens `script-src` further.

---

## Troubleshooting

| Symptom                                    | Fix                                                                    |
| ------------------------------------------ | ---------------------------------------------------------------------- |
| "Demo mode" badge in production            | Env vars missing — check Vercel → Settings → Environment Variables     |
| Build error: TS / lint                     | `npm run typecheck && npm run lint`                                    |
| Test failure                               | `npm run test`                                                         |
| Users stuck on PIN screen after real login | Check `users` row exists and RLS policy allows `select` for their role |

For a deeper runbook, see [`docs/ENTERPRISE_ROADMAP.md`](./docs/ENTERPRISE_ROADMAP.md) § On-call (epic P6).
