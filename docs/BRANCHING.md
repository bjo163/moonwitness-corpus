# Branching Contract

This repository uses **exactly two branches**, both long-lived:

- `main`: stable, release-ready state.
- `dev`: active development, data curation, and integration.

No other permanent branches are used.

## Workflow

- Develop and validate changes on `dev`.
- Promote a stable `dev` to `main` when it is ready.
- Push directly. The repository ruleset **does not require a pull request**,
  approvals, or status checks, so a normal `git push origin dev` (or
  `git push origin main`) works.

```bash
git checkout dev
git push origin dev
```

## Repository rulesets

Applied 2026-10-24 (updated 2026-10-24 to remove the mandatory pull request):

- `canonical-branch-protection` (id `25772824`, active) targets `main` and `dev`.
  It blocks branch deletion (`deletion`) and force pushes (`non_fast_forward`).
  It does **not** require a pull request and does **not** require status checks,
  so direct pushes are allowed.
- `immutable-release-tags` (id `25772825`, active) targets `corpus-v*` and
  `browser-db-*`, blocking tag updates, retagging and deletion.

The rulesets endpoint is the authoritative enforcement source. Verify with:

```bash
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://api.github.com/repos/bjo163/moonwitness-corpus/rulesets
```

## Branch policy automation

`.github/workflows/branch-policy.yml` is **read-only and audit-only**: it reports
branch state and makes zero branch deletions or pushes.

## Release & protection dependencies

- [FIX-003 / #396](https://github.com/bjo163/moonwitness-corpus/issues/396): branch-safety remediation.
- [FIX-006 / #398](https://github.com/bjo163/moonwitness-corpus/issues/398): repository-level branch protection / ruleset requirements.
- [FIX-001 / #399](https://github.com/bjo163/moonwitness-corpus/issues/399): lossless reconciliation of divergent `dev` and `main`.
- [FIX-005 / #400](https://github.com/bjo163/moonwitness-corpus/issues/400): release and promotion verification.
