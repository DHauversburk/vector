# Branch Protection — `main`

**Status:** Recommended configuration. Not yet enforced. Enable in the
GitHub Settings UI after Sprint 13 ships. `.github/CODEOWNERS` is
already populated with `@DHauversburk` as of the Sprint 14 planning
branch, so code-owner review is ready to flip on.

**Owner:** Repo admin.

**Referenced from:** `docs/ENTERPRISE_ROADMAP.md` §5 P1, §7 (P1 validation row).

---

## Why

Until branch protection is enabled, every `git push` to `main` is
accepted unconditionally. CI may run, but nothing prevents a red
workflow from being merged, nor a direct push that bypasses review
entirely. Branch protection is the enforcement layer that turns the
Sprint 13 CI workflow from _advisory_ into _required_.

---

## Required settings (GitHub UI)

Path: **Settings → Branches → Branch protection rules → Add rule**.

Rule applies to: `main`.

### 1. Require a pull request before merging

- [x] Require a pull request before merging
  - [x] **Require approvals:** 1 (raise to 2 after headcount allows)
  - [x] **Dismiss stale pull request approvals when new commits are pushed** — forces re-review after force-push or rebase
  - [x] **Require review from Code Owners** — activates `.github/CODEOWNERS` (already populated with `@DHauversburk`)
  - [ ] ~~Allow specified actors to bypass required pull requests~~ — leave off

### 2. Require status checks to pass before merging

- [x] Require status checks to pass before merging
  - [x] **Require branches to be up to date before merging**
  - **Required status checks** (type the name exactly — must match `.github/workflows/ci.yml` job name):
    - `CI complete` — this is the `ci-complete` aggregator job added in Sprint 13 precisely so the required-check name stays stable even if the matrix reshapes
  - After Sprint 14 add: `Supabase migrations (staging)` from `supabase-migrate.yml`
  - After Sprint 17 (P5.3): `E2E (preview)` from `e2e.yml`
  - After Sprint 20 (P7): `Headers check (prod)` from `headers-check.yml`

### 3. Require conversation resolution before merging

- [x] Require conversation resolution before merging

### 4. Require signed commits

- [x] Require signed commits — requires contributors to set up GPG or SSH signing keys (`git config user.signingkey` + `commit.gpgSign=true`).

_Impact:_ contributors without signing set up cannot push. Offer `docs/CONTRIBUTING.md` or onboarding guide with key-setup steps (future work).

### 5. Require linear history

- [x] Require linear history — forces squash-or-rebase merges, no merge commits. Keeps `git log` bisectable and release-please-friendly (P8).

### 6. Do not allow bypassing the above settings

- [x] Do not allow bypassing the above settings — this also applies to repo admins. **Critical** for enterprise compliance: admins get audited too.

### 7. Restrict who can push to matching branches

- [x] Restrict who can push to matching branches
  - Add the release-automation bot (Sprint 21 / P8) when release-please is wired. No humans in this list.

### 8. Rules applied to everyone including administrators

- [x] Include administrators — enforce for admins too.

### 9. Allow force pushes / deletions

- [ ] ~~Allow force pushes~~ — LEAVE OFF.
- [ ] ~~Allow deletions~~ — LEAVE OFF. Main can never be deleted.

---

## Verification (P1 row of §7 in the roadmap)

After enabling, confirm:

1. **Direct push is rejected:**

   ```bash
   git checkout main
   git commit --allow-empty -m "chore: test branch protection"
   git push origin main
   # expected: remote rejects — "protected branch hook declined"
   ```

2. **PR without approval cannot merge:** open a trivial PR; the merge
   button on GitHub should be disabled until code owners approve.

3. **PR with red CI cannot merge:** intentionally break a test in a
   PR; verify the merge button is disabled with "Required statuses
   must pass" shown.

4. **Unsigned commit rejected:** in a PR, push a commit authored
   without signing. GitHub shows the commit flagged "Unverified" and
   the branch cannot merge until all commits in the range are
   verified.

5. **Force push rejected on main:**
   ```bash
   git push --force origin main
   # expected: remote rejects — "cannot force-push to protected branch"
   ```

---

## Incremental rollout

Because turning on all of these at once will break any live dev
work, stagger them:

| Date              | What                               | Why                                               |
| ----------------- | ---------------------------------- | ------------------------------------------------- |
| Sprint 13 end     | Required PR + required CI check    | Closes the "merge anything" hole immediately      |
| Sprint 13 end +7d | Require code-owner review          | CODEOWNERS already populated with `@DHauversburk` |
| Sprint 14 start   | Require signed commits             | Contributors need time to set up signing          |
| Sprint 14 end     | Linear history                     | After team adjusts to squash-merge workflow       |
| Sprint 15         | Include administrators / no bypass | Last — once everyone is bought in                 |

---

## Rollback

If a setting breaks critical workflow (e.g. a release emergency),
temporarily disable via **Settings → Branches → Edit rule → toggle
off**. Document the toggle in `docs/ON_CALL_RUNBOOK.md` (Sprint 16)
so on-call knows the escape hatch exists. Re-enable within 24h of
the incident resolution.

Do **not** delete the rule — toggling fields preserves history; deleting
loses the audit trail of what was protected and when.
