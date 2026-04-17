import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2E configuration — Project Vector.
 *
 * Runs smoke tests against:
 *   - Local dev server (npm run dev) when PLAYWRIGHT_BASE_URL is unset.
 *   - Vercel Preview URL when PLAYWRIGHT_BASE_URL is set in CI.
 *   - Production (vector-health.vercel.app) on workflow_dispatch.
 *
 * See docs/ENTERPRISE_ROADMAP.md §Platform P5 for full test strategy.
 * Contract / RLS tests (tests/contract/) are gated on staging Supabase
 * being provisioned (S14.1 — see docs/SPRINT_14_OWNER_ACTIONS.md).
 */

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'on-failure' }]],

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'] },
    },
  ],

  // Start local dev server when running locally (not in CI — CI targets a live URL).
  webServer: process.env.CI
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://localhost:5173',
        reuseExistingServer: !process.env.CI,
        timeout: 30_000,
      },
})
