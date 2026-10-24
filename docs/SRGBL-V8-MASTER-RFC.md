# SRGBL v8 — MoonWitness Five-Layer Witness Intelligence (RFC)

**Status:** Working research RFC / proposed method, 2026-10-24. **Not approved canon, not empirical validation, not a scientific truth detector.**
**Owner:** MoonWitness Corpus / TEXT. **Target:** `dev`.
**Parent:** [Product Blueprint](./PRODUCT-BLUEPRINT.md), [Key Witness v0](./KEY-WITNESS-V0.md), [Intertextual Evidence Graph](./INTERTEXTUAL_EVIDENCE_GRAPH_TARGETS.md), [Proposed ADR-0008](./decisions/ADR-0008-srgbl-derived-research.md).
**Backlog:** P18 key witness (prerequisite), P19 SRGBL Witness Intelligence. [Concrete implementation and unresolved gates](./SRGBL-V8-IMPLEMENTATION-STATUS.md).

> TRACE THE TEXT. EXAMINE THE WITNESS. PRESERVE THE DIFFERENCE.

## 1. Scope and architecture decision

MoonWitness owns exact work/expression/edition/artifact/passage/content identity, licensing, evidence, provenance and attributed assessments. The canonical spec remains six families: entity, resource, assertion, evidence, provenance, assessment. **Do not mutate canonical text to insert SRGBL output.** Analysis runs, messages, SWING candidates, cross-text comparison projections and scores are versioned derived records, reproducible from a pinned corpus snapshot.

This RFC is an implementation proposal for `moonwitness-corpus`, **not** automatic redefinition of `bjo163/ALLAH-CRAYON-RGBL-ENGINE` v7. Four-level v7 labels do not silently transform into five-level v8 evidence. The repository's longstanding `RGBL` technical domain alias denotes TEXT ownership and remains distinct from this `SRGBL` methodology.

```text
EXACT SOURCE / EDITION / RIGHTS / EVIDENCE
   → ORIGINAL PASSAGE / TRANSLATION (different witnesses)
   → KEY WITNESS (fragment, concept, relation, recipient/frame, direction)
   → S1 Source & Sense
   → R2 Reality
   → G3 Governing Order
   → B4 Being
   → L5 Light
   → DERIVED MESSAGE + BOUNDARY NOTE
   → SWING candidate / cross-text evidence / corrections within a chosen lens
   → REVIEW / DISAGREEMENT / NEXT EVIDENCE
   → FOLLOW-UP SOURCE (no automatic truth promotion)
```

A passage can have many witnesses, keys, analyses, messages and conflicting interpretations. It is never forced into one numerical or doctrinal verdict.

## 2. Five levels

| Level | Meaning | Required yield | Disallowed inference |
|---|---|---|---|
| S1 Source & Sense | Source type, exact edition, evidence acquisition, observation method, original-language text, provenance and rights | Traceable acquisition and limitations | Claim that all senses are facts, or that an ultimate metaphysical Source is empirically measured |
| R2 Reality | What exact text explicitly states, plus textual context and variants | Textual observations with source spans, not automatic historical proof | Translation collapse or treating interpretation as verbatim scripture |
| G3 Governing Order | Supported syntax, relations, pattern or causal hypothesis | Explicit evidence links and alternatives | Similarity=identity or correlation=causation |
| B4 Being | Actor/speaker/recipient, agency, experiences, interpretive frame | Attributed and bounded understanding | Mind-reading, identity reduction, unconstrained universal promise |
| L5 Light | Responsible synthesis, options, limitations and next inquiry | Derived message with boundary, uncertainty, risks | Fatwa, universal theological verdict, or high certainty by level number alone |

Levels are cumulative. Each `supported` transition needs an explicit evidence obligation. Provisional later-level statements may be stored but do not count as reached. S1 is the foundation; L5 is the furthest synthesis, **not the highest guaranteed confidence**. `unknown`, `partial`, `pending` and `unsupported` are not equal to zero or false.

The notion Source → Quantum → Light is an **optional philosophical ontology research lens**, not a physical-science progression. In physics photons are quanta of light. L5 "Light" is a metaphor for responsible orientation; theological ultimate Source is not interchangeable with an evidence source.

## 3. Per-passage Witness card

Universal unit = passage/content, not necessarily a numbered Quranic ayat. Always preserve the specific language/edition, rights, source location and text selectors; only render source text when licensed.

A card contains:
- **Textual witnesses:** exact reading (script and language), translations separately attributed, edition, artifact, rights.
- **Key assessments:** 0..N scheme-controlled keys; each `method`, `assessor`, `evidence`, and `extensions.key` with `relation`, `frame`, `direction`, `intensity`, `confidence`, `review_status`.
- **SRGBL trace:** 0..N analysis runs, claim-kind `observed | inferred | interpreted`, evidence dependencies and per-level UNKNOWNs.
- **Messages:** derived key message, context note, boundary note; citations and review state. Not sacred original text.
- **Correlations:** typed passage-to-passage relations, evidence for/against, method/tradition perspective and disagreement.
- **Evaluation:** analysis maturity, quality, key-frame direction and candidate witness support **as separate scales**.

Illustrative keys `faith`, `good_deeds`, `paradise_promise` from older examples are **not** automatically members of the P18 20-key controlled registry. Require approved registry mapping or a separately versioned experimental scheme before claiming `reviewed`.

## 4. Separate scoring targets

| Target object | Metric | Max | What it means |
|---|---|---|---|
| analysis run | `maturity` | 15 | Verified contiguous `supported` level prefix |
| analysis run | `quality` | 40 | Ten bounded 0–4 methodological dimensions |
| one candidate relation | `legacy-witness-score-v1` | 100 | Historical source/observation/semantic/cross-reference/non-overlap rubric |
| framed key bundle | `direction` | -2..2 | Method-relative message direction (not universal sentiment) |
| reading card | `context_coverage` | 9 fields | Whether required reading context is present |
| search hit | `search_relevance` | engine dependent | Query relevance, not moral quality of text |

**Maturity**: if contiguous supported prefix count `m` ∈ [0..5], `m(m+1)/2`; scores 0,1,3,6,10,15. Later `supported` without earlier support earns nothing. `L5=15` indicates stage coverage, not truth.

**Quality**: `sGrounding`, `rAccuracy`, `gSupport`, `bDiscipline`, `lResponsibility`, `provenance`, `unknownHonesty`, `alternativeCoverage`, `confidenceCalibration`, `actionUsefulness`; 0..4 integer each. Maximum 40; cannot compare directly with older v7 36-point benchmark.

**Direction v8**: `Σ(w*c*i*d) / Σ(w*c*i)`, where direction `d∈{-2,-1,0,1,2}`, intensity `i∈{1,2,3}`, confidence `c∈[0,1]`, weight `w≥0`. Denominator zero → `UNKNOWN`; frame and method/profile mandatory. Scores must not rank ayat or religions. v0 Key Witness formula remains versioned and is not silently overwritten.

**Historical Witness 100**: source fidelity 25, observability 25, semantic consistency 20, cross-reference 15, non-overlapping 15. Its original `50=Middle Point` and `>=70=Accepted` are preserved as historical descriptions, **not** algorithmic truth or canonical authority. v8 may use ≥70 as **eligible for review** only. UNKNOWN is categorical, not automatically value 50; support, conflict and ambiguity are separate axes.

Review must include rubric version, frame, N, coverage, annotator count, agreement where actually measured, and source/corpus hash. Omit a score rather than fabricate absent inputs.

## 5. Swing Swing Key

Historical idea: *Swing the Key. Discover the Treasures of the Quran.*
**ROTATE THE RELATIONSHIP, NOT THE TRUTH.**
Seven operators: direction, polarity, subject/object, cause/effect, perspective, temporal, semantic opposition. Default max depth 3. Transformations produce **question/candidate only**; inverse relationships are not assumed true; score never inherits; detect duplicate/cycles; source evidence must be gathered independently before promotion. Repeated websites citing one upstream edition are one origin, not N independent evidence sources.

A candidate has `transform_operator`, original edges, attempted direction, depth, signature, `evidenceStatus`, contrary sources, method, review state and fresh candidate score. **Unlock Treasure** = approved and traceable discovery in the derived research ledger, never automatic discovery of hidden scripture secrets, new revelation, or miraculous intervention.

## 6. Cross-scripture comparison and Positive Correction

Default `comparative-neutral` reports textual parallels, clarification hypotheses and doctrinal contrasts without ranking revelation, religious communities or scripture. `islamic-quran-anchored` is an **explicit user/research method** anchored in Islamic exegesis (e.g. interpretation of Qur'an 5:48); it may produce `CORRECTS_WITHIN_FRAME` *only when both passage sources, framework and relevant commentary are declared*. Do not auto-convert one tradition's claim into universal historical fact. Other source/tradition-specific lenses may coexist.

Typed relations: `AFFIRMS`, `PARALLELS`, `CLARIFIES`, `QUALIFIES`, `CONTRASTS`, `CORRECTS_WITHIN_FRAME`, `UNRESOLVED`, `NOT_RELATED`. Separate exact text similarity, shared motif, literary dependence, historicity and theological implication. Relation review requires contrary-evidence visibility and source rights. Miracle is a **source-attributed theological `miracle_claim`**, never an automated bonus score or statement of empirically confirmed supernatural event.

Do not replace Hebrew/Greek originals with ALLAH in the source lane. Standardized terms may be offered as explicitly attributed optional Islamic semantic glosses. Original text and faithful edition-specific translations remain distinct.

## 7. OFFSIDE / COME BACK ONSIDE

An editorial metaphor becomes a reusable non-theological frame diagnostic:
`OFFSIDE` = suspected misplaced speaker, recipient, scope, genre, actor, epoch or evidence.
`ONSIDE` = proposed source-backed corrected frame with audit trail. Not a moral status or guarantee of divine approval.
Research fixture: QS 37:30 read in neighboring passage context, with QS 20:5 as separate *editorial/theological* reference. Football referee, Master Gula, or coach figures **are creative metaphors**, not literal verse contents. Never soften away a sourced warning.

## 8. Research/UI/API boundary

Public MoonWitness: exact text, rights, passage context, citation export, key spectrum, source-framed messages, boundary notes, reviewer disagreement; **no global public score/ranking**.
Research mode: level trace, candidate graph, scores, debug gates, alternative interpretations, calibration and explicit UNKNOWN. Synthetic samples not shown as reviewed.
Web is Next.js 16 static export with independent npm lockfile; Fastify REST and Browser SQLite/catalog are existing data planes. Do not add dynamic Next API routes or eager scans; derived artifacts are produced at build or served read-only by Fastify once materialized. Always include dataset revision, `corpusHash`, scheme and evaluator version.

## 9. Pilot and evidence

Suggested source-cleared fixture themes: QS 42:51 (communication structure), 5:48 (Quran-anchored lens), 37:30 with surrounding context (actor framing), 20:5 (theological reference), 2:82 (faith/deeds/promise). These are **study cases**, not pre-validated readings. Cross-tradition comparison demands two exact rights-cleared witnesses with interpretation methods visible.

P18 pilot (three traditions ×100 passages×2 annotators) requires prior ratification of pilot traditions, controlled key scheme and reviewer authority. P19 methodological validity remains an open empirical gate: agreement, blinded studies, adversarial cases, holdouts, calibration eligibility and external replication are distinct from successful CI.

## 10. Implementation and acceptance

Pure TypeScript initial package: `packages/srgbl/src/index.ts`; root `pnpm test` discovers `packages/*/src/**/*.test.ts`. Functions are deterministic and have no I/O or canonical store side effects. Future stages: evidence adapters → analysis runs → versioned derived index → independent candidate review → read-only API → reader/research UI → real study.

Blocked conditions: missing source/rights (no quotation), untraceable inference, frame-free correction, unreviewed miracle claim, fabricated revelation, unlicensed derived texts, unsupported later level marked achieved, automatic candidate canonicalization, score used as scripture/tradition ranking.

## 11. Version and governance

**SRGBL v8** is a **proposal and experimental implementation**, not `8.0.0` released. Core corpus spec remains `v0.1`; v7 RGBL Engine unchanged. Keep parent `docs/PRODUCT-BLUEPRINT.md` and `docs/KEY-WITNESS-V0.md` intact with forward links. P19 issues are owned by `TODO.md` ↔ automated issue sync; never manually duplicate child issues. Update documented method IDs only through reviewed additive changes. Release promotion requires CI, provenance/rights checks, review and benchmark evidence. Protected `dev` must use PR if direct writes are forbidden.
