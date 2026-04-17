/**
 * Unit tests for the exchange-token edge function.
 *
 * Run locally: deno test --allow-env supabase/functions/exchange-token/index.test.ts
 * Run in CI: supabase functions serve exchange-token --no-verify-jwt
 *
 * These tests validate token-format logic and mapping without hitting Supabase.
 * Integration tests (hitting the live function) are out of scope here —
 * see docs/ENTERPRISE_ROADMAP.md §P5 for the E2E test strategy.
 */

import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'

// ── Inline the pure functions so we can unit-test without importing the full
//    handler (which calls Deno.serve and requires network).  ──────────────────

const TOKEN_RE = /^(ADMIN-\d{1,3}|M-\d{1,3}|PT-\d{1,3}|DOC-\d{1,3}|MH-\d{1,3}|TECH-\d{1,3})$/i

function normalise(raw: string): string {
  return raw.trim().toUpperCase()
}

function isValidFormat(token: string): boolean {
  return TOKEN_RE.test(token)
}

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

// ── Format validation ────────────────────────────────────────────────────────

Deno.test('isValidFormat — accepts ADMIN-01', () => {
  assertEquals(isValidFormat('ADMIN-01'), true)
})

Deno.test('isValidFormat — accepts M-001', () => {
  assertEquals(isValidFormat('M-001'), true)
})

Deno.test('isValidFormat — accepts M-1 (short)', () => {
  assertEquals(isValidFormat('M-1'), true)
})

Deno.test('isValidFormat — accepts DOC-5', () => {
  assertEquals(isValidFormat('DOC-5'), true)
})

Deno.test('isValidFormat — accepts MH-12', () => {
  assertEquals(isValidFormat('MH-12'), true)
})

Deno.test('isValidFormat — accepts TECH-99', () => {
  assertEquals(isValidFormat('TECH-99'), true)
})

Deno.test('isValidFormat — accepts PT-01', () => {
  assertEquals(isValidFormat('PT-01'), true)
})

Deno.test('isValidFormat — case insensitive', () => {
  assertEquals(isValidFormat('m-001'), true)
  assertEquals(isValidFormat('admin-01'), true)
})

Deno.test('isValidFormat — rejects empty string', () => {
  assertEquals(isValidFormat(''), false)
})

Deno.test('isValidFormat — rejects SQL injection attempt', () => {
  assertEquals(isValidFormat("' OR 1=1--"), false)
})

Deno.test('isValidFormat — rejects unknown prefix', () => {
  assertEquals(isValidFormat('NURSE-01'), false)
})

Deno.test('isValidFormat — rejects no separator', () => {
  assertEquals(isValidFormat('ADMIN01'), false)
})

// ── Email mapping ────────────────────────────────────────────────────────────

Deno.test('tokenToEmail — ADMIN-01 maps to admin@vector.mil', () => {
  assertEquals(tokenToEmail('ADMIN-01'), 'admin@vector.mil')
})

Deno.test('tokenToEmail — M-1 maps to patient001@vector.mil', () => {
  assertEquals(tokenToEmail('M-1'), 'patient001@vector.mil')
})

Deno.test('tokenToEmail — M-042 pads correctly', () => {
  assertEquals(tokenToEmail('M-042'), 'patient042@vector.mil')
})

Deno.test('tokenToEmail — DOC-3 maps to doc3@vector.mil', () => {
  assertEquals(tokenToEmail('DOC-3'), 'doc3@vector.mil')
})

Deno.test('tokenToEmail — MH-7 maps to mh7@vector.mil', () => {
  assertEquals(tokenToEmail('MH-7'), 'mh7@vector.mil')
})

Deno.test('tokenToEmail — TECH-2 maps to medtech2@vector.mil', () => {
  assertEquals(tokenToEmail('TECH-2'), 'medtech2@vector.mil')
})

Deno.test('tokenToEmail — PT-01 maps to pt1@vector.mil', () => {
  assertEquals(tokenToEmail('PT-01'), 'pt1@vector.mil')
})

Deno.test('tokenToEmail — case normalised before mapping', () => {
  // lowercase input should still produce the correct email
  assertEquals(tokenToEmail('admin-01'), 'admin@vector.mil')
  assertEquals(tokenToEmail('m-001'), 'patient001@vector.mil')
})
