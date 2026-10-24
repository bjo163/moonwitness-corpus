# MOONWITNESS — Apa Sebenarnya yang Dibangun?
## Contoh alur produk + definisi input/output untuk pemilik produk dan AI lokal

**Tanggal:** 2026-10-25. **Jenis:** Penjelasan operasional produk, bukan hasil penelitian ayat yang sudah disahkan.  
**Baca bersama:** [Product Story](./PRODUCT-STORY.md) · [Grandplan](./MOONWITNESS-SRGBL-V8-GRANDPLAN.md) · [Blueprint](./MOONWITNESS-SRGBL-V8-BLUEPRINT.md) · [38 Spec Teknis](./MOONWITNESS-P19-EXECUTABLE-SPECS.md).  
**Instruksi branch:** semua pengerjaan langsung di `dev`, tidak membuat branch baru.

## 1. Satu kalimat tanpa jargon

**MoonWitness adalah mesin untuk menjawab pertanyaan “kutipan ini datang dari mana, siapa yang berkata kepada siapa, apa yang betul-betul dinyatakan teks, dan tafsir/kesaksian apa yang dapat dijelaskan dengan bukti?”**

Yang dibangun bukan AI penentu kitab mana paling benar, dan bukan bot yang mengarang atau memutlakkan tafsir. Fitur riset opsional dapat mengusulkan hubungan teks dalam kerangka pembacaan tertentu, termasuk perspektif Quran-anchored yang dinyatakan secara terbuka.

## 2. Contoh perjalanan nyata yang diinginkan: pengguna mencari QS 2:82

**Skenario ini target desain, belum menunjukkan satu anotasi ayat QS 2:82 yang telah direview atau diunggah.** Nama surat/ayat adalah referensi yang ingin dicari; tidak mengarang ID kanonik atau mengutip edisi/terjemahan yang belum diverifikasi.

| Langkah | Yang dilakukan pengguna | Input ke software | Output yang diharapkan | Bila tidak tersedia |
|---|---|---|---|---|
| 1. Cari | Mengetik “QS 2:82” | Kata kunci + tradisi | Kandidat passage pada work yang terindeks dan canonical ID yang benar-benar ada | “Tidak ditemukan”/bantuan disambiguasi, **bukan** ID palsu |
| 2. Teks | Memilih edisi/language | Exact canonical passage ID | Edisi, sumber, bahasa/skrip, original dan lane terjemahan yang berizin | Metadata-only, teks tidak dipaksa tampil |
| 3. Konteks | Membuka ayat sebelum/sesudah | Passage dan work structure | Penutur/penerima/genre/cakupan bila ada bukti, source selectors, alternatif | Nilai UNKNOWN, tautan context; bukan tebak |
| 4. Key Witness | Membuka semantic keys | Passage+fragment+scheme+frame | Kandidat key seperti promise/hope **hanya bila tercatat**, evidence, metode, reviewer/unknown | “Belum ada anotasi” |
| 5. Five Layers | Menekan tab S1/R2/G3/B4/L5 | AnalysisRun + claim DAG | Source trace dan klaim terdukung/masih pending per level | UNKNOWN; tahap tidak otomatis terisi |
| 6. Message | Memilih kesimpulan turunan | Reviewed key assessments + batas | Message berlabel **derived**, referensi dan boundary note | Draft terpisah atau belum tersedia |
| 7. Swing | Meneliti kemungkinan hubungan lain | Source-backed relation + operator | Candidate baru, level depth, independent-evidence placeholder, status UNVERIFIED | Tidak mengatakan transformasi itu fakta |
| 8. Korelasi | Membandingkan teks dua kitab | Dua exact source refs + frame/metode | PARALLELS/CONTRASTS/CORRECTS_WITHIN_FRAME dengan penjelasan perspektif | UNRESOLVED; tidak auto samakan teks |
| 9. Cite | Menyalin sitasi | Edisi+fragment+hash+rights | Deep link kembali ke ayat/edisi/fragmen, tekstual dan interpretif terpisah | Pesan kenapa sitasi belum aman |

**Definisi sukses pengguna:** ia dapat menelusuri *kutipan → sumber → konteks → key/frame → pesan/batas → sitasi* tanpa ditipu status review, hak cipta atau kepastian palsu.

## 3. Apa arti satu Key?

Key adalah **label konsep yang menunjuk suatu fragmen yang dinilai oleh seorang assessor**. Bukan ayat itu sendiri, bukan angka moral, dan bukan klaim bahwa Allah memberikan wahyu baru lewat software.

Contoh *synthetic untuk memahami struktur*, bukan anotasi sah QS 2:82:

```json
{
  "passageId": "mw:passage:synthetic:demo:1",
  "contentId": "mw:content:synthetic:demo:1",
  "key": "hope",
  "scheme": "semantic-core:v0",
  "relation": "expresses",
  "frame": {
    "agent": "narrator",
    "recipient": "community",
    "domain": "research",
    "scope": "illustration",
    "genre": "example"
  },
  "direction": 1,
  "intensity": 2,
  "confidence": 0.6,
  "reviewStatus": "draft",
  "evidenceIds": ["mw:evidence:synthetic:demo:1"]
}
```

Yang harus dilakukan software: cek key dari scheme, angka tidak melampaui range, frame ada, evidence ID benar-benar ada ketika source resolver tersedia, dan status tetap DRAFT. **Mengisi reviewer dengan sembarang string bukan autentikasi review.** Struktur di atas adalah contoh input *validator*, bukan janji bahwa produk saat ini sudah punya data tersebut.

## 4. Apa arti SRGBL dan kenapa lima level?

| Level | Bahasa sederhana | Contoh PERTANYAAN, bukan putusan |
|---|---|---|
| **S1 — Source & Sense** | “Sumber yang dapat ditelusuri?” | Apakah artefak, edisi, bahasa, hak, sumber dan provenance cocok? |
| **R2 — Reality** | “Apa tertulis di teks?” | Apa yang sungguh dinyatakan oleh edisi ini; apa yang hanya terjemahan? |
| **G3 — Governing Order** | “Apa hubungannya?” | Apakah ada pola/aturan/syarat yang benar-benar didukung? |
| **B4 — Being** | “Siapa pelaku dan penerima?” | Apakah peringatan itu untuk tokoh tertentu atau semua orang? |
| **L5 — Light** | “Pesan yang dapat dipertanggungjawabkan?” | Apa pembacaan turunan, bukti, batas dan alternatifnya? |

**S1 bukan otomatis benar hanya karena sumber ditemukan**: source metadata, rights dan evidence tetap diuji. **R2 bukan pembuktian bahwa kejadian historis/gaib sungguh terjadi**: R2 mencatat apa yang teks ungkapkan. **L5 bukan skor kesucian**.

Status bisa `supported`, `partial`, `pending`, `unknown`, `unsupported`; jangan mengganti UNKNOWN dengan angka nol atau karangan.

## 5. Kenapa ada empat skor?

| Nama | Sasaran | Arti yang benar | Salah jika dipakai untuk |
|---|---|---|---|
| Maturity 0–15 | **Satu AnalysisRun** | Seberapa jauh rantai lima tahap *didukung berturut-turut* | Menyebut satu ayat lebih luhur |
| Quality 0–40 | **Mutu satu analisis** | Penilaian 10 aspek metode, data dan batas | Menilai agama atau mukjizat |
| Witness 0–100 | **Kandidat hubungan** | Seberapa baik sumber/observasi/konsistensi/cross-ref independen | Secara otomatis “bukti mukjizat” |
| Direction −2…+2 | **Key pada frame tertentu** | Arah pesan kepada *penerima/metode tertentu*, bukan positif/negatif ayat global | Mengubah semua peringatan jadi positif |

Contoh skor maturity *teknis* untuk status [supported, supported, pending, supported, supported]: hasilnya **3/15** (S1 dan R2 saja yang berurutan sah), bukan 15 dan bukan “ayat itu 3/15”.

## 6. Apa itu SWING? Contoh tanpa mengarang teologi

Input hipotesis berlabel sintetis: `A —menolong→ B`. User menekan operator “subject/object”.

- **Software boleh menghasilkan** “bagaimana jika kita meneliti apakah B juga menolong A?” sebagai *kandidat pertanyaan*.
- **Software TIDAK boleh menyatakan** “B pasti menolong A”.
- Kandidat baru menyimpan origin, operator, depth 1, status `candidate/unverified`, bukti baru masih kosong.
- Tanpa sumber terpisah dan reviewer yang berwenang, ia tidak pernah otomatis naik menjadi reviewed/discovery.

Begitu juga koreksi dengan Quran-anchored: *ini pembacaan dalam kerangka tafsir Islam tertentu*, bukan hasil uji fisika atau fakta netral yang mengatasi semua perbedaan kitab.

## 7. Bentuk layar yang dituju (wireframe teks, bukan UI selesai)

```text
MOONWITNESS CORPUS            [Search QS 2:82]        [Method: Neutral ▾]
SOURCE: Al-Qur'an / [Edition] / [Language] / [Rights: UNKNOWN]
PASSAGE: [exact canonical ID only after lookup]     [Open context] [Cite]
------------------------------------------------------------------------
[Original, if licensed]    [Translation, if separately licensed]
[Source / edition / artifact / checksum / rights / selectors]
------------------------------------------------------------------------
[S1 Source]  [R2 Text]  [G3 Relation]  [B4 Context]  [L5 Message]
SUPPORT     UNKNOWN    UNKNOWN        UNKNOWN       UNKNOWN
Evidence ...             [no generated placeholder disguised as interpretation]
------------------------------------------------------------------------
KEY WITNESS (scheme + frame + assessor + state)
- No reviewed key assessments yet / or reviewed entries when available
MESSAGE (derived) | CONTEXT | BOUNDARY | DISAGREEMENT
------------------------------------------------------------------------
SWING CANDIDATES   [Depth 1..3]  [Candidate / Unverified]
CROSS-TEXT RELATIONS [Compare source A / source B] [Method is explicit]
SCORES (Research Only: 15 / 40 / 100 / direction; never one total)
------------------------------------------------------------------------
[Citation / Original edition / Rights]       [Report source discrepancy]
```

This screen is the **target layout**, not a claim all widgets and review data are already shipped. The repo has an early `/research/srgbl` source viewer and reviewed static/API projection, but no completed independent annotator workflow or fully validated intertextual studies.

## 8. Which parts exist in dev right now? (Baseline 2026-10-25)

**Implemented as code foundations:** `packages/srgbl/src/index.ts` (scoring and Swing operators), `analysis.ts` (claim/level validation), `keys.ts` (Key/message validators), `sources.ts` (initial source adapter), `derived.ts`/`publication.ts`/`static.ts` (research export), Fastify `apps/api/src/routes/srgbl.ts`, early web `apps/web/src/app/research/srgbl/page.tsx`, synthetic tests and pointer-only research cases.

**Partially implemented:** evidence-source resolver still treats some nonblank IDs as present without lookup; reviewer authorization relies on external access control not yet completed; S1 true rights approval, exact source selector and multi-text relations need hardening; five-layer UI research preview is not a fully operational reviewed annotation system.

**Not demonstrated as completed:** real rights-cleared QS 2:82 and other reviewed analysis, paired annotator research/pilot, inter-rater validity, productive authenticated editorial decisions and a separate production `main` release. A passing compiler test does not count as research evidence.

## 9. One micro issue explained precisely: P19-L03 / GitHub #454

**Business problem:** a Content record can contain `edition_id` or `source_id` that looks nonempty but points to no real repository record. Then UI may accidentally suggest a valid trace. Current initial adapter in `packages/srgbl/src/sources.ts` checks known artifacts/provenance sets but does not fully resolve source and edition IDs.

**Input:** `CorpusPassageDetail` with `passage`, `contents`, `artifacts`, `provenance`, `evidence` and `content.source_id`/`edition_id`/`extensions.source.*`. **Do not invent source IDs.**

**Task:** ensure IDs are actually resolved via existing canonical repository/adapter resolver; if required edition/source data is not in the detail payload, provide an explicitly typed resolver or return an `unresolved` gap rather than assuming the ID is valid. Prefer extending an existing resolver rather than adding a new generic database layer.

**Expected good:** content with valid source/edition/artefact/provenance metadata and actual verified IDs may be marked `resolved` for that field; still **no automatic reviewed analysis**.

**Expected bad:** source ID `mw:source:does-not-exist` should yield a named unresolved gap even though the string is nonblank. A content linked to the wrong edition also fails.

**Tests:** construct synthetic valid / missing / wrong-record / wrong-edition cases; test `adaptPassageSources` or its new resolver seam without making HTTP requests. Existing tests are in `packages/srgbl/src/analysis.test.ts`. Run `pnpm exec tsx --test packages/srgbl/src/analysis.test.ts` and `pnpm typecheck`.

**Definition of Done:** no false resolved source metadata, no claim of rights clearance/reviewer status, regression tests, and a single commit mentioning P19-L03 on `dev`. Do not simply rename `source_unknown` to `source_unresolved` without a real existence check.

## 10. What “small AI issue” means

A title like “Validate R2” is NOT a complete assignment. Each issue should explicitly contain:
1. **Before:** what is already in the repo, which missing bug/requirement is targeted.
2. **Input:** exact data type/path and field values.
3. **Transformation:** one operation and error behavior.
4. **Output:** JSON/result/UI state examples, with success and negative cases.
5. **File scope:** 1–3 initial files, allowed limited expansion with rationale.
6. **Tests:** one named command, fixture and proof of regression, plus typecheck.
7. **DoD:** exact pass/fail evidence and one atomic commit on existing dev.
8. **Blockers:** human review/source rights/empirical study clearly separated.

See [P19-Lxx executable specs](./MOONWITNESS-P19-EXECUTABLE-SPECS.md) for **all 38** small issues with individualized input/output and edge cases.

## 11. Handoff rules and dependency order

Run **one AI agent writing to dev at a time**. `git fetch`, check clean status, `git switch dev`, `git pull --ff-only origin dev`. Never reset someone else's work; never create feature branches/PRs. If protected branch refuses direct push, report and stop.

First wave: baseline (#452), frame (#453), resolver (#454), key registry (#463), Swing (#466). Then rights/selectors/text, level DAG and scores, key messages, candidate ledger, cross-text, publication/API, UI, and research/pilot. Human/rights tasks remain blocked until genuinely approved; never fabricate records to make the dashboard look finished.

**Program complete ≠ every ticket checked.** Completion requires an evidenced user journey, approved sources, independent review, repeatable builds/tests and release decision. Until then label the UI as research-preview.
