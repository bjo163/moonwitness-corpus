# MoonWitness Knowledge Observatory — UI Design Atlas v2

**2026-10-25 · baseline: `bjo163/moonwitness-corpus@dev` · non-production design proposals.**

This is the coherent public and curator UX extension of the existing MoonWitness TEXT observatory. It does **not** replace RGBL corpus canonical ownership, schemas, P18/P19 contracts, Rocksoul design-system ownership, or the existing branch and approval rules.

## Open the assets

- [20-screen interactive, stand-alone HTML atlas](./atlas.html) — open the raw file locally; choose any of 20 screens from sidebar. No calls to API.
- [Screen map and proposed route contract](./SCREEN-MATRIX.md) — current vs proposed routes, required data fields, empty/rights states.
- [Design tokens, table contracts and safety rules](./DESIGN-CONTRACT.md).
- [Local AI implementation packets](./LOCAL-AI-IMPLEMENTATION.md).

The HTML is a **visual specimen, not a production UI**. Sample names and terms demonstrate layout, not approved, sourced assertions. There are no privileged actions, no published research output, and no fake live metrics.

## Actual repository baseline (checked on dev)

| Existing surface | Code | Boundary |
|---|---|---|
| Public landing | `apps/web/src/app/page.tsx` | provenance-before-interpretation landing already exists |
| Corpus browser | `apps/web/src/app/explorer/page.tsx`, `apps/web/src/corpus-app.tsx` | text search, source trace; derived browser data, not canonical SQL |
| Key Witness | `apps/web/src/app/research/key-witness/page.tsx` | early sealed-data viewer, real human pilot not complete |
| SRGBL S1–L5 | `apps/web/src/app/research/srgbl/page.tsx` | research preview, unsupported levels remain UNKNOWN |
| Curatorial console | `apps/web/src/app/admin/**` | currently browser-local credential; **not server authentication** |
| Current admin pages | `/admin/ledger`, `/balance`, `/spectrum`, `/profile` | sealed export/read-only reports, source-gated |

**What the new mockups propose:** a proper passage reader, ontology graph and entity detail, a P13 source-attributed prophetic figures table, P15 lexicon/etymology table, research case workbench, and reviewed server-authorized curation pipeline. These do not yet exist as complete production routes.

## Source documents

[Product Story](../../PRODUCT-STORY.md) · [Product Blueprint](../../PRODUCT-BLUEPRINT.md) · [P19 Grandplan](../../MOONWITNESS-SRGBL-V8-GRANDPLAN.md) · [P19 Status](../../SRGBL-V8-IMPLEMENTATION-STATUS.md) · [P13 figures](../../WORLD_REGISTRY_TARGETS.md) · [P15 lexicon](../../RELIGIOUS_LEXICON_TARGETS.md) · [Roles vocabulary](../../../spec/v0.1/vocab/religious-roles.json) · [Lexicon contract](../../../spec/v0.1/profiles/lexicon.md) · [Rocksoul interoperability](../../ROCKSOUL_INTEROP.md)

## Integrity before aesthetics

1. A textual passage, translation, interpretation, and theological judgment remain separate records/layers.
2. `prophet`/`messenger` is a **source/tradition-scoped role assertion**, not a global boolean; cross-tradition person identity requires evidence.
3. A shared translated term never proves identical concepts. Native spelling, script, language, sense, etymology and provenance stay visible.
4. Unknown means unknown, not false or zero. No invented scripture, references, annotations, human approvals, rights or scores.
5. Admin writer/reviewer/publisher features stay disabled until independently verified server authentication, authorization, audit and source-rights review exist.
6. No new branches: implementation and guide updates go to existing `dev`, `main` only through established promotion rules.

**Design-only commit, not approval of deployment or P18/P19 research release.**
