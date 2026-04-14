import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Vitest config is intentionally separate from vite.config.ts so the production
// build graph and the test graph are independent. See docs/ENTERPRISE_ROADMAP.md
// §5 Platform Epic P2.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'lcov', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/test-setup.ts',
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/lib/database.types.ts',
        'src/scripts/**',
      ],
      // TODO(Sprint 14): baseline is currently UNMEASURABLE — `npm run test:coverage`
      // fails 16 of 22 tests because the corpus calls supabase.auth.signInWithPassword
      // with credentials the harness does not inject. See docs/ENTERPRISE_ROADMAP.md
      // §8 Risk #9 and docs/SPRINT_14_KICKOFF.md for the triage plan (fixture creds
      // from staging post-P9, or mark broken tests .skip with a rewrite-debt ticket).
      // Once the suite runs green, record the measured baseline here and start the
      // +5 points / sprint ratchet per Risk #5. Start at 0 so CI does not red-wall.
      thresholds: {
        lines: 0,
        branches: 0,
        functions: 0,
        statements: 0,
      },
    },
  },
})
