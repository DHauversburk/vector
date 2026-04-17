/**
 * Unit tests for src/lib/utils.ts
 *
 * Pure utility functions — no network, no Supabase, no IndexedDB.
 */

import { describe, it, expect } from 'vitest'
import { cn, sanitizeText } from '../../lib/utils'

describe('cn (className merge)', () => {
  it('merges two class names', () => {
    expect(cn('p-4', 'text-blue-500')).toBe('p-4 text-blue-500')
  })

  it('resolves Tailwind conflicts — last wins', () => {
    // tailwind-merge should prefer the later utility
    const result = cn('text-red-500', 'text-blue-500')
    expect(result).toBe('text-blue-500')
  })

  it('filters out falsy values', () => {
    const condition = false as boolean
    const result = cn('p-4', condition && 'bg-red-500', undefined, null, 'font-bold')
    expect(result).toContain('p-4')
    expect(result).toContain('font-bold')
    expect(result).not.toContain('bg-red-500')
  })

  it('returns empty string for all falsy inputs', () => {
    expect(cn(false, undefined, null)).toBe('')
  })

  it('handles conditional class objects', () => {
    const active = true
    const result = cn('base', { 'active-class': active, 'inactive-class': !active })
    expect(result).toContain('active-class')
    expect(result).not.toContain('inactive-class')
  })
})

describe('sanitizeText', () => {
  it('removes script tags', () => {
    const input = 'Hello <script>alert("xss")</script> World'
    const result = sanitizeText(input)
    expect(result).not.toContain('<script>')
    expect(result).not.toContain('alert("xss")')
    expect(result).toContain('Hello')
    expect(result).toContain('World')
  })

  it('escapes angle brackets', () => {
    const input = '<b>bold</b>'
    const result = sanitizeText(input)
    expect(result).toContain('&lt;')
    expect(result).toContain('&gt;')
    expect(result).not.toContain('<b>')
  })

  it('returns empty string for empty input', () => {
    expect(sanitizeText('')).toBe('')
  })

  it('returns empty string for falsy input', () => {
    // TypeScript says string, but test the runtime boundary
    expect(sanitizeText(null as unknown as string)).toBe('')
    expect(sanitizeText(undefined as unknown as string)).toBe('')
  })

  it('preserves safe text unchanged', () => {
    const safe = 'Patient presented with mild discomfort in the left shoulder.'
    expect(sanitizeText(safe)).toBe(safe)
  })

  it('handles multi-line script tags', () => {
    const input = `Before <script>
      var x = 1;
      document.cookie = x;
    </script> After`
    const result = sanitizeText(input)
    expect(result).not.toContain('<script>')
    expect(result).toContain('Before')
    expect(result).toContain('After')
  })

  it('handles case-insensitive script tags', () => {
    const input = 'test <SCRIPT>evil()</SCRIPT> end'
    const result = sanitizeText(input)
    expect(result).not.toContain('evil()')
  })
})
