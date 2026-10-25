# Execution Guide — AI Lokal (UI Only)

**Repo:** `bjo163/moonwitness-corpus` · **branch:** existing `dev` only · **do not create a branch or PR and do not write main.**

Start by reading `README.md`, `docs/PRODUCT-STORY.md`, `docs/PRODUCT-BLUEPRINT.md`, `docs/MOONWITNESS-SRGBL-V8-GRANDPLAN.md`, `docs/SRGBL-V8-IMPLEMENTATION-STATUS.md`, `docs/WORLD_REGISTRY_TARGETS.md`, `docs/RELIGIOUS_LEXICON_TARGETS.md` and the four files in this directory. Review current `apps/web/src/app/`, `apps/web/src/corpus-app.tsx` and relevant `apps/api/src/routes/`.

## Small implementation packets

1. UI-01 — Confirm exact `dev` SHA, screen route parity, current browser/Next runtime and baseline tests; record gaps, do not change code yet.
2. UI-02 — Extract reusable shell/layout, typography/tokens, mobile and focus; refer to `rocksoul-assets` as visual upstream without copying unsupported assets.
3. UI-03 — Improve existing landing and link paths to existing screens, hide routes that are not yet implemented or mark preview.
4. UI-04 — Reader source/edition/passage selection: canonical ID, metadata-only/rights state and adjacent context; API-driven, no random passages.
5. UI-05 — Translation and compare lanes: separate rights/expression, source selectors, scoped comparison state.
6. UI-06 — Evidence/provenance and copy citation with validation; disallow incomplete citations.
7. UI-07 — P13 figure list and filters from actual scoped role assertions. Empty/unknown source mapping tested.
8. UI-08 — Figure detail: names, traditions, role claims, exact evidence links, competing records, no silent merge.
9. UI-09 — P15 lexicon index, multilingual native-script search, accessible filter and pagination.
10. UI-10 — Term details: script/transliteration/source-scoped gloss, etymology provenance and contested relations.
11. UI-11 — Ontology graph and accessible alternative relations table; only explicit source-backed edges.
12. UI-12 — Join P18 Key Witness and P19 S1–L5 viewer with edition selector, UNKNOWN and dispute/counter-evidence handling.
13. UI-13 — Future curator overview + source registry **read-only** using existing sealed data; no privileged mutation.
14. UI-14 — Security ADR for editor/reviewer server auth, RBAC, signed audit, rights approval. Do not implement approvals first.
15. UI-15 — Pilot review queue, ontology proposal curation and publication ledger only after back-end gates and human approvals are accepted.
16. UI-16 — Visual, accessibility, keyboard/RTL, rights, API/browser offline fallback, integration/E2E regression and docs.

## Per-ticket Definition of Done

Explicit input/fixture, file scope, status, proof of existing endpoint/dataset, positive and negative test cases, screenshots at 360/768/1440 px, test command/exit, SHA, issue reference if tracked, commit/push on `dev` after checks. No fake live counters, approval, source text, theological verdict, or direct production writes. Do not tick P18/P19 completed unless original scientific/rights/human gates pass.
