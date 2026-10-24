# ADR-0008 — SRGBL v8 is a derived, frame-scoped research method

- **Date:** 2026-10-24
- **Status:** Proposed for review; experimental implementation on P19
- **Depends on:** ADR-0002 disposable indexes, ADR-0003 assertions not global facts, ADR-0004 engine policy outside corpus; P17 graph and P18 Key Witness
- **Main RFC:** [SRGBL v8](../SRGBL-V8-MASTER-RFC.md)

## Decision

Keep the six canonical corpus record types and `mw:*` identity contracts unchanged. SRGBL v8 analysis traces (`S1→R2→G3→B4→L5`), key/message projections, witness candidate scoring, Swing rotations and Positive Correction relationships are **versioned derived methods**, not intrinsic scripture properties. Every result declares its method, frame, source and rights provenance, inputs/corpusHash once derived integration exists, reviewer state and uncertainty.

Separate **Maturity /15**, **Quality /40**, **candidate Witness /100** and **Key Direction −2..2**. Do not aggregate them into a faith, verse or religion score. A high number never approves canonical text, miracle truth or editorial publication.

`CORRECTS_WITHIN_FRAME` may be used in an explicitly attributed perspective such as `islamic-quran-anchored` but never as a globally binding neutral assessment. Other traditions' interpretations and disagreements must remain visible. Swing generation is an unverified candidate procedure, with a maximum chain depth of three and no score inheritance.

## Alternatives rejected

1. **New canonical `srgbl` record_type or special `polarity` field on passage:** violates core evidence neutrality and P18 contract.
2. **Copy/replace existing four-level RGBL Engine v7 into this repo:** breaks independent versioning and may conflate method with TEXT corpus alias.
3. **Single composite universal score and `UNKNOWN=50`:** collapses incomparable constructs and uncertainty into false precision.
4. **Direct Next.js runtime inference API:** web is static export; use later derived build/Browser SQLite or reviewed readonly Fastify endpoint.
5. **Algorithmic scripture correction or miracle detection:** misrepresents theological perspective as empirical proof and encourages unsafe ranking.

## Consequences and verification

- New pure package `packages/srgbl` can be tested without adding data or external service dependencies.
- P19 implements source adapters, audit ledger, reviewer workflow, export/API/UI and empirical studies **incrementally**; no synthetic test counts as real annotation.
- Explicit rights, provenance and no-ranking checks are release blockers.
- P18 registry/reviewer/pilot decisions remain separate required approvals.
- Protect `dev` and promote via passing PR checks. Do not update `main` in this research change.

**Status is provisional until repository reviewers ratify this ADR; commit history does not equal governance approval.**
