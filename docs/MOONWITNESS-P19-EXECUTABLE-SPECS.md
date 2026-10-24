# MoonWitness — EXECUTABLE SPECIFICATIONS for 38 Small AI Issues

**Status:** 2026-10-25 implementation handoff. This file expands each micro issue from a *title* to a **testable change contract**. No new branches. 
**Scope authority:** [Micro Issue Manifest](./MOONWITNESS-P19-MICROTASKS.json) + individual GitHub issue, [Walkthrough](./MOONWITNESS-EXPLAINED-WALKTHROUGH.md), [Master Grandplan](./MOONWITNESS-SRGBL-V8-GRANDPLAN.md), [Blueprint](./MOONWITNESS-SRGBL-V8-BLUEPRINT.md).
**Important:** These are proposed acceptance examples, not evidence that the feature was already implemented or that Quranic annotations were human reviewed. Synthetic placeholders are not real corpus IDs.

## How to work one ticket

1. **INPUT:** identify the exact code and record type to test; verify current baseline first.
2. **CHANGE:** implement one necessary missing invariant in the named files. If already present, add missing regression evidence and document it; no refactoring for appearance.
3. **OUTPUT:** assert one success path and one negative/fail-closed path in a runnable test.
4. **PROOF:** run the issue's scoped command, `pnpm typecheck`, check `git diff`, commit atomically to existing `dev` when permitted.
5. **REPORT:** comment actual commit SHA, test exit, screenshots/data only when verified; keep parent TODO open until parent DoD is fully met.
6. **HUMAN BOUNDARY:** no generated rights authorization, fake annotator/reviewer, fake original text or automatic theological proof.

**No branch creation, no PR creation, no main writes; manual-only CI remains unchanged.** Do not run parallel agents pushing the same dev worktree.

## P19-L01 — Baseline local tests and manual-CI smoke instructions

**GitHub:** [#452](https://github.com/bjo163/moonwitness-corpus/issues/452) · **Parent:** P19-027 · **Dependencies:** none · **Gate:** ready

**Input / starting state.** Checkout dev + Node and pnpm installed; no source edits required.

**Change to implement.** Inspect package.json, apps/web/package.json and CI workflow_dispatch; record command matrix separately for root and web.

**Expected positive example.** Handoff documents exact commands with tested exit codes and worktree policy.

**Expected negative example.** Do not claim CI ran; do not enable automatic triggers or invent scripts.

**Initial file scope:** `docs/MOONWITNESS-LOCAL-AI-HANDOFF.md`, `package.json`. **Verification command:** `pnpm typecheck`. If the named test file does not exist yet, create it within the scoped test path. Run `pnpm typecheck` in addition.

**Micro-DoD:** focused validation + positive/negative regression + honest report, one atomic dev commit; no global scripture ranking, no fake rights/reviewer; never automatically mark P19-027 finished.

## P19-L02 — Reject blank or malformed SRGBL actor/recipient frames

**GitHub:** [#453](https://github.com/bjo163/moonwitness-corpus/issues/453) · **Parent:** P19-004 · **Dependencies:** none · **Gate:** ready

**Input / starting state.** ResearchFrame with agent, recipient, domain, scope, genre; empty, whitespace, missing and wrong types.

**Change to implement.** Validate each required field and return which key failed without modifying caller object.

**Expected positive example.** Frame with all fields nonblank yields []; recipient:'  ' yields frame.recipient diagnostic.

**Expected negative example.** Passing unknown/null as frame must return controlled error rather than crash.

**Initial file scope:** `packages/srgbl/src/analysis.ts`, `packages/srgbl/src/analysis.test.ts`. **Verification command:** `pnpm exec tsx --test packages/srgbl/src/analysis.test.ts`. If the named test file does not exist yet, create it within the scoped test path. Run `pnpm typecheck` in addition.

**Micro-DoD:** focused validation + positive/negative regression + honest report, one atomic dev commit; no global scripture ranking, no fake rights/reviewer; never automatically mark P19-004 finished.

## P19-L03 — Resolve exact source IDs against repository records

**GitHub:** [#454](https://github.com/bjo163/moonwitness-corpus/issues/454) · **Parent:** P19-005 · **Dependencies:** none · **Gate:** ready

**Input / starting state.** CorpusPassageDetail: content.source_id and edition_id plus artifact/provenance references; current code accepts nonblank source/edition strings.

**Change to implement.** Introduce actual canonical lookup/resolver or explicit unresolved gap when source/edition record unavailable; never infer existence from nonblank IDs.

**Expected positive example.** Known source+edition in fixture resolve; nonexistent mw:source:does-not-exist produces source_unresolved and cannot be reviewed.

**Expected negative example.** Do not treat metadata-only source ID, wrong edition or missing artifact as resolved.

**Initial file scope:** `packages/srgbl/src/sources.ts`, `packages/srgbl/src/analysis.test.ts`. **Verification command:** `pnpm exec tsx --test packages/srgbl/src/analysis.test.ts`. If the named test file does not exist yet, create it within the scoped test path. Run `pnpm typecheck` in addition.

**Micro-DoD:** focused validation + positive/negative regression + honest report, one atomic dev commit; no global scripture ranking, no fake rights/reviewer; never automatically mark P19-005 finished.

## P19-L04 — Fail closed for unverified rights on source witnesses

**GitHub:** [#455](https://github.com/bjo163/moonwitness-corpus/issues/455) · **Parent:** P19-005 · **Dependencies:** P19-L03 · **Gate:** ready

**Input / starting state.** Content with rightsByContentId 'unknown'/'restricted' and text bytes; optionally cleared only from verified rights record.

**Change to implement.** Ensure uncleared text bytes are always omitted in projections and list rights gap; separate claimed state from actual authoritative clearance.

**Expected positive example.** Cleared (when independently verified) may expose licensed text; restricted/unknown never expose it.

**Expected negative example.** A caller-supplied 'cleared' string without independent attestation cannot silently grant publication.

**Initial file scope:** `packages/srgbl/src/sources.ts`, `packages/srgbl/src/analysis.test.ts`. **Verification command:** `pnpm exec tsx --test packages/srgbl/src/analysis.test.ts`. If the named test file does not exist yet, create it within the scoped test path. Run `pnpm typecheck` in addition.

**Micro-DoD:** focused validation + positive/negative regression + honest report, one atomic dev commit; no global scripture ranking, no fake rights/reviewer; never automatically mark P19-005 finished.

## P19-L05 — Validate source selectors against exact passage/edition

**GitHub:** [#456](https://github.com/bjo163/moonwitness-corpus/issues/456) · **Parent:** P19-006 · **Dependencies:** P19-L03 · **Gate:** ready

**Input / starting state.** Two synthetic passages/editions with content selectors and provenance/artefact metadata.

**Change to implement.** Validate selectors point to exact content, passage, edition; missing resolver info reports unverifiable, not success.

**Expected positive example.** Selector for correct source edition recognized; reused from a different edition returns selector_mismatch.

**Expected negative example.** No fabricated selector, no guessing a canonical prefix is enough.

**Initial file scope:** `packages/srgbl/src/sources.ts`, `packages/srgbl/src/sources.test.ts`. **Verification command:** `pnpm exec tsx --test packages/srgbl/src/sources.test.ts`. If the named test file does not exist yet, create it within the scoped test path. Run `pnpm typecheck` in addition.

**Micro-DoD:** focused validation + positive/negative regression + honest report, one atomic dev commit; no global scripture ranking, no fake rights/reviewer; never automatically mark P19-006 finished.

## P19-L06 — Prevent translation from masquerading as original reading

**GitHub:** [#457](https://github.com/bjo163/moonwitness-corpus/issues/457) · **Parent:** P19-006 · **Dependencies:** P19-L05 · **Gate:** ready

**Input / starting state.** Two synthetic content lanes source_text and translation with different edition/language.

**Change to implement.** Maintain and validate representation; deny translation being classified source_text unless independent original edition metadata exists.

**Expected positive example.** Output keeps distinct language/representation/edition fields; no silent swap.

**Expected negative example.** Source text missing must not be reconstructed from translation.

**Initial file scope:** `packages/srgbl/src/analysis.ts`, `packages/srgbl/src/analysis.test.ts`. **Verification command:** `pnpm exec tsx --test packages/srgbl/src/analysis.test.ts`. If the named test file does not exist yet, create it within the scoped test path. Run `pnpm typecheck` in addition.

**Micro-DoD:** focused validation + positive/negative regression + honest report, one atomic dev commit; no global scripture ranking, no fake rights/reviewer; never automatically mark P19-006 finished.

## P19-L07 — Validate R2 observed text versus inferred story claims

**GitHub:** [#458](https://github.com/bjo163/moonwitness-corpus/issues/458) · **Parent:** P19-006 · **Dependencies:** P19-L06 · **Gate:** ready

**Input / starting state.** Synthetic R2 claim with epistemic='observed' or 'inferred', valid sourceContentId/evidence.

**Change to implement.** Validate supported R2 only from observed textual claims attached to real source content and exact selectors when available.

**Expected positive example.** Observed text with source refs can support R2 when prerequisites pass.

**Expected negative example.** 'Historical event occurred' marked inferred cannot become supported R2 just because narrative says so.

**Initial file scope:** `packages/srgbl/src/analysis.ts`, `packages/srgbl/src/analysis.test.ts`. **Verification command:** `pnpm exec tsx --test packages/srgbl/src/analysis.test.ts`. If the named test file does not exist yet, create it within the scoped test path. Run `pnpm typecheck` in addition.

**Micro-DoD:** focused validation + positive/negative regression + honest report, one atomic dev commit; no global scripture ranking, no fake rights/reviewer; never automatically mark P19-006 finished.

## P19-L08 — Reject dangling and cyclic level-claim dependencies

**GitHub:** [#459](https://github.com/bjo163/moonwitness-corpus/issues/459) · **Parent:** P19-007 · **Dependencies:** P19-L02 · **Gate:** ready

**Input / starting state.** Claims S1,R2,G3 with dependsOn IDs and sourceContent IDs.

**Change to implement.** Validate unknown predecessor, duplicates, self-links and cyclic DAG; errors must be stable and actionable.

**Expected positive example.** S1→R2→G3 chain passes; duplicate claim:id or G3→R2→G3 cycle fails.

**Expected negative example.** No silent deletion of bad graph edges or promotion to supported.

**Initial file scope:** `packages/srgbl/src/analysis.ts`, `packages/srgbl/src/analysis.test.ts`. **Verification command:** `pnpm exec tsx --test packages/srgbl/src/analysis.test.ts`. If the named test file does not exist yet, create it within the scoped test path. Run `pnpm typecheck` in addition.

**Micro-DoD:** focused validation + positive/negative regression + honest report, one atomic dev commit; no global scripture ranking, no fake rights/reviewer; never automatically mark P19-007 finished.

## P19-L09 — Test all contiguous maturity gates 0 to 15

**GitHub:** [#460](https://github.com/bjo163/moonwitness-corpus/issues/460) · **Parent:** P19-008 · **Dependencies:** P19-L08 · **Gate:** ready

**Input / starting state.** Level statuses as five-element state map including supported, pending, unknown and partial.

**Change to implement.** Test count m=0..5 and triangular m(m+1)/2, with first unsatisfied level ending accumulation.

**Expected positive example.** S1,S2? Use canonical S1/R2/G3/B4/L5: all supported => 15; S1/R2 => 3.

**Expected negative example.** S1 supported,R2 unknown,G3 supported => maturity 1, not 6/15.

**Initial file scope:** `packages/srgbl/src/index.ts`, `packages/srgbl/src/index.test.ts`. **Verification command:** `pnpm exec tsx --test packages/srgbl/src/index.test.ts`. If the named test file does not exist yet, create it within the scoped test path. Run `pnpm typecheck` in addition.

**Micro-DoD:** focused validation + positive/negative regression + honest report, one atomic dev commit; no global scripture ranking, no fake rights/reviewer; never automatically mark P19-008 finished.

## P19-L10 — Treat zero evidence weight as UNKNOWN, not neutral

**GitHub:** [#461](https://github.com/bjo163/moonwitness-corpus/issues/461) · **Parent:** P19-010 · **Dependencies:** P19-L09 · **Gate:** ready

**Input / starting state.** Frame-scoped keys with confidence, intensity, direction and weight, including all weight 0.

**Change to implement.** Use same factor for numerator and denominator; return unknown/null if denominator zero.

**Expected positive example.** Single direction=+2/intensity=3/confidence=1/weight=1 yields +2.

**Expected negative example.** When every confidence=0, return UNKNOWN not score 0 or NaN.

**Initial file scope:** `packages/srgbl/src/index.ts`, `packages/srgbl/src/index.test.ts`. **Verification command:** `pnpm exec tsx --test packages/srgbl/src/index.test.ts`. If the named test file does not exist yet, create it within the scoped test path. Run `pnpm typecheck` in addition.

**Micro-DoD:** focused validation + positive/negative regression + honest report, one atomic dev commit; no global scripture ranking, no fake rights/reviewer; never automatically mark P19-010 finished.

## P19-L11 — Verify quality 10-dimension integer rubric and missingness

**GitHub:** [#462](https://github.com/bjo163/moonwitness-corpus/issues/462) · **Parent:** P19-009 · **Dependencies:** P19-L09 · **Gate:** ready

**Input / starting state.** 10 quality rubric fields 0..4; one missing or fractional field.

**Change to implement.** Validate all integers, compute max40 only on complete bundle; method/profile must be labeled by caller.

**Expected positive example.** Ten fields=4 returns 40; ten=0 returns 0, preserving distinction from missing.

**Expected negative example.** undefined or 4.1 fails, never filled as 0.

**Initial file scope:** `packages/srgbl/src/index.ts`, `packages/srgbl/src/index.test.ts`. **Verification command:** `pnpm exec tsx --test packages/srgbl/src/index.test.ts`. If the named test file does not exist yet, create it within the scoped test path. Run `pnpm typecheck` in addition.

**Micro-DoD:** focused validation + positive/negative regression + honest report, one atomic dev commit; no global scripture ranking, no fake rights/reviewer; never automatically mark P19-009 finished.

## P19-L12 — Enforce scheme-versioned P18 key tokens

**GitHub:** [#463](https://github.com/bjo163/moonwitness-corpus/issues/463) · **Parent:** P19-010 · **Dependencies:** none · **Gate:** ready

**Input / starting state.** One P18 key assessment with scheme semantic-core:v0 and a token; e.g. hope approved candidate, 'faith' exploratory.

**Change to implement.** Validate vocabulary only against current versioned registry without editing registry decision.

**Expected positive example.** Known token with valid frame/direction passes syntactic validation; future scheme needs independent version.

**Expected negative example.** Unknown token or wrong scheme fails; do not silently auto-map faith into approved list.

**Initial file scope:** `packages/srgbl/src/keys.ts`, `packages/srgbl/src/analysis.test.ts`. **Verification command:** `pnpm exec tsx --test packages/srgbl/src/analysis.test.ts`. If the named test file does not exist yet, create it within the scoped test path. Run `pnpm typecheck` in addition.

**Micro-DoD:** focused validation + positive/negative regression + honest report, one atomic dev commit; no global scripture ranking, no fake rights/reviewer; never automatically mark P19-010 finished.

## P19-L13 — Reject derived messages with dangling key IDs

**GitHub:** [#464](https://github.com/bjo163/moonwitness-corpus/issues/464) · **Parent:** P19-010 · **Dependencies:** P19-L12 · **Gate:** ready

**Input / starting state.** Derived KeyMessage linked to one FramedKeyAssessment by ID, passage/method and evidence.

**Change to implement.** Enforce nonempty message, contextNote, boundaryNote and resolvable references with compatible passage/method.

**Expected positive example.** Reviewed message with reviewed linked key and evidence IDs passes structural gate.

**Expected negative example.** Dangling key, mismatched method or blank boundary rejects review.

**Initial file scope:** `packages/srgbl/src/keys.ts`, `packages/srgbl/src/analysis.test.ts`. **Verification command:** `pnpm exec tsx --test packages/srgbl/src/analysis.test.ts`. If the named test file does not exist yet, create it within the scoped test path. Run `pnpm typecheck` in addition.

**Micro-DoD:** focused validation + positive/negative regression + honest report, one atomic dev commit; no global scripture ranking, no fake rights/reviewer; never automatically mark P19-010 finished.

## P19-L14 — Make OFFSIDE diagnostic return reason and proposed frame

**GitHub:** [#465](https://github.com/bjo163/moonwitness-corpus/issues/465) · **Parent:** P19-004 · **Dependencies:** P19-L02 · **Gate:** ready

**Input / starting state.** ResearchFrame actor/recipient plus evidenceFrame containing a different recipient.

**Change to implement.** Return candidate-offside with key differences and proposedFrame, always verified:false.

**Expected positive example.** Recipient mismatch reports 'recipient', with a suggested frame for human examination.

**Expected negative example.** Never auto-change canonical frame or mark ONSIDE=divine approval.

**Initial file scope:** `packages/srgbl/src/analysis.ts`, `packages/srgbl/src/analysis.test.ts`. **Verification command:** `pnpm exec tsx --test packages/srgbl/src/analysis.test.ts`. If the named test file does not exist yet, create it within the scoped test path. Run `pnpm typecheck` in addition.

**Micro-DoD:** focused validation + positive/negative regression + honest report, one atomic dev commit; no global scripture ranking, no fake rights/reviewer; never automatically mark P19-004 finished.

## P19-L15 — Exercise all seven Swing operators as candidate-only transforms

**GitHub:** [#466](https://github.com/bjo163/moonwitness-corpus/issues/466) · **Parent:** P19-011 · **Dependencies:** none · **Gate:** ready

**Input / starting state.** Synthetic triple A relates-to B and operator direction/polarity/subject-object/cause-effect/perspective/temporal/semantic-opposition.

**Change to implement.** Run each transformation and assert operator tag, status candidate, evidence unverified, inheritedScore null.

**Expected positive example.** All seven operators yield distinct candidate records and signatures.

**Expected negative example.** Inverse of A relates-to B is never asserted true or reviewed.

**Initial file scope:** `packages/srgbl/src/index.ts`, `packages/srgbl/src/swing-chain.test.ts`. **Verification command:** `pnpm exec tsx --test packages/srgbl/src/swing-chain.test.ts`. If the named test file does not exist yet, create it within the scoped test path. Run `pnpm typecheck` in addition.

**Micro-DoD:** focused validation + positive/negative regression + honest report, one atomic dev commit; no global scripture ranking, no fake rights/reviewer; never automatically mark P19-011 finished.

## P19-L16 — Reject Swing duplicate signatures, exact cycles and depth 4

**GitHub:** [#467](https://github.com/bjo163/moonwitness-corpus/issues/467) · **Parent:** P19-011 · **Dependencies:** P19-L15 · **Gate:** ready

**Input / starting state.** Swing history signatures and seenRelations with cycles and candidate depths 1–4.

**Change to implement.** Reject depth>3, exact cycle/repeat and duplicate relation/candidate signature deterministically.

**Expected positive example.** Depth 1..3 accepted with nonrepeated candidate; same signature blocked.

**Expected negative example.** No extra hidden fourth hop, no score inheritance.

**Initial file scope:** `packages/srgbl/src/index.ts`, `packages/srgbl/src/swing-chain.test.ts`. **Verification command:** `pnpm exec tsx --test packages/srgbl/src/swing-chain.test.ts`. If the named test file does not exist yet, create it within the scoped test path. Run `pnpm typecheck` in addition.

**Micro-DoD:** focused validation + positive/negative regression + honest report, one atomic dev commit; no global scripture ranking, no fake rights/reviewer; never automatically mark P19-011 finished.

## P19-L17 — Check legacy Witness /100 bounds without truth promotion

**GitHub:** [#468](https://github.com/bjo163/moonwitness-corpus/issues/468) · **Parent:** P19-012 · **Dependencies:** P19-L16 · **Gate:** ready

**Input / starting state.** Witness score components Source25 Observation25 Semantic20 CrossRef15 NonOverlap15.

**Change to implement.** Validate integer bounds, compute sum<=100, return eligibility not approval.

**Expected positive example.** Maximum100 yields eligible-for-review; fields 0 produce needs-more-evidence.

**Expected negative example.** sourceFidelity=26 or non-integer fails; >=70 never grants truth.

**Initial file scope:** `packages/srgbl/src/index.ts`, `packages/srgbl/src/index.test.ts`. **Verification command:** `pnpm exec tsx --test packages/srgbl/src/index.test.ts`. If the named test file does not exist yet, create it within the scoped test path. Run `pnpm typecheck` in addition.

**Micro-DoD:** focused validation + positive/negative regression + honest report, one atomic dev commit; no global scripture ranking, no fake rights/reviewer; never automatically mark P19-012 finished.

## P19-L18 — Require independent source-origin evidence for reviewed Swing

**GitHub:** [#469](https://github.com/bjo163/moonwitness-corpus/issues/469) · **Parent:** P19-013 · **Dependencies:** P19-L17 · **Gate:** ready

**Input / starting state.** ReviewedCandidate with Swing origin, reviewed ScopedTextRelation, source origins, support and contradiction arrays.

**Change to implement.** Require explicit independentSourceIds and reviewer and evidence for reviewed; preserve contrary evidence (including [] meaning none found).

**Expected positive example.** Source-origin and reviewed relation/evidence returns structurally reviewable result.

**Expected negative example.** Empty sources or candidate with inheritedScore non-null fails.

**Initial file scope:** `packages/srgbl/src/research-ledger.ts`, `packages/srgbl/src/analysis.test.ts`. **Verification command:** `pnpm exec tsx --test packages/srgbl/src/analysis.test.ts`. If the named test file does not exist yet, create it within the scoped test path. Run `pnpm typecheck` in addition.

**Micro-DoD:** focused validation + positive/negative regression + honest report, one atomic dev commit; no global scripture ranking, no fake rights/reviewer; never automatically mark P19-013 finished.

## P19-L19 — Implement candidate ledger serialization with stable IDs

**GitHub:** [#470](https://github.com/bjo163/moonwitness-corpus/issues/470) · **Parent:** P19-013 · **Dependencies:** P19-L18 · **Gate:** ready

**Input / starting state.** Small set of ReviewedCandidate test entries with IDs out of order and nullable component rubric.

**Change to implement.** Design stable serializer roundtrip for candidate ledger; include frame/method, origin, evidence, disputed status and uncertainty.

**Expected positive example.** Two same entries serialize identically regardless of insertion order; deserialize to same data.

**Expected negative example.** Duplicate IDs, discarded contradiction evidence, reviewer escalation or public mutable ledger blocked.

**Initial file scope:** `packages/srgbl/src/research-ledger.ts`, `packages/srgbl/src/research-ledger.test.ts`. **Verification command:** `pnpm exec tsx --test packages/srgbl/src/research-ledger.test.ts`. If the named test file does not exist yet, create it within the scoped test path. Run `pnpm typecheck` in addition.

**Micro-DoD:** focused validation + positive/negative regression + honest report, one atomic dev commit; no global scripture ranking, no fake rights/reviewer; never automatically mark P19-013 finished.

## P19-L20 — Validate two-sided cross-text relation source references

**GitHub:** [#471](https://github.com/bjo163/moonwitness-corpus/issues/471) · **Parent:** P19-014 · **Dependencies:** P19-L05 · **Gate:** ready

**Input / starting state.** Two exact mw:passage IDs, relation type, method/frame, evidence IDs; ideally two resolved edition/source refs.

**Change to implement.** Require both source endpoints and evidence with matching identifiers; distinguish structural validation from repository lookup.

**Expected positive example.** Correct pair and evidence pass proposal-stage validation; reviewed requires reviewer/source existence.

**Expected negative example.** One missing/nonexistent source or unsupported type cannot be reviewed.

**Initial file scope:** `packages/srgbl/src/index.ts`, `packages/srgbl/src/index.test.ts`. **Verification command:** `pnpm exec tsx --test packages/srgbl/src/index.test.ts`. If the named test file does not exist yet, create it within the scoped test path. Run `pnpm typecheck` in addition.

**Micro-DoD:** focused validation + positive/negative regression + honest report, one atomic dev commit; no global scripture ranking, no fake rights/reviewer; never automatically mark P19-014 finished.

## P19-L21 — Expose explicit neutral versus Quran-anchored lens selector

**GitHub:** [#472](https://github.com/bjo163/moonwitness-corpus/issues/472) · **Parent:** P19-015 · **Dependencies:** P19-L20 · **Gate:** ready

**Input / starting state.** Same candidate textual pair evaluated with comparative-neutral vs islamic-quran-anchored.

**Change to implement.** Represent method/lens explicitly; render/query it unchanged through relation record.

**Expected positive example.** Neutral outputs PARALLELS/CONTRASTS; Islamic frame may carry scope for correction after actual review.

**Expected negative example.** Changing UI filter cannot silently rewrite the stored chosen frame.

**Initial file scope:** `packages/srgbl/src/index.ts`, `packages/srgbl/src/index.test.ts`. **Verification command:** `pnpm exec tsx --test packages/srgbl/src/index.test.ts`. If the named test file does not exist yet, create it within the scoped test path. Run `pnpm typecheck` in addition.

**Micro-DoD:** focused validation + positive/negative regression + honest report, one atomic dev commit; no global scripture ranking, no fake rights/reviewer; never automatically mark P19-015 finished.

## P19-L22 — Reject unframed Quran positive correction assertions

**GitHub:** [#473](https://github.com/bjo163/moonwitness-corpus/issues/473) · **Parent:** P19-015 · **Dependencies:** P19-L21 · **Gate:** ready

**Input / starting state.** CORRECTS_WITHIN_FRAME relation with neutral frame and an explicitly labeled Islamic frame.

**Change to implement.** Fail neutral correction, require reviewer ID/evidence and preserve counterreadings for reviewed.

**Expected positive example.** Islamic perspective labeled + reviewed evidence may pass structural check.

**Expected negative example.** Neutral correction or unnamed evidence fails; no automatic universal proof.

**Initial file scope:** `packages/srgbl/src/index.ts`, `packages/srgbl/src/index.test.ts`. **Verification command:** `pnpm exec tsx --test packages/srgbl/src/index.test.ts`. If the named test file does not exist yet, create it within the scoped test path. Run `pnpm typecheck` in addition.

**Micro-DoD:** focused validation + positive/negative regression + honest report, one atomic dev commit; no global scripture ranking, no fake rights/reviewer; never automatically mark P19-015 finished.

## P19-L23 — Keep miracle claim attribution separate from numeric scoring

**GitHub:** [#474](https://github.com/bjo163/moonwitness-corpus/issues/474) · **Parent:** P19-016 · **Dependencies:** P19-L20 · **Gate:** ready

**Input / starting state.** MiracleAttribution with claimant/tradition/method/evidence and reviewStatus.

**Change to implement.** Keep attributed claim separate from scores; empiricalVerified fixed false in current schema.

**Expected positive example.** Sourced attribution is displayable as attributed claim with limitations.

**Expected negative example.** No 'score>70' conversion to empirical miracle proof; no invented claimant.

**Initial file scope:** `packages/srgbl/src/research-ledger.ts`, `packages/srgbl/src/analysis.test.ts`. **Verification command:** `pnpm exec tsx --test packages/srgbl/src/analysis.test.ts`. If the named test file does not exist yet, create it within the scoped test path. Run `pnpm typecheck` in addition.

**Micro-DoD:** focused validation + positive/negative regression + honest report, one atomic dev commit; no global scripture ranking, no fake rights/reviewer; never automatically mark P19-016 finished.

## P19-L24 — Add rights-safe QS 37:30 context and OFFSIDE fixture

**GitHub:** [#475](https://github.com/bjo163/moonwitness-corpus/issues/475) · **Parent:** P19-018 · **Dependencies:** P19-L14, P19-L05 · **Gate:** ready

**Input / starting state.** Metadata-only Quran 37:30 pointer and neighbor context scope plus distinct 20:5 pointer.

**Change to implement.** Add explicit neighbor-reference placeholders/source selectors in rights-safe fixture; distinguish literary context and creative metaphor.

**Expected positive example.** Fixture says actor/recipient uncertain pending exact edition; OFFSIDE remains editorial candidate.

**Expected negative example.** Never copy unlicensed translation or render Master Gula as literal verse wording.

**Initial file scope:** `fixtures/srgbl/quran-research-cases.json`, `packages/srgbl/src/analysis.test.ts`. **Verification command:** `pnpm exec tsx --test packages/srgbl/src/analysis.test.ts`. If the named test file does not exist yet, create it within the scoped test path. Run `pnpm typecheck` in addition.

**Micro-DoD:** focused validation + positive/negative regression + honest report, one atomic dev commit; no global scripture ranking, no fake rights/reviewer; never automatically mark P19-018 finished.

## P19-L25 — Audit five pilot Quran passage rights/edition matrix

**GitHub:** [#476](https://github.com/bjo163/moonwitness-corpus/issues/476) · **Parent:** P19-019 · **Dependencies:** P19-L04 · **Gate:** blocked-human-rights

**Input / starting state.** List of 5 Quran metadata-only case pointers and available exact editions/terms, without assumed permission.

**Change to implement.** Document edition publisher/source/license status/evidence URL for each where checked and mark gaps unknown; human confirmation later.

**Expected positive example.** A documented, verifiable license source is cited, otherwise matrix says pending/unknown.

**Expected negative example.** No 'public domain' asserted only from work age, religion or random hosting.

**Initial file scope:** `docs/SRGBL-V8-SOURCE-EDITION-MATRIX.md`, `fixtures/srgbl/quran-research-cases.json`. **Verification command:** `pnpm validate:editions`. If the named test file does not exist yet, create it within the scoped test path. Run `pnpm typecheck` in addition.

**Micro-DoD:** focused validation + positive/negative regression + honest report, one atomic dev commit; no global scripture ranking, no fake rights/reviewer; never automatically mark P19-019 finished.

## P19-L26 — Bind reviewed analysis input hashes to source evidence

**GitHub:** [#477](https://github.com/bjo163/moonwitness-corpus/issues/477) · **Parent:** P19-020 · **Dependencies:** P19-L03, P19-L09 · **Gate:** ready

**Input / starting state.** AnalysisRun with claims and inputHash sealed using computeAnalysisInputHash.

**Change to implement.** Changing any source, reviewer, claim or evidence after sealing must fail createReviewedSnapshot.

**Expected positive example.** Deterministically identical run yields same input SHA; changed claim yields mismatch.

**Expected negative example.** Do not treat hash as authenticated human signature.

**Initial file scope:** `packages/srgbl/src/derived.ts`, `packages/srgbl/src/publication.test.ts`. **Verification command:** `pnpm exec tsx --test packages/srgbl/src/publication.test.ts`. If the named test file does not exist yet, create it within the scoped test path. Run `pnpm typecheck` in addition.

**Micro-DoD:** focused validation + positive/negative regression + honest report, one atomic dev commit; no global scripture ranking, no fake rights/reviewer; never automatically mark P19-020 finished.

## P19-L27 — Reject stale/mismatched corpusHash on reviewed projection

**GitHub:** [#478](https://github.com/bjo163/moonwitness-corpus/issues/478) · **Parent:** P19-020 · **Dependencies:** P19-L26 · **Gate:** ready

**Input / starting state.** Reviewed snapshot with projectionSha256, corpusHash and reviewed publicSummaries.

**Change to implement.** Verify exact hash and stage counts/IDs, input/projection structure; missing or malformed fields fail closed.

**Expected positive example.** Same corpus+unchanged projection passes; stale hash rejected.

**Expected negative example.** Valid recomputed SHA cannot replace reviewer authorization or missing required evidence.

**Initial file scope:** `packages/srgbl/src/publication.ts`, `packages/srgbl/src/publication.test.ts`. **Verification command:** `pnpm exec tsx --test packages/srgbl/src/publication.test.ts`. If the named test file does not exist yet, create it within the scoped test path. Run `pnpm typecheck` in addition.

**Micro-DoD:** focused validation + positive/negative regression + honest report, one atomic dev commit; no global scripture ranking, no fake rights/reviewer; never automatically mark P19-020 finished.

## P19-L28 — Make reviewed Fastify endpoints fail closed with 404 and 503

**GitHub:** [#479](https://github.com/bjo163/moonwitness-corpus/issues/479) · **Parent:** P19-021 · **Dependencies:** P19-L27 · **Gate:** ready

**Input / starting state.** Fastify /v1/research/srgbl/passages/:id/analysis with valid, missing or tampered index.

**Change to implement.** Use existing repo catalog to bind snapshot, handle invalid hash/schema as HTTP503; absent review HTTP404.

**Expected positive example.** No snapshot => 404; corrupted snapshot => 503; reviewed case => 200 only when pinned.

**Expected negative example.** No source-text leak, empty index not mistaken for a published analysis.

**Initial file scope:** `apps/api/src/routes/srgbl.ts`, `apps/api/src/api.test.ts`. **Verification command:** `pnpm exec tsx --test apps/api/src/api.test.ts`. If the named test file does not exist yet, create it within the scoped test path. Run `pnpm typecheck` in addition.

**Micro-DoD:** focused validation + positive/negative regression + honest report, one atomic dev commit; no global scripture ranking, no fake rights/reviewer; never automatically mark P19-021 finished.

## P19-L29 — Match browser/static SRGBL export to current corpus catalog

**GitHub:** [#480](https://github.com/bjo163/moonwitness-corpus/issues/480) · **Parent:** P19-022 · **Dependencies:** P19-L27 · **Gate:** ready

**Input / starting state.** apps/web public catalog hash and materialized public SRGBL static export.

**Change to implement.** Verify same schema/method/corpus hash and public-only claims; use deterministic sorted output.

**Expected positive example.** Valid static derived file renders; mismatched catalog yields explicit unavailable state.

**Expected negative example.** Never fallback to an unrelated corpus or include research-only scores in public export.

**Initial file scope:** `packages/srgbl/src/static.ts`, `packages/srgbl/src/static.test.ts`. **Verification command:** `pnpm exec tsx --test packages/srgbl/src/static.test.ts`. If the named test file does not exist yet, create it within the scoped test path. Run `pnpm typecheck` in addition.

**Micro-DoD:** focused validation + positive/negative regression + honest report, one atomic dev commit; no global scripture ranking, no fake rights/reviewer; never automatically mark P19-022 finished.

## P19-L30 — Render five S1–L5 tabs with true UNKNOWN states

**GitHub:** [#481](https://github.com/bjo163/moonwitness-corpus/issues/481) · **Parent:** P19-023 · **Dependencies:** P19-L28 · **Gate:** ready

**Input / starting state.** Viewer with S1..L5 tabs, sourceTrace/reviewed projection and no record.

**Change to implement.** Render per-stage status; UNKNOWN for no approved evidence, never generated placeholder.

**Expected positive example.** Opening R2 without approved claim displays UNKNOWN; exact reviewed entry shows evidence IDs.

**Expected negative example.** No hidden synthetic paragraphs or global positive/negative ayat badge.

**Initial file scope:** `apps/web/src/app/research/srgbl/page.tsx`, `apps/web/scripts/contract-test.mjs`. **Verification command:** `pnpm --dir apps/web test`. If the named test file does not exist yet, create it within the scoped test path. Run `pnpm typecheck` in addition.

**Micro-DoD:** focused validation + positive/negative regression + honest report, one atomic dev commit; no global scripture ranking, no fake rights/reviewer; never automatically mark P19-023 finished.

## P19-L31 — Add source-linked key/message panel to witness viewer

**GitHub:** [#482](https://github.com/bjo163/moonwitness-corpus/issues/482) · **Parent:** P19-023 · **Dependencies:** P19-L13, P19-L30 · **Gate:** ready

**Input / starting state.** Reviewer-approved KeyMessage plus linked KeyAssessment and content reference.

**Change to implement.** Show message as derived with method/frame/contextNote/boundaryNote and original source link.

**Expected positive example.** Visible 'Derived message' label and referenced evidence; no rewriting textual lane.

**Expected negative example.** Unknown unreviewed message withheld/clearly draft; empty boundary not accepted.

**Initial file scope:** `apps/web/src/app/research/srgbl/page.tsx`, `apps/web/scripts/contract-test.mjs`. **Verification command:** `pnpm --dir apps/web test`. If the named test file does not exist yet, create it within the scoped test path. Run `pnpm typecheck` in addition.

**Micro-DoD:** focused validation + positive/negative regression + honest report, one atomic dev commit; no global scripture ranking, no fake rights/reviewer; never automatically mark P19-023 finished.

## P19-L32 — Render Swing candidates with independent evidence state

**GitHub:** [#483](https://github.com/bjo163/moonwitness-corpus/issues/483) · **Parent:** P19-024 · **Dependencies:** P19-L19, P19-L30 · **Gate:** ready

**Input / starting state.** Unverified SwingCandidate array containing source relation, operator, depth 1..3.

**Change to implement.** Render candidate badge, depth and evidenceStatus without implying review; keyboard accessible selection.

**Expected positive example.** One candidate shows Unverified / depth1 / no inherited score; source origin clickable where indexed.

**Expected negative example.** No truth badge or fabricated supporting refs.

**Initial file scope:** `apps/web/src/app/research/srgbl/page.tsx`, `apps/web/scripts/contract-test.mjs`. **Verification command:** `pnpm --dir apps/web test`. If the named test file does not exist yet, create it within the scoped test path. Run `pnpm typecheck` in addition.

**Micro-DoD:** focused validation + positive/negative regression + honest report, one atomic dev commit; no global scripture ranking, no fake rights/reviewer; never automatically mark P19-024 finished.

## P19-L33 — Add comparative lens and correction/contrast panels

**GitHub:** [#484](https://github.com/bjo163/moonwitness-corpus/issues/484) · **Parent:** P19-024 · **Dependencies:** P19-L22, P19-L30 · **Gate:** ready

**Input / starting state.** Two textual sources with typed relation and explicit chosen frame.

**Change to implement.** UI filter renders lens label, precise pair, type, evidence, review status, uncertainties.

**Expected positive example.** Islamic-anchored correction explicitly marked interpretation; neutral compare stays neutral.

**Expected negative example.** Never show correction as cross-religious neutral truth.

**Initial file scope:** `apps/web/src/app/research/srgbl/page.tsx`, `apps/web/scripts/contract-test.mjs`. **Verification command:** `pnpm --dir apps/web test`. If the named test file does not exist yet, create it within the scoped test path. Run `pnpm typecheck` in addition.

**Micro-DoD:** focused validation + positive/negative regression + honest report, one atomic dev commit; no global scripture ranking, no fake rights/reviewer; never automatically mark P19-024 finished.

## P19-L34 — Verify RTL, keyboard, mobile and reduced-motion research UI

**GitHub:** [#485](https://github.com/bjo163/moonwitness-corpus/issues/485) · **Parent:** P19-023 · **Dependencies:** P19-L30 · **Gate:** ready

**Input / starting state.** Five tabs and RTL/LTR content plus prefers-reduced-motion browser case.

**Change to implement.** Preserve dir=auto or appropriate dir and keyboard tab semantics; ensure compact viewport no overflow.

**Expected positive example.** Arabic content reads right-to-left, focus visible, reduced motion respected.

**Expected negative example.** No decorative animation blocks reading or requires mouse only.

**Initial file scope:** `apps/web/src/app/research/srgbl/page.tsx`, `apps/web/scripts/contract-test.mjs`. **Verification command:** `pnpm --dir apps/web test`. If the named test file does not exist yet, create it within the scoped test path. Run `pnpm typecheck` in addition.

**Micro-DoD:** focused validation + positive/negative regression + honest report, one atomic dev commit; no global scripture ranking, no fake rights/reviewer; never automatically mark P19-023 finished.

## P19-L35 — Define source-grounded annotation input validator

**GitHub:** [#486](https://github.com/bjo163/moonwitness-corpus/issues/486) · **Parent:** P19-025 · **Dependencies:** P19-L12, P19-L05 · **Gate:** ready

**Input / starting state.** Synthetic annotations for same passage from distinct assessors with evidence IDs and frames.

**Change to implement.** Validate required fields/scheme, retain two different submissions and status, don't auto adjudicate.

**Expected positive example.** Reviewer sees A=hope and B=warning as separate entries with justification.

**Expected negative example.** Duplicate assessor pretending to be 2 raters or missing evidence does not pass paired sample.

**Initial file scope:** `packages/srgbl/src/keys.ts`, `packages/srgbl/src/annotation.test.ts`. **Verification command:** `pnpm exec tsx --test packages/srgbl/src/annotation.test.ts`. If the named test file does not exist yet, create it within the scoped test path. Run `pnpm typecheck` in addition.

**Micro-DoD:** focused validation + positive/negative regression + honest report, one atomic dev commit; no global scripture ranking, no fake rights/reviewer; never automatically mark P19-025 finished.

## P19-L36 — Compute inter-rater agreement only from real paired annotations

**GitHub:** [#487](https://github.com/bjo163/moonwitness-corpus/issues/487) · **Parent:** P19-026 · **Dependencies:** P19-L35 · **Gate:** blocked-pilot-input

**Input / starting state.** Actual independently paired human annotation rows and adjudication metadata after P18 approval.

**Change to implement.** Compute agreement only for same-scheme comparable paired cases; report N/denominator, missingness and confidence interval or limits.

**Expected positive example.** Real N>=2 pairs produces defensible coefficient/report; insufficient N returns undefined/not estimable.

**Expected negative example.** Synthetic fixtures test code but cannot satisfy empirical pilot completion.

**Initial file scope:** `packages/srgbl/src/agreement.ts`, `packages/srgbl/src/agreement.test.ts`. **Verification command:** `pnpm exec tsx --test packages/srgbl/src/agreement.test.ts`. If the named test file does not exist yet, create it within the scoped test path. Run `pnpm typecheck` in addition.

**Micro-DoD:** focused validation + positive/negative regression + honest report, one atomic dev commit; no global scripture ranking, no fake rights/reviewer; never automatically mark P19-026 finished.

## P19-L37 — Add adversarial rights/claims/publication regression matrix

**GitHub:** [#488](https://github.com/bjo163/moonwitness-corpus/issues/488) · **Parent:** P19-027 · **Dependencies:** P19-L28, P19-L22 · **Gate:** ready

**Input / starting state.** Adversarial fixtures wrong source, rights, method, forged review, tampered hash, out-of-frame correction.

**Change to implement.** Run regression matrix across engine and API and record which invariants are enforced.

**Expected positive example.** All negative cases fail closed; valid synthetic control remains accepted without claiming human approval.

**Expected negative example.** No weakening of validator or CI assertion merely to obtain green.

**Initial file scope:** `packages/srgbl/src/publication.test.ts`, `apps/api/src/api.test.ts`. **Verification command:** `pnpm test`. If the named test file does not exist yet, create it within the scoped test path. Run `pnpm typecheck` in addition.

**Micro-DoD:** focused validation + positive/negative regression + honest report, one atomic dev commit; no global scripture ranking, no fake rights/reviewer; never automatically mark P19-027 finished.

## P19-L38 — Prepare honest P19 release/validation decision record

**GitHub:** [#489](https://github.com/bjo163/moonwitness-corpus/issues/489) · **Parent:** P19-028 · **Dependencies:** P19-L37, P19-L25, P19-L36 · **Gate:** blocked-review

**Input / starting state.** Implementation Status, runbook, CI SHA, rights decisions and pilot/reviewer evidence.

**Change to implement.** Write release decision table with each gate PASS/FAIL/UNKNOWN and independent evidence links.

**Expected positive example.** If no human pilot, document BLOCKED; owner cannot promote main in this task.

**Expected negative example.** Do not label production-ready from unit test success or fabricated CI URL.

**Initial file scope:** `docs/SRGBL-V8-IMPLEMENTATION-STATUS.md`, `docs/SRGBL-V8-PUBLICATION-RUNBOOK.md`. **Verification command:** `pnpm todo:check`. If the named test file does not exist yet, create it within the scoped test path. Run `pnpm typecheck` in addition.

**Micro-DoD:** focused validation + positive/negative regression + honest report, one atomic dev commit; no global scripture ranking, no fake rights/reviewer; never automatically mark P19-028 finished.

## Next steps after all 38

The small issues are engineering slices, not the full P18/P19 programme. Human authorization of source editions, a real paired 300-passage annotation pilot, independently measured agreement and separate release approval still gate the research product. Look at parent 28 P19 and 20 P18 TODOs before calling any milestone completed.

**Suggestion to local AI:** read exactly one section named by the issue (example `P19-L03`), its fileScope and the live code. Fix that minimal unit. Never hallucinate a completed experiment.
