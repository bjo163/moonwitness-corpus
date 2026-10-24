# MoonWitness Corpus — Product Blueprint

**Status:** Final v1.0 · 2026-10-24
**Peran dokumen:** blueprint eksekusi dari narasi ke arsitektur, UX, data, pilot, dan rilis.
**Pendamping:** [Cerita Produk](./PRODUCT-STORY.md) · [Key Witness v0](./KEY-WITNESS-V0.md) · [Roadmap](./ROADMAP.md)
**Scope:** v1.0 — kejelasan pembaca + pilot Key Witness. Dokumen ini tidak mengubah schema kanonik atau data yang sudah ada.

---

## 0. Blueprint satu halaman

```text
MASALAH     kutipan tanpa konteks berubah menjadi vonis dan ketakutan
INSIGHT     lapisan tengah antara teks dan tafsir belum ada
PRODUK      observatorium teks provenance-first + Key Witness
BUKTI       witness persis · frame · message turunan · disagreement · sitasi
PENGGUNA    pembaca · peneliti · verifier · kurator · developer · komunitas
MOAT        identitas kanonik + hak/provenance + semantik berskop + perbedaan
V1          kejelasan pembaca + pilot 3 tradisi × 100 passage × 2 annotator
METRIK      traceable reading session · sitasi < 60 detik · alpha ≥ 0.6
GUARDRAIL   tanpa teks sintetis · tanpa skor global/ranking · tanpa klaim otoritas
```

**Urutan eksekusi:**

```text
Phase 1  Reader clarity (P0)
Phase 2  Key foundation (KW-001..004)
Phase 3  Pilot (KW-005..008)
Phase 4  Public middle layer (KW-009..014)
Phase 5  Scale, compare, export (KW-015..020)
```

---

## 1. Definisi produk

**Kategori:** scripture & sacred-literature reference intelligence / textual observatory.

**Produk:** MoonWitness Corpus — korpus multi-tradisi dengan identitas teks kanonik, provenance, hak, dan lapisan semantik **Key Witness** yang selalu berskop metode dan frame.

**Pekerjaan utama:**

- membuat kutipan bisa dilacak ke teks, edisi, artefak, dan hak;
- membuat konteks teks terlihat sebelum tafsir;
- membuat makna dapat dicari dan dibandingkan tanpa mengubah teks;
- membuat perbedaan annotator terlihat, bukan disembunyikan;
- membuat sitasi dan ekspor dapat direproduksi.

**Non-goals v1:**

- bukan tafsir resmi atau fatwa;
- bukan chatbot agama atau penentu kebenaran;
- bukan ranking ayat, tradisi, atau komunitas;
- bukan generator teks kitab suci;
- bukan penerbit paket npm/GitHub Release (tetap mengikuti gate rilis terpisah).

**North star:** *traceable reading session* — pembaca bergerak dari kutipan/pencarian ke witness, konteks, dan sitasi tanpa bantuan.

**Guardrail produk:**

```text
NO SYNTHETIC SCRIPTURE
NO GLOBAL POSITIVE/NEGATIVE SCORE
NO VERSE OR TRADITION RANKING
NO UNSOURCED OR UNLICENSED TEXT
NO HIDDEN DISAGREEMENT
NO MODEL OUTPUT AS CANONICAL TRUTH
```

---

## 2. Kondisi saat ini

| Lapisan | Status | Catatan |
|---|---|---|
| Spec dan dataset kanonik | live | `spec/`, `datasets/`, `ingestion/`; multi-tradisi, registry lebih besar daripada corpus termaterialisasi |
| Fastify API | live | REST, SQLite FTS5, OTel/Prometheus |
| Browser SQLite | live | content-addressed, HTTP range/WASM |
| Web app | live | Next.js 16 App Router, static export, React 19, Tailwind v4, shadcn/ui |
| Key Witness | spec only | belum ada registry, data, derived index, atau UI |
| Annotation | belum mulai | belum ada tool, dataset pilot, atau agreement report |
| Score profile | belum ada | sengaja tidak ada skor global |
| Tafsir hosting | belum ada | tetap downstream dan terpisah |

### Stack berjalan

```text
Node.js 24 LTS
Next.js 16 App Router · static export · React 19 · TypeScript strict
Tailwind CSS v4 · shadcn/ui · sql.js-httpvfs
Fastify 5 · SQLite FTS5 · OpenTelemetry/Prometheus
GitHub Actions · Vercel
```

### Gap yang sudah teridentifikasi

| Gap | Dampak | Fase |
|---|---|---|
| Initial load menunggu statistik `count(*)` seluruh browser DB | panel utama tertahan; DB besar terbaca hampir seluruhnya | Phase 1 |
| Hasil `loadSemanticRules` tidak terhubung ke tabel semantic rules | panel aturan selalu kosong | Phase 1 |
| Work default bisa memiliki 0 passage | layar pertama terasa kosong | Phase 1 |
| Pagination katalog memakai panjang sampel sebagai total | indikasi "masih ada" bisa menyesatkan | Phase 1 |
| Copy citation belum menjadi aksi utama | pembaca sulit membawa sumber | Phase 1 |
| Belum ada lapisan key/message/balance | tujuan produk baru berhenti di dokumen | Phase 2-4 |

**Prinsip penanganan gap:** jangan menutupi kekosongan dengan data palsu. Tampilkan state `unavailable`, `partial`, atau `restricted` secara eksplisit.

---

## 3. Brand dan penamaan

```text
ROCKSOUL RESEARCH
└── MOONWITNESS
    └── MOONWITNESS CORPUS
        ├── RGBL                 domain TEXT / identitas kanonik
        ├── TEXT OBSERVATORY     permukaan baca & riset
        └── KEY WITNESS          lapisan tengah semantik
```

| Konteks | Nama yang dipakai |
|---|---|
| UI publik, komunikasi, onboarding | MoonWitness |
| Repo, rilis data, dokumentasi produk | MoonWitness Corpus |
| Spec, API, canonical ID, dokumen teknis | RGBL |
| Judul web app | MoonWitness Text Observatory |
| Fitur semantik | Key Witness |
| Kredit riset | Rocksoul Research |

**Keputusan final:** MoonWitness adalah brand publik; RGBL tetap nama teknis domain TEXT. Web title, metadata, dan copy publik boleh berubah ke MoonWitness tanpa mengganti nama repo, canonical ID, atau environment variable teknis.

---

## 4. Arsitektur sistem

### 4.1 Alur data

```text
UPSTREAM SOURCES
      │  pinned artifact / revision / checksum
      ▼
INGESTION RECIPES
      │  parser → normalizer → mapper
      ▼
CANONICAL CORPUS
├── work / expression / edition / artifact / passage / content
├── assertion / evidence / provenance
├── rights / availability
└── assessment (termasuk key assessments)
      │
      ├── release manifest + corpus hash
      ▼
DERIVED BUILD
├── FTS index · browser SQLite · generated catalog
└── key index · message · score · coverage · balance
      │
      ▼
DATA PLANES
├── Fastify REST API
├── Browser SQLite (WASM + HTTP range)
└── Generated catalog (fallback)
      │
      ▼
MOONWITNESS TEXT OBSERVATORY
key cards · balance · message · boundary · disagreement
```

### 4.2 Batas kanonik vs derived

| Kanonik | Derived |
|---|---|
| teks dan content | FTS index |
| canonical ID | browser SQLite |
| assertion/evidence/provenance | catalog |
| assessment, termasuk key assessment | message, score, coverage, balance |
| rights dan availability | cache dan search artifact |

Semua derived harus dapat dibangun ulang dari input kanonik. Tidak boleh ada derived yang menjadi satu-satunya salinan pengetahuan.

### 4.3 Data plane precedence

```text
1. REST API         jika dikonfigurasi dan sehat
2. Browser SQLite   default produksi tanpa API
3. Catalog          fallback aman dan startup metadata
```

UI wajib menampilkan sumber data aktif secara jujur: `Live API`, `Full browser DB`, atau `Generated catalog`.

API base dikonfigurasi melalui `NEXT_PUBLIC_RGBL_API_URL`. Pada static export, nilai ini di-inline saat build; perubahan endpoint memerlukan build ulang.

### 4.4 Kontrak performa

- Boot tidak boleh menjalankan full-table `count(*)` pada browser DB.
- Shell dan catalog dirender lebih dulu; statistik berat dimuat lazy atau dari cache.
- Browser DB diambil per chunk, bukan seluruh file pada boot.
- Target LCP < 2.5 detik pada mid-tier mobile.
- Search p95 < 300 ms setelah DB siap; passage open < 500 ms.
- Setiap query berat harus punya index atau batas; tidak ada scan tak terbatas dari UI.
- Semua angka yang ditampilkan harus berasal dari data atau ditandai sebagai sampel.

### 4.5 Gate rilis

```text
source pin + rights decision
      ↓
schema + semantic validation
      ↓
deterministic checksum + manifest
      ↓
catalog/database build
      ↓
CI: typecheck · test · validate · build · smoke
      ↓
promotion dev → main
```

Build harus gagal jika catalog dan browser DB memakai `corpusHash` yang berbeda.

---

## 5. Blueprint pengalaman

### 5.1 Peta permukaan

| Permukaan | Tujuan | Pengguna utama | Wajib menampilkan |
|---|---|---|---|
| **Home / Search** | menemukan teks dan tradisi | pembaca, peneliti | pencarian, tradisi, work, status data |
| **Work Reader** | membaca hierarchy dan passage | pembaca | work → expression → edition → passage |
| **Passage Trace** | melacak teks dan bukti | verifier, peneliti | witness, content lanes, provenance, evidence |
| **Key Witness** | melihat titik tengah | pembaca, peneliti | key, frame, direction, message, boundary, disagreement |
| **Compare** | membandingkan tanpa menyamakan | peneliti | dua passage/edisi, dimensi, batas |
| **Coverage** | melihat kesenjangan | kurator, peneliti | registered vs materialized, rights, gap |
| **Method / About** | menjelaskan batas produk | semua | apa yang diklaim dan tidak |

**Catatan implementasi:** web saat ini adalah satu halaman dengan section dan deep link query. Blueprint ini tidak mewajibkan rewrite routing; rute fisik dapat ditambahkan nanti tanpa mengubah kontrak query.

### 5.2 Deep link contract

```text
?tradition=islam
?work=mw:work:...
?passage=mw:passage:...
?q=mercy
?key=comfort
?frame=devotional
?compare=...
```

Parameter dapat dikombinasikan. Setiap perubahan state riset harus dapat dibagikan dan dipulihkan.

### 5.3 Component inventory

| Komponen | Tanggung jawab | State penting |
|---|---|---|
| `WitnessStrip` | edisi, artefak, checksum, hak | available, restricted, unavailable |
| `TextLanes` | sumber, transliterasi, terjemahan | language, script, edition |
| `KeyCard` | key, relation, frame, direction, confidence | draft, reviewed, disputed, deprecated |
| `BalanceView` | distribusi key dalam passage/work | partial, complete |
| `MessageCard` | ringkasan turunan | derived, reviewed, boundary |
| `BoundaryNote` | apa yang tidak diklaim | selalu tampil |
| `ContextCoverageMeter` | x/9 field + gap | partial, complete |
| `DisagreementPanel` | alternatif dan annotator | hidden only if none |
| `CitationActions` | copy citation, deep link, export | success, unavailable |
| `ProvenanceRail` | source → recipe → normalizer | available, metadata-only |
| `CoverageBadge` | registered vs materialized | never imply coverage from registry |
| `EmptyState` | belum tersedia/restricted/error | eksplisit, tanpa teks sintetis |
| `MethodBadge` | scheme + versi | selalu terlihat pada key/score |

### 5.4 Aturan interaksi dan aksesibilitas

- Direction ditampilkan sebagai teks + bentuk netral, bukan hanya warna.
- Tidak ada label "baik/buruk"; gunakan "arah dalam frame ini".
- Semua key dapat dibuka untuk melihat definisi, evidence, dan method.
- Message selalu berlabel `derived`.
- Disagreement tidak boleh disembunyikan di balik tooltip kecil.
- Keyboard navigation penuh; focus visible; reduced motion dihormati.
- Lane teks diberi label bahasa/script untuk screen reader.
- Angka selalu disertai `n`, `coverage`, dan `method` jika relevan.
- Mobile: kartu key dapat di-expand; balance view tetap terbaca tanpa hover.

### 5.5 State model

```text
Sumber data : api | browser | catalog
Konten      : available | partial | unavailable | restricted | error
Review      : draft | reviewed | disputed | deprecated
Lifecycle   : current | superseded | retired
Loading     : shell | catalog | database | passage | key
```

Aturan: `loading` tidak boleh menyembunyikan konten yang sudah tersedia; `unavailable` tidak boleh diganti dengan teks karangan.

---

## 6. Blueprint data

### 6.1 Record kanonik

Enam keluarga inti tetap tidak berubah:

```text
ENTITY · RESOURCE · ASSERTION · EVIDENCE · PROVENANCE · ASSESSMENT
```

Profil tekstual tetap:

```text
WORK · EXPRESSION · EDITION · ARTIFACT · PASSAGE · CONTENT · ALIGNMENT · VARIANT
```

### 6.2 Key sebagai assessment

Key tidak menambah field polaritas pada passage. Key disimpan sebagai `assessment`:

```json
{
  "target": "mw:content:...",
  "result": "comfort",
  "method": "mw:key-scheme:semantic-core:v0",
  "assessor": "mw:agent:...",
  "confidence": 0.82,
  "evidence": ["mw:evidence:..."],
  "extensions": {
    "key": {
      "scheme": "semantic-core:v0",
      "relation": "expresses",
      "frame": {
        "agent": "individual",
        "recipient": "self",
        "domain": "devotional",
        "scope": "individual",
        "genre": "prayer"
      },
      "direction": 2,
      "intensity": 3,
      "review_status": "reviewed",
      "language": "en"
    }
  }
}
```

**Target:** content untuk key yang bergantung pada bahasa/edisi; passage untuk key struktural yang berlaku lintas lane. Jangan mencampur keduanya tanpa menandai level target.

**Mengapa assessment:** nilai tidak universal, method wajib, dan dua assessment boleh berbeda. Ini semantik yang sudah dimiliki korpus.

### 6.3 Kosakata v0

- **20 key** dalam 5 keluarga.
- **12 relation**: expresses, commands, prohibits, promises, warns, narrates, praises, condemns, comforts, questions, describes, covenants.
- **5 dimensi frame**: agent, recipient, domain, scope, genre.
- **Direction**: −2..+2, selalu frame-scoped.
- **Review status**: draft, reviewed, disputed, deprecated.
- **Intensity**: 1..3.
- **Confidence**: 0..1, hanya bermakna dalam metode.

Registry key harus versioned dan tidak menjadi enum universal di core.

### 6.4 Derived layer

| Artefak | Isi | Sumber |
|---|---|---|
| `key_index` | key assessments yang lolos validasi | canonical assessment |
| `message_index` | key message, boundary note, context note | key + witness |
| `score_profile` | agregat per profile/frame | key assessments |
| `coverage_index` | context coverage per passage | witness + key + rights |
| `balance_index` | distribusi key per passage/work | key assessments |

Semua derived menyimpan `inputs`, `method`, `scheme_version`, dan `corpusHash`; tidak masuk canonical JSONL.

**Score v0:**

```text
score(p, profile) = Σ(w·d·i·c) / Σ(w·c)
coverage          = key teranotasi / key yang diharapkan
```

Score tidak pernah menjadi satu angka global, tidak menjadi ranking, dan tidak ditampilkan publik pada v0.

**Context coverage 9 field:**

```text
1. witness textual (edition + artifact)
2. rights
3. genre
4. agent
5. recipient
6. domain
7. scope
8. minimal satu key
9. minimal satu evidence/provenance
```

UI menampilkan `x/9` dan daftar gap. Ini metrik kesiapan baca, bukan penilaian isi teks.

### 6.5 Validation gates

- key ada di registry versi yang dipakai;
- relation dan frame valid;
- direction dalam −2..+2;
- intensity dan confidence dalam rentang;
- target dapat di-resolve;
- evidence minimal satu untuk status `reviewed`;
- method cocok dengan scheme version;
- `review_status` valid dan bukan pengganti lifecycle;
- tidak ada duplikat `(target, key, method, assessor)`;
- key `reviewed` wajib punya reviewer (provenance/extensions) dan frame lengkap;
- tidak ada key pada content yang tidak tersedia tanpa menandai status.

### 6.6 Lokasi implementasi yang diusulkan

| Area | Path | Status |
|---|---|---|
| Scheme registry | `config/key-witness/scheme.v0.json` | proposed |
| Profile schema | `spec/v0.1/schemes/key-witness/` | proposed |
| Pilot dataset | `datasets/key-witness-pilot/` | proposed |
| Annotation CLI | `scripts/key-witness/` | proposed |
| Derived index | `dist/key-witness/` | proposed |
| Web components | `apps/web/src/components/key-witness/` | proposed |
| API endpoint | `apps/api` (read-only derived) | proposed |

---

## 7. Blueprint editorial dan kepercayaan

### 7.1 Peran

| Peran | Tanggung jawab |
|---|---|
| Annotator | mengusulkan key, relation, frame, direction, confidence |
| Reviewer | menyetujui atau menandai disputed |
| Tradition advisor | memeriksa frame, istilah, dan konteks tradisi |
| Rights reviewer | memastikan teks/terjemahan/tafsir boleh dipakai |
| Editor | menjaga suara, batas klaim, dan konsistensi |

Tidak ada status `reviewed` tanpa reviewer yang tercatat.

### 7.2 Workflow

```text
draft → reviewed → disputed → deprecated
```

- `draft` tidak ditampilkan sebagai kesimpulan.
- `reviewed` berarti disetujui untuk scheme/versi ini, bukan kebenaran universal.
- `disputed` tetap terlihat beserta alasannya.
- `deprecated` disimpan untuk histori; tidak dihapus diam-diam.

Lifecycle record tetap `current / superseded / retired`.

### 7.3 Checklist anti-horor

- [ ] Genre ditampilkan.
- [ ] Addressee ditampilkan.
- [ ] Konteks sekitar ditampilkan jika tersedia.
- [ ] Lebih dari satu key ditampilkan jika ada.
- [ ] Balance view ditampilkan, bukan hanya key yang menakutkan.
- [ ] Tidak ada judul sensasional.
- [ ] Tidak ada potongan terjemahan untuk efek dramatis.

### 7.4 Checklist anti-overreach

- [ ] Tidak menulis "ayat ini membuktikan".
- [ ] Menggunakan "dalam frame ini" atau "menurut metode ini".
- [ ] Message turunan tidak dicampur dengan tafsir.
- [ ] Tidak mengklaim konsensus jika annotator berbeda.
- [ ] Tidak memberi nasihat medis, hukum, atau teologis.
- [ ] Tidak mengklaim otoritas universal atas tradisi mana pun.

### 7.5 Kebijakan model

- Model boleh membantu pencarian, kandidat key, dan pekerjaan anotasi.
- Output model diberi label `machine_candidate`.
- Model tidak boleh menghasilkan teks kitab suci.
- Message/score dari model tidak boleh tampil sebagai `reviewed` tanpa review manusia.
- Tidak ada "AI tafsir" atau "AI fatwa" di permukaan produk.

### 7.6 Koreksi

Koreksi harus terlihat dan dapat ditelusuri. Gunakan `superseded`, bukan menimpa record lama. Setiap koreksi mencatat sumber, alasan, dan waktu.

---

## 8. Blueprint pengukuran

### 8.1 Funnel

```text
search / quote
      ↓
exact witness
      ↓
context / frame
      ↓
key / balance
      ↓
citation
```

**North star:** persentase sesi yang mencapai citation setelah melewati witness dan context.

### 8.2 Metrik dan target

| Metrik | Target v1 |
|---|---|
| Waktu kutipan → sitasi | median < 60 detik |
| Trace completeness | ≥ 95% passage tampil punya penunjuk edisi/hak/provenance |
| Context coverage | ≥ 80% key card lengkap |
| Key coverage pilot | 300 passage dengan ≥ 1 key reviewed |
| Agreement | alpha ≥ 0.6 per key, atau revise terdokumentasi |
| Citation copy success | ≥ 95% |
| Boot | 0 full-table scan; LCP < 2.5 detik |
| Koreksi | respons pertama < 7 hari |

### 8.3 Guardrail metrics

```text
fabricated text         = 0
global score/ranking    = 0
unlicensed content      = 0
derived labels missing  = 0
reviewed keys without frame/evidence/method = 0
```

### 8.4 Events

```text
search_submitted
result_opened
passage_opened
text_lane_switched
key_opened
balance_viewed
message_viewed
disagreement_opened
citation_copied
compare_opened
correction_submitted
source_mode_changed
empty_state_seen
```

Tidak ada akun wajib untuk membaca. Analitik agregat; jangan mengumpulkan profil sensitif pembaca.

### 8.5 Evaluasi pemahaman

Sebelum scale, jalankan studi within-subject dengan 20 pembaca dan 10 passage sulit:

- kondisi A: teks + terjemahan saja;
- kondisi B: teks + konteks + Key Witness.

Ukur: pemahaman addressee, persepsi ancaman, kepercayaan pada sitasi, dan waktu menuju sitasi. Hipotesis: kondisi B meningkatkan pemahaman dan menurunkan persepsi ancaman tanpa mengurangi persepsi bahwa teks itu serius.

---

## 9. Roadmap eksekusi

| Fase | Fokus | Estimasi | Exit gate |
|---|---|---|---|
| **Phase 0** | fondasi korpus, API, web, data planes | selesai | CI hijau; web static export berjalan |
| **Phase 1** | reader clarity dan P0 gaps | 1-2 minggu | quote → citation < 60 detik; boot tanpa full scan |
| **Phase 2** | key registry, vocab, validator, message contract | 1-2 minggu | key assessment valid; message reproducible |
| **Phase 3** | pilot 3 × 100 × 2 | 3-4 minggu | 300 passage; alpha ≥ 0.6 atau revise |
| **Phase 4** | public middle layer | 2-3 minggu | key card, balance, search, disagreement, coverage |
| **Phase 5** | compare, export, review, API | 3-4 minggu | peneliti dapat mengutip key bundle secara reproducible |

### Phase 1 — Reader clarity

- pisahkan boot dari statistik DB;
- hubungkan semantic rules ke state UI;
- pilih work default yang punya passage atau tampilkan empty state yang jelas;
- perbaiki pagination katalog agar tidak mengklaim total penuh dari sampel;
- tambahkan copy citation;
- selaraskan judul web dan metadata publik ke MoonWitness Text Observatory;
- tambahkan telemetry funnel;
- pastikan semua state unavailable/restricted terlihat.

### Phase 2 — Key foundation

- KW-001 registry 20 key;
- KW-002 controlled vocabulary;
- KW-003 validator extension;
- KW-004 message contract.

### Phase 3 — Pilot

- KW-005 pilih 300 passage stratifikasi;
- KW-006 annotation tool;
- KW-007 anotasi 2 annotator;
- KW-008 agreement report dan keputusan go/no-go.

### Phase 4 — Public middle layer

- KW-009 Titik Tengah card;
- KW-010 balance view;
- KW-011 key spectrum search;
- KW-012 disagreement UI;
- KW-013 context coverage meter;
- KW-014 score profile research-only.

### Phase 5 — Scale dan export

- KW-015 compare by key;
- KW-016 citation export;
- KW-017 review workflow;
- KW-018 annotation provenance;
- KW-019 annotation licensing;
- KW-020 API/export.

---

## 10. Work breakdown

Format `KW-xxx` dipetakan ke `P18-xxx` saat disetujui masuk `TODO.md`. P18 belum ditulis ke `TODO.md` agar tidak memicu pembuatan issue otomatis sebelum keputusan pilot diratifikasi.

| KW | P18 | Fase | Deliverable | Depends | Acceptance |
|---|---|---|---|---|---|
| KW-001 | P18-001 | 2 | Key registry v0 | — | 20 key + definisi + contoh + exclusion |
| KW-002 | P18-002 | 2 | Controlled vocabularies | KW-001 | relation, frame, direction, review valid |
| KW-003 | P18-003 | 2 | Assessment extension validator | KW-001, KW-002 | key assessment valid tanpa schema core baru |
| KW-004 | P18-004 | 2 | Message schema (derived) | KW-003 | message + boundary + provenance |
| KW-005 | P18-005 | 3 | Pilot passage selection | KW-001 | 3 × 100 passage stratifikasi |
| KW-006 | P18-006 | 3 | Annotation tool | KW-003 | 2 annotator dapat mengisi key/frame/direction |
| KW-007 | P18-007 | 3 | Annotation pilot | KW-005, KW-006 | 300 passage selesai; disagreement disimpan |
| KW-008 | P18-008 | 3 | Agreement report | KW-007 | alpha per key + alasan disagreement |
| KW-009 | P18-009 | 4 | Titik Tengah card | KW-004, KW-007 | witness/key/message/boundary tampil |
| KW-010 | P18-010 | 4 | Balance view | KW-009 | distribusi key per passage/work |
| KW-011 | P18-011 | 4 | Key spectrum search | KW-009 | filter key + direction + frame |
| KW-012 | P18-012 | 4 | Disagreement UI | KW-009 | alternatif + annotator terlihat |
| KW-013 | P18-013 | 4 | Context coverage meter | KW-009 | 9 field + gap |
| KW-014 | P18-014 | 4 | Score profile v0 | KW-008 | formula + coverage + export, research-only |
| KW-015 | P18-015 | 5 | Compare by key | KW-011 | dua passage + method + batas |
| KW-016 | P18-016 | 5 | Citation export | KW-009 | teks + key bundle + rights |
| KW-017 | P18-017 | 5 | Review workflow | KW-007 | draft → reviewed → disputed |
| KW-018 | P18-018 | 5 | Annotation provenance | KW-007 | assessor + method + waktu |
| KW-019 | P18-019 | 5 | Annotation licensing | KW-004 | lisensi teks dan anotasi terpisah |
| KW-020 | P18-020 | 5 | API/export | KW-014, KW-016 | endpoint read-only + JSONL/Parquet |

**Urutan kritis:**

```text
KW-001 → KW-002 → KW-003 → KW-005 → KW-006 → KW-007 → KW-008
→ KW-009 → KW-010 → KW-013 → KW-014 → KW-016 → KW-020
```

---

## 11. Decision register

| # | Keputusan | Rekomendasi | Alasan | Status |
|---|---|---|---|---|
| 1 | Nama publik | **MoonWitness**; RGBL nama teknis | menyelesaikan drift brand tanpa mengganti ID/repo | **Final** |
| 2 | Tiga tradisi pilot | Islam (Quran), Judaism (Psalms/WLC), Buddhism (Dhammapada) | hak jelas, data siap, genre dan emosi beragam | Perlu ratifikasi |
| 3 | Cakupan key v0 | 20 key, dibekukan selama pilot | cukup luas, masih dapat dianotasi | Perlu ratifikasi |
| 4 | Visibilitas score | research-only; publik hanya coverage + balance | mencegah ranking dan penyalahgunaan | Rekomendasi |
| 5 | Tafsir | link/separate work; tidak di-host sebagai kanonik di v1 | hak dan otoritas tetap downstream | Rekomendasi |
| 6 | Reviewer | dewan editorial 3 orang + tradition advisor per pilot | `reviewed` harus dapat dipertanggungjawabkan | Perlu ratifikasi |
| 7 | Lisensi anotasi | teks dan anotasi terpisah; default CC BY 4.0 jika kontributor setuju | melindungi teks sumber dan kontributor | Rekomendasi |
| 8 | Kebijakan model | kandidat assistif, label `machine_candidate`, review manusia wajib | mencegah AI menjadi otoritas | Rekomendasi |

Keputusan 2, 3, dan 6 harus diratifikasi sebelum Phase 2/3 dimulai.

---

## 12. Risiko dan mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Score disalahgunakan untuk ranking | kredibilitas rusak | tanpa skor global; coverage + disagreement |
| Key dianggap tafsir | overreach teologis | label, definisi, method, boundary note |
| Bias annotator/model | hasil tidak adil | multi-annotator, agreement, audit |
| Biaya anotasi besar | pilot terlambat | 300 passage, active learning, tool sederhana |
| Hak terjemahan/tafsir | konten tidak boleh tampil | rights gate; translation witness terpisah |
| Backlash teologis | kehilangan kepercayaan | bahasa netral, reviewer, no ranking |
| Boot lambat | pembaca pergi | catalog-first, lazy stats, no full scan |
| Katalog basi | data tidak cocok | corpusHash gate; build gagal jika mismatch |
| Scope creep | reader belum selesai | Phase 1 dikunci sebelum key layer |
| Reviewer bottleneck | pilot macet | reviewer pool + jadwal review |

---

## 13. Definition of done v1

- [ ] 5 tugas pembaca diuji pada 5 pengguna; ≥ 4/5 berhasil tanpa bantuan.
- [ ] Median waktu kutipan → sitasi < 60 detik.
- [ ] 100% passage tampil punya penunjuk edisi/hak/provenance atau state unavailable yang eksplisit.
- [ ] 300 passage pilot punya ≥ 1 key reviewed.
- [ ] Alpha ≥ 0.6 per key, atau keputusan revise yang terdokumentasi.
- [ ] 100% key card menampilkan method, frame, review status, dan boundary note.
- [ ] 0 skor global/ranking di UI publik.
- [ ] Boot tidak menjalankan full-table scan; LCP < 2.5 detik.
- [ ] Tidak ada teks sintetis atau konten tanpa hak.
- [ ] CI hijau; derived artifacts dapat dibangun ulang.
- [ ] Kanal koreksi aktif dan tercatat.

---

## 14. Sepuluh hari kerja pertama

| Hari | Fokus | Output |
|---|---|---|
| 1-2 | ratifikasi keputusan 2-3; bekukan registry | decision record + scope pilot |
| 2-4 | Phase 1: boot, semantic rules, default work, pagination | reader clarity P0 |
| 4-6 | KW-001..003 | registry + vocab + validator |
| 6-8 | KW-005 + KW-006 | 300 passage terpilih + annotation tool |
| 8-10 | dry run 20 passage; kalibrasi annotator | laporan kalibrasi; keputusan lanjut pilot |

---

## 15. Peta repo

| Area | Path | Peran |
|---|---|---|
| Spec | `spec/` | kontrak kanonik dan profile |
| Datasets | `datasets/` | data kanonik versioned |
| Ingestion | `ingestion/` | resep source → corpus |
| Packages | `packages/` | validator, repository, SDK |
| API | `apps/api/` | Fastify REST |
| Web | `apps/web/` | Text Observatory |
| Scripts | `scripts/` | build, audit, export, annotation |
| Docs | `docs/` | narasi, blueprint, kontrak, laporan |
| Derived | `dist/` | disposable artifacts |

---

## 16. Di luar scope v1

- hosting tafsir lengkap;
- skor publik atau ranking;
- akun, sosial, komentar;
- aplikasi native;
- chatbot/AI answer engine;
- model teologi;
- pricing dan paket komersial;
- publikasi npm/GitHub Release tanpa gate terpisah.

---

## 17. Penutup

Blueprint ini selesai ketika pembaca dapat pergi dari kutipan ke sitasi tanpa kehilangan konteks, dan ketika Key Witness dapat menunjukkan spektrum pesan tanpa mengubah teks atau mengklaim otoritas.

```text
TRACE THE TEXT. DON'T QUOTE THE VIBE.
```
