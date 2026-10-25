# SRGBL v8 — Source and Edition Rights Matrix (P19-L25)

**Status: audit only. No pilot case is cleared. Gate `blocked-human-rights` stays closed.**

This document records, for the five metadata-only Quran case pointers in
`fixtures/srgbl/quran-research-cases.json`, which edition asset each case would
need, what the repository already records about that asset's reuse terms, where
that record lives, and which parts are still UNKNOWN. It is a record of what has
been checked — not a rights clearance, not a licence opinion, and not a licence
grant for any translation, commentary, font, scan or audio asset.

## 1. What this document is not

- It does not assert public domain for any asset. Age, religion, scriptural
  status and "it is hosted publicly somewhere" are not licence evidence.
- It does not turn a repository note into a clearance. A note that a corpus
  recorded a licence expression is weaker evidence than a human reading the
  publisher's current terms.
- It does not name a reviewer. `reviewedBy` and `reviewedOn` stay `null` in every
  fixture record until a human actually reviews.
- It does not complete P19-019. That parent closes only when a human signs off
  the rights gate.

## 2. Case pointers under audit

| Case | Exact reference | Why an edition is needed |
| --- | --- | --- |
| `quran-42-51` | al-quran 42:51 | compare enumerated communication modes |
| `quran-5-48` | al-quran 5:48 | source-scoped comparative correction |
| `quran-37-30` | al-quran 37:30 (+ neighbours 37:27–33) | OFFSIDE actor/recipient diagnostics |
| `quran-20-5` | al-quran 20:5 (+ chapter opening 20:1–8) | literary-context theological reference |
| `quran-2-82` | al-quran 2:82 | bounded message and multiple key candidates |

All five are pointers. None carries embedded scripture text, translation text,
transliteration or quotation — see `textPolicy` in the fixture.

## 3. Registry inventory consulted

- `config/editions.json` lists 7 Quran editions (`quran-tanzil-uthmani`,
  `quran-saheeh-international`, `quran-indonesian-kemenag`,
  `quran-urdu-jalandhry`, `quran-turkish-diyanet`, `quran-persian-fooladvand`,
  `quran-ummah-ar-en`). **None of the 7 records a `license` or `rightsStatus`
  field.** The registry therefore cannot clear anything on its own.
- `config/sources.json` registers one Quran source, `quranenc`, with a homepage
  only (`https://quranenc.com`) and no terms or licence field.
- Rights evidence lives per dataset, not in the registries:
  - `datasets/quran-tanzil-uthmani/LICENSES/TANZIL.md` — the only Quran asset in
    this repository with a licence expression **and** an evidence URL **and** a
    re-verification date.
  - `datasets/quranenc-english-rwwad/README.md`,
    `datasets/quranenc-indonesian-kemenag/README.md` — prose terms
    (attribution, unchanged text) with no licence expression and no evidence URL.
  - `datasets/quran-tafsir-sample/README.md`,
    `datasets/quran-arabic-lexicon/README.md` — no rights statement at all.

## 4. Matrix

Text asset = the Quran text the passage pointer resolves against. Interpretation
asset = whatever edition a meaning-level claim would be read from.

| Case | Text edition | Licence expression | Evidence URL | Recorded in | Re-verified | Conditions | Interpretation edition | Case status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `quran-42-51` | `quran-tanzil-uthmani` | `CC-BY-3.0` | https://tanzil.net/docs/Text_License | `datasets/quran-tanzil-uthmani/LICENSES/TANZIL.md` | 2026-08-27 | attribution; text must not be changed | none selected | pending human confirmation |
| `quran-5-48` | `quran-tanzil-uthmani` | `CC-BY-3.0` | https://tanzil.net/docs/Text_License | same note | 2026-08-27 | attribution; text must not be changed | none selected | pending human confirmation |
| `quran-37-30` | `quran-tanzil-uthmani` | `CC-BY-3.0` | https://tanzil.net/docs/Text_License | same note | 2026-08-27 | attribution; text must not be changed | none selected | pending human confirmation |
| `quran-20-5` | `quran-tanzil-uthmani` | `CC-BY-3.0` | https://tanzil.net/docs/Text_License | same note | 2026-08-27 | attribution; text must not be changed | none selected | pending human confirmation |
| `quran-2-82` | `quran-tanzil-uthmani` | `CC-BY-3.0` | https://tanzil.net/docs/Text_License | same note | 2026-08-27 | attribution; text must not be changed | none selected | pending human confirmation |

Download/version evidence for the text asset: https://tanzil.net/docs/download
(recorded, and re-checked on the date above, inside the same note).

## 5. Documented positive

One asset in this audit has a verifiable, cited licence source: the Tanzil
Uthmani text, `CC-BY-3.0`, with an official text-licence URL, a download/version
URL, a corpus-recorded attribution string and a stated source condition that the
Quran text must not be changed. That is the standard every other row has to
reach before its status may change — the matrix cites it and describes its
conditions rather than upgrading the row to "cleared".

Note the scope limit the note itself states: it covers the Tanzil text artifact
only. It establishes nothing for modern translations, scans, fonts, audio,
commentary or unrelated metadata.

## 6. Gaps and UNKNOWN

- **Interpretation asset for all five cases: UNKNOWN.** No translation or
  commentary edition is selected, so no licence expression and no evidence URL
  exist for the reading a meaning-level claim would need. The QuranEnc READMEs
  record attribution/unchanged-text terms in prose only; prose terms without a
  licence expression and evidence URL are not a clearance.
- **Bundled translation rights: not audited.** `quran-saheeh-international`,
  `quran-indonesian-kemenag`, `quran-urdu-jalandhry`, `quran-turkish-diyanet`,
  `quran-persian-fooladvand` exist as registry ids with no rights record here.
- **Commentary and lexicon assets: no rights statement** in their dataset
  READMEs; `quran-tafsir-sample` and `quran-arabic-lexicon` must not be treated
  as reusable.
- **Human reviewer: none.** `reviewedBy: null`, `reviewedOn: null` on every case.
- **No case is publishable.** All five stay at
  `pending-human-rights-confirmation`, and the case-level `rights` field stays
  `unknown`.

## 7. Rules for changing a row

1. A row may only be marked cleared when it carries **all five** of
   `editionId`, `licenseExpression`, `evidenceUrl`, `reVerifiedOn`,
   `reviewedBy`. The fixture encodes this list in `rightsAuditPolicy.clearedRequires`
   and a regression test enforces it.
2. Never infer public domain from the age of a work, the religion it belongs to,
   the absence of a visible copyright notice, or the fact that a third party
   hosts a copy. `rightsAuditPolicy.publicDomainInference` is `prohibited`.
3. Reuse terms must come from the publisher's own terms page or licence text,
   quoted with the date it was read, not from a mirror, aggregator or dataset
   description.
4. Digital reproduction is not a licence. A bundle in `ingestion/recipes/` or a
   snapshot in `datasets/` proves only that bytes were fetched.
5. A hash is not a signature. Sealed hashes prove integrity of what was already
   collected; they never prove that collection was permitted.
6. Keep UNKNOWN as UNKNOWN. An unfilled cell is information; a guessed licence is
   a defect.
7. Human sign-off is required before any change of `status`. This document cannot
   be self-cleared by editing it.

## 8. Enforcement

- Fixture: `fixtures/srgbl/quran-research-cases.json` — top-level
  `rightsAuditPolicy` plus a `rightsAudit` block per case, mirroring this matrix.
- Regression: `packages/srgbl/src/analysis.test.ts` asserts that every case still
  carries a `rightsAudit`, that no case claims `cleared` without the five required
  fields, that `reviewedBy`/`reviewedOn` stay `null`, that the text asset cites an
  `https:` evidence URL, and that no row asserts public domain.
- Registry check: `pnpm validate:editions` (edition registry integrity) and
  `pnpm typecheck`.

## 9. What a human must decide

1. Approve or reject `CC-BY-3.0` for the Tanzil text as used by these five
   case pointers, including the no-change condition.
2. Select an exact interpretation edition per case and record its licence,
   evidence URL and read date — or record that no interpretation edition is used.
3. Fill `reviewedBy` and `reviewedOn` per case.
4. Only then may `status` move off `pending-human-rights-confirmation`, and only
   by a human edit accompanied by that evidence.
