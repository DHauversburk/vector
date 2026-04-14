/**
 * Enforces Conventional Commits (https://www.conventionalcommits.org/).
 *
 * Used by release-please (Sprint 20 / Platform Epic P8) to auto-generate the
 * CHANGELOG and bump the semver correctly. Without this enforcement, release
 * automation produces garbage release notes.
 *
 * Allowed types are intentionally limited. "wip" is excluded so WIP commits do
 * not end up in release notes.
 */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat', // new user-facing feature
        'fix', // bug fix
        'docs', // documentation only
        'style', // formatting, missing semicolons; no code change
        'refactor', // code change that neither fixes a bug nor adds a feature
        'perf', // performance improvement
        'test', // adding or correcting tests
        'build', // build system, dependencies, tooling
        'ci', // CI configuration
        'chore', // miscellaneous (no src/ impact)
        'revert', // revert a previous commit
        'security', // security fix or hardening
      ],
    ],
    'subject-case': [2, 'never', ['upper-case', 'pascal-case', 'start-case']],
    'header-max-length': [2, 'always', 100],
    'body-max-line-length': [1, 'always', 100],
  },
}
