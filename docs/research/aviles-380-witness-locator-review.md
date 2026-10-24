# TEXT #380 — Avilés bounded witness-locator review (noncanonical)

- Owner: `bjo163/rocksoul-rgbl`; research issue: #380 (`ready_for_observation`).
- Canonical base checked: `main@df00706c98e21fb3fb0146b8389b0f2978f3d833` (2026-10-15 Asia/Jakarta); artifact evidence re-checked against `main@14368423d7792c970c2938a8105b7575ef2c6050` on 2026-10-24 Asia/Jakarta.
- Review status: **locator-only staging**; not corpus extraction, candidate promotion, translation equivalence, or canonical truth.
- Source inspection: Spanish and Portuguese official SEGIB five-page PDFs inspected separately; page numbering below is **1-based PDF page**, not a claim of shared exact wording.

| Witness | Language | Commitment | PDF page | Exact-text authority | Publication provenance |
|---|---|---:|---:|---|---|
| ES-SEGIB-2026-AVILES | es | 1 | 2 | Spanish full-text SEGIB PDF | ES official publication + linked PDF |
| ES-SEGIB-2026-AVILES | es | 10 | 3 | Spanish full-text SEGIB PDF | ES official publication + linked PDF |
| ES-SEGIB-2026-AVILES | es | 21 | 5 | Spanish full-text SEGIB PDF | ES official publication + linked PDF |
| PT-SEGIB-2026-AVILES | pt | 1 | 2 | Portuguese full-text SEGIB PDF | PT official publication + linked PDF |
| PT-SEGIB-2026-AVILES | pt | 10 | 3 | Portuguese full-text SEGIB PDF | PT official publication + linked PDF |
| PT-SEGIB-2026-AVILES | pt | 21 | 5 | Portuguese full-text SEGIB PDF | PT official publication + linked PDF |

## Source registry (external links, no bundled bytes)

- ES landing: https://segib.org/es/publicacion/declaracion-de-aviles-sobre-trabajo/
- ES witness: https://segib.org/wp-content/uploads/2026/07/Declaracion_VI_Conferencia_Iberoamericana_Ministerial_de-Trabajo_29-06-2026.pdf
- PT landing: https://segib.org/pt/publicacion/declaracao-da-aviles-sobre-trabalho/
- PT witness: https://segib.org/wp-content/uploads/2026/07/Declaracao_VI_Conferencia_Ibero-Americana_Ministerial_do_Trabalho_29-06-2026.pdf

The **document date is 2 July 2026**, distinct from `29-06-2026` embedded in both filenames. Each language version is a separate published witness. A matching commitment number is a locator only, **not** textual identity, juridical equivalence, or an inferred source/translation direction.

## Witness artifact evidence (verified 2026-10-24)

| Witness | HTTP | Bytes | Pages | SHA-256 |
|---|---|---:|---:|---|
| ES-SEGIB-2026-AVILES | 200 `application/pdf` | 216374 | 5 | `926de5b860dbd927060a1278a6f0c5141dec1a475801198cd7b70b4bb3f12f3f` |
| PT-SEGIB-2026-AVILES | 200 `application/pdf` | 168955 | 5 | `1232615258389e7e083e47a81a1b96aa7f7d25670bca8999a42313d3a143ee22` |

- Retrieval: direct download from the official SEGIB witness URLs above; both returned `200 application/pdf`.
- Page check: commitments 1, 10 and 21 occur on 1-based PDF pages 2, 3 and 5 respectively in **both** language versions (`pdftotext -enc UTF-8 -layout`).
- Date check: the ES cover page reads “Avilés, España, 2 de julio 2026”, matching the recorded document date.
- The PDF bytes are **not** committed. These hashes describe the public artifacts as retrieved; a SEGIB reissue would change them.

## Gates and uncertainty

- Issue-first: #380 existed before this review. Both official full-text witnesses were inspected before these locators were staged.
- Repository duplicate screening against current `main`: search for `Avilés`, `Aviles`, `SEGIB`, and `Declaracion_VI_Conferencia` (excluding `node_modules` and generated `dist`) found no dataset, candidate, or canonical record; `datasets/registry.json` lists no Avilés dataset. **This is repository-level screening, not exhaustive external deduplication**.
- Rights/reissue: no explicit license or republication grant was found (both SEGIB landing pages returned HTTP 403 to automated requests). This record is **link-and-hash only**; no license is inferred and no bytes are redistributed. Promotion to bundled content remains blocked until explicit terms are verified.
- Exact-text transcription/quotation, page-specific variant analysis, normalized text, translation alignment, PERSON identity, LAW/EVENT conclusions, and canonical IDs: **not created**.
- Cross-domain relationship handoff: none; `canonical_edge_created=false`.
- No scheduled correlation or automatic identity merging.

## Next gate

Complete exhaustive external deduplication and determine explicit rights terms before any promotion to an owner-native candidate or bundled dataset. Run repository-declared `pnpm check` and GitHub CI before any merge. **ISSUE FIRST. SOURCE SECOND. CANON LAST.**
