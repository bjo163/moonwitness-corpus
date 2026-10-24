# Key Witness v0 — Titik Tengah antara Teks dan Tafsir

Status: draft produk & data untuk review, 2026-10-24.
Scope: konsep, model data, kosakata, UI, editorial, pilot, dan kandidat task.
Dokumen ini belum mengubah schema atau data kanonik.
Narasi final: [Cerita Produk](./PRODUCT-STORY.md) · Blueprint: [Product Blueprint](./PRODUCT-BLUEPRINT.md).

---

## 0. Ringkasan satu halaman

**Masalah.** Pembaca sering bertemu ayat atau kutipan yang dibaca tanpa konteks: tanpa genre, tanpa penerima pesan, tanpa edisi, tanpa hak, dan tanpa bukti. Akibatnya teks yang sebenarnya berskop sempit terasa seperti vonis universal. Di banyak kanal populer, hasilnya adalah pembacaan yang didominasi horor, ancaman, dan sensasi.

**Solusi.** MoonWitness menambahkan lapisan **Key Witness** di antara teks dan tafsir:

```text
TEXT / WITNESS        apa yang benar-benar tersaksi, pada edisi dan artefak mana
KEY WITNESS           konsep, relasi, frame, arah, pesan, skor — semuanya method-scoped
TAFSIR / INTERPRETASI apa yang dikatakan komunitas atau penafsir — tetap downstream
```

Lapisan ini tidak menggantikan tafsir dan tidak mengubah teks. Ia membuat teks bisa dibaca dengan konteks, dicari dengan konsep, dibandingkan dengan metode, dan dikutip dengan bukti.

**Nilai positifnya.** Bukan klaim mukjizat dan bukan "positivisasi" teks. Nilai positifnya adalah **kejelasan**: pembaca melihat genre, penerima, cakupan, dan spektrum pesan — termasuk ayat yang memang berisi peringatan. Yang dihilangkan bukan teks sulitnya, melainkan pembacaan horor yang kehilangan konteks.

**Bukan produk ini.** Bukan tafsir resmi, bukan chatbot, bukan penentu kebenaran, bukan ranking agama, bukan generator ayat.

---

## 1. Mengapa "titik tengah"

### 1.1 Lapisan yang hilang

Aplikasi kitab suci biasanya berhenti di salah satu dari dua kutub:

```text
KUTUB A                                  KUTUB B
teks mentah / terjemahan                 tafsir / ceramah / konten
sulit dipahami                           penuh kesimpulan
tidak ada konteks                        sulit diverifikasi
```

Yang hilang adalah lapisan tengah yang menjawab:

```text
Apa teksnya?
Apa yang teks ini saksikan?
Dalam frame apa?
Untuk siapa?
Dengan metode apa?
Apa yang tidak diklaim?
```

Key Witness mengisi lapisan itu.

### 1.2 Mengapa pembacaan horor terjadi

Pembacaan yang terasa seram biasanya muncul dari enam hal:

1. **Genre blindness** — puisi, narasi, hukum, doa, dan oracle diperlakukan sama.
2. **Addressee blindness** — peringatan untuk kelompok tertentu dibaca sebagai ancaman untuk semua orang.
3. **Excerpt bias** — satu kalimat diambil tanpa ayat sebelum/sesudahnya.
4. **Translation collapse** — terjemahan dianggap identik dengan teks sumber.
5. **Selection bias** — konten yang menakutkan lebih viral daripada konten yang menenangkan.
6. **No provenance** — pembaca tidak bisa memeriksa edisi, konteks, atau hak.

Key Witness tidak menyangkal ayat sulit. Ia mengembalikan konteks yang membuat ayat itu tidak lagi dibaca sebagai vonis universal.

### 1.3 Narasi positif tanpa klaim teologis

Produk ini sebaiknya tidak menjual "mukjizat" atau "pencerahan". Yang bisa dijanjikan secara jujur:

> **Kejelasan yang bisa ditelusuri.**

Atau dalam bahasa produk:

> **Bukan tafsir. Bukan sekadar teks. Titik tengahnya.**

Nilai positif yang bisa diukur:
- lebih banyak teks tampil dengan genre dan penerima yang jelas;
- lebih banyak kutipan yang disertai edisi, hak, dan provenance;
- lebih banyak pembaca yang melihat spektrum pesan, bukan satu label;
- lebih sedikit kutipan tanpa sumber.

---

## 2. Prinsip integritas

Sepuluh aturan yang tidak boleh dilanggar:

1. **Teks tidak diubah, ditambah, atau dihaluskan.** Yang tidak tersedia tetap tidak tersedia.
2. **Key bukan makna final.** Key adalah titik akses semantik, bukan tafsir.
3. **Arah wajib frame-scoped.** Tidak ada "ayat ini positif/negatif" tanpa frame.
4. **Message adalah turunan.** Selalu diberi label, metode, dan tautan ke teks.
5. **Score adalah turunan.** Tidak masuk canonical text; harus bisa direkonstruksi.
6. **Disagreement disimpan.** Dua annotator boleh berbeda; keduanya terlihat.
7. **Tidak ada ranking ayat atau tradisi** berdasarkan skor.
8. **Tidak ada teks sintetis.** Model tidak boleh mengarang isi kitab.
9. **Provenance dan rights wajib** untuk setiap witness yang ditampilkan.
10. **Tafsir tetap downstream.** Jika dihubungkan, tafsir adalah work/expression terpisah dengan hak sendiri.

---

## 3. Kosakata

| Istilah | Definisi | Bukan |
|---|---|---|
| **Witness** | Attestasi teks pada edisi/artefak tertentu | Teks baru atau tafsir |
| **Key** | Titik akses semantik yang di-anchor ke witness | Tag bebas atau makna final |
| **Relation** | Hubungan antara key dan teks (expresses, warns, promises, …) | Sentimen kata |
| **Frame** | Siapa berbicara, kepada siapa, dalam domain dan cakupan apa | Konteks opsional |
| **Direction** | Arah relatif terhadap frame, skala -2..+2 | "Baik/buruk" universal |
| **Message** | Ringkasan turunan dari witness + key | Tafsir atau fatwa |
| **Score** | Agregat turunan dari assessment dengan profile dan coverage | Properti intrinsik teks |
| **Context coverage** | Kelengkapan konteks sebuah kartu (genre, addressee, frame, evidence, rights) | Skor kebaikan teks |
| **Balance view** | Distribusi key dalam satu passage/work | Vonis positif/negatif |

---

## 4. Model data

### 4.1 Witness

Witness bukan record baru; ia adalah **peran** yang diambil dari record yang sudah ada:

| Witness type | Sumber data | Fungsi |
|---|---|---|
| `textual` | `content` + `artifact` + `edition` | teks persis |
| `variant` | `variant` | bacaan alternatif |
| `translation` | `content` pada expression terjemahan | saksi penerimaan, bukan sumber |
| `lexical` | lexicon/usage records | akar kata dan penggunaan |
| `community` | `assertion` berskop | klaim kanon/otoritas komunitas |
| `commentary` | work/expression tafsir (nanti) | interpretasi downstream |

Kartu Key Witness minimal menampilkan satu `textual` witness. Witness lain opsional dan harus diberi label jenisnya.

### 4.2 Key sebagai Assessment

Key disimpan memakai record `assessment` yang sudah ada:

- `target` → content/passage yang di-key.
- `result` → token key (`mercy`, `warning`, …).
- `method` → scheme + versi (`mw:key-scheme:semantic-core:v0`).
- `assessor` → annotator/agent.
- `confidence` → 0..1, hanya bermakna dalam metode.
- `evidence` → bukti lexicon/usage/parallel.
- `extensions.key` → relation, frame, direction, intensity, review status.

Contoh:

```json
{
  "id": "mw:assessment:key:psalm-23-4:comfort:v0",
  "record_type": "assessment",
  "target": "mw:content:example:psalm-23-4:he",
  "result": "comfort",
  "method": "mw:key-scheme:semantic-core:v0",
  "assessor": "mw:agent:pilot-annotator-a",
  "confidence": 0.82,
  "evidence": ["mw:evidence:example:lexicon-comfort"],
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

**Mengapa tidak menambah field `polarity` di passage?** Karena itu akan menjadikan penilaian sebagai properti intrinsik teks. Assessment sudah punya semantik yang benar: nilainya tidak universal, metode wajib, dan dua assessment boleh berbeda.

### 4.3 Message (derived)

Message bukan record kanonik. Ia disimpan di derived index dan selalu menunjuk balik ke key assessments.

```json
{
  "id": "mw:message:psalm-23-4:comfort:v0",
  "passage": "mw:passage:example:psalm-23-4",
  "kind": "key_message",
  "text": "Dalam situasi berbahaya, penutur menyaksikan kepercayaan pada bimbingan.",
  "method": "curated:v0",
  "review": "reviewed",
  "source_keys": ["mw:assessment:key:psalm-23-4:comfort:v0"],
  "boundary_note": "Bukan klaim bahwa bahaya itu baik, dan bukan janji universal untuk semua pembaca.",
  "provenance": "mw:provenance:example:editorial-v0"
}
```

Tiga jenis message:

| Jenis | Isi | Contoh |
|---|---|---|
| `key_message` | ringkasan 1–2 kalimat | "Penutur menyaksikan kepercayaan…" |
| `boundary_note` | apa yang tidak diklaim | "Bukan janji universal…" |
| `context_note` | genre, addressee, situasi | "Doa individual dalam genre puisi Ibrani." |

### 4.4 Score (derived)

Score adalah agregat dari key assessments. Aturan:

- selalu per `profile` + `frame`;
- selalu menyertakan `coverage`, `n`, `agreement`;
- tidak pernah menjadi satu angka global;
- tidak masuk canonical JSONL;
- dapat direkonstruksi dari `inputs`.

Contoh:

```json
{
  "passage": "mw:passage:example:psalm-23-4",
  "profile": "devotional-clarity:v0",
  "score": 0.72,
  "coverage": 0.5,
  "n": 3,
  "agreement": 0.78,
  "distribution": [2, 2, 1],
  "inputs": [
    "mw:assessment:key:psalm-23-4:comfort:v0",
    "mw:assessment:key:psalm-23-4:trust:v0"
  ]
}
```

Rumus v0:

```text
score(p, profile) = Σ(w_k · d_k · i_k · c_k) / Σ(w_k · c_k)
coverage          = key teranotasi / key yang diharapkan
```

`d` = direction (-2..+2 dinormalisasi), `i` = intensity, `c` = confidence, `w` = bobot scheme.

### 4.5 Context coverage (produk-oriented)

Ini metrik yang lebih aman dan lebih berguna daripada "skor positif":

```text
context_coverage = field terisi / field wajib
```

Field wajib:
- witness textual (edition, artifact, rights)
- genre
- agent
- recipient
- domain
- scope
- minimal satu key
- minimal satu evidence/provenance

Kegunaan:
- menunjukkan seberapa siap sebuah passage untuk dibaca publik;
- mendorong kurator melengkapi konteks;
- tidak menghakimi isi teks.

UI menampilkan:

```text
Konteks: 7/9 lengkap
Celah: recipient, genre
```

Ini jauh lebih jujur daripada “skor kebaikan 8/10”.

### 4.6 Balance view

Untuk menjawab kekhawatiran "semua terasa horor", tampilkan distribusi key, bukan skor tunggal:

```text
Mercy        ●●●●○
Warning      ●●○○○
Narrative    ●●●○○
Justice      ●●○○○
Comfort      ●●●●○
```

Dengan begitu pembaca melihat bahwa satu passage atau satu work punya spektrum, bukan satu nada.

---

## 5. Kosakata terkontrol v0

### 5.1 Dua puluh key

| Family | Key | Definisi netral | Relasi umum |
|---|---|---|---|
| Mercy & Compassion | `mercy` | belas kasih yang diberikan tanpa klaim hak | expresses, promises |
| | `compassion` | empati terhadap penderitaan | expresses, commands |
| | `forgiveness` | pengampunan atas kesalahan | expresses, promises |
| | `comfort` | penghiburan dalam kesulitan | expresses, comforts |
| Justice & Order | `justice` | keadilan dan keseimbangan | expresses, commands |
| | `truth` | kebenaran, kejujuran, kesaksian | expresses, commands |
| | `accountability` | pertanggungjawaban tindakan | warns, describes |
| | `restoration` | pemulihan hubungan/keadaan | promises, expresses |
| Devotion & Trust | `praise` | pujian dan penghormatan | expresses, praises |
| | `gratitude` | syukur atas pemberian | expresses, commands |
| | `trust` | bersandar/percaya | expresses, comforts |
| | `hope` | harapan akan keadaan lebih baik | promises, expresses |
| Character & Wisdom | `patience` | ketabahan dalam proses | commands, expresses |
| | `humility` | kerendahan hati | commands, expresses |
| | `generosity` | kemurahan berbagi | commands, expresses |
| | `wisdom` | pemahaman yang membimbing tindakan | expresses, describes |
| Narrative & Warning | `narrative` | cerita/peristiwa yang disaksikan | narrates, describes |
| | `warning` | peringatan berskop | warns, describes |
| | `promise` | janji berskop | promises, expresses |
| | `covenant` | perjanjian/ikatan berskop | covenants, expresses |

Catatan:
- Key bukan enum universal di core. Ini kosakata scheme yang versioned.
- Key boleh ditambah di v1 setelah pilot.
- Setiap key punya definisi, contoh, exclusion, dan label multibahasa di registry.

### 5.2 Relasi

```text
expresses   menyatakan sikap/nilai
commands    memerintahkan
prohibits   melarang
promises    menjanjikan
warns       memperingatkan
narrates    menceritakan
praises     memuji
condemns    mengecam
comforts    menghibur
questions   mempertanyakan
describes   mendeskripsikan
covenants   mengikat perjanjian
```

### 5.3 Frame

| Dimensi | Nilai v0 |
|---|---|
| `agent` | divine, prophet, narrator, community, individual, other |
| `recipient` | humanity, believers, community, individual, opponents, creation, unspecified |
| `domain` | devotional, ethical, legal, narrative, eschatological, wisdom, ritual |
| `scope` | individual, community, universal, local, unspecified |
| `genre` | prayer, poetry, law, narrative, dialogue, list, prose, oracle |

Frame wajib. Tanpa frame, key tidak boleh dipublikasikan sebagai reviewed.

### 5.4 Direction

```text
-2  kuat negatif terhadap recipient/frame
-1  negatif
 0  netral / campuran
+1  positif
+2  kuat positif
```

Aturan:
- arah bukan sentimen kata;
- satu passage boleh punya beberapa arah untuk key berbeda;
- satu key boleh punya arah berbeda untuk frame berbeda;
- direction wajib disertai relation dan frame.

### 5.5 Review status

```text
draft      diusulkan, belum direview
reviewed   disetujui reviewer untuk skema/versi ini
disputed   ada keberatan tercatat; jangan disembunyikan
deprecated tidak dipakai lagi; tetap disimpan untuk histori
```

`review_status` hidup di `extensions.key`, bukan di lifecycle record. Lifecycle tetap `current/superseded/retired`.

---

## 6. Contoh kartu (ilustrasi struktur, bukan tafsir)

### 6.1 Mazmur 23:4

```text
WITNESS
  text      : teks Ibrani (edisi WLC)
  artifact  : SHA-256, URI, availability
  rights    : public domain / CC
  provenance: source → recipe → normalizer

KEY
  comfort   expresses  frame: individual → self, devotional, prayer   +2
  trust     expresses  frame: individual → self, devotional, prayer   +2
  fear      expresses   frame: individual → self, devotional, prayer -1

MESSAGE (derived)
  "Dalam situasi berbahaya, penutur menyaksikan kepercayaan pada bimbingan."
BOUNDARY
  "Bukan klaim bahwa bahaya itu baik; bukan janji universal untuk semua pembaca."

CONTEXT COVERAGE
  9/9

BALANCE
  comfort 4 · trust 3 · fear 2
```

### 6.2 QS 1:2 (ilustrasi struktur)

```text
WITNESS
  text      : Tanzil Uthmani v1.1
  artifact  : SHA-256, URI, rights
KEY
  praise    expresses  frame: creation → divine, devotional   +2
  gratitude expresses  frame: creation → divine, devotional   +2
MESSAGE (derived)
  "Pujian dan syukur kepada Tuhan pemelihara seluruh alam."
BOUNDARY
  "Bukan klaim bahwa semua komunitas menerima otoritas teks ini."
```

### 6.3 Dhammapada 1 (ilustrasi struktur)

```text
WITNESS
  text      : Pali root / terjemahan sebagai witness terpisah
KEY
  wisdom    expresses  frame: narrator → practitioner, ethical   +1
  narrative describes  frame: narrator → practitioner, ethical    0
  accountability warns frame: narrator → practitioner, ethical   -1
MESSAGE (derived)
  "Tindakan dan keadaan batin saling terkait; pesan dibingkai sebagai instruksi, bukan vonis."
BOUNDARY
  "Bukan penilaian terhadap individu tertentu."
```

---

## 7. Anatomi UI

Setiap passage memiliki **Titik Tengah card**:

```text
┌─────────────────────────────────────────────────────────────┐
│ WORK · EDITION · CITATION                                   │
│ [Witness strip] edition · artifact · checksum · rights      │
├─────────────────────────────────────────────────────────────┤
│ [Text lanes] original · transliteration · translation       │
├─────────────────────────────────────────────────────────────┤
│ [Balance view] mercy ●●●●○  warning ●●○○○  narrative ●●●○○  │
├─────────────────────────────────────────────────────────────┤
│ [Key cards]                                                 │
│  mercy    expresses  divine → creation  devotional   +2     │
│  warning  warns      divine → opponents eschatological -1   │
│  [evidence] [confidence] [reviewed]                         │
├─────────────────────────────────────────────────────────────┤
│ [Message] ringkasan turunan + boundary note                 │
│ [Disagreement] alternatif & annotator                       │
├─────────────────────────────────────────────────────────────┤
│ [Actions] cite · compare · export · provenance              │
└─────────────────────────────────────────────────────────────┘
```

Aturan UI:
- direction ditampilkan sebagai teks + warna netral, bukan badge "baik/buruk";
- setiap key bisa diklik untuk melihat evidence dan definisi;
- message selalu punya label `derived`;
- disagreement tidak disembunyikan;
- semua angka punya `n`, `coverage`, dan `method`.

---

## 8. User flow

### A. Reader
```text
buka → pilih work → baca passage → lihat Titik Tengah
→ ganti terjemahan → bookmark → copy citation
```

### B. Researcher
```text
cari kutipan → trace → lihat key + evidence
→ bandingkan edisi/terjemahan → export sitasi
```

### C. Verifier
```text
klaim → assertion → evidence → witness → passage
```

### D. Key explorer
```text
passage → balance view → key card → frame/direction
→ bandingkan lintas tradisi → lihat disagreement → export
```

### E. Curator
```text
sumber → recipe → checksum → validasi
→ annotate key → review → rilis → browser DB/API
```

### F. Developer
```text
kontrak → key assessment → API/export → pin release → embed
```

---

## 9. Panduan editorial

### 9.1 Anti-horor

- Selalu tampilkan genre dan addressee.
- Jangan tampilkan satu ayat tanpa konteks minimal satu ayat sebelum/sesudah.
- Bedakan peringatan berskop dari ancaman universal.
- Tampilkan lebih dari satu key jika ada.
- Tampilkan balance view, bukan hanya key yang menakutkan.
- Jangan memakai judul sensasional.
- Jangan memotong terjemahan untuk efek dramatis.

### 9.2 Anti-overreach

- Jangan menulis "ayat ini membuktikan…".
- Gunakan "dalam frame ini…", "menurut metode ini…", "annotator A mencatat…".
- Jangan mencampur tafsir dengan message turunan.
- Jangan mengklaim konsensus jika annotator berbeda.
- Jangan memberi nasihat medis, hukum, atau teologis.

### 9.3 Bahasa

- "Arah" bukan "baik/buruk".
- "Peringatan" bukan "ancaman".
- "Key" bukan "makna".
- "Message turunan" bukan "tafsir".
- "Belum tersedia" bukan "tidak ada".

---

## 10. Pilot v0

### 10.1 Cakupan

```text
3 tradisi × 100 passage = 300 passage
2 annotator per passage
20 key, 12 relasi, 5 frame
1 periode: 2–3 minggu
```

Pilihan tradisi (kandidat, menunggu keputusan):
- Islam — Quran (Arab) + terjemahan sebagai witness terpisah.
- Judaism — Psalms/Genesis (Ibrani).
- Buddhism — Dhammapada (Pali/English) atau Christianity — Gospel (Greek).

Pilih berdasarkan hak yang paling jelas dan data yang paling siap.

### 10.2 Protokol

1. Pilih 100 passage per tradisi secara stratifikasi: doa, narasi, hukum, puisi, peringatan.
2. Dua annotator memberi key, relation, frame, direction, confidence.
3. Reviewer menyelesaikan disagreement; disagreement tetap disimpan.
4. Hitung agreement per key (Cohen's kappa / Krippendorff's alpha).
5. Ukur waktu annotasi per passage.
6. Kumpulkan alasan disagreement.
7. Tulis laporan go/no-go.

### 10.3 Metrik

```text
coverage            % passage dengan minimal 1 key reviewed
agreement           alpha per key
trace completeness  % key dengan evidence + method + provenance
context coverage    % kartu dengan 9/9 field
time per passage    menit
disagreement rate   % key dengan >1 arah
```

### 10.4 Deliverable

- 300 Titik Tengah cards.
- Registry key v0.1 (definisi, contoh, exclusion).
- Laporan agreement + rekomendasi.
- Score profile v0 (research-only).
- Keputusan: scale, revise, atau stop.

---

## 11. Kandidat task

Format ID `KW-xxx`; dipetakan ke `TODO.md` sebagai P18-001..P18-020.

| ID | Task | Acceptance | Prioritas |
|---|---|---|---|
| KW-001 | Key registry v0 | 20 key + definisi + contoh + exclusion | P0 |
| KW-002 | Controlled vocabularies | relation, frame, direction, review status tervalidasi | P0 |
| KW-003 | Assessment extension validator | key assessment valid tanpa schema core baru | P0 |
| KW-004 | Message schema (derived) | message + boundary + provenance | P0 |
| KW-005 | Pilot passage selection | 3×100 passage stratifikasi | P0 |
| KW-006 | Annotation tool | CLI/web sederhana untuk 2 annotator | P0 |
| KW-007 | Annotation pilot | 300 passage selesai | P0 |
| KW-008 | Agreement report | alpha + disagreement reasons | P0 |
| KW-009 | Titik Tengah card UI | witness/key/message/boundary | P1 |
| KW-010 | Balance view | distribusi key per passage | P1 |
| KW-011 | Key spectrum search | filter key + direction | P1 |
| KW-012 | Disagreement UI | alternatif + annotator | P1 |
| KW-013 | Context coverage meter | 9 field + gap | P1 |
| KW-014 | Score profile v0 | formula + coverage + export | P1 |
| KW-015 | Compare by key | dua passage + method | P2 |
| KW-016 | Citation export | key bundle + teks + rights | P2 |
| KW-017 | Review workflow | draft → reviewed → disputed | P2 |
| KW-018 | Annotation provenance | assessor + method + time | P2 |
| KW-019 | Annotation licensing | teks vs anotasi terpisah | P3 |
| KW-020 | API/export | endpoint + JSONL/Parquet | P3 |

Urutan eksekusi yang disarankan:

```text
KW-001 → KW-002 → KW-003 → KW-005 → KW-006 → KW-007
→ KW-008 → KW-009 → KW-010 → KW-013 → KW-014
```

---

## 12. Keputusan yang dibutuhkan

1. Nama publik: **final — MoonWitness (publik), RGBL (nama teknis).** Lihat [Cerita Produk](./PRODUCT-STORY.md).
2. Tiga tradisi pilot.
3. Cakupan key v0: 20 key di atas atau lebih kecil.
4. Apakah score ditampilkan publik atau research-only.
5. Apakah tafsir di-host, di-link, atau tidak sama sekali.
6. Siapa reviewer yang berwenang menandai `reviewed`.
7. Lisensi anotasi: apakah key/message punya lisensi terpisah.
8. Kebijakan model: apakah model boleh menghasilkan key/message, dan bagaimana labelnya.

---

## 13. Risiko

| Risiko | Mitigasi |
|---|---|
| Skor disalahgunakan untuk ranking | tidak ada skor global; tampilkan coverage + disagreement |
| Key dianggap tafsir | label, definisi, method, boundary note |
| Bias annotator/model | multi-annotator, agreement, audit |
| Biaya anotasi besar | pilot 300 passage, active learning |
| Hak terjemahan | translation witness terpisah; jangan campur |
| Backlash teologis | bahasa netral, reviewer, no ranking |
| Scope creep | reader dulu, key pilot kemudian |

---

## 14. Definisi sukses

Produk dianggap berhasil jika:

1. Pembaca bisa pergi dari kutipan ke sitasi lengkap dalam < 60 detik.
2. Setiap kartu menampilkan witness, minimal satu key, message turunan, dan boundary note.
3. Tidak ada teks tampil tanpa provenance/rights pointer.
4. Balance view tersedia untuk setiap passage yang punya key.
5. Score selalu disertai method, coverage, n, agreement.
6. Pilot menghasilkan agreement yang cukup untuk scale (target alpha ≥ 0.6 per key).
7. Tidak ada ranking ayat/tradisi berdasarkan skor.

---

## 15. Catatan penutup

Key Witness bukan jalan pintas untuk membuat semua teks terasa menyenangkan. Ini jalan untuk membuat teks **terbaca dengan benar**: lengkap, berskop, dan bisa diperiksa. Kalau ada nilai "positif" yang bisa dijanjikan, itu adalah **kejelasan yang mengurangi kepanikan** — bukan penghapusan teks yang sulit.
