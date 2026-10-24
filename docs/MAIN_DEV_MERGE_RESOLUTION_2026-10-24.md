# Main / Dev Merge Conflict Resolution — Exact Git Preflight

## Evidence snapshot — 24 October 2026

- [Preflight run 40064683312](https://github.com/bjo163/moonwitness-corpus/actions/runs/40064683312) computes a three-way merge via `git merge-tree --write-tree --name-only origin/dev origin/main`, without changing a remote ref.
- A later [run 40064826137](https://github.com/bjo163/moonwitness-corpus/actions/runs/40064826137) reproduced the same **five actual conflict paths** after registry metadata consolidation.
- Main HEAD at assessment: `df00706c98e21fb3fb0146b8389b0f2978f3d833`.
- Dev HEAD at the current integration pass: `42c0b2f2b1675300a70b58171167dd2ebfa84e66` (`origin/dev`).
- Merge base: `f59331449fedf90ca494c4dcc35855f148b7afe1`; `dev` is 227 commits ahead and 100 behind `main`.
- Exit code 1 is a **deliberate fail-closed result**. A clean text merge alone will not establish semantic compatibility.
- `scripts/build-sqlite-database.ts` was auto-merged by Git but **still requires integration validation** because its schema adds edition/source/ownership fields and the main consumer expects a particular database contract.

## Five concrete textual merge conflicts

| Path | Confirmed difference | Resolution and proof |
| --- | --- | --- |
| `.github/workflows/upstream-sync.yml` | Main scheduled a direct push on `self-hosted`; dev has a read-only hosted audit | Retained dev's fail-closed workflow. No scheduled source mutation or direct push was restored. Updated workflow Node setup to 24. |
| `apps/api/src/api.test.ts` | Main adds telemetry, passage, hierarchy, traversal and pagination cases | Kept main's additions and restored dev's `/v1/works` list test, warm-up and three-tradition compare invariant. API regression suite passes. |
| `datasets/registry.json` | Main's 45 identities and dev's 4 additional entries overlap shared metadata | Retained dev's registry after commit `5a75012` reconciled main metadata; validators pass with 49 datasets and canonical identity unchanged. |
| `docs/ROCKSOUL_INTEROP.md` | Dev documents AWS LAW ownership; main adds six domains and CORRELATION boundaries | Kept both AWS ownership and the six-domain/correlation contract. |
| `package.json` | Dev has the full corpus command set; main adds `research:steward` | Kept all scripts and added the research steward with its implementation, tests and config. Root and web packages now target Node 24 LTS. |

## Source-of-truth decisions

1. Preserve exact canonical IDs, source provenance and rights; never invent or rewrite dataset identity to silence a merge.
2. Preserve both branch histories through an ordinary reviewed merge and keep [PR #360](https://github.com/bjo163/moonwitness-corpus/pull/360) as the pending promotion path.
3. Keep active draft [PR #393](https://github.com/bjo163/moonwitness-corpus/pull/393) and [PR #394](https://github.com/bjo163/moonwitness-corpus/pull/394) and their head branches intact; no source witness becomes canonical just by resolving a PR.
4. Ensure web application, browser DB/catalog scripts, SDK, research steward, telemetry and API additions on main survive as complete dependency sets.
5. Local integration checks on Node 24.22.1: frozen pnpm install, `pnpm check` (224 tests), API smoke, web `npm ci`/typecheck/contract/build, workflow-safety tests, release determinism and publish dry-run all pass. The browser DB used for the web build was generated locally for this candidate; no release was published.
6. GitHub exact-head CI is still required on the proposed PR. A passing core `dev` CI alone is not an integration check of both branches.

## Integration status

**Local candidate prepared and tested; canonical remote branches unchanged.** The isolated `codex/issue-399-reconcile` branch contains an ordinary merge candidate for the pinned `main` and `dev` heads. All five conflicts have explicit resolutions above. Local checks pass; exact-head GitHub CI on the review branch is the next gate. `origin/main` and `origin/dev` remain unchanged, and no release was published.
