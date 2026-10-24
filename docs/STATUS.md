# MoonWitness Corpus — Current Status

Snapshot date: 2026-10-24.

This file is a concise implementation/release snapshot. `TODO.md` remains the canonical executable task state, while `docs/ROADMAP.md` preserves the detailed architecture and milestone rationale. `docs/DATASET_TARGETS.md` defines the current data-first source/target plan. `docs/APP_INTEGRATION_ADVICE.md` defines the seed pathway to the MoonWitness app.

## Current snapshot (2026-10-24)

- `main` and `dev` are converged: `git diff origin/main origin/dev` is empty and `main` is an ancestor of `dev`. Snapshot SHAs are recorded in the merge report; use `git rev-parse origin/main origin/dev` for live values.
- Only `main` and `dev` exist locally and on `origin`; there are no open pull requests.
- Rulesets `25772824` (canonical branches) and `25772825` (immutable `corpus-v*` / `browser-db-*` tags) are active. Both canonical branches require a pull request plus exact-head `check` and `web`; `required_approving_review_count` is 0 by explicit owner decision. This is a single-admin setup without independent approval, documented in `docs/BRANCHING.md`.
- All workflow `uses:` entries are pinned to 40-character commit SHAs; Dependabot updates them weekly.
- TODO ↔ Issues sync is check-only: it never writes or pushes to a protected branch. Drift fails the run with an artifact report.
- `pnpm research:audit` is a read-only contract audit of TODO markers, research issue metadata, and PR heads. It never mutates issues or data; see `docs/RESEARCH_ISSUE_LIFECYCLE.md`.
- P8 npm publication is **blocked on owner decisions**; see `docs/P8-RELEASE-DECISION.md`. Issues #92–#96 stay open.
- P12-006 (Pali↔English Dhammapada alignment) remains `blocked_pending_source_language_rights_audit`. Issue #149 carries a corrected status comment; the earlier "Completed and verified" comment is not supported by the data.
- The experimental `ui/vercel-observatory` branch was removed; its head is preserved by tag `archive/ui-vercel-observatory-2026-10-24`.

Historical feature/bootstrap branches are non-authoritative; consumers and downstream work must pin `main`/release commits, not deleted branch refs.

## Current operational priority

The P12 foundation corpus is complete except for P12-006, which cannot proceed without cleared Pali root redistribution rights. No P12 coding work is actionable from the repository data alone. The next milestone has not been selected; the options are documented in the handoff below.

P9–P11 feature/integration work remains deferred. P8 publication remains blocked by licence and npm-scope authorization, not by dataset rights.

## Milestone state

```text
P0  Foundation                         complete
P1  Core contract stabilization        complete
P2  Textual profile v0.1               complete
P3  Provenance / source / rights        complete
P4  Reproducible ingestion framework   complete
P5  Two real dataset proofs             complete
P6  Repository / query / build          complete
P7  Public Corpus Explorer              complete
P8  Package/release infrastructure      complete
    npm publication tasks               BLOCKED on owner decisions (#92–#96)
P12 Foundation Text Corpus expansion   complete except P12-006 (blocked)
P9  MoonWitness integration             deferred
P10 Advanced profiles                   deferred
P11 Curation / collaboration            deferred
```

P8 publication tasks intentionally remain open:

```text
P8-002  publish core
P8-003  publish schema
P8-004  publish repository
P8-005  publish validator
P8-006  publish CLI
```

They are not considered complete until packages are actually published and installable from the selected registry.

## P12 approved source lanes

The committed Foundation Text Corpus target set is:

```text
Quran Arabic baseline
  source: existing Tanzil Uthmani v1.1 dataset

Dhammapada English
  source: SuttaCentral Bilara / Bhikkhu Sujato
  baseline ref: published@cf0dac3b59a3f9b1d4829acb311e303f1eb6bba6
  translation rights: CC0

Dhammapada Pali root
  source family identified in SuttaCentral Bilara
  bundling: conditional on root-edition-specific rights audit

Hebrew Bible
  source: Open Scriptures Hebrew Bible / Westminster Leningrad Codex
  text: public domain WLC
  lemma/morphology: CC BY 4.0

Greek New Testament
  source: official SBLGNT v1.2 repository
  license: CC BY 4.0

English Bible
  source: eBible.org World English Bible Classic
  target: 2020 stable text, full ecumenical book set
  rights: public domain, trademark naming caveat

Broader Buddhist English corpus
  source: SuttaCentral Bilara Bhikkhu Sujato translations
  first expansion: DN, MN, SN, AN
  translation rights: CC0
```

See `docs/DATASET_TARGETS.md` for exact paths, source boundaries, alignment policy, and acceptance criteria.

## Verified implementation baseline (2026-08-28, historical)

The numbers below describe the 2026-08-28 snapshot and are not current counts. They are retained for comparison with the P12 expansion.

The release/CI baseline already verifies:

- 108 automated tests passing;
- 12,841 canonical records validating before P12 expansion;
- 7 registered datasets before P12 expansion;
- deterministic derived corpus build;
- deterministic release bundle across two independent builds;
- 7 npm tarballs prepared in the release bundle;
- npm publication dry-run resolving the expected package artifacts;
- production Corpus Explorer build and runtime smoke test passing.

Current real-data proofs include:

- full Tanzil Uthmani Quran dataset with 6,236 ayah and pinned source checksum/rights metadata;
- SuttaCentral/Bilara Dhammapada 1–20 proof with source-preserving provenance and explicit translation rights metadata.

These datasets remain descriptive corpus inputs. Their presence does not create universal theological identity, equivalence, canon, or authority claims.

## Release boundary

Four version domains remain independent:

```text
spec version
package version
dataset version
aggregate corpus release version
```

Generated release/build output under `dist/` is disposable and reproducible; it is not canonical authoring state.

## Dataset expansion rules

For P12 and later data work:

1. identify exact source/edition before ingestion;
2. pin source revision/artifact and SHA-256;
3. capture source-specific rights evidence before bundling;
4. preserve source text separately from translations/annotations;
5. treat morphology/lemma data as annotations, not source-text mutation;
6. treat canon/book-set membership as edition/community context, not universal truth;
7. treat alignment as navigational/research linkage, not identity/equivalence;
8. reject or externalize content whose redistribution rights remain unresolved;
9. require deterministic recipe/checksum validation before closing the dataset task.

## Next execution sequence (revised 2026-10-24)

```text
P12-001..005, P12-007..027  complete in TODO.md
P12-006 Pali↔English Dhammapada alignment
        BLOCKED: Pali root redistribution rights unresolved
        (docs/P12-004-PALI-RIGHTS-AUDIT.md; do not bundle)
      ↓
choose the next milestone only after an explicit owner decision:
  a) clear Pali rights and finish P12-006; or
  b) P8 package build/licence work, still blocked on scope ownership; or
  c) P11 curation, P9 integration, or P10 profiles
```

The project should not expand to additional source ecosystems merely because text is easy to scrape. Sanskrit/Hindu, Sikh, Avestan/Zoroastrian, Chinese Buddhist, Taoist/Confucian, and Quran-translation candidates remain audit-only until an exact rights-safe source is approved. See `datasets/EXPANSION_TARGETS.json` for the full candidate list with rights status.

## Seed data coverage (2026-08-28, historical)

The corpus is the canonical seed data source for the MoonWitness app (`X:\REPO\moonwitness`). Current state:

```text
Traditions with complete baseline data: 12 / 12  (100%)
Exported Static Seed Bundles:           10 / 10  (100%)
Corpus to App Seed Path:                pnpm export:app-seeds (dual export to dist/app-seeds and packages/moon-witness/src/seed/data/)
```

## Milestone Status & Documentation (2026-08-28)

```text
docs/SEED_DATA_ARCHITECTURE.md    Corpus → App seed pathway design
docs/APP_ORM_MAPPING.md           51 ORM models mapped to corpus datasets
docs/APP_INTEGRATION_ADVICE.md    Bugs, fixes, and complete seed specs for 12 religions
docs/SYNC_AND_UPSTREAM_POLICY.md  Immutability philosophy & development sync pipeline
docs/SUNNAH_API_REQUEST_DRAFT.md  Ready-to-use template for sunnah-com/api GitHub issue
datasets/EXPANSION_TARGETS.json   15 candidate datasets with sources and rights
scripts/export-app-seeds.ts       CLI command (pnpm export:app-seeds) exporting 10 JSON bundles
```

