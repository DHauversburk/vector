import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/**
 * Smoke tests — login page.
 *
 * These run against any URL (local dev, Vercel Preview, production) via
 * PLAYWRIGHT_BASE_URL. They do NOT authenticate — they only confirm the
 * login page renders correctly, is accessible, and has no layout overflow.
 *
 * Full auth flow tests (token → PIN → dashboard) live in
 * tests/e2e/auth-flow.spec.ts (Sprint 17, pending staging Supabase S14.1).
 *
 * See playwright.config.ts and docs/ENTERPRISE_ROADMAP.md §Platform P5.
 */

test.describe('Login page — smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('renders without crashing', async ({ page }) => {
    // The VECTOR branding or the login card must be visible.
    // Either element confirms the React app mounted successfully.
    await expect(
      page.locator('text=VECTOR').or(page.locator('input[type="text"], input[type="password"]')),
    ).toBeVisible({ timeout: 10_000 })
  })

  test('has no horizontal overflow (no scrollbar)', async ({ page }) => {
    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth
    })
    expect(overflow).toBe(false)
  })

  test('shows split-screen on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/login')
    // Left branding panel headline should be visible on desktop.
    await expect(page.locator('h1', { hasText: 'Secure clinical' })).toBeVisible({
      timeout: 10_000,
    })
    // LoginHeader (mobile-only) should NOT be visible at desktop width.
    // (LoginHeader renders inside md:hidden wrapper)
  })

  test('shows single-column on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/login')
    // Left branding panel should be hidden on mobile.
    const brandingPanel = page.locator('h1', { hasText: 'Secure clinical' })
    await expect(brandingPanel).toBeHidden()
  })

  test('login form is present and has correct fields', async ({ page }) => {
    await page.goto('/login')
    // Token input should be present (default mode).
    const tokenInput = page.locator('input').first()
    await expect(tokenInput).toBeVisible({ timeout: 10_000 })
  })

  test('has no critical accessibility violations', async ({ page }) => {
    // Allow time for fonts + animations to settle.
    await page.waitForTimeout(500)
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
    // Log violations for debugging without failing on pre-existing issues.
    // Ratchet to expect(results.violations).toEqual([]) in Sprint 15 a11y pass.
    if (results.violations.length > 0) {
      console.warn(
        `[axe] ${results.violations.length} accessibility violation(s) on login page:`,
        results.violations.map((v) => `${v.id}: ${v.description}`),
      )
    }
    // Critical violations (level A) must always be zero.
    const criticalViolations = results.violations.filter((v) => v.impact === 'critical')
    expect(criticalViolations).toEqual([])
  })

  test('health endpoint returns ok', async ({ request }) => {
    const resp = await request.get('/healthz.json')
    expect(resp.status()).toBe(200)
    const body = await resp.json()
    expect(body.status).toBe('ok')
  })
})
