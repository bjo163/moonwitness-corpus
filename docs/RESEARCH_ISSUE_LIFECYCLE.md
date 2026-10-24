# TEXT Research Issue Lifecycle & TODO/PR Reconciliation Contract

> Status: remediation contract for [FIX-007 / #401](https://github.com/bjo163/moonwitness-corpus/issues/401). This document does **not** canonicalize any research record, close issues, update TODOs, or merge draft PRs.

## Distinct systems of record

| Record | Canonical owner | What it establishes | What it cannot establish |
| --- | --- | --- | --- |
| Research issue (`[AUTO-RESEARCH] TEXT` or `[RESEARCH]`) | TEXT issue steward | Research question, source locator, research state, uncertainty, next evidence gate | Canonical TEXT presence solely because an issue is open, progressed, or closed |
| Source/witness evidence | Source institution + separately attributed TEXT review | Directly observed artifact/edition, page/line/image locator, exact wording or uncertainty | PERSON identity, EVENT chronology, LAW applicability or universal authority |
| Observation/candidate | Reviewed, bounded TEXT research proposal | Candidate extraction with source/version/rights/provenance and dedup review | Automatically accepted canonical `mw:*` record |
| Corpus canonical record | `spec/` + `datasets/` with validation gates | Validated source/text identity, scoped assertion and reproducible rights/provenance | Unscoped truth, theological authority, or a claim of complete historical certainty |
| Roadmap TODO marker (`mw-todo:P*-*`) | `TODO.md` | Engineering task identity, wording, phase, checkbox | Research lifecycle state |
| GitHub PR | Existing author/review workflow | Proposed changes at an exact head SHA | Accepted canonical evidence before review/merge/CI |

Research issue machine key: `ROCKSOUL-RESEARCH-STATE:<value>`, with historical issue bodies potentially containing display-only table state. On conflict or malformed metadata, **fail closed** and request human reconciliation: no automated state advancement.

## Research state model

Active states currently recognized in canonical `main` steward code: `discovered`, `triaged`, `needs_sources`, `source_inspected`, `ready_for_observation`.

- `discovered` → `triaged`: identify scoped question, domain, existing candidate/canonical dedup, known source route and uncertainty.
- `triaged` → `needs_sources`: required primary witness/rights/provenance evidence is not yet available. A later review may return to `triaged` or proceed after new evidence arrives.
- `triaged` / `needs_sources` → `source_inspected`: direct, independently verifiable witness/facsimile/edition inspection, with exact artifact and locator identity.
- `source_inspected` → `ready_for_observation`: inspection plus separately checked exact-text and domain ownership boundaries; machine scoring alone is insufficient evidence.
- `ready_for_observation` → *reviewed candidate/observation*: bounded text/passage locators, edition/language/version, digest, rights/reissue, provenance and independent dedup review.
- *reviewed candidate* → `canonicalized` only **after** authorized source/rights review, ingestion, schema, reference integrity, deterministic build and human-approved publication decision.
- `merged` (deduplicated under another canonical issue) and `rejected` (reviewed and explicitly rejected) are terminal disposition states with linked reasons.

`canonicalized`, `merged` and `rejected` are proposed terminal machine states in existing **draft** [PR #393](https://github.com/bjo163/moonwitness-corpus/pull/393). Their implementation is **not yet merged**. Reuse/review that PR; **do not implement a duplicate terminal-state parser in `dev` while the branches diverge**. Do not equate GitHub `closed` with `canonicalized`.

## Required witness record envelope

Before observation or canonical ingestion, record:

- canonical research issue, source authority/publisher, stable URI and retrieval time;
- physical/digital artifact ID and custody, work, distinct language expression and edition/revision;
- page/panel/line or segment locator, photographed/manuscript/transcription/translation layer and known damage/reconstructions;
- source SHA-256/byte identity when artifacts are available, license/redistribution terms and jurisdictional uncertainty;
- observed wording vs paraphrase, commentary, machine-generated candidate, editorial normalization and translation;
- evidence/reviewer and dates, unresolved contradictions, duplicate-candidate/canonical scan, explicit source-owned scope;
- reference links to PERSON/EVENT/LAW research only as **foreign domain handoffs**, never inferred entity merge.

## Mapping rules for TODO ↔ Issues ↔ PRs

1. `mw-todo:Pn-nnn` is a **roadmap engineering** marker. The repository's existing `scripts/sync-todo-issues.ts` and `scripts/reconcile-issue-status.ts` must manage only those marked tasks; research issue text, state and witness are not derived from a TODO checkbox.
2. Exactly **one authoritative roadmap issue** may claim an `mw-todo` key; duplicated keys **fail closed** and must be reviewed without synthetic replacement issues.
3. Research issues have their own stable GitHub issue URL/number and research-machine metadata; multiple PRs or observations can reference the *same* canonical issue.
4. PR #393 is the existing terminal-state parser proposal; PR #394 is bounded Avilés witness-locator review for issue #380. Neither is automatically canonical data.
5. Opening, closing or merging a PR does not automatically move a research issue into a later evidence state.
6. An outside workspace `MASTER-TODO.json` or another repository's issue/knowledge base must not be edited by local TODO sync without explicit ownership and separate approval.
7. On stale issue SHA, missing source, missing rights, conflicted locators or API errors, report the mismatch; perform **zero unattended canonical mutations**.

## No-write verification matrix (before enabling automation)

| Case | Expected outcome |
| --- | --- |
| #380 Avilés issue + draft #394 | `ready_for_observation` remains noncanonical; Spanish/Portuguese official PDFs stay distinct |
| #375 Ur III Dugga | `source_inspected` pending bounded line/surface witness matrix |
| Draft #393 lifecycle parser | Review existing code/tests; requires exact-head green CI; terminal states excluded from actionable WIP only once merged |
| #384 repository control metadata | Operational issue, not research state or `mw-todo` ownership |
| Missing/malformed marker | Fail closed; never manufacture a completed research state |
| Duplicate TODO marker claim | Fail closed; no synthetic duplicate GitHub issue |
| Cross-domain person label | Keep TEXT label attribution; no minted PERSON identity |
| Rights/version ambiguity | Leave as research candidate; never canonicalize by automation |

## Implementation gates

- **Stage A (read-only):** inventory TODO markers, issue machine states, related PR head SHAs, duplicate keys, and source locators; publish dry-run delta and evidence to #401.
- **Stage B (review):** reuse PR #393 after dev/main history reconciliation [FIX-001 / #399](https://github.com/bjo163/moonwitness-corpus/issues/399); do not blindly cherry-pick files from `main`.
- **Stage C (tests):** add malformed/duplicate marker, source-vs-translation, terminal state, uncertain rights, stale PR, closed-not-canonical, idempotent no-op coverage.
- **Stage D (mutations):** only separately approved actions after branch safety [FIX-003 / #396](https://github.com/bjo163/moonwitness-corpus/issues/396), CI reliability [FIX-004 / #397](https://github.com/bjo163/moonwitness-corpus/issues/397), and verified exact-head green checks.

No code/data/issue status was changed by the creation of this contract document.
