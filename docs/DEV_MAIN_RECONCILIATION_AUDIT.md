# Dev/Main Reconciliation — Lossless Integration Inventory

> Online source/metadata audit for [#399 / FIX-001](https://github.com/bjo163/moonwitness-corpus/issues/399). This document is an inventory, **not** a merged branch or an approval to promote. Verify the current heads again before integration.

## Pinned heads (2026-10-24)

- `dev`: `42c0b2f2b1675300a70b58171167dd2ebfa84e66` (`origin/dev` at the current integration pass)
- `main`: `df00706c98e21fb3fb0146b8389b0f2978f3d833`
- Merge base: `f59331449fedf90ca494c4dcc35855f148b7afe1`; `main...dev` is **100 behind / 227 ahead**. History is **diverged**.
- Existing [PR #360](https://github.com/bjo163/moonwitness-corpus/pull/360) is the canonical promotion PR, and was not mergeable in the audit.
- [Compare branches](https://github.com/bjo163/moonwitness-corpus/compare/main...dev) (live, may differ from this snapshot).

The current isolated merge candidate restores the main-only web explorer, API/SDK routes, browser database/catalog, research steward and metadata while preserving dev's corpus and safety work. Local Node 24 LTS core, API, web and release checks pass; the exact-head GitHub CI and reviewed PR remain pending. See [the exact conflict decisions](MAIN_DEV_MERGE_RESOLUTION_2026-10-24.md).

## Six changed-path intersections across both histories

These six paths have been changed on *both sides* relative to their shared base and require deliberate three-way merge decisions (not all imply literal Git textual conflicts).

| Path | Required reconciliation |
| --- | --- |
| `.github/workflows/upstream-sync.yml` | Retain the validated ignored-`dist/` staging fix, least-privilege bot semantics, one correctly anchored default-branch schedule and safe read/write boundaries. The `dev` workflow is dispatch-only; `main` has scheduled sync and an unresolved historical 403. |
| `apps/api/src/api.test.ts` | Preserve both API regressions; validate live endpoint behavior and forbid dropping tests to satisfy conflicts. |
| `datasets/registry.json` | Merge dataset entries by immutable canonical identity; detect duplicate IDs, source/rights drift, and missing dependencies; never silently replace a recorded edition. |
| `docs/ROCKSOUL_INTEROP.md` | Preserve domain boundaries (TEXT / PERSON / EVENT / STORY / LAW), source-scoped assertions, and cross-repo provenance requirements. |
| `package.json` | Preserve scripts and workspace/package versions across both lines; reconcile Node/pnpm/CI contract and versioning without reverting release gates. |
| `scripts/build-sqlite-database.ts` | Preserve deterministic derived artifact behavior, schema compatibility, and API/web consumer DB contract; test source → DB derivation from a clean checkout. |

## Main-only work to restore as complete dependency sets

The reverse compare reported **41 paths present/changed only on the `main` side** at this snapshot. Main-only is relative to the shared base and **does not authorize blind file copying**.

| Group | Important paths / acceptance |
| --- | --- |
| Web explorer | `apps/web/**` (16 files), `scripts/export-web-catalog.mjs`, `scripts/build-browser-search-db.mjs`, `scripts/chunk-browser-search-db.mjs`, `pnpm-workspace.yaml`, `vercel.json`, root TS config. Restore as one tested consumer integration; `dev` currently has no `apps/web`. |
| Research lifecycle | `scripts/research-steward.ts` and `.test.ts`, `config/textual-semantic-rules.json`, research issue template, and existing draft [PR #393](https://github.com/bjo163/moonwitness-corpus/pull/393). Do not duplicate that parser on `dev`; preserve draft PR #394 and issue #380 evidence. |
| Core API and SDK | `apps/api/src/app.ts`, relevant routes, `packages/sdk/src/client.ts`, `packages/node/src/sqlite-repository.ts`; verify compatibility with `dev` ingestion/DB interfaces. |
| Repository governance | `ROCKSOUL-REPO.json`, `ROCKSOUL-TODO.json`, `rocksoul-contract.yml`, web publication workflows, associated metadata and tests. Do not re-enable destructive branch cleanup. |

## Dev-specific work that must survive

- Numerous `config/**` and `datasets/**` coverage, recipe, quality, lineage, materialization, metrics and build tools; source- and jurisdiction-specific rights review still matters.
- Budge/Zhuangzi/Renouf scripts and edition-specific source metadata under [#395](https://github.com/bjo163/moonwitness-corpus/issues/395).
- Safe branch inventory workflow in [#396](https://github.com/bjo163/moonwitness-corpus/issues/396).
- CI / upstream synchronization fixes in [#397](https://github.com/bjo163/moonwitness-corpus/issues/397).
- Read-only release candidate verification workflow in [#400](https://github.com/bjo163/moonwitness-corpus/issues/400), including removal of unsafe automatic `main` push.
- [TEXT research lifecycle contract](RESEARCH_ISSUE_LIFECYCLE.md).

## Required merge gates / decisions

1. Pin both heads, merge-base, active PR head SHAs, complete tracked file diff and current CI. Do **not** rely only on the six overlapping-path names above for conflict resolution.
2. Record explicit reviewer decisions for each overlapping file and the web/research/source migration groups.
3. Restore `main`-only work through a reviewed non-force-push merge that preserves historical commits; handle conflicts in `dev` first, do not overwrite `main` with a snapshot.
4. Re-run deterministic canonical data validation and full materialization, then API, web, research stewardship and release verification on one exact candidate SHA.
5. Require [#395](https://github.com/bjo163/moonwitness-corpus/issues/395), [#397](https://github.com/bjo163/moonwitness-corpus/issues/397), [#398](https://github.com/bjo163/moonwitness-corpus/issues/398) and [#400](https://github.com/bjo163/moonwitness-corpus/issues/400) safety gates before the final promotion.
6. Preserve PR #360 as the reviewed integration surface, keep open/draft PR source branches, and prepare rollback/retention refs before any head-changing merge.
7. Verify `main` and `dev` history relationship **after** promotion without force-push, and record the released SHA/artifact checksums.

**No merge/reset/rebase/branch deletion was done to produce this audit.**
