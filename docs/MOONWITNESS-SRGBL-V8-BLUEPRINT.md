
# MOONWITNESS CORPUS — SRGBL v8 EXPERIENCE & IMPLEMENTATION BLUEPRINT

**Version:** P19 implementation blueprint / draft-for-ratification, 2026-10-25.  
**Product foundation:** [Product Blueprint v1](./PRODUCT-BLUEPRINT.md) remains the product specification; this document scopes its P18/P19 experimental extension.  
**Single master programme:** [SRGBL v8 Grandplan](./MOONWITNESS-SRGBL-V8-GRANDPLAN.md).  
**Experience story:** [Witness → Message](./MOONWITNESS-P19-PRODUCT-NARRATIVE.md).  
**Build queue:** [Small-AI Issue Register](./MOONWITNESS-P19-MICROTASKS.md) · [Local AI Handoff](./MOONWITNESS-LOCAL-AI-HANDOFF.md) · [#446](https://github.com/bjo163/moonwitness-corpus/issues/446).

> **TEXT ≠ CLAIM ≠ INTERPRETATION ≠ FRAMEWORK ≠ JUDGMENT.**

**Concrete first-read:** [MoonWitness Explained: QS 2:82 user flow, synthetic key payload and UI wireframe](./MOONWITNESS-EXPLAINED-WALKTHROUGH.md). **Small AI issue implementations:** [Per-task I/O/negative-case/test specifications](./MOONWITNESS-P19-EXECUTABLE-SPECS.md).

## 1. Product journeys and what is actually shipped

**Public reader:** Discover → Source Trace → Context → Key Witness (reviewed only) → Citation. Protect source rights and original-language lanes throughout.

**Optional research reader:** selected exact passage → source/rights status → S1–L5 provenance/claim trace → framed keys → derived message/boundary → comparators → Swing candidate graph → editorial review/UNKNOWN.

**Annotator:** select a passage/fragment and controlled key → set relation/frame/direction/intensity/confidence with evidence → save draft → human review.

**Reviewer:** inspect edition/right/source selector → compare divergent annotations, alternatives and contrary evidence → record decision, identity and reason → versioned reviewed export.

**What is already implemented on dev as of HEAD 93d2e8e:** pure SRGBL scoring; typed run/key/source contract; Swing bounded chain; static/browser reviewed projection exporter; read-only research Fastify endpoints; basic Five-Layer viewer. See merged PRs #445, #447–#450 and [Implementation Status](./SRGBL-V8-IMPLEMENTATION-STATUS.md). **This is not a production-complete interpretation platform:** rights-cleared annotations, independent reviewer pilot, sourced intertextual comparison and reviewer UI are still missing.

## 2. Ownership and repository boundaries

| Layer | Owner | Immutable boundary |
|---|---|---|
| Text / original | Existing corpus core/schema/dataset | Never mutate original content or infer edition rights |
| Text witness | Resource/provenance/evidence | Explicit source and edition, not commentary |
| Key / message | P18 assessments and reviewed derived index | Not canonical scripture; controlled schema |
| Five-layer analysis | packages/srgbl derived run | No new core record_type; corpusHash/version pin |
| Swing/correlations | P19 candidate research ledger | Independent evidence; frame scoped |
| Reviewer decisions | Authenticated editorial workflow (pending) | AI cannot impersonate/approve human review |
| API | apps/api Fastify read-only | No writable public research claim API without security review |
| Browser/static | apps/web Next.js static export | Never invent Next dynamic API routes |
| External MoonWitness stories | Separate STORY/EVENT/PERSON owners | Never import personal testimony into scripture |

## 3. Detailed domain contracts

### 3.1 Source witness

Required: canonical passage ID, content ID, work/expression/edition/artifact references where available, provenance ID, language/script, representation type (source / variant / transliteration / translation), source selector, rights status, source-catalog hash.  
Fail closed: unknown rights → hide textual bytes; metadata only. A source may be metadata-only without implying the scripture never existed.

### 3.2 Framed key assessment

Required: unique annotation ID, passage+fragment, scheme ID/version, controlled key, relation, agent/recipient/domain/scope/genre, assessor, evidence IDs, direction in {-2,-1,0,1,2}, intensity 1..3, confidence 0..1, nonnegative weight, draft/reviewed/disputed/deprecated.  
No inferencing reviewer authority from a nonempty name. Ratify scheme 20 P18 tokens before promoting public-reviewed labels. Exploratory keys must be separately versioned.

### 3.3 Five-level analysis

Run: run ID, inputHash, corpusHash, method and methodVersion, source witnesses, claim array, evidence dependencies, uncertainty and reviewer state.  
Claim: claim ID, stage S1/R2/G3/B4/L5, status supported/partial/pending/unknown/unsupported, epistemic observed/inferred/interpreted, selector, evidence, dependsOn, frame, boundary.  
Validation: evidence must exist, dependencies form an acyclic graph and refer to supported predecessors, R2 textual support is observed rather than historical proof, L5 requires boundary note. Out-of-sequence supported claims may exist as candidates but **do not earn maturity**.

### 3.4 Message

Derived message ID links reviewed source keys, passage, method/frame, support evidence and source selectors, context note, boundary note, alternatives and review state. It cannot be displayed in the literal text lane. Wrong passage/frame or dangling key causes validation failure. Disagreement is retained.

### 3.5 Swing and correction

Seven candidate transformation operators, depth <=3, original edge signature, duplicate/cycle detection, no inherited support score, independent source-origin evidence, counterevidence, review status, retained UNKNOWN.

Relation types: AFFIRMS, PARALLELS, CLARIFIES, QUALIFIES, CONTRASTS, CORRECTS_WITHIN_FRAME, UNRESOLVED, NOT_RELATED.  
Profiles: comparative-neutral; islamic-quran-anchored explicitly selected with source/exegetical attribution and other tradition's perspective preserved.  
Miracle: attributed claim with claimant and sources, no computed empirical/supernatural truth status.  
OFFSIDE: reviewable mismatch hypothesis for actor/addressee/genre/scope/time/source; ONSIDE: evidenced proposed frame repair.

## 4. Distinct scoring and visibility

| Metric | Target | Formula | Visibility |
|---|---|---|---|
| Maturity /15 | Analytic run | Verified contiguous stages: 0,1,3,6,10,15 | Research debug; optional maturity badge without ranking |
| Quality /40 | Analytic run | 10 dimensions × integer 0..4 | Research only |
| Witness support /100 | Candidate relation | Source25+observation25+semantic20+cross-reference15+non-overlap15 | Research only; ≥70 eligible for review, not approved |
| Key direction −2..+2 | Key bundle + explicit frame | weighted average with intensity in numerator and denominator | Key-spectrum research view, not verse worth |
| Context coverage | Named required fields | present / expected | Reader/research, with missing fields |
| Agreement | Real independently annotated sample | Empirical coefficient only | Research transparency, no fabricated N |

UNKNOWN is categorical, not a synthetic midpoint score. No combined scripture/religion leaderboard, no automatic miracle score.

## 5. Screen architecture

### Public product
- / search and corpus explorer: work/dataset/tradition browse.
- Passage detail: exact text lanes and rights-aware source/provenance.
- Key Witness card: source fragment → approved key spectrum → method + frame → derived boundary/message → disagreement → citation.
- Comparison: both exact sources side-by-side, frame selector, textual vs theological relation tags and reviewer status.

### Research studio (incremental)
- /research/srgbl currently exists as an early preview. Extend, do not replace.
- Header: exact passage ID, edition, corpus hash, method, review-state, rights and citations.
- Five-column responsive tabs: S1/R2/G3/B4/L5 with UNKNOWN state per stage.
- Key/Message drawer with source fragments, one-to-many assessments and boundary.
- Swing graph: candidate-only edges, max-depth indicator, contrary evidence and new score eligibility.
- Correlation matrix: pair IDs, type, lens, evidence, disagreement and claimed relation limitations.
- Reviewer decision trail: who/what/when/why only when genuinely authenticated.
- Research metric panel: distinguish /15, /40, /100, −2..+2; no public global rankings.

Design: LINES + LIGHT + MOTION + ELECTRICITY as restrained navigation aids; RTL/LTR, reduced motion, mobile layout, keyboard focus, accessible data labels. UI must never label an unreviewed candidate as an established interpretation.

## 6. Deterministic derived data and release

Build graph:
1. Read pinned canonical source corpus catalog and verify hash.
2. Validate source/edition/artifact/provenance, actual rights/selector and evidence existence; reject or retain metadata-only.
3. Parse approved key scheme, annotation/decision records and frame-specific interpretation.
4. Validate claim DAG and stage gates; preserve disagreements and unsupported claims.
5. Compute run content hash, versioned evaluation and reviewed-only public projection.
6. Export deterministic sorted records with input and projection hashes; no source text in research public JSON.
7. Load in Fastify read-only and static/browser with identical corpusHash; mismatch is explicit 503/UNKNOWN.
8. Reproducibility check --check against exact inputs; publish only when review gates pass.

Inputs are NOT trusted just because their JSON says rights: cleared or reviewStatus: reviewed. True authority requires an independently auditable rights/reviewer record, secure attribution and repository evidence resolution. Until implemented, stay research-preview and do not publish real reviewed theological claims.

## 7. Implementation slices and dependencies

| Slice | Focus | Prerequisite | Test contract |
|---|---|---|---|
| A | Source ID and selector lookups | Corpus repository contract | Missing and wrong-edition reference rejected |
| B | Rights and S1 support | A | Unknown status fails closed |
| C | R2 exact-text observation | B | Inference cannot become exact text |
| D | Claim graph and cumulative levels | C | Out-of-order and cycles blocked |
| E | Key registry, frame and message | P18 source/reviewer scheme | Unapproved token and dangling message rejected |
| F | Swing candidates and ledger | D/E | Three-hop cap, no inherited score, false inverse test |
| G | Cross-text and perspectives | A/F | Two grounded source locators, method-scoped correction |
| H | Derived publication and API | A–G reviewed subset | Pinned hash, 404/503 and rebuild equivalence |
| I | Five-stage and comparison UI | H | Mobile/RTL/a11y, UNKNOWN, no-ranking |
| J | Human annotation/pilot/release | P18 rights/reviewer decisions | Real N, agreement, independent review, CI SHA |

**Do not change stage-completion checkboxes merely because a data class exists.** A child issue can be completed when *its local acceptance tests pass*, while the wider P19 checkbox remains open if other dependencies are outstanding.

## 8. Exact QA and negative test checklist

- Source/edition/provenance/rights missing and wrong source IDs.
- Text lane vs translation lane vs tafsir/interpretation boundary.
- Evidence pointer missing, duplicate, cycle, wrong passage; no multi-hop inference leakage.
- S1/R2/G3/B4/L5 absent predecessor / UNKNOWN treated as supported.
- Low/zero confidence → UNKNOWN rather than false neutral.
- No Key or relation outside versioned registries.
- Seven Swing operator tests; depth 4 rejected; duplicate/cycle and empty inherited score.
- Cross-text relation with one missing source; correction within neutral frame rejected.
- Miracle attribution never computed proof.
- Unreviewed reviewer name and forged rights JSON not sufficient for publication.
- Stale corpus or modified snapshot → API 503 / UI not showing claim.
- Browser/static export checksum equality and no quote/text leakage.
- RTL and reduced motion as applicable; no ranking or invented source messages.
- Manual CI run on exact dev SHA; no automated workflow changes.

## 9. Human decisions still blocking actual research

P18 must ratify the three pilot traditions, exact editions, controlled key list, reviewer authority and disagreement procedure. Rights and re-use permission for each text lane must be evidenced. The 300-passage, two-annotator pilot is a proposal, not already-conducted work. Reviewer inter-rater agreement/holdouts must be measured rather than guessed. This is research publication work; engineering mocks never fulfill it.

## 10. Branch/commit policy (user instruction)

**ONLY long-lived branches dev and main. LOCAL AI works on dev directly. DO NOT CREATE FEATURE BRANCHES.**

Run a clean-tree and protected-branch preflight; if direct commit or push is prohibited by the host, do not bypass protection or create a new branch. Report the exact blocker. One micro issue = one logical change, exact file scope, focused tests, and a descriptive atomic commit. main is release-only and is not part of this local AI job.

CI currently uses manual workflow_dispatch. Do not re-enable automatic triggers. Execute the installed local pnpm test/check commands and preserve output; manual CI must run on the exact SHA for release verification.

## 11. Decision log and conflict corrections

- Product Story v1 is not to be overwritten; narrative P19 is additive, with named phase/owner.
- Product Blueprint v1 is public-reader-first; SRGBL v8 is an experimental research addendum, not a claimed released product.
- Canonical RGBL TEXT domain alias ≠ standalone historical RGBL v7 metaphysics; do not collapse their versions.
- SRGBL S1 Source is source-of-evidence; ultimate theological SOURCE is an explicitly attributed ontology lens, not a database physical metric.
- Witness /100 ≥70 is candidate review eligibility, never automatically Accepted as religious or scientific fact.
- Middle Point historically 50 does not overwrite UNKNOWN or disagreement.
- Source labels such as faith/good_deeds/paradise_promise are experimental, not approved v0 registry keys.
- Positive Correction may be framed Quran-anchored, never default religious ranking.
- OFFSIDE metaphor must not alter literal 37:30 content.
- AI model cannot create theological review, source license, authentication or empirical agreement.
- GitHub manual CI cannot be claimed successful merely because older runs passed.

## 12. Ready-for-local DoD

- The master grandplan, narrative, blueprint, handoff and small-task register are accessible from docs/README.md.
- Each small issue has a unique ID, parent P19 task, prerequisites, ≤3 initial files, explicit tests, acceptance checklist and DoD.
- Existing P18 #425–#444 and P19 #446 are linked, not duplicated.
- No branch created; all documentation committed directly to dev.
- Local AI can begin first READY issue with installed Node24/pnpm10 and clear commands.
- P19 larger acceptance and human review remain tracked separately, not claimed completed.

**References:** [Master Grandplan](./MOONWITNESS-SRGBL-V8-GRANDPLAN.md) · [Narrative](./MOONWITNESS-P19-PRODUCT-NARRATIVE.md) · [Small Issues](./MOONWITNESS-P19-MICROTASKS.md) · [Local AI Handoff](./MOONWITNESS-LOCAL-AI-HANDOFF.md).
