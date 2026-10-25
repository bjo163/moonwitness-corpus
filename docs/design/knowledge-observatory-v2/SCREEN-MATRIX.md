# Screen Matrix — 20 MoonWitness Views

All proposed paths are design suggestions, **not a claim they currently resolve**. Each mockup screen is selectable from [atlas.html](./atlas.html).

| ID | Screen | Current / intended route | State | Essential proof / UI constraints |
|---|---|---|---|---|
| 01 | Home Landing | `/` | existing / redesign | Entry point for five connected workspaces |
| 02 | Corpus Explorer | `/explorer` | existing | Search by work, edition, passage and text coverage |
| 03 | Corpus Reader | `/reader` | proposed | Original/translations in rights-gated parallel lanes |
| 04 | Parallel Text Comparison | `/compare` | proposed | Compare exact witnesses with scoped relation types |
| 05 | Evidence & Provenance | `/trace` | partial | Artifact to edition to passage to evidence trail |
| 06 | Ontology Graph Explorer | `/ontology` | proposed | Navigate explicit, sourced concept and claim edges |
| 07 | Entity & Relation Detail | `/entity` | proposed | Separate identity from source-scoped claims |
| 08 | Tabel Kenabian | `/prophets` | proposed | Religious figure table with per-tradition role assertions |
| 09 | Profil Tokoh Kenabian | `/prophet-profile` | proposed | Names, roles, citations, contested identity links |
| 10 | Ensiklopedia Istilah | `/lexicon` | proposed | Multiscript term, sense, transliteration and evidence registry |
| 11 | Detail Istilah & Etimologi | `/term-detail` | proposed | Do not merge concepts by translation alone |
| 12 | Traditions & Works Atlas | `/traditions` | partial | Tradition registries distinct from full text coverage |
| 13 | Key Witness / Titik Tengah | `/research/key-witness` | preview | Frame/key/message, disagreement and review boundary |
| 14 | SRGBL Researcher | `/research/srgbl` | preview | S1 R2 G3 B4 L5, method/rights gated claims |
| 15 | Research Case Workspace | `/case` | proposed | Claim DAG, counter-evidence and human approval gates |
| 16 | Admin Command Center | `/admin/overview` | proposed | Operations home; no simulated production health |
| 17 | Source & Rights Registry | `/admin/sources` | proposed | Artifact/edition/licence/ingestion curation |
| 18 | Annotation Review Queue | `/admin/review` | proposed | Two assessor and reviewer audit workflow |
| 19 | Ontology Curation | `/admin/ontology` | proposed | Candidate identity and relation reviews |
| 20 | Release & Integrity Ledger | `/admin/release` | partial | Corpus hash, source rights and publication gates |

## Primary task-specific mappings

### Corpus Reader

`work → expression → edition → artifact → passage → content`; right-side panel: source URI, hash, rights, language/script, citation. Independent parallel lane for translation **only after** the translation's distinct rights/edition is confirmed. Show context fields `genre, narrator, speaker, recipient, place, period, scope` as UNKNOWN until sourced. Actions: previous/next, compare, evidence, citation, text issue report. Cite must be disabled if incomplete.

### Tabel Kenabian / prophetic figures

Rows require `figure_id, source-scoped role_assertion_id, preferred_label, localized_aliases, role_vocab, source_tradition, source_work, edition?, exact_evidence_locator?, provenance, historical_assessment?, review_state`. Show *Musa/Moses*, *Ibrahim/Abraham*, *Isa/Jesus*, etc. only as **illustrative display labels** until resolved to corpus identities/evidence. Roles may differ across sources. No `prophet=true` or universal doctrinal registry. Ability to filter by tradition, role, confidence scope, data status, and see disagreement.

### Istilah / multilingual lexicon

Rows require `term_id, script, native_form, language, transliteration_scheme, transliteration_version, sense/concept_id, definition_source, usage_evidence, etymology_evidence?, review_state`. Lexical exemplars *Elohim, Adonai, YHWH, Hashem, Nabī, Rasūl, Logos, Dharma, Dhamma* demonstrate how to compare without flattening meanings. Preserve right-to-left rendering and separate term/concept/entity/designation.

### Ontology / graph

Corpus stores TEXT-local structural relations, scoped assertions, evidence and provenance. Global reviewed links belong to the Correlation domain; SUPERHERO person intelligence, LEGEND events, MFTL stories, AWS law and JIZZ perspective remain cross-domain references. Graph fallbacks must provide an accessible table. Edge color alone never communicates support.

### Research and admin

SRGBL `S1→R2→G3→B4→L5` is **a method for a specific, reviewable analysis**, not five intrinsic spiritual levels. Distinguish maturity 0–15, quality 0–40, candidate support 0–100 and frame direction −2..+2. Keep real reviewer, rights, discrepancy and data-availability gates. Browser-local console login is not authority to approve or publish. `UNAVAILABLE`, `UNKNOWN`, `DISPUTED`, `RESTRICTED` must stay distinct.
