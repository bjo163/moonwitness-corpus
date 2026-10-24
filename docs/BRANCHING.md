# Branching Contract

This repository has **two canonical long-lived branches**:

- `main`: reviewed, stable/release-ready state.
- `dev`: ongoing implementation, data curation, and integration.

A canonical branch is not the same as the only permitted remote branch.

## Branch safety and review

- Changes should be developed and validated against `dev`. Stable releases are promoted from reviewed candidates to `main` only after all required checks succeed.
- Short-lived `feature/*`, `fix/*`, `research/*`, `work/*`, `ui/*` or other PR source branches **may exist remotely while work is in progress**. They are noncanonical but must not be deleted while an open or draft PR, unmerged commits, or a retention obligation exists.
- A `dev` / `main` naming policy **never authorizes deletion** of active pull-request heads or other unmerged work.
- Emergency fixes are reviewed and validated like other changes; do not rewrite branch history to bypass gates.
- Release automation may create verified tags/releases through an approved publication process, but it must not force-update `main`.

## Branch policy automation

`.github/workflows/branch-policy.yml` is **read-only and audit-only**:

1. Enumerates repository branches and open pull-request heads with the GitHub API.
2. Writes an Actions step summary to help human reviewers identify abandoned refs.
3. Makes **zero branch deletions or pushes**, even for merged or apparently stale branches.
4. On GitHub API/auth failure, the job fails without mutating any ref.

Permanent deletion requires a **separate, explicitly reviewed process**, including current PR-state checks, a merged/unmerged history check against canonical refs, no open review or research retention obligation, audit evidence, and an accountable human approval. A failed/ambiguous check means **retain the branch**.

## Repository rulesets (FIX-006 / #398)

Repository rulesets were applied on 2026-10-24:

- `canonical-branch-protection` (id `25772824`, active) targets `main` and `dev`.
  It blocks deletion and force pushes, requires a pull request, requires review
  conversations to be resolved, and requires the exact-head checks `check` and
  `web`. Required approvals are `0` because the repository currently has a
  single admin; raise this to at least `1` as soon as a second reviewer exists.
- `immutable-release-tags` (id `25772825`, active) targets `corpus-v*` and
  `browser-db-*`, blocking tag updates, retagging and deletion.

The classic branch-protection API still reports `Branch not protected`; the
rulesets endpoint is the authoritative enforcement source. Verify with:

```bash
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://api.github.com/repos/bjo163/moonwitness-corpus/rulesets
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://api.github.com/repos/bjo163/moonwitness-corpus/rules/branches/dev
```

A canonical branch is fully protected only when the second call lists `deletion`,
`non_fast_forward`, `pull_request` and `required_status_checks`, and a pull
request targeting it is blocked by a red exact-head check.

`todo-issues-sync.yml` still commits `TODO.md` to the default branch. Before
requiring pull requests on `main`, either allowlist that bot identity or convert
the sync to a reviewed pull request; do not add a broad bypass.

## Release & protection dependencies

- [FIX-003 / #396](https://github.com/bjo163/moonwitness-corpus/issues/396): branch-safety remediation.
- [FIX-006 / #398](https://github.com/bjo163/moonwitness-corpus/issues/398): repository-level branch protection / ruleset requirements.
- [FIX-001 / #399](https://github.com/bjo163/moonwitness-corpus/issues/399): lossless reconciliation of divergent `dev` and `main`.
- [FIX-005 / #400](https://github.com/bjo163/moonwitness-corpus/issues/400): release and promotion verification.

If an older document or inherited workflow describes destructive branch cleanup, **this non-destructive retention policy takes precedence**.
