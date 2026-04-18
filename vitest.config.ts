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
    // Exclude Deno-targeted test files in supabase/functions/ — they use
    // https:// imports incompatible with Node's ESM loader. Run them via:
    //   deno test --allow-env supabase/functions/exchange-token/index.test.ts
    exclude: ['**/node_modules/**', '**/dist/**', 'supabase/**', 'tests/**'],
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
      // S14.3 STATUS: The 3 legacy integration suites (mvp_enhancements,
      // verification, verification_10_stories) are marked describe.skip because
      // they require Supabase auth credentials the jsdom harness cannot inject.
      // Replaced in S14.3 with proper unit tests in src/__tests__/lib/ that run
      // clean. Thresholds start at 0 per Risk #5; ratchet +5 pts/sprint once
      // integration tests are rewritten against staging (post-S14.1 provisioning).
      // See docs/ENTERPRISE_ROADMAP.md §S14.3 and §Risk #5.
      thresholds: {
        lines: 0,
        branches: 0,
        functions: 0,
        statements: 0,
      },
    },
  },
})
