# Main / Dev Merge Conflict Resolution — Exact Git Preflight

## Evidence snapshot — 24 October 2026

- [Preflight run 40064683312](https://github.com/bjo163/moonwitness-corpus/actions/runs/40064683312) computes a three-way merge via `git merge-tree --write-tree --name-only origin/dev origin/main`, without changing a remote ref.
- A later [run 40064826137](https://github.com/bjo163/moonwitness-corpus/actions/runs/40064826137) reproduced the same **five actual conflict paths** after registry metadata consolidation.
- Main HEAD at assessment: `df00706c98e21fb3fb0146b8389b0f2978f3d833`.
- Dev HEAD before this document: `90598de70d4c9332530e60437648981af414647d`.
- Exit code 1 is a **deliberate fail-closed result**. A clean text merge alone will not establish semantic compatibility.
- `scripts/build-sqlite-database.ts` was auto-merged by Git but **still requires integration validation** because its schema adds edition/source/ownership fields and the main consumer expects a particular database contract.

## Five concrete textual merge conflicts

| Path | Confirmed difference | Required resolution and proof |
| --- | --- | --- |
| `.github/workflows/upstream-sync.yml` | Main still schedules a direct push on `self-hosted` with an unfrozen install; dev has a successful hosted audit with `contents: read` and no commit/push | Retain the dev fail-closed audit. Introduce one reviewed default-branch production schedule only after permission and input-rights design, preferably PR-based rather than direct push. Do not revive the old main cron workflow. |
| `apps/api/src/api.test.ts` | Main has telemetry, passage, work hierarchy, traversal, and pagination cases not all present in dev | Preserve all test intentions through a reviewed union; adapt expectations to the merged API without weakening coverage, then prove API smoke and tests on an integration candidate. |
| `datasets/registry.json` | All 45 main dataset IDs/paths/statuses were exactly present in dev; dev added 4 more; 39 shared main entries carried optional tradition/genre/language metadata absent in dev | [Commit 5a75012](https://github.com/bjo163/moonwitness-corpus/commit/5a750124a9c3c45db3f214b4dd930c1b37b3b9ee) preserves all 45 main entries and all 4 dev-only entries with canonical identity unchanged. Still use an explicit conflict resolution because Git sees a changed path; rerun schema/ownership validation after the real merge. |
| `docs/ROCKSOUL_INTEROP.md` | Dev documents AWS LAW ownership; main has a six-domain STORY/EVENT/PERSON/TEXT/LAW/PERSPECTIVE contract and a separate CORRELATION relationship layer | Preserve AWS plus the six-domain/correlation boundaries. Do not merge textual sources into PERSON/EVENT or global normative truth. |
| `package.json` | Dev defines ~87 scripts and stricter `check`; main defines ~30 scripts including `research:steward` absent in dev | Keep dev's comprehensive check and tests; restore main-only research steward **with its implementation, tests and config** when integrating. Revalidate merged workspace/lockfile and all consumers. |

## Source-of-truth decisions

1. Preserve exact canonical IDs, source provenance and rights; never invent or rewrite dataset identity to silence a merge.
2. Preserve both branch histories through an ordinary reviewed merge and keep [PR #360](https://github.com/bjo163/moonwitness-corpus/pull/360) as the pending promotion path.
3. Keep active draft [PR #393](https://github.com/bjo163/moonwitness-corpus/pull/393) and [PR #394](https://github.com/bjo163/moonwitness-corpus/pull/394) and their head branches intact; no source witness becomes canonical just by resolving a PR.
4. Ensure web application, browser DB/catalog scripts, SDK, research steward, telemetry and API additions on main survive as complete dependency sets.
5. Check `pnpm install --frozen-lockfile`, `pnpm check`, API and web smoke, release determinism, and true exact-head CI after source integration.
6. A passing core `dev` CI (e.g. [run 40063553958](https://github.com/bjo163/moonwitness-corpus/actions/runs/40063553958)) is **not** a passing integration test of both branches. `main` has not been changed or promoted by this audit.

## Integration status

**NOT MERGED.** Semantic reconciliation has begun online for the registry and interoperability boundaries; the Git three-way merge still reports conflicts. `main` remains independent until the complete candidate is reviewed and passes its own test gates.
