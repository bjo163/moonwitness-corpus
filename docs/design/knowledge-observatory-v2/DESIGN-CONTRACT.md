# MoonWitness — Design & Integrity Contract v2

## UI identity

Quiet, information-dense editorial observatory. **Proposed visual palette only**, reconcile with upstream `rocksoul-assets` prior to production:
- night/side-nav `#14262A`, teal `#22574F`, ink `#1E2F32`;
- paper `#FBFAF6`, canvas `#F3F4EF`, line `#D8DFDD`;
- coral focus `#DE7655`, evidence mint `#DAEEE1`, pale sand `#F4E6BE`.
Use normal readable sans for body, a mono face for SHA/edition/status, and a proper multiscript fallback stack for Arabic/Hebrew/Greek/Devanagari. Use design-token aliases, not copy-pasted page-level hex values. Respect reduced-motion.

## Information architecture

**Public:** Home / Corpus Explorer / Corpus Reader / Text Comparison / Source Trace / Ontology Graph / Entity Detail / Tabel Kenabian / Figure Detail / Ensiklopedia Istilah / Term Detail / Traditions Atlas.

**Research:** Key Witness / SRGBL Researcher / Case & Evidence workspace. Annotator views are *not* public research conclusions.

**Curator Admin:** Overview / Source Rights / Review Queue / Ontology Curation / Release Integrity. First implement safe read-only surfaces. Never reuse client-only browser credentials for real mutation authorization.

## Reusable component contracts

| Component | State / data obligations |
|---|---|
| `SourceSelector` | exact work/expression/edition/locator with source availability |
| `CorpusPassageLane` | display only when bytes, source, edition and rights permit |
| `TranslationLane` | independent expression, rights, attribution and source |
| `CitationBundle` | complete edition/artifact/hash/rights before copy/export |
| `ContextFrame` | speaker, recipient, genre, period, scope with UNKNOWN |
| `AssertionTrail` | claim versus evidence versus provenance, including disagreements |
| `FigureRoleTable` | roles source-scoped, avoid global prophet/saint flags |
| `TermSenseTable` | term, source-linguistic concept, native script, scheme/version |
| `OntologyGraph` | explicit provenance on edge, table fallback, no inferred identity |
| `ResearchStages` | S1…L5 status, method and evidence; unsupported stays UNKNOWN |
| `ReviewerGate` | named human authority, audit and rejected/contested states |
| `ReleaseLedger` | signed rights/review, exact corpus hash and irreversible logs |

## State vocabulary

`loading`, `empty`, `unavailable`, `metadata_only`, `restricted`, `unknown`, `partial`, `disputed`, `reviewed`, `published`, `error`. Do not make empty, missing rights and search-no-results indistinguishable.

## Acceptance and tests

- Desktop + mobile, keyboard navigation, correct table headers, focus visibility, contrast AA, language/RTL/script semantics, no sticky UI that hides selected passages.
- Source-mode visible: live API / browser DB / generated catalog. Avoid promising an API endpoint that does not yet exist.
- Pinned exact edition + content rights; no synthetic scripture/text fallback.
- Pagination matches actual indexed results; registered works != works with materialized text.
- All publicly rendered derived messages carry method, frame, evidence, revision, review, and limits; dissent remains visible.
- All admin mutations require server-verified RBAC, immutable audit, rights clearance and reviewer identity. Never force-publish when any source hash or licence does not match.
- Accessibility/visual tests and negative-rights tests before promoting any production route.
