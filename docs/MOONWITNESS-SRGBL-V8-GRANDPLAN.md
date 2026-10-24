# MOONWITNESS CORPUS — MASTER GRANDPLAN
## SRGBL v8 × Key Witness × Swing Swing Key × Unlock Treasure × Positive Correction

**Document version:** 1.0 — consolidated execution grandplan, 2026-10-25  
**Status:** Canonical *planning index* for P18/P19; method/ADR approval and empirical validation remain pending. Not a declaration that product/research is finished.  
**Repository:** bjo163/moonwitness-corpus · development branch: dev · release branch: main.  
**Master tracking:** [P19 Epic #446](https://github.com/bjo163/moonwitness-corpus/issues/446) and [TODO.md P18/P19](../TODO.md).  
**Product foundation:** [Product Story](./PRODUCT-STORY.md), [Product Blueprint v1](./PRODUCT-BLUEPRINT.md), [Key Witness v0](./KEY-WITNESS-V0.md).  
**Technical authority:** [SRGBL v8 Master RFC](./SRGBL-V8-MASTER-RFC.md), [Concept Crosswalk](./SRGBL-V8-CONCEPT-CROSSWALK.md), [ADR-0008 (proposed)](./decisions/ADR-0008-srgbl-derived-research.md), [Publication Runbook](./SRGBL-V8-PUBLICATION-RUNBOOK.md), [Implementation Status](./SRGBL-V8-IMPLEMENTATION-STATUS.md).

> **SOURCE BEFORE CLAIM · WITNESS BEFORE MESSAGE · CONTEXT BEFORE CORRECTION · REVIEW BEFORE PUBLICATION.**

### How to use this document

This is the **single navigation and execution plan** for the user-requested corpus witness intelligence programme. It **does not replace** the original v1 Product Blueprint, P18 Key Witness spec, P19 methodology RFC, canonical corpus schema, or TODO identity markers. Their detailed requirements stay authoritative within their respective domains. In a conflict: preserve canonical text, rights, sourced evidence and reviewer decisions first; open an ADR/RFC review for semantic changes instead of silently redefining a term. The linked TODO is the canonical, issue-sync-compatible record of task IDs and completion state. GitHub commit evidence is not empirical or doctrinal verification.

---

## 1. North star and outcomes

MoonWitness Corpus is a **provenance-first observatory for world scripture, revelation and wider historical/traditional texts**. It makes source, original reading, translation, interpreted meaning, semantic key, derived witness/message, alternative interpretation and cross-text relationships inspectable.

The proposed distinctive experience is a **Five-Layer Passage Witness**. One Qur'anic ayat or one other tradition's passage can have many source editions, key assessments, interpretive lenses, messages, correlations and review states. The app must NOT imply one verse has one absolute direction, score, key, hidden secret, or approved miracle.

Desired public outcome: a reader can quote a specific passage with its edition and context, see evidence-backed candidate keys and attributed commentary, inspect disagreements, and follow a reviewed derived message without confusing that message with an original revelation.

Desired research outcome: a verifier can reproduce the source-to-message chain, compare framed hypotheses, run bounded Swing candidate generation and explicitly see UNKNOWN and contrary evidence. A scholarly/theological reviewer—not a score—determines whether a reading may be published with proper attribution.

Not in scope: issuing new revelation, changing source text, algorithmically proving supernatural events, universal religious ranking, automatically judging believers, or converting a theological opinion into a neutral historical fact.

---

## 2. Repository ownership and context

- **Canonical TEXT:** Existing six record families—entity, resource, assertion, evidence, provenance, assessment—and immutable content identity, edition, artifact, rights, locator and source selectors. Keep mw:* IDs and original/translated source lanes unmodified.
- **P17 evidence graph:** Existing intertextual linking, provenance and query foundations; SRGBL may consume evidence references but must not rewrite them.
- **P18 Key Witness:** Controlled concepts, key relations, frame, direction, message, context coverage, annotator disagreement, source-linked assessments, pilot methodology and editorial authority. P18 v0 remains a separately versioned contract.
- **P19 SRGBL:** Derived experimental analysis runs, evidence obligations, five-level transitions, supporting quality diagnostics and reproducible scored results. No new canonical record_type.
- **Research candidate engines:** Swing operators, independent candidate support and reviewed cross-text relation ledger.
- **Delivery:** Fastify read-only research routes; deterministic projection exporter; Next.js static export and browser catalog integration. A static Next.js deployment has no dynamic Next.js API routes.
- **Naming:** Historic RGBL here is a technical TEXT domain alias. Four-level RGBL v7 in the independent CRAYON engine is NOT silently upgraded; five-stage methodology in this repository is explicitly named **SRGBL v8**. An unrelated historic L5 role/ontology level is not SRGBL L5.

~~~text
CANONICAL TEXT + RIGHTS + EXACT EDITION + PROVENANCE
     │
     ├── WORK / EXPRESSION / EDITION / ARTIFACT
     └── PASSAGE / CONTENT / TEXTUAL WITNESS
                         │
                         ▼
                P18 KEY WITNESS
   fragments · controlled keys · relation · reader frame
   recipient · direction · intensity · confidence · evidence
                         │
                         ▼
           P19 SRGBL ANALYSIS (DERIVED)
    S1 Source & Sense → R2 Reality → G3 Governing Order
             → B4 Being → L5 Light
       supported · partial · pending · unknown · unsupported
                         │
             ┌───────────┴────────────┐
             ▼                        ▼
      DERIVED MESSAGE         SWING CANDIDATES
   interpretation boundary    7 rotations · max depth 3
             │                        │
             └───────────┬────────────┘
                         ▼
           CROSS-TEXT RELATION + EVIDENCE
   neutral comparative OR explicitly Quran-anchored frame
      affirmation · qualification · contrast · correction
                         │
                         ▼
        REVIEW + DISAGREEMENT + SOURCE CHECKS
                         │
                         ▼
        REVIEWED, VERSIONED DERIVED PROJECTION
      Fastify API / static-browser corpus viewer / citation
~~~

---

## 3. The Five-Layer Passage Witness card

Five UI columns are **five different research questions**, not five parallel translations or five mandatory tafsir outputs.

| Stage | Purpose | Example output | Non-negotiable boundary |
|---|---|---|---|
| **S1 — Source & Sense** | Where did this exact reading, observation and edition come from? | Source/edition/artifact/language/rights/provenance/acquisition method | Ultimate theological Source is not an empirical checksum. No guessed rights clearance. |
| **R2 — Reality** | What does this exact passage actually state, and where? | Quoted/source-located textual observations, variants and translation labeling | Textual claim ≠ proven historical/scientific event; translation ≠ original text. |
| **G3 — Governing Order** | Which patterns, relationships, rules or conditional links are supportable? | Syntax, literary/context structure, provisional intertextual edge, alternative explanations | Similarity ≠ identity; parallel ≠ causal dependency. |
| **B4 — Being** | Who is speaking, addressed, acting or experiencing this, according to which frame? | Actor/addressee/genre/temporal context, attributed understanding and effect | No invented speaker identity, mind-reading or universalization beyond scope. |
| **L5 — Light** | What bounded, responsible message or next interpretation is defensible? | Message with evidence, competing readings, limitations and boundary note | L5 does not certify wisdom, divine authority, miracle, safety or religious truth. |

S1 can be supported with metadata-only records where the relevant rights and acquisition fields are properly evidenced. If source metadata is incomplete, mark gaps. R2 must not be marked supported using only interpretation. G3/B4/L5 may be stored as **provisional candidate** when an earlier stage is not verified, but must never receive cumulative maturity credit for unsupported prerequisites.

**Universal unit:** passage/content with source-native locators, not an imposed Quran-style ayat number for sutras, slokas, Psalms, philosophical fragments or oral/tradition collections. The same passage supports multiple editions/translations, textual witnesses, contexts and research analysis runs.

### 3.1 Passage card composition

1. Exact source and rights pane with separate original, variant and translation lanes (do not paraphrase into original text).
2. Named textual source, locator, edition, hash/provenance and selected evidence.
3. Key candidates and validated P18 key assessments with reviewer/annotator ID and selected interpretive frame.
4. S1–L5 trace with independent per-claim evidence obligations and pending/UNKNOWN detail.
5. Derived witness/message, interpretation boundary and disagreement notes (not literal scripture).
6. Correlation matrix, candidate Swing chain and method-framed Positive Correction claims.
7. Research-only scores and confidence diagnostics, no global public rankings.
8. Citation/export and a link back to the source/edition and reproducible analysis.

### 3.2 One verse, many keys, many messages

Model cardinalities as 1 passage → many textual witnesses, key annotations, framed assessments, SRGBL analysis runs, derived messages, optional reviewed relation edges. An unratified label like **faith / good_deeds / paradise_promise** is an exploratory concept—not automatically an approved member of the P18 20-key vocabulary. Only a formally versioned registry/mapping can make it approved.

---

## 4. Key / Witness / Message: strict distinctions

| Term | Stable meaning | Owner |
|---|---|---|
| Original text | Exact script/reading at a named source edition, with rights | Canonical source |
| Translation / arti | Translation credited to translator/edition, different from original | Source/edition |
| Tafsir / commentary | Named exegetical interpretation or traditional commentary | Attributed source/commentator |
| Textual witness | Artifact/source evidence supporting what was read | Corpus evidence |
| Semantic key | Method- and scheme-scoped concept anchored to a passage fragment | P18 |
| Key assessment | Key + relation + direction + intensity + confidence + frame, evidence, assessor and review | P18 derived assessment |
| Derived message | Synthesis of evidenced assessments with context/boundary note | P18/P19 analysis |
| Correction relation | Claim that one source clarifies/qualifies/corrects another, within a named interpretive frame | P19 cross-text |
| Miracle claim | Attributed theological witness about a sign/miracle, with supporting references | P19 source-attributed research |
| Unlock Treasure | A source-traceable reviewed *discovery of a relation*, not automatic occult truth | P19 research ledger |

The same text may yield different directions according to who is being addressed. Negative warning for a specific actor can coexist with beneficial guidance for other readers; neither direction is the moral worth of the ayat.

---

## 5. Scoring contract: no single truth score

| Metric and object scored | Range | Formula / interpretation |
|---|---:|---|
| Analysis-run **maturity** | 0–15 | Verified supported contiguous prefix count m of S1..L5 gives m(m+1)/2: 0,1,3,6,10,15 |
| Analysis-run **quality** | 0–40 | Ten 0–4 dimensions: source grounding, textual accuracy, relation support, interpretive discipline, responsible direction, provenance, UNKNOWN honesty, alternatives, confidence calibration, action usefulness |
| Candidate-relation **Witness support** | 0–100 | Historical weights: source fidelity 25, observability 25, semantic consistency 20, cross-reference 15, non-overlap 15 |
| Framed-key-bundle **Direction** | −2 .. +2 | Σ(weight × confidence × intensity × direction) / Σ(weight × confidence × intensity); denominator zero = UNKNOWN |
| Context **coverage** | P18 field count | Completeness of required contextual fields; not truth |
| Human agreement | empirical coefficient | Only calculate from actual independent annotations; never infer agreement from self-reported confidence |

The historical WITNESS model had **Middle Point 50** and **Accepted ≥70**. Those are retained as historical methodological conventions, *not* automatic publication truth thresholds. The current proposal interprets ≥70 as **eligible for further review**; UNKNOWN stays an epistemic state, not 50. Every candidate Swing must earn a new independent Witness score.

Scores carry method version, object ID, frame, evidence citations, measured sample size N, annotator/reviewer information and missingness. They are **never** properties of the ayat, a religion, a sacred text, or the existence of a miracle. Do not aggregate the four measurement scales.

---

## 6. Swing Swing Key and Unlock Treasure

Legacy slogan: **SWING THE KEY. DISCOVER THE TREASURES OF THE QURAN.**

**ROTATE THE RELATIONSHIP, NOT THE TRUTH.**

Seven research operators:

1. Direction reversal as a question, not a proven inverse.
2. Polarity reversal as a candidate counterclaim.
3. Subject/object role shift, subject to grammar and genre checks.
4. Cause/effect reexamination, never automatic reversal of causality.
5. Perspective / recipient rotation.
6. Temporal viewpoint rotation.
7. Semantic opposition candidate.

A Swing chain has maximum **three** hops, duplicate/cycle detection, original edge references and evidence per candidate. Every transformed edge starts **unverified** and has **no inherited score**. Independent editions/locations do not count as multiple independent origins when they share the same unverified upstream source. Counterevidence must remain available.

Unlock Treasure is the **reviewed discovery ledger**: new relationships with method, sources, rights, alternatives, review decision and reproducibility, not a hidden-code / supernatural truth detector or newly generated revelation.

---

## 7. Quran-anchored Positive Correction, comparative reading and miracle claim

Default method: **comparative-neutral**. It reports AFFIRMS / PARALLELS / CLARIFIES / QUALIFIES / CONTRASTS / UNRESOLVED / NOT_RELATED based on named witnesses, including opposing explanations.

Optional explicitly selected method: **islamic-quran-anchored**. In a declared Islamic hermeneutical frame, Al-Qur'an (notably QS 5:48 in the Islamic exegetical tradition) may be treated as a theological standard for confirmation, clarification, qualification or **CORRECTS_WITHIN_FRAME** against an attributed reading of another scripture. The frame, Qur'anic edition and passage, other source, exegetical reference and limits must be presented. The app does not declare any tradition or person globally invalid.

Other traditions' text and commentary remain independently attributed. Terms in Hebrew/Greek/Pali/Sanskrit etc. remain in original source lanes; Islamic semantic standardization may appear only as a **labeled interpretive gloss**, never as silent replacement of the original or translator's wording.

A **Positive Miracle** is an attributed theological claim with claimant/tradition/method/verses/review; it must not become an automatic extra point, literal empirical assertion or machine-certified supernatural result.

Cross-text relationships always require two real locators/editions, provenance and rights, relation type, methodological frame, sources for and against, uncertainty and review status.

---

## 8. OFFSIDE → ONSIDE / ASSAFAAT-30

Use **OFFSIDE** as an internal/editorial **candidate context error**: suspected mismatch in speaker, actor, addressee, role, scope, genre, era, chronology or source evidence. **ONSIDE** is a proposed correction of that frame backed by explicit contextual evidence; it is not a moral verdict or guarantee of divine favor.

First research case: Quran QS As-Saffat 37:30 **with neighboring verses** for actor/addressee identification, and QS Taha 20:5 as a separate source-labeled theological/editorial reference. The historical *Master Gula/referee/coach* narration is a **creative metaphor**, not literal text in either verse. Preserve difficult warnings rather than artificially recoding their sentiments as positive.

---

## 9. Concrete research cases and rights-gated pilot

Five initial metadata-only, **NOT reviewed findings**:

| Case pointer | Research question | Required check |
|---|---|---|
| QS 42:51 | Named communication types; limit illegitimate new inference | Source text/edition and explicit category boundary |
| QS 5:48 | Quran-anchored confirmation/guardianship vs comparative-neutral interpretation | Frame and exegesis attribution |
| QS 37:30 (+ neighbors) | Role/speaker/recipient and OFFSIDE diagnostic | Neighboring context and genre |
| QS 20:5 | Separate theological/editorial reference | No metaphor as literal verse |
| QS 2:82 | Multiple keys, promise, audience scope and bounded message | Ratified key mapping and reviewer |

These pointers are tracked in [quran-research-cases.json](../fixtures/srgbl/quran-research-cases.json); they are not editorially ratified interpretations. Actual primary text may be quoted only with exact edition, source selector and rights clearance. Pilot traditions, annotator count and reviewer authority must be decided by P18 before a scholarly claim of agreement. The proposed pilot from Product Blueprint is **3 traditions × 100 passages × 2 independent annotators**, requiring consent/rights and adjudication. Do not invent missing annotations, agreement or license.

---

## 10. Data and API blueprint

Versioned research objects (all **derived**, no core schema mutations):

- **TextualSourceWitness**: passage/content/source/edition/artifact/provenance/language/representation/rights.
- **FramedKeyAssessment**: scheme version, passage, source fragment, relation, frame, direction, intensity, confidence, evidence, assessor, reviewer, state.
- **AnalysisRun**: method/version, corpusHash, inputHash, source witnesses, level claims, evidence obligations, uncertainty, review.
- **LevelClaim**: S1..L5, observed/inferred/interpreted, claim text, source selectors, dependencies, evidence, boundary.
- **KeyMessage**: referenced key assessments, evidence, context/boundary notes and reviewer.
- **SwingCandidate**: operator, original relation, depth, cycle signature, independent evidence and candidate-only state.
- **CrossTextRelation**: two passages/editions, relation type, explicit perspective, positive/counter evidence, review.
- **MiracleAttribution**: claimant, tradition, method, supporting sources, no automatic empirical certification.
- **ReviewedDerivedPublication**: schema, corpusHash, methodVersion, input/projection checksums, reviewed-only summary and separate research records.

File ownership (implementation started, not complete):

~~~text
packages/srgbl/src/              pure analysis, keys, sources, swing, review, scoring
scripts/build-srgbl-reviewed.ts  deterministic reviewed snapshot compiler
scripts/export-srgbl-static.ts   public/static projection
apps/api/src/routes/srgbl.ts     Fastify read-only source/analysis routes
apps/web/src/app/research/srgbl/ static Next.js research reader
fixtures/srgbl/                  no unlicensed source text or invented results
docs/                            RFC, grandplan, product blueprint, runbook, decisions
TODO.md                          stable P18/P19 task markers
~~~

API is **read-only** for published/reviewed projections. Missing review → 404 or UNKNOWN; stale/malformed/untrusted snapshot → 503. Never emit unlicensed source text or a public verse ranking. Browser/static projections are pinned to the same corpus catalog hash; mismatched versions fail closed. Retain preview-only views for unreviewed candidates and clearly label them as such.

---

## 11. Workstreams, dependencies, milestones and deliverables

**Milestone M0: Canonical and methodology governance** (P19-001..004; depends on P17/P18 editorial decisions). Source crosswalk, versioned ADR/RFC, registry/frames, naming and actor/recipient diagnostic contract. Exit: no overlapping definitions of key, witness, message, L5 or SOURCE.

**M1: Source and five-stage evidence engine** (P19-005..010). Edition/provenance/rights adapter; R2 exact-text validator; G3/B4/L5 evidence-gated claims; triangular maturity 15 and quality 40; framed direction with N, coverage, honest missing agreement. Exit: representative synthetic/adversarial tests, real metadata bridge, no unsupported stage promotion.

**M2: Swing and candidate research** (P19-011..013). Seven bounded operators and three-hop chains, no inherited score, witness 100, independent supporting/counter-origin ledger, reviewer workflow. Exit: duplicates/cycles and false inverses cannot become reviewed truth.

**M3: Cross-text and Positive Correction** (P19-014..019). Typed relations, comparative-neutral / Islamic Quran-anchored method selection, attributed miracle claims, Unlock Treasure ledger, rights-safe OFFSIDE case and first five source-cleared pilot pointers. Exit: reviewed exact-edition comparisons or clearly recorded block, no global ranking.

**M4: Deterministic delivery** (P19-020..024). Versioned derived build, input/projection checksum, Fastify API, static/browser projection, RTL accessible Five-Layer viewer, Swing/disagreement panels, citation and reproducibility. Exit: real reviewed material can be traced to source/edition/corpusHash without leaking source rights; UI handles all UNKNOWN/error states.

**M5: Independent validation and research release gates** (P19-025..028). Dual-annotator pilot, alpha/agreement measurements, holdouts, calibration eligibility, adverse/counterexamples, benchmark limitations, source rights, performance, CI, documentation and separate dev→main release review. Exit: documented empirical evidence and explicit production approval; otherwise keep experimental.

**Prioritize independent engineering without waiting for human study to finish**, but never bypass review requirements for public publication. A primitive implementation does not complete an entire P19 task if its DoD calls for reviewed real sources.

### P19 ID → ownership crosswalk

| Range | Primary deliverable | Current status principle |
|---|---|---|
| P19-001..004 | Crosswalk/RFC/ADR and framed contracts | Documents/code drafted; editorial approvals still pending |
| P19-005..010 | Evidence, five-level validation and scoring | Foundations exist; real source selectors/pilot ratings not validated |
| P19-011..013 | Swing, Witness 100 and reviewer ledger | Operators/chain tests implemented; full persisted, independently reviewed ledger pending |
| P19-014..019 | Cross-text, Quran correction, miracle attribution, OFFSIDE and rights-cleared cases | Types/fixtures exist; reviewed actual cross-text research pending |
| P19-020..024 | Deterministic publication, API, static/browser and full UI | Build/API/research preview exist; full reviewed data and UI workflow pending |
| P19-025..028 | Human annotation, agreement, robustness, release | Open; cannot be replaced by successful unit/CI tests |

The specific 28 task descriptions and dependencies are **only** controlled at [TODO.md](../TODO.md); this summary deliberately does not duplicate checkboxes or reassign stable identifiers. P18 twenty-task prerequisites are also in that file.

---

## 12. Progress baseline at 2026-10-25

The following GitHub PRs have been **merged into dev**:

| PR | Verified work merged | Merge result |
|---|---|---|
| [#445](https://github.com/bjo163/moonwitness-corpus/pull/445) | SRGBL RFC, crosswalk, ADR, initial pure scoring engine and 28 P19 TODOs | merged |
| [#447](https://github.com/bjo163/moonwitness-corpus/pull/447) | Derived run/key/source contracts, research ledger, Fastify source trace and five-stage preview | merged |
| [#448](https://github.com/bjo163/moonwitness-corpus/pull/448) | Reviewed publication integrity, source pinning, public stage trace and related tests | merged |
| [#449](https://github.com/bjo163/moonwitness-corpus/pull/449) | Corpus-pinned static research export/browser integration | merged |
| [#450](https://github.com/bjo163/moonwitness-corpus/pull/450) | Bounded Swing chain proposals | merged |

**Observed dev HEAD while this planning document was prepared:** 93d2e8ed5077c97f336ca2970fa36075e0e84e7f. Verify live HEAD before continuing: it may change.

**Critical distinction:** latest P19 TODO has **28 unchecked tasks**, because final acceptance includes reviewer, source rights, human pilot and production validation. The runtime pieces above have been committed, but this does not mean a reviewed Qur'anic interpretation/miracle was actually published.

**CI note:** GitHub Actions CI was changed on dev to **manual-only workflow_dispatch** on 2026-10-24. Old green check runs cannot certify #448–#450 or later commits. Run and record the manual CI on the exact candidate HEAD before a subsequent merge/release. This plan does not override the repository's workflow trigger policy. Production **main** is intentionally not updated.

---

## 13. Quality gates and risk register

**G1 Source integrity:** passage and source selectors exist, editions verified, original ≠ translation, rights not inferred, provenance bounded. On failure, metadata-only/UNKNOWN.

**G2 Claim validity:** evidence IDs resolve and support each claim; dependencies form a DAG, every attained stage has its supported prerequisites; absent evidence cannot be scored as support.

**G3 Method and frame:** actor, audience, domain, chronology, genre, interpretation perspective and dissent visible; conflicting theological interpretations are attributed rather than flattened.

**G4 Candidate rigor:** no score inheritance, bounded search, anti-duplicate/cycle, independent source origins, contrary evidence and stable candidate identifiers.

**G5 Publication trust:** reviewer authority and real decision records, exact corpusHash, input/projection checksum, deterministic rebuild, minimal public projection. SHA-256 is **not** a human signature.

**G6 User experience:** accessible mobile/RTL, no preview displayed as reviewed, clear UNKNOWN, reproducible citations; no global per-verse or tradition score leaderboards.

**G7 Empirical:** N, two independent annotations, real inter-rater agreement, adversarial tests, bias/error analysis, holdout, calibration limited to observable outcomes; no miracle-truth claim from rubric points.

**G8 Release:** manual CI on exact SHA, security/performance/rights gates, ADR and editorial review as required, PR to dev, then a separate reviewed promotion to main.

High risks: unlicensed editions, misattributed translated text, theological framing hidden as neutral, false positive Swing, unreviewed claims bypassing stage gate, stale corpus projection, composite-score gaming, reviewer identity spoofing, and confusion between four-level RGBL v7 and SRGBL v8. Each requires an explicit fail-closed contract, test or human decision.

---

## 14. Acceptance criteria / Definition of Done

The **engineering foundation** may be called delivered only when code, test evidence, CI commit SHA, derived pipeline and documented public API/UI behavior match the implemented subset.

The **P19 research pilot** may be called completed only with rights-cleared text excerpts, an exact independent annotation dataset, measured agreement/disagreement and an auditable reviewer decision process.

The **product research release** may be promoted to main only when all linked P18/P19 release gates are met, CI on the actual candidate passes, source rights and published projection are independently verified and the production promotion is separately approved.

**Not an acceptable DoD substitute:** closing 28 boxes to make a dashboard look finished; putting one synthetic Qur'anic message in a reviewed column; treating 100-point Witness score as miracle truth; claiming old CI proves a new commit; changing main or a protected workflow without a policy decision.

---

## 15. Immediate execution queue (next PRs)

1. **Governance first:** review and ratify P18 pilot traditions, 20-key registry and reviewer authority; source edition/rights matrix. If human decisions pending, mark blockers without stalling unrelated code.
2. **Source resolver verification:** connect source, evidence and selector references to exact corpus records; verify rights state rather than trusting manual metadata alone. Adversarial wrong-edition and dangling-ID tests.
3. **Real annotation ingestion:** accepted input schemas, reviewer decision trail, multi-annotator disagreement workflow, key-to-message validation, duplicate/invalid claim rejection.
4. **Candidate persistence and counterevidence:** bound Swing and cross-text reviewed ledger, typed comparative lenses, no inherited scores, limited query expansion.
5. **Reader and reviewer UI:** source-first five-column viewer, cross-scripture comparison, candidate/disagreement panels, research score diagnostics separate from public summaries.
6. **Pilot and release:** reviewed cases, reliable agreement/coverage reports, calibration eligibility, pinned static/browser export, manual CI and separate release decision.

The owner of each change must link implementation PR, exact commit, test logs, source rights reference and issue/todo ID. Incomplete work stays visibly incomplete.

### Navigation

- [Repository README](../README.md) · [Docs index](./README.md)
- [Product Blueprint](./PRODUCT-BLUEPRINT.md) · [Key Witness v0](./KEY-WITNESS-V0.md)
- [SRGBL v8 Master RFC](./SRGBL-V8-MASTER-RFC.md) · [Concept Crosswalk](./SRGBL-V8-CONCEPT-CROSSWALK.md)
- [Implementation Status](./SRGBL-V8-IMPLEMENTATION-STATUS.md) · [Publication Runbook](./SRGBL-V8-PUBLICATION-RUNBOOK.md)
- [P19 Epic #446](https://github.com/bjo163/moonwitness-corpus/issues/446) · [TODO P18/P19](../TODO.md)

**Grandplan is complete as a *planning artifact*, not complete as a validated or publicly released research system.**
