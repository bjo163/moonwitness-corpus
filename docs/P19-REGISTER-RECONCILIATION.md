# P19 register reconciliation

The register in [`MOONWITNESS-P19-MICROTASKS.md`](./MOONWITNESS-P19-MICROTASKS.md) still lists all
37 micros as `READY (check prerequisites)` and 0 as done. That status was a readiness snapshot from
before the implementation wave, not a claim about the current tree, and leaving it unqualified would
let a reader conclude that nothing landed.

## Method

One command per micro, run at the `dev` head that includes this file:

```powershell
git log --all --oneline -1 --grep="p19-lNN\b" -E
```

A hit proves **a commit claims that micro id**. It does not prove the acceptance checks were met;
that evidence lives in the focused tests and the CI runs recorded in
[`MOONWITNESS-LOCAL-AI-HANDOFF.md`](./MOONWITNESS-LOCAL-AI-HANDOFF.md). No TODO checkbox is changed
here, because ratification is a human decision.

## Evidence ledger

| Micro | TODO | Declared outcome | Commit | Subject as committed |
|---|---|---|---|---|
| L01 | P19-027 | Baseline local tests and manual-CI smoke instructions | bda17a8 | docs(p19-l01): re-measure command matrix at dev HEAD and record gh availability (#452) |
| L02 | P19-004 | Reject blank or malformed SRGBL actor/recipient frames | d4255bc | test(p19-l02): cover blank, malformed and null research frames (#453) |
| L03 | P19-005 | Resolve exact source IDs against repository records | 236bcc9 | fix(p19-l03): resolve content source/edition pointers against canonical records (#454) |
| L04 | P19-005 | Fail closed for unverified rights on source witnesses | 8f3cecb | fix(p19-l04): require attested edition-specific rights before exposing text (#455) |
| L05 | P19-006 | Validate source selectors against exact passage/edition | 83c83fd | feat(p19-l05): validate source selectors against exact passage, edition and content (#456) |
| L06 | P19-006 | Prevent translation from masquerading as original reading | 45bfa31 | fix(p19-l06): keep translation lanes from masquerading as the original reading (#457) |
| L07 | P19-006 | Validate R2 observed text versus inferred story claims | 9bb9d43 | test(p19-l07): close R2 observed-versus-inferred edge cases (#458) |
| L08 | P19-007 | Reject dangling and cyclic level-claim dependencies | de5c86e | fix(p19-l08): name the claim, edge and cycle path in level-claim graph diagnostics (#459) |
| L09 | P19-008 | Test all contiguous maturity gates 0 to 15 | df7aab9 | test(p19-l09): prove every contiguous maturity gate 0 to 15 stops at the first unsatisfied level (#460) |
| L10 | P19-010 | Treat zero evidence weight as UNKNOWN, not neutral | 47e941f | fix(p19-l10): keep zero-weight evidence UNKNOWN and guard the direction inputs (#461) |
| L11 | P19-009 | Verify quality 10-dimension integer rubric and missingness | 7eb26cd | fix(p19-l11): score quality only on a complete, caller-labelled 10-dimension bundle (#462) |
| L12 | P19-010 | Enforce scheme-versioned P18 key tokens | 4757c49 | fix(p19-l12): enforce scheme-versioned P18 key vocabulary (#463) |
| L13 | P19-010 | Reject derived messages with dangling key IDs | 9030619 | fix(p19-l13): name the failing candidate array and keep contrary evidence through summarization (#469) |
| L14 | P19-004 | Make OFFSIDE diagnostic return reason and proposed frame | 6e3f42b | feat(p19-l14): name the OFFSIDE reason and keep the proposal human-only (#465) |
| L15 | P19-011 | Exercise all seven Swing operators as candidate-only transforms | 284d2d1 | test(p19-l15): cover seven distinct candidate-only Swing operators (#466) |
| L16 | P19-011 | Reject Swing duplicate signatures, exact cycles and depth 4 | cf313c6 | test(p19-l16): cover Swing duplicate-candidate and cycle stops with no hidden fourth hop (#467) |
| L17 | P19-012 | Check legacy Witness /100 bounds without truth promotion | 5fe49b5 | fix(p19-l17): bound legacy Witness /100 to integer component caps without truth promotion (#468) |
| L18 | P19-013 | Require independent source-origin evidence for reviewed Swing | 0ea9659 | feat(p19-l18): canonical, immutable candidate-ledger serializer with strict revival (#470) |
| L19 | P19-013 | Implement candidate ledger serialization with stable IDs | — | no commit message references this id |
| L20 | P19-014 | Validate two-sided cross-text relation source references | 169cd33 | fix(p19-l20): separate cross-text relation structure from repository source lookup (#471) |
| L21 | P19-015 | Expose explicit neutral versus Quran-anchored lens selector | e8fbfcf | feat(p19-l21): choose a research lens explicitly and never let a filter rewrite a stored frame (#472) |
| L22 | P19-015 | Reject unframed Quran positive correction assertions | 9f5014b | feat(p19-l22): reject unframed corrections and make a reviewed one keep its objections (#473) |
| L23 | P19-016 | Keep miracle claim attribution separate from numeric scoring | b0448f2 | feat(p19-l23): show a miracle claim as an attributed reading, never as a score (#474) |
| L24 | P19-018 | Add rights-safe QS 37:30 context and OFFSIDE fixture | be1120d | feat(p19-l24): keep QS 37:30 neighbour context and the OFFSIDE metaphor rights-safe (#475) |
| L25 | P19-019 | Audit five pilot Quran passage rights/edition matrix | 3bcf56a | feat(p19-l25): audit the five pilot cases against a source/edition rights matrix |
| L26 | P19-020 | Bind reviewed analysis input hashes to source evidence | cba5095 | feat(p19-l26): seal reviewed runs against source, reviewer and evidence edits |
| L27 | P19-020 | Reject stale/mismatched corpusHash on reviewed projection | b020fbb | feat(p19-l27): make the reviewed projection a closed, verified structure |
| L28 | P19-021 | Make reviewed Fastify endpoints fail closed with 404 and 503 | 8a30f2d | feat(p19-l28): serve reviewed analysis only for a verified, pinned snapshot |
| L29 | P19-022 | Match browser/static SRGBL export to current corpus catalog | 47dc70e | feat(p19-l29): pin the static SRGBL export to the served corpus catalog |
| L30 | P19-023 | Render five S1–L5 tabs with true UNKNOWN states | af466d4 | feat(p19-l30): render a per-stage status on each S1-L5 tab |
| L31 | P19-023 | Add source-linked key/message panel to witness viewer | a7d9227 | feat(p19-l31): show reviewed key messages as derived, bounded and evidence-linked |
| L32 | P19-024 | Render Swing candidates with independent evidence state | 67acede | feat(p19-l32): render Swing candidates as unverified, depth-tagged leads |
| L33 | P19-024 | Add comparative lens and correction/contrast panels | 50660df | feat(p19-l33): add a lens filter and typed correction/contrast panels |
| L34 | P19-023 | Verify RTL, keyboard, mobile and reduced-motion research UI | 042b3fa | feat(p19-l34): make the research tabs keyboard-operable and direction-safe |
| L35 | P19-025 | Define source-grounded annotation input validator | 6862429 | feat(p19-l35): validate paired key annotations without adjudicating them |
| L36 | P19-026 | Compute inter-rater agreement only from real paired annotations | 0a8ed3d | feat(p19-l36): compute agreement only from comparable paired annotations |
| L37 | P19-027 | Add adversarial rights/claims/publication regression matrix | 64f5742 | test(p19-l37): add the adversarial rights/claims/publication regression matrix |
| L38 | P19-028 | Prepare honest P19 release/validation decision record | 7a97cc9 | docs(p19-l38): record the P19 release decision as BLOCKED with per-gate evidence |

## Findings a human has to settle

1. **L19 has no commit of its own**, yet `0ea9659` implements "candidate ledger serialization with stable
   IDs" — the declared outcome of L19 — while carrying the `p19-l18` tag. The two ids look crossed. The
   code exists; the trail does not, so L18/L19 cannot both be claimed on this evidence.
2. **L13's commit subject does not describe L13's declared outcome.** `9030619` is about naming a
   failing candidate array and keeping contrary evidence; L13 is about rejecting derived messages with
   dangling key IDs. Either the tag or the subject is wrong.
3. **L25 is a rights audit, not a rights clearance.** It records the matrix for the five pilot cases; the
   clearances themselves are still a human decision, and P19-019 stays open on that basis.
4. **No per-micro CI run exists.** The green runs listed in the handoff are wave-level (`#480-#489` and
   earlier), so a commit is evidence that the tree was green at the wave head, not that the micro's own
   acceptance checks were reviewed.

## What is still missing

The mapping from the 37 micros to the 28 coarse P19 TODO items exists only in the register's TODO
column, and several TODO items collect four to six micros. Nobody has decided whether a TODO item is
"done" when all its micros are merged — that rule belongs to ratification, not to this file.
