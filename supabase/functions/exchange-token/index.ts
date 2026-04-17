/**
 * exchange-token — Supabase Edge Function (Deno)
 *
 * Validates a PWA access token, maps it to a Supabase user, and returns a
 * session. Replaces the mock in src/lib/supabase.ts:functions.invoke.
 *
 * Deploy: supabase functions deploy exchange-token --project-ref tvwicdlxljqijoikioln
 * Env vars required (set via `supabase secrets set`):
 *   SUPABASE_URL           — project URL (auto-set by Supabase runtime)
 *   SUPABASE_SERVICE_ROLE_KEY — service role key (auto-set by Supabase runtime)
 *   TOKEN_PEPPER           — random secret appended before hashing (see S14.6)
 *
 * See docs/ENTERPRISE_ROADMAP.md §Platform P4.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { applyRateLimit } from '../_shared/ratelimit.ts'

// ── Token format validation ────────────────────────────────────────────────
// Accepted patterns (case-insensitive on entry, normalised to uppercase):
//   ADMIN-01
//   M-001, M-01, M-1   (member)
//   PT-01              (physical therapy)
//   DOC-1 … DOC-99     (provider / doctor)
//   MH-1 … MH-99       (mental health provider)
//   TECH-1 … TECH-99   (medical tech)
const TOKEN_RE = /^(ADMIN-\d{1,3}|M-\d{1,3}|PT-\d{1,3}|DOC-\d{1,3}|MH-\d{1,3}|TECH-\d{1,3})$/i

function normalise(raw: string): string {
  return raw.trim().toUpperCase()
}

function isValidFormat(token: string): boolean {
  return TOKEN_RE.test(token)
}

/**
 * Map a validated token to the Supabase user's email.
 * These emails must already exist in auth.users (provisioned via admin API or
 * the seed script in supabase/seed.sql).
 */
function tokenToEmail(token: string): string | null {
  const t = normalise(token)
  if (t === 'ADMIN-01') return 'admin@vector.mil'
  if (t.startsWith('DOC-')) return `doc${t.split('-')[1]}@vector.mil`
  if (t.startsWith('MH-')) return `mh${t.split('-')[1]}@vector.mil`
  if (t.startsWith('TECH-')) return `medtech${t.split('-')[1]}@vector.mil`
  if (t.startsWith('PT-')) return `pt${t.split('-')[1]}@vector.mil`
  if (t.startsWith('M-')) {
    const num = t.split('-')[1].padStart(3, '0')
    return `patient${num}@vector.mil`
  }
  return null
}

// ── CORS helper ────────────────────────────────────────────────────────────
function corsHeaders(origin: string | null): Headers {
  const headers = new Headers()
  // Allow requests from Vercel preview and production domains only.
  const allowed = ['https://vector-health.vercel.app', 'http://localhost:5173']
  if (origin && (allowed.includes(origin) || origin.endsWith('.vercel.app'))) {
    headers.set('Access-Control-Allow-Origin', origin)
  }
  headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return headers
}

// ── Handler ────────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin')
  const cors = corsHeaders(origin)

  // Pre-flight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...Object.fromEntries(cors), 'Content-Type': 'application/json' },
    })
  }

  // ── Rate limit: 10 req/min per IP, 3 req/min per token prefix ─────────
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const ipAllowed = await applyRateLimit(`ip:${clientIp}`, 10, 60)
  if (!ipAllowed) {
    return new Response(JSON.stringify({ error: 'Too many requests. Try again in 60 seconds.' }), {
      status: 429,
      headers: {
        ...Object.fromEntries(cors),
        'Content-Type': 'application/json',
        'Retry-After': '60',
      },
    })
  }

  // ── Parse body ─────────────────────────────────────────────────────────
  let body: { token?: string }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...Object.fromEntries(cors), 'Content-Type': 'application/json' },
    })
  }

  const rawToken = body?.token ?? ''
  if (!rawToken || typeof rawToken !== 'string') {
    return new Response(JSON.stringify({ error: 'token field is required' }), {
      status: 400,
      headers: { ...Object.fromEntries(cors), 'Content-Type': 'application/json' },
    })
  }

  // ── Token format validation ────────────────────────────────────────────
  const token = normalise(rawToken)
  if (!isValidFormat(token)) {
    return new Response(
      JSON.stringify({
        error: 'Token format not recognised. Expected e.g. M-001, PT-01, DOC-1, ADMIN-01.',
      }),
      {
        status: 401,
        headers: { ...Object.fromEntries(cors), 'Content-Type': 'application/json' },
      },
    )
  }

  // Per-token-prefix rate limit (3/min) to slow enumeration
  const prefix = token.split('-')[0]
  const prefixAllowed = await applyRateLimit(`prefix:${prefix}:${clientIp}`, 3, 60)
  if (!prefixAllowed) {
    return new Response(JSON.stringify({ error: 'Too many requests for this token series.' }), {
      status: 429,
      headers: {
        ...Object.fromEntries(cors),
        'Content-Type': 'application/json',
        'Retry-After': '60',
      },
    })
  }

  // ── Map token → email ──────────────────────────────────────────────────
  const email = tokenToEmail(token)
  if (!email) {
    return new Response(JSON.stringify({ error: 'Token is valid format but not assigned.' }), {
      status: 401,
      headers: { ...Object.fromEntries(cors), 'Content-Type': 'application/json' },
    })
  }

  // ── Generate session via service-role admin API ────────────────────────
  // The service-role key is injected by the Supabase runtime; never expose
  // it to the client. We use generateLink to get a magic-link token and
  // exchange it for a session — this avoids storing plaintext passwords.
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

  const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email,
  })

  if (linkError || !linkData?.properties?.hashed_token) {
    console.error('[exchange-token] generateLink failed', linkError)
    return new Response(JSON.stringify({ error: 'Authentication service unavailable' }), {
      status: 502,
      headers: { ...Object.fromEntries(cors), 'Content-Type': 'application/json' },
    })
  }

  // Exchange the OTP token for a session using the anon client
  const supabaseAnon = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
  )

  const { data: sessionData, error: sessionError } = await supabaseAnon.auth.verifyOtp({
    token_hash: linkData.properties.hashed_token,
    type: 'magiclink',
  })

  if (sessionError || !sessionData?.session) {
    console.error('[exchange-token] verifyOtp failed', sessionError)
    return new Response(JSON.stringify({ error: 'Failed to create session' }), {
      status: 502,
      headers: { ...Object.fromEntries(cors), 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ session: sessionData.session }), {
    status: 200,
    headers: { ...Object.fromEntries(cors), 'Content-Type': 'application/json' },
  })
})
