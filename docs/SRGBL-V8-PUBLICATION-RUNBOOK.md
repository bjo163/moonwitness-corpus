# SRGBL v8 — Reviewed Publication & Integrity Runbook

**Status:** P19 implementation research preview, 2026-10-24. NOT ratified scientific or theological validation.
**Owner:** MoonWitness Corpus, derived SRGBL method.
**Canonical source:** [SRGBL Master RFC](./SRGBL-V8-MASTER-RFC.md) · [P18 Key Witness](./KEY-WITNESS-V0.md) · [Implementation status](./SRGBL-V8-IMPLEMENTATION-STATUS.md) · [Issue #446](https://github.com/bjo163/moonwitness-corpus/issues/446).

## The trust boundary

1. The corpus's **original records, exact edition, translation, source rights and provenance** are separate from any derived interpretation.
2. A researcher submits a human-reviewed `SnapshotInput` with explicit `corpusHash`, method version, reviewer and source links. An `AnalysisRun` is sealed with `computeAnalysisInputHash()`: SHA-256 of the run excluding `inputHash`.
3. `createReviewedSnapshot()` refuses missing S1 support, unknown rights, failed evidence/dependency gates, version/corpus mismatch, input-hash mismatch, unreviewed Swing/correction or unattributed miracle claims.
4. The compiler generates `inputSha256` and **`projectionSha256`**, including only a reviewable derived level trace in its public projection. No original source text, standalone score leaderboard, or unreviewed source claim appears in the public projection.
5. At request time, Fastify verifies the snapshot schema, consistency of each reviewed analysis and its five-level trace, checksum, and exact **corpus hash from the trusted on-disk `apps/web/public/corpus-catalog.json`**. Stale/malformed files produce `503 reviewed_publication_integrity_failure`.
6. Missing snapshot or passage review produces an explicit `404`. No automated fallback fills missing R2–L5 panels.
7. The reader at `/research/srgbl` may show reviewed level claims with evidence/content references *only* when the API returns them; otherwise it shows UNKNOWN.

**Important:** SHA-256 protects reproducibility and detects unintended changes. It does **not** establish reviewer identity or authenticate a dishonest source. Only an access-controlled editorial workflow and a verified chain of real corpus source records can do that; those acceptance gates are not yet complete.

## Exact source pin

The catalog's `corpusHash` is computed by `scripts/export-web-catalog.mjs`. Before ingesting a reviewed input, take the hash from the **same build** of the corpus that will serve the API. Do not assume a source is redistributable because the work is old or the tradition is public.

An example of a legitimate (future) review-run flow:

```bash
# From the MoonWitness Corpus checkout, Node 24 / pnpm 10.33.4.
pnpm install --frozen-lockfile
pnpm check

# Reviewers must produce a rights-cleared, independently auditable input.
# No example in this repository claims to be a reviewed Qur'an interpretation.
pnpm srgbl:build-reviewed --input /secure/reviewed-input.json --out dist/srgbl/reviewed.json
pnpm srgbl:build-reviewed --input /secure/reviewed-input.json --out dist/srgbl/reviewed.json --check

# Optional static/browser public projection. This writes only reviewed public claims
# and evidence/source IDs under apps/web/public; no reviewer rows, scores, or text.
pnpm srgbl:export-static --input dist/srgbl/reviewed.json
pnpm srgbl:export-static --input dist/srgbl/reviewed.json --check

# Fastify loads only the pinned reviewed file and local catalog.
SRGBL_REVIEWED_PATH=dist/srgbl/reviewed.json pnpm serve
```

Source input must be produced only by authorized reviewers. Do not store private notes, copyrighted translations, sensitive review credentials, or secrets in public git. A permission record or review attestation is not manufactured by the compiler.

## API behavior

| Condition | Manifest | `/passages/:id/analysis` |
|---|---|---|
| No reviewed snapshot | `source-trace-only` | 404 `reviewed_analysis_not_materialized` |
| Valid snapshot for same catalog with reviewed rows | `reviewed-derived-available` | 200 for reviewed passage; 404 for others |
| Snapshot stale/corrupt/untrusted | 503 `reviewed-publication-invalid` | 503 `reviewed_publication_integrity_failure` |
| Empty but structurally valid snapshot | `source-trace-only` | 404 passage absent |

The `/source-trace` endpoint is separate. It reveals metadata/gaps and never grants rights clearance automatically.

The static export uses the same verifier and corpus hash as the API. The browser fallback compares the static projection's corpus hash to `/corpus-catalog.json` before displaying claims. A missing projection leaves the page in its explicit UNKNOWN state; never create placeholder reviewed data to populate it.

## What still blocks production

- Approve P18 methodology, pilot traditions, 20-key registry, reviewers and appeal/disagreement workflow.
- Validate canonical evidence selector existence and edition rights with actual corpus sources during review/data materialization.
- Obtain independent dual-annotator input and measure agreement/calibration (not inferred from scores).
- Audit cross-text correction and miracle attributions *as perspective-scoped theological claims*, never universal truth outcomes.
- Verify production read-only directory ownership/deployment, same-corpus builds, performance and preservation of provenance.
- Ship static/browser data only after consistent reviewed projection materialization; no silent unlicensed text.
- **Do not promote to main** until separate release checks and editorial approvals pass.

## CI policy note

The repository changed CI on `dev` to **manual-only `workflow_dispatch`** as of commit `4ed1f23`. This PR must not re-enable automatic workflows. To check an implementation branch: open **Actions → CI → Run workflow**, select that branch, run, and verify both `check` and `web` succeed for the exact PR HEAD. A previous successful run from another commit is not evidence that this PR passes.

See also: [P19 execution backlog](../TODO.md) and [Epic #446](https://github.com/bjo163/moonwitness-corpus/issues/446).
