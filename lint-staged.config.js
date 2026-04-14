/**
 * lint-staged runs via .husky/pre-commit on every `git commit`.
 *
 * Intent: every committed file is formatted and lint-clean, regardless of what
 * the developer ran locally. Scope is kept tight to staged files so pre-commit
 * stays fast (< 2s for typical commits).
 *
 * See docs/ENTERPRISE_ROADMAP.md §5 Platform Epic P2.
 */
export default {
  '*.{ts,tsx}': ['eslint --fix', 'prettier --write'],
  '*.{js,mjs,cjs}': ['eslint --fix', 'prettier --write'],
  '*.{json,md,yml,yaml,html,css}': ['prettier --write'],
}
