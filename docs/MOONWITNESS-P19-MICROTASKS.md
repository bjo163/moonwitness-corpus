# MoonWitness P19 — Small-Issue Execution Register (Local AI)

**As of:** 2026-10-25 · **38 actual GitHub issues #452–#489** · **No new branches permitted**.  
**Canonical master:** [MoonWitness SRGBL v8 Grandplan](./MOONWITNESS-SRGBL-V8-GRANDPLAN.md) · [Narrative](./MOONWITNESS-P19-PRODUCT-NARRATIVE.md) · [Experience Blueprint](./MOONWITNESS-SRGBL-V8-BLUEPRINT.md).  
**Machine-readable:** [Microtask Manifest JSON](./MOONWITNESS-P19-MICROTASKS.json), with exact file scope, acceptance, test command, dependency and GitHub issue number.  
**Epic:** [#446](https://github.com/bjo163/moonwitness-corpus/issues/446) · **Pre-existing P18 tasks:** #425–#444 (do not duplicate).  
**Local instruction:** [Local AI Handoff](./MOONWITNESS-LOCAL-AI-HANDOFF.md).

> **The Status column below is the original readiness snapshot, not the current tree.** All 37 micros
> still read `READY`, although most have merged commits. Per-micro commit evidence, and two ids that do
> not add up (L19 has no commit; L13's subject does not match its outcome), are recorded in
> [`P19-REGISTER-RECONCILIATION.md`](./P19-REGISTER-RECONCILIATION.md). Read that before treating this
> table as a progress report.

**Before coding, open:** [Detailed input/output and failure examples for all 38 issues](./MOONWITNESS-P19-EXECUTABLE-SPECS.md) and [What MoonWitness is supposed to do in one real user session](./MOONWITNESS-EXPLAINED-WALKTHROUGH.md). The issue bodies #452–#489 were expanded with those examples; a title by itself is not an executable specification.

## What “one small issue” means

Every micro issue intentionally has **1 concrete outcome, no more than 3 initial files, 2 acceptance checks, 1 named focused test**, and dependencies. The issue describes a **small verification/hardening or implementation slice**; if the current code already covers it, the AI verifies a missing edge case and adds the regression test rather than duplicating existing functions.

The issue ID **P19-Lxx is NOT a replacement for P19-001..028**: it is a child work packet. Closing a small issue means its specific scope passed, *not* that the entire parent milestone, pilot, licensing or theological claim was approved.

## Rules for all local AI agents

1. **Use existing dev only. DO NOT create any new branch.** Never push to main. If direct push to protected dev is denied, stop and explain; do not bypass protection.
2. Fetch and inspect git status first. Do not reset/clean/discard user edits.
3. Select only a READY issue with dependencies satisfied. Do not begin blocked rights/review/pilot tasks without actual evidence.
4. Read the issue, named files, linked RFC; change only required files (≤3 initial scope, expand only with documented reason).
5. Run focused test listed in issue, plus typecheck and relevant web/API test after change. Report actual pass/fail, no invented logs.
6. One atomic commit per issue, scoped commit message including issue ID; push to dev if permitted.
7. Close issue only with commit SHA + test evidence; retain parent P19 TODO unchecked unless **all** its wider DoD has been independently met.
8. Do not enable automatic GitHub CI: repository currently uses manual workflow_dispatch. Run manual CI on exact SHA when authorized/required.

## Immediate work order

**Wave 0 (independent, start here):** P19-L01 environment/readme baseline; L02 strict frames; L03 source-ID resolver; L12 P18 scheme guard; L15 Swing operator checks. They can be attempted in separate clean sessions, **not concurrently editing the same shared dev branch**.

**Wave 1 (grounding):** L04 → L05 → L06 → L07; L08 → L09 → L10/L11; L14 OFFSIDE.

**Wave 2 (witness/candidates):** L12 → L13; L15 → L16 → L17 → L18 → L19; L20 → L21 → L22 and L23.

**Wave 3 (derived/API/UI):** L26 → L27 → L28/L29 → L30 → L31/L32/L33/L34, with own dependency gates.

**Wave 4 (research/release):** L24 metadata-safe OFFSIDE; L25 rights matrix; L35 annotation validator; L36 real paired agreement; L37 adversarial; L38 final release governance. L25/L36/L38 are explicitly human-input/approval-gated.

## Issue registry

| Micro Issue | Parent TODO | Single deliverable | Dependencies | Entry gate |
|---|---|---|---|---|
| [P19-L01](https://github.com/bjo163/moonwitness-corpus/issues/452) | P19-027 | Baseline local tests and manual-CI smoke instructions | — | READY (check prerequisites) |
| [P19-L02](https://github.com/bjo163/moonwitness-corpus/issues/453) | P19-004 | Reject blank or malformed SRGBL actor/recipient frames | — | READY (check prerequisites) |
| [P19-L03](https://github.com/bjo163/moonwitness-corpus/issues/454) | P19-005 | Resolve exact source IDs against repository records | — | READY (check prerequisites) |
| [P19-L04](https://github.com/bjo163/moonwitness-corpus/issues/455) | P19-005 | Fail closed for unverified rights on source witnesses | P19-L03 | READY (check prerequisites) |
| [P19-L05](https://github.com/bjo163/moonwitness-corpus/issues/456) | P19-006 | Validate source selectors against exact passage/edition | P19-L03 | READY (check prerequisites) |
| [P19-L06](https://github.com/bjo163/moonwitness-corpus/issues/457) | P19-006 | Prevent translation from masquerading as original reading | P19-L05 | READY (check prerequisites) |
| [P19-L07](https://github.com/bjo163/moonwitness-corpus/issues/458) | P19-006 | Validate R2 observed text versus inferred story claims | P19-L06 | READY (check prerequisites) |
| [P19-L08](https://github.com/bjo163/moonwitness-corpus/issues/459) | P19-007 | Reject dangling and cyclic level-claim dependencies | P19-L02 | READY (check prerequisites) |
| [P19-L09](https://github.com/bjo163/moonwitness-corpus/issues/460) | P19-008 | Test all contiguous maturity gates 0 to 15 | P19-L08 | READY (check prerequisites) |
| [P19-L10](https://github.com/bjo163/moonwitness-corpus/issues/461) | P19-010 | Treat zero evidence weight as UNKNOWN, not neutral | P19-L09 | READY (check prerequisites) |
| [P19-L11](https://github.com/bjo163/moonwitness-corpus/issues/462) | P19-009 | Verify quality 10-dimension integer rubric and missingness | P19-L09 | READY (check prerequisites) |
| [P19-L12](https://github.com/bjo163/moonwitness-corpus/issues/463) | P19-010 | Enforce scheme-versioned P18 key tokens | — | READY (check prerequisites) |
| [P19-L13](https://github.com/bjo163/moonwitness-corpus/issues/464) | P19-010 | Reject derived messages with dangling key IDs | P19-L12 | READY (check prerequisites) |
| [P19-L14](https://github.com/bjo163/moonwitness-corpus/issues/465) | P19-004 | Make OFFSIDE diagnostic return reason and proposed frame | P19-L02 | READY (check prerequisites) |
| [P19-L15](https://github.com/bjo163/moonwitness-corpus/issues/466) | P19-011 | Exercise all seven Swing operators as candidate-only transforms | — | READY (check prerequisites) |
| [P19-L16](https://github.com/bjo163/moonwitness-corpus/issues/467) | P19-011 | Reject Swing duplicate signatures, exact cycles and depth 4 | P19-L15 | READY (check prerequisites) |
| [P19-L17](https://github.com/bjo163/moonwitness-corpus/issues/468) | P19-012 | Check legacy Witness /100 bounds without truth promotion | P19-L16 | READY (check prerequisites) |
| [P19-L18](https://github.com/bjo163/moonwitness-corpus/issues/469) | P19-013 | Require independent source-origin evidence for reviewed Swing | P19-L17 | READY (check prerequisites) |
| [P19-L19](https://github.com/bjo163/moonwitness-corpus/issues/470) | P19-013 | Implement candidate ledger serialization with stable IDs | P19-L18 | READY (check prerequisites) |
| [P19-L20](https://github.com/bjo163/moonwitness-corpus/issues/471) | P19-014 | Validate two-sided cross-text relation source references | P19-L05 | READY (check prerequisites) |
| [P19-L21](https://github.com/bjo163/moonwitness-corpus/issues/472) | P19-015 | Expose explicit neutral versus Quran-anchored lens selector | P19-L20 | READY (check prerequisites) |
| [P19-L22](https://github.com/bjo163/moonwitness-corpus/issues/473) | P19-015 | Reject unframed Quran positive correction assertions | P19-L21 | READY (check prerequisites) |
| [P19-L23](https://github.com/bjo163/moonwitness-corpus/issues/474) | P19-016 | Keep miracle claim attribution separate from numeric scoring | P19-L20 | READY (check prerequisites) |
| [P19-L24](https://github.com/bjo163/moonwitness-corpus/issues/475) | P19-018 | Add rights-safe QS 37:30 context and OFFSIDE fixture | P19-L14, P19-L05 | READY (check prerequisites) |
| [P19-L25](https://github.com/bjo163/moonwitness-corpus/issues/476) | P19-019 | Audit five pilot Quran passage rights/edition matrix | P19-L04 | BLOCKED: human-rights |
| [P19-L26](https://github.com/bjo163/moonwitness-corpus/issues/477) | P19-020 | Bind reviewed analysis input hashes to source evidence | P19-L03, P19-L09 | READY (check prerequisites) |
| [P19-L27](https://github.com/bjo163/moonwitness-corpus/issues/478) | P19-020 | Reject stale/mismatched corpusHash on reviewed projection | P19-L26 | READY (check prerequisites) |
| [P19-L28](https://github.com/bjo163/moonwitness-corpus/issues/479) | P19-021 | Make reviewed Fastify endpoints fail closed with 404 and 503 | P19-L27 | READY (check prerequisites) |
| [P19-L29](https://github.com/bjo163/moonwitness-corpus/issues/480) | P19-022 | Match browser/static SRGBL export to current corpus catalog | P19-L27 | READY (check prerequisites) |
| [P19-L30](https://github.com/bjo163/moonwitness-corpus/issues/481) | P19-023 | Render five S1–L5 tabs with true UNKNOWN states | P19-L28 | READY (check prerequisites) |
| [P19-L31](https://github.com/bjo163/moonwitness-corpus/issues/482) | P19-023 | Add source-linked key/message panel to witness viewer | P19-L13, P19-L30 | READY (check prerequisites) |
| [P19-L32](https://github.com/bjo163/moonwitness-corpus/issues/483) | P19-024 | Render Swing candidates with independent evidence state | P19-L19, P19-L30 | READY (check prerequisites) |
| [P19-L33](https://github.com/bjo163/moonwitness-corpus/issues/484) | P19-024 | Add comparative lens and correction/contrast panels | P19-L22, P19-L30 | READY (check prerequisites) |
| [P19-L34](https://github.com/bjo163/moonwitness-corpus/issues/485) | P19-023 | Verify RTL, keyboard, mobile and reduced-motion research UI | P19-L30 | READY (check prerequisites) |
| [P19-L35](https://github.com/bjo163/moonwitness-corpus/issues/486) | P19-025 | Define source-grounded annotation input validator | P19-L12, P19-L05 | READY (check prerequisites) |
| [P19-L36](https://github.com/bjo163/moonwitness-corpus/issues/487) | P19-026 | Compute inter-rater agreement only from real paired annotations | P19-L35 | BLOCKED: pilot-input |
| [P19-L37](https://github.com/bjo163/moonwitness-corpus/issues/488) | P19-027 | Add adversarial rights/claims/publication regression matrix | P19-L28, P19-L22 | READY (check prerequisites) |
| [P19-L38](https://github.com/bjo163/moonwitness-corpus/issues/489) | P19-028 | Prepare honest P19 release/validation decision record | P19-L37, P19-L25, P19-L36 | BLOCKED: review |

## A single tiny local AI task (copy/paste)

> Repository bjo163/moonwitness-corpus. Branch dev ONLY. No new branches or PRs. Read [this exact issue URL], the Master Grandplan, and at most the scoped files. Check git status and current code first. Implement only the missing acceptance criteria; do not broaden the change. Run the focused test from the issue and pnpm typecheck; report exact results. Commit one atomic change referencing the micro-ID; push directly to dev only if permitted. If branch protection, rights, human review, or missing evidence blocks you, STOP that action without bypass or invention and report the blocker. Do not alter main or CI triggers. Include changed files, SHA, tests and remaining blockers in your final response.

## Crosswalk to larger P18/P19 work

- **P18 #425–#444:** controlled key vocabulary, message schema, annotator tool, agreement, UI, rights and reviewer decisions; still independently owned.
- **P19-001..004:** historical method/actor/frame and review decisions.
- **P19-005..010:** exact source/rights, textual R2, framed scoring and five-level constraints.
- **P19-011..013:** bounded Swing operators, candidate ledger and independent support.
- **P19-014..019:** correlation modes, Quran-anchored correction, attributed miracle/rights-reviewed cases.
- **P19-020..024:** derived publication, Fastify/browser transport, research viewer and comparison panels.
- **P19-025..028:** independent pilot, actual agreement, adversarial and release gates.

Task readiness depends on verified prerequisites. “READY” means a coder may inspect/harden the code without needing a new editorial decision, **not** that the entire named dependency has already passed a research review.

## Definition of Done for local handoff

The Manifest and each issue state acceptance, file scope, test command, dependency, explicit branch policy, and parent P19 marker. All 38 issue URLs are real. New work progresses sequentially on dev using atomic commits; no branch or PR creation is required to select the next issue. P18/P19 higher-level checkboxes and production main remain unchanged until separately verified.

**No score proves a miracle. No synthetic scripture. No silent frame substitution. UNKNOWN is a valid result.**
