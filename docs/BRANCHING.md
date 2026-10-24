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

## Required repository rulesets (FIX-006 / #398)

As of 2026-10-24 the repository is **not protected**: the public rulesets endpoint
returns an empty list and reading classic branch protection requires admin
authentication. CI success is therefore not yet structurally enforced.

A repository admin must create the following in **Settings → Rules → Rulesets**
(or the equivalent ruleset API) and then verify them:

1. **Canonical branches (`main`, `dev`)**
   - Require a pull request before merging; at least one approval; dismiss stale approvals.
   - Require review conversations to be resolved.
   - Require status checks `CI / check` and `CI / web` from the exact head SHA.
   - Block force pushes and branch deletion.
2. **Release tags (`corpus-v*`, `browser-db-*`)**
   - Block tag update and deletion; releases are immutable once published.
3. **Workflow permissions**
   - Default `GITHUB_TOKEN` read-only in **Settings → Actions → General**.
   - Write permissions only in manual, opt-in publication jobs (`browser-db` publish job, future release job).
4. **Bypass list**
   - Empty, or limited to an explicitly reviewed release identity. No broad PAT/admin bypass.

Verification after configuration (admin token):

```bash
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://api.github.com/repos/bjo163/moonwitness-corpus/rulesets
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://api.github.com/repos/bjo163/moonwitness-corpus/branches/main/protection
```

The rules become complete only when both responses show the contract above and a
pull request targeting a canonical branch is blocked by a red exact-head check.

`todo-issues-sync.yml` still commits `TODO.md` to the default branch. Before
requiring pull requests on `main`, either allowlist that bot identity or convert
the sync to a reviewed pull request; do not add a broad bypass.

## Release & protection dependencies

- [FIX-003 / #396](https://github.com/bjo163/moonwitness-corpus/issues/396): branch-safety remediation.
- [FIX-006 / #398](https://github.com/bjo163/moonwitness-corpus/issues/398): repository-level branch protection / ruleset requirements.
- [FIX-001 / #399](https://github.com/bjo163/moonwitness-corpus/issues/399): lossless reconciliation of divergent `dev` and `main`.
- [FIX-005 / #400](https://github.com/bjo163/moonwitness-corpus/issues/400): release and promotion verification.

If an older document or inherited workflow describes destructive branch cleanup, **this non-destructive retention policy takes precedence**.
