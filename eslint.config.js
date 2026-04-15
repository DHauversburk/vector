import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import security from 'eslint-plugin-security'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

// Sprint 13 adds jsx-a11y and security plugins per docs/ENTERPRISE_ROADMAP.md
// §5 Platform Epic P2. Rules start at "warn" severity so day-one CI does not
// red-wall (see §8 Risk #5). Ratchet to "error" as baseline violations are
// fixed in later sprints.
export default defineConfig([
  globalIgnores(['dist', 'dev-dist', 'coverage', 'node_modules']),
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'jsx-a11y': jsxA11y,
      security,
    },
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // react-refresh/only-export-components: downgraded to warn for
      // the Sprint 13 baseline. Several contexts (OnboardingContext,
      // etc.) export both constants and components — fast-refresh
      // works fine in Vite, the rule is purely a dev-mode nicety.
      // TODO(Sprint 15 / Epic F): as part of the design-system
      // reset, extract mixed exports to dedicated files and ratchet
      // this rule back to error.
      'react-refresh/only-export-components': 'warn',

      // react-hooks/set-state-in-effect: downgraded to warn for the
      // Sprint 13 baseline. Several components (TacticalPinField,
      // DeviceContext) legitimately reset state on prop change via
      // useEffect. Some of those sites can be refactored to derived
      // state, others are load-once initializers. Same Risk #5
      // mitigation pattern as react-refresh above.
      // TODO(Sprint 15 / Epic F): audit each call site; ratchet back
      // to error.
      'react-hooks/set-state-in-effect': 'warn',

      // jsx-a11y: curated high-signal rules at warn. Expand in Sprints 15-16
      // (Product Epic A — Accessibility) where a full WCAG pass happens.
      'jsx-a11y/alt-text': 'warn',
      'jsx-a11y/anchor-has-content': 'warn',
      'jsx-a11y/anchor-is-valid': 'warn',
      'jsx-a11y/aria-props': 'warn',
      'jsx-a11y/aria-role': 'warn',
      'jsx-a11y/aria-unsupported-elements': 'warn',
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/heading-has-content': 'warn',
      'jsx-a11y/img-redundant-alt': 'warn',
      'jsx-a11y/label-has-associated-control': 'warn',
      'jsx-a11y/no-noninteractive-element-interactions': 'warn',
      'jsx-a11y/no-redundant-roles': 'warn',
      'jsx-a11y/role-has-required-aria-props': 'warn',

      // security: curated. detect-object-injection is intentionally off — it
      // is too noisy against idiomatic TS/React code (records, dynamic keys).
      'security/detect-eval-with-expression': 'warn',
      'security/detect-non-literal-fs-filename': 'warn',
      'security/detect-unsafe-regex': 'warn',
      'security/detect-buffer-noassert': 'warn',
      'security/detect-child-process': 'warn',
      'security/detect-new-buffer': 'warn',
      'security/detect-pseudoRandomBytes': 'warn',
      'security/detect-object-injection': 'off',
    },
  },
])
