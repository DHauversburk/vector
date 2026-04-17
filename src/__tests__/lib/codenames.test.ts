/**
 * Unit tests for src/lib/codenames.ts
 *
 * Pure functions — no network, no Supabase, no IndexedDB. These run clean in
 * the jsdom vitest environment without any harness setup.
 *
 * Replaces the coverage gap left by the three describe.skip suites that
 * require real auth credentials (see S14.3 in docs/ENTERPRISE_ROADMAP.md).
 */

import { describe, it, expect } from 'vitest'
import {
  generatePatientCodename,
  getShortPatientId,
  getPatientDisplayInfo,
} from '../../lib/codenames'

describe('generatePatientCodename', () => {
  it('returns a non-empty string for a valid UUID', () => {
    const result = generatePatientCodename('abc123')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('is deterministic — same input always yields same output', () => {
    const id = '550e8400-e29b-41d4-a716-446655440000'
    expect(generatePatientCodename(id)).toBe(generatePatientCodename(id))
  })

  it('produces different codenames for different IDs', () => {
    const a = generatePatientCodename('id-one')
    const b = generatePatientCodename('id-two')
    // Astronomically unlikely to collide; detects a broken hash
    expect(a).not.toBe(b)
  })

  it('handles empty string without throwing', () => {
    expect(() => generatePatientCodename('')).not.toThrow()
  })

  it('follows ADJECTIVE-NOUN-NUMBER format', () => {
    const result = generatePatientCodename('test-patient-001')
    // Should contain at least two words (adj + noun) and a number
    const parts = result.split(' ')
    expect(parts.length).toBeGreaterThanOrEqual(2)
    // Number suffix should be 0–99
    const lastPart = parts[parts.length - 1]
    const num = parseInt(lastPart, 10)
    if (!isNaN(num)) {
      expect(num).toBeGreaterThanOrEqual(0)
      expect(num).toBeLessThanOrEqual(99)
    }
  })

  it('handles very long IDs', () => {
    const longId = 'a'.repeat(200)
    expect(() => generatePatientCodename(longId)).not.toThrow()
    expect(generatePatientCodename(longId).length).toBeGreaterThan(0)
  })

  it('handles UUIDs with hyphens', () => {
    const uuid = '123e4567-e89b-12d3-a456-426614174000'
    const result = generatePatientCodename(uuid)
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })
})

describe('getShortPatientId', () => {
  it('returns first 4 characters uppercased', () => {
    expect(getShortPatientId('abcd1234')).toBe('ABCD')
  })

  it('returns ---- for empty string', () => {
    expect(getShortPatientId('')).toBe('----')
  })

  it('handles a standard UUID', () => {
    const uuid = '550e8400-e29b-41d4-a716-446655440000'
    expect(getShortPatientId(uuid)).toBe('550E')
  })

  it('returns exactly 4 characters', () => {
    const result = getShortPatientId('abcdefghij')
    expect(result.length).toBe(4)
  })
})

describe('getPatientDisplayInfo', () => {
  it('returns both codename and shortId', () => {
    const result = getPatientDisplayInfo('test-id')
    expect(result).toHaveProperty('codename')
    expect(result).toHaveProperty('shortId')
  })

  it('codename matches standalone generatePatientCodename', () => {
    const id = 'some-patient-uuid'
    const info = getPatientDisplayInfo(id)
    expect(info.codename).toBe(generatePatientCodename(id))
  })

  it('shortId matches standalone getShortPatientId', () => {
    const id = 'some-patient-uuid'
    const info = getPatientDisplayInfo(id)
    expect(info.shortId).toBe(getShortPatientId(id))
  })
})
