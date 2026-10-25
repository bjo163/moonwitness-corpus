# P19 SRGBL v8 — Implementation Status / Outstanding Release Gates

**As of 2026-10-25:** RFC and P19 foundations are merged via PRs #445, #447, and #448. This is not a claim that P19 is complete.
**Master issue:** [#446](https://github.com/bjo163/moonwitness-corpus/issues/446)
**Current local AI execution (2026-10-25):** [Final Master Grandplan](./MOONWITNESS-SRGBL-V8-GRANDPLAN.md) · [Product Narrative](./MOONWITNESS-P19-PRODUCT-NARRATIVE.md) · [Blueprint](./MOONWITNESS-SRGBL-V8-BLUEPRINT.md) · [38 real micro issues #452–#489](./MOONWITNESS-P19-MICROTASKS.md) · [No-branch handoff](./MOONWITNESS-LOCAL-AI-HANDOFF.md). Small-ticket issuance is COMPLETE; actual 28 larger P19 acceptance and P18 rights/annotator pilot remain OPEN.
**Scope:** Additive derived features on top of P17 evidence graph and P18 Key Witness; canonical v0.1 remains unchanged.

## Implemented technical primitives

| Scope | Implementation | What is genuinely available | What is missing |
|---|---|---|---|
| S1–L5 scoring | `packages/srgbl/src/index.ts` | /15 maturity, /40 quality, framed -2..2 key direction, legacy /100 candidate | empirical rubric calibration, human-reviewed source claims |
| Analysis contract | `packages/srgbl/src/analysis.ts` | typed observed/inferred/interpreted claims; evidence/reference/dependency validation, UNKNOWN, OFFSIDE frame diagnostics | ingestion resolver binding to full corpus evidence selectors |
| P18 Key layer | `packages/srgbl/src/keys.ts` | 20 controlled candidate tokens, assessed direction, context frame, message boundaries, nullable real agreement | ratified P18 registry, two-annotator pilot, actual per-passage reviewed annotations |
| S1 canonical bridge | `packages/srgbl/src/sources.ts` | read-only exact passage projection and metadata gaps; rights fail closed | edition-specific rights review and approved source selector mapping |
| Swing/correlation | `packages/srgbl/src/index.ts`, `research-ledger.ts` | seven unverified candidate transforms; chain capped at depth 3 with duplicate/exact-cycle guards; reviewed candidates require independent sources | persisted research ledger, real independent witness evidence, reviewer pilot and calibration |
| Deterministic output | `packages/srgbl/src/derived.ts` | stable canonical hashing and fail-closed reviewed projection | real reviewed datasets, deployment consumption and published audit manifest |
| CLI | `scripts/build-srgbl-reviewed.ts` | explicit JSON input → `dist/srgbl/*.json` output; `--check` mode | stable annotated input pipeline |
| Static/browser delivery | `packages/srgbl/src/static.ts`, `scripts/export-srgbl-static.ts`, SRGBL research page | corpus-pinned public-only projection export; deterministic `--check`; static UI fallback validates against the deployed corpus catalog | no approved reviewed input is available to publish; browser source metadata still needs the API |
| Fastify | `apps/api/src/routes/srgbl.ts` | research manifest and passage source-trace; explicit 404 for absent reviewed analysis | data-backed reviewed analysis endpoints |
| Research UI | `apps/web/src/app/research/srgbl/page.tsx` | five responsive accessible tabs with S1 source gaps; other stages UNKNOWN | real reviewed G3/B4/L5 projections, Swing/correction/reviewer panels |
| Test cases | `fixtures/srgbl/quran-research-cases.json` | five metadata-only source pointers and rights/review gates | licensed exact source excerpts and validated references |

**CLI example (only after reviewed inputs exist):**

```bash
pnpm exec tsx scripts/build-srgbl-reviewed.ts \
  --input /secure/reviewed-srgbl-input.json \
  --out dist/srgbl/reviewed.json
pnpm exec tsx scripts/build-srgbl-reviewed.ts \
  --input /secure/reviewed-srgbl-input.json \
  --out dist/srgbl/reviewed.json --check
pnpm srgbl:export-static --input dist/srgbl/reviewed.json
pnpm srgbl:export-static --input dist/srgbl/reviewed.json --check
```

The input file must explicitly include `corpusHash`, `methodVersion`, `runs`, `candidates`, and `miracleClaims` with proper review/rights provenance. Do **not** check private annotations or unlicensed source text into the public repo.

## Why 28 P19 TODO checkboxes remain open

A primitive function and a passing CI suite do not satisfy the complete P19 child task if it requires rights-cleared material, source-to-evidence reproducibility, live reviewed output, or real human assessment. Do not change any checkbox to [x] solely because a scaffold exists. Dependency tracking is in canonical `TODO.md`.

### Human/empirical decisions still required

- P18: ratify 3 pilot traditions, the 20 controlled keys, and reviewer/editorial authority.
- Select exact source editions and redistribution rights (including Arabic/scriptural excerpts and translation rights) for proposed QS 42:51, 5:48, 37:30, 20:5, 2:82 and any cross-tradition comparisons.
- Generate real double-annotated assessments, retain disagreements and `n`; compute agreement only from the actual annotation dataset.
- Establish source-independent evidence trails and reviewer attestations for `CORRECTS_WITHIN_FRAME` and attributed `miracle_claim` readings.
- Evaluate holdout, inter-rater agreement, false-positive Swing reversals, confidence calibration, reader comprehension and UI accessibility.
- Implement reviewed derived persistence/export, static/browser consumption, research review/editorial UI, checked rights gating and measured API performance.
- Pass a separate guarded, non-forced dev→main production promotion after all rights/release checks, not merely green unit tests.

## Security and epistemic boundaries

No automatic scripture ranking, miracle validation or new-revelation synthesis; no change to original canonical text; no default rights clearance; no interpretation masquerading as literal source text. The 0–15 / 0–40 / 0–100 and -2..+2 numbers never become the same measure. An absent derived analysis returns an explicit non-success response.

Read: [Master RFC](./SRGBL-V8-MASTER-RFC.md), [Key Witness](./KEY-WITNESS-V0.md), [Product Blueprint](./PRODUCT-BLUEPRINT.md), [TODO](../TODO.md).


## Next security and publication hardening (follow-up)

- Validate reviewed projection checksum and stage-by-stage source/evidence references against the corpus-pinned catalog before serving any review claim.
- Seal individual analysis inputs with stable SHA-256; do not interpret a checksum as a human signature or proof of source rights.
- Display reviewed S1–L5 claims only when the review projection is present and passes the integrity gate; otherwise UNKNOWN.
- On missing/stale index, return explicit 404/503 instead of fabricated results.
- See [Reviewed Publication Runbook](./SRGBL-V8-PUBLICATION-RUNBOOK.md). The repository has **manual-only GitHub Actions**; trigger CI on the exact candidate branch before merging this follow-up PR.

## P19 release decision record - 2026-10-25

This record answers one question only: may the reviewed SRGBL v8 reader be promoted to production? It is written by the executing agent, it cites only measured evidence, and it does **not** tick any parent `P19-0xx` item.

**Decision: BLOCKED. Not production-ready. The owner must not promote `main` on the basis of this record.**

| Gate | Status | Independent evidence | Why |
| --- | --- | --- | --- |
| Reviewed projection integrity | PASS (unit) | `packages/srgbl/src/publication.test.ts` 9 tests, incl. the 15-case adversarial matrix (#488, `64f5742`); #477, #478 | Closed structure, ordered stages, duplicate derived IDs, checksum-not-signature all fail closed |
| Static/browser export contract | PASS (unit) | `packages/srgbl/src/static.test.ts` 3 tests (#480, `47dc70e`) | Deterministic passage order, explicit unavailable state, no research-only score |
| API fail-closed surface | PASS (unit) | `apps/api/src/api.test.ts` 15 tests (#479, `8a30f2d`) | 200 only when pinned; 503 corrupt; 404 absent/empty/orphaned |
| Five-stage reader UI | PASS (source contract) | `apps/web/scripts/contract-test.mjs` + `tsc --noEmit` (#481-#485, `af466d4`..`50660df`) | UNKNOWN preserved, no synthetic paragraph, keyboard/roving tab stop, `dir="auto"`, motion-safe |
| Browser, screen-reader, mobile audit | UNKNOWN | none | No browser session, device or assistive-technology pass was executed for #481-#485 |
| Source edition rights | FAIL / OPEN | [source-edition matrix](./SRGBL-V8-SOURCE-EDITION-MATRIX.md); #476 | No pilot edition is cleared; only the Tanzil note (CC-BY-3.0, re-verified 2026-08-27) is cited, and translations remain unidentified |
| Human reviewer authorization | UNKNOWN | no reviewer attestation exists | Reviewer IDs in fixtures are synthetic; a checksum is not a signature |
| Two independent annotators | UNKNOWN | no paired human data | #486 validates intake; #487 computes kappa, but `satisfiesPilot:false` and `blocked-pilot-input` on every run |
| Inter-rater agreement | NOT ESTIMABLE | `packages/srgbl/src/agreement.test.ts` 4 tests (#487, `0a8ed3d`) | N=0 real pairs; the module returns `estimable:false` rather than a fabricated coefficient |
| Cross-tradition correction framing | PASS (contract) | `#484` lens panel + `CORRECTS_WITHIN_FRAME` `frameNote` requirement | A correction renders as interpretation inside its declared lens, never as neutral truth |
| Consumer release / promotion | FAIL | [consumer release contract](./CONSUMER_RELEASE_CONTRACT.md); no approval record | No editorial approval, no rights clearance, no pilot evidence |
| CI on the candidate SHA | PASS (recorded run) | run `40147222934` on `8a30f2d`: `check` and `web` succeeded | Earlier batch only; runs after 2026-10-25 commits are listed in the local AI handoff log |

### What this record does not claim

- Unit-test success is not empirical validation, editorial approval, rights clearance or production readiness.
- No human pilot exists: the annotation and agreement fixtures are synthetic and are labelled as such in code.
- No scripture ranking, miracle verdict, canon claim or reviewer name was produced by this wave.

### Conditions before any promotion

1. Select and record the exact edition, licence expression, evidence URL and re-verification date for every published source; flip `rightsAudit` off `pending-human-rights-confirmation` through a human decision, not a code change.
2. Run a real paired annotation pilot, retain disagreements and missingness, and report agreement with its own N and limits.
3. Obtain an independent reviewer attestation for each published analysis; a content checksum stays `authenticatedSignature: false`.
4. Execute a browser, keyboard, RTL and screen-reader pass against a built `apps/web` bundle and record the result.
5. Promote only through the guarded, non-forced `dev` to `main` path in [Branching](./BRANCHING.md), after the above.
