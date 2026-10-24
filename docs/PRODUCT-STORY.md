# MoonWitness — Cerita Produk

**Status:** Final v1.0 · 2026-10-24
**Peran dokumen:** narasi kanonik brand dan produk.
**Pendamping:** [Product Blueprint](./PRODUCT-BLUEPRINT.md) · [Key Witness v0](./KEY-WITNESS-V0.md)

> **Bukan tafsir. Bukan sekadar teks. Titik tengahnya.**

---

## 0. Satu paragraf

MoonWitness adalah observatorium teks suci yang membuat setiap kutipan bisa dilacak kembali ke sumber, edisi, hak, dan konteksnya — lalu menunjukkan titik tengah antara apa yang teks saksikan dan apa yang ditafsirkan. Ia tidak menggantikan tafsir, tidak menghakimi pembaca, dan tidak menghaluskan teks yang sulit. Ia mengembalikan hal yang paling sering hilang dari kutipan: konteks yang bisa diperiksa.

**English one-liner:** A provenance-first scripture observatory that turns quotes into traceable text — and shows the middle point between text and interpretation.

**Kategori:** scripture & sacred-literature reference intelligence / textual observatory.
**Bukan:** aplikasi tafsir, chatbot agama, mesin fatwa, atau generator ayat.

---

## 1. Malam ketika sebuah kutipan terasa seperti vonis

Bayangkan sebuah video pendek. Di layar, satu kalimat dari kitab suci. Tidak ada nama kitab, tidak ada nomor ayat, tidak ada edisi, tidak ada penjelasan siapa yang dituju. Kalimat itu keras. Penonton merasa sedang dibicarakan.

Teksnya mungkin autentik. Terjemahannya mungkin benar. Yang hilang adalah bingkainya: genre, penerima, cakupan, dan sumber. Tanpa bingkai itu, pembaca mengisi sendiri bagian yang kosong — biasanya dengan ketakutan.

Tiga hal hilang bersamaan:

1. **Genre** — doa, puisi, hukum, narasi, dan peringatan diperlakukan sama.
2. **Addressee** — peringatan untuk kelompok tertentu dibaca sebagai ancaman untuk semua orang.
3. **Provenance** — tidak ada edisi, artefak, checksum, atau hak yang bisa diperiksa.

Kekosongan konteks tidak pernah netral. Ia selalu diisi oleh ketakutan pembaca.

---

## 2. Dua kutub dan satu ruang kosong

Aplikasi kitab suci biasanya berhenti di salah satu dari dua kutub:

| Kutub | Yang diberikan | Yang hilang |
|---|---|---|
| **Teks mentah** | isi dan terjemahan | genre, penerima, konteks, hak |
| **Tafsir** | kesimpulan dan makna | jejak sumber, batas klaim, disagreement |
| **Titik tengah** | teks + konteks + key + batas | bukan tafsir, bukan vonis |

Titik tengah bukan kompromi antara teks dan tafsir. Ia lapisan yang membuat keduanya bisa dibedakan. Di lapisan ini, pembaca dapat melihat:

```text
Apa teksnya?
Apa yang teks ini saksikan?
Dalam frame apa?
Untuk siapa?
Dengan metode apa?
Apa yang tidak diklaim?
```

Itulah **Key Witness**.

---

## 3. Tujuh keyakinan

1. **Teks tidak boleh dikarang.** Jika sebuah edisi belum tersedia, produk menampilkan "belum tersedia". Ia tidak mengisi kekosongan dengan teks sintetis.
2. **Kesulitan bukan alasan untuk menghapus.** Teks yang keras tetap ditampilkan. Yang dihilangkan adalah kebingungan di sekitarnya, bukan isi teksnya.
3. **Konteks adalah bagian dari teks yang dibaca.** Genre, penerima, dan cakupan bukan hiasan; tanpa itu, pembaca membaca kalimat yang berbeda.
4. **Terjemahan adalah saksi, bukan sumber.** Terjemahan menunjukkan penerimaan dan pemahaman, tetapi tidak menggantikan teks sumber.
5. **Perbedaan adalah data.** Dua annotator boleh berbeda. Perbedaan yang disembunyikan menjadi kepalsuan; perbedaan yang terlihat menjadi pengetahuan.
6. **Skor bukan kebenaran.** Setiap angka adalah turunan dari metode, frame, dan bukti. Tidak ada satu angka global yang menentukan nilai sebuah ayat.
7. **Pembaca berhak tahu apa yang tidak diklaim.** Batas klaim ditulis, bukan disimpulkan sendiri oleh pembaca.

---

## 4. Lima babak pembaca

Ini adalah perjalanan inti produk. Setiap babak menjawab satu pertanyaan, dan setiap babak punya godaan yang harus ditolak.

### Babak 1 — Menemukan

**Yang pembaca cari:** "Ini teks yang mana?"

Pembaca datang dari kutipan, screenshot, video, atau pencarian. MoonWitness mencocokkan kutipan dengan teks kanonik, bukan dengan "ayat yang mirip". Hasil pencarian menunjukkan work, bahasa, dan sumber; bukan sekadar potongan kalimat.

**Yang tidak boleh terjadi:** menampilkan teks yang mirip sebagai identik, atau mengarang ayat untuk memenuhi pencarian.

### Babak 2 — Melacak

**Yang pembaca cari:** "Ini dari edisi dan sumber mana?"

MoonWitness menampilkan rantai identitas:

```text
WORK → EXPRESSION → EDITION → ARTIFACT → PASSAGE → CONTENT
```

Bersama rantai itu: canonical ID, checksum, URI artefak, status ketersediaan, dan hak penggunaan. Pembaca dapat melihat bahwa teks ini bukan sekadar kutipan, tetapi record yang bisa diperiksa.

**Yang tidak boleh terjadi:** menampilkan teks tanpa penunjuk edisi/hak, atau menyembunyikan bahwa sebuah content bersifat metadata-only atau restricted.

### Babak 3 — Membaca konteks

**Yang pembaca cari:** "Ini untuk siapa, dalam genre apa, dan di sekitarnya ada apa?"

MoonWitness menampilkan genre, penerima, cakupan, domain, dan passage sebelum/sesudahnya jika tersedia. Lane teks dipisahkan dengan jelas: sumber, transliterasi, dan terjemahan. Setiap lane menyebut bahasa, script, dan edisinya.

**Yang tidak boleh terjadi:** memperlakukan terjemahan sebagai teks sumber; menampilkan satu ayat seolah-olah ia berdiri sendiri ketika konteksnya tersedia.

### Babak 4 — Melihat titik tengah

**Yang pembaca cari:** "Apa yang sebenarnya disaksikan teks ini?"

MoonWitness menampilkan **Titik Tengah card**:

- key yang ter-anchor ke witness;
- relation dan frame;
- direction yang selalu frame-scoped;
- intensity dan confidence;
- balance view, bukan satu label;
- message turunan dengan label `derived`;
- boundary note: apa yang tidak diklaim;
- disagreement: siapa yang berbeda dan mengapa;
- context coverage: seberapa lengkap konteks kartu ini.

**Yang tidak boleh terjadi:** memberi label global "ayat ini positif/negatif"; menyembunyikan disagreement; menyajikan message turunan sebagai tafsir.

### Babak 5 — Membawa pulang

**Yang pembaca cari:** "Bagaimana saya mengutip ini dengan benar?"

MoonWitness menyediakan sitasi yang membawa teks, edisi, artefak, checksum, hak, dan tautan balik. Pembaca dapat menyalin sitasi, menyimpan deep link, berpindah lane terjemahan, atau mengirim koreksi.

**Yang tidak boleh terjadi:** sitasi tanpa edisi; tautan yang kehilangan konteks; koreksi yang tidak terlihat.

---

## 5. Titik tengah, bukan positivisasi

Key Witness bukan lapisan yang membuat semua teks terdengar menyenangkan. Ia lapisan yang membuat teks yang sama terbaca dengan frame yang lengkap.

Contoh ilustratif, Mazmur 23:4:

| Key | Relation | Frame | Arah |
|---|---|---|---|
| `comfort` | expresses | individual → self · devotional · prayer | +2 |
| `trust` | expresses | individual → self · devotional · prayer | +2 |
| `fear` | expresses | individual → self · devotional · prayer | −1 |

Kartu ini tidak berkata "ayat ini positif". Ia berkata: dalam frame doa individual, rasa takut dan kepercayaan hadir bersama. Pembaca melihat keduanya.

Balance view menampilkan distribusi, bukan vonis:

```text
comfort   ●●●●○
trust     ●●●●○
fear      ●●○○○
```

Yang positif bukan skornya. Yang positif adalah pembaca tidak lagi hanya melihat satu nada.

### Tentang "mukjizat positif"

Kami tidak menjual mukjizat. Kami menjual kejelasan. Tetapi bagi banyak pembaca, kejelasan terasa seperti kelegaan: teks yang tadinya terasa seperti vonis berubah menjadi teks yang bisa dibaca, dipahami, dan dikutip.

Jika ada yang terasa seperti mukjizat di sini, itu bukan klaim teologis produk. Itu efek dari membaca teks yang sama secara utuh — dengan genre, penerima, dan batasnya.

Yang kami sebut positif dapat diukur:

- pembaca melihat genre dan penerima;
- pembaca melihat lebih dari satu key;
- pembaca melihat perbedaan annotator;
- pembaca bisa menelusuri bukti;
- pembaca bisa mengutip dengan benar.

Tidak satu pun dari ini mengklaim kebenaran teologis. Semuanya mengklaim sesuatu yang lebih sederhana: **kejelasan yang bisa diperiksa.**

---

## 6. Karakter dan suara

MoonWitness adalah **kurator observatorium**, bukan pendeta, hakim, influencer, atau chatbot.

Ia tenang, presisi, dan hangat secukupnya. Ia tidak menaikkan ketegangan untuk mendapat perhatian. Ia tidak memakai kata-kata sensasional untuk membuat teks terasa lebih dramatis. Ia menjelaskan batasnya sendiri.

| Pakai | Hindari |
|---|---|
| "Arah" | "baik/buruk" |
| "Peringatan" | "ancaman" |
| "Key" | "makna final" |
| "Message turunan" | "tafsir" |
| "Belum tersedia" | "tidak ada" |
| "Disputed" dengan alasan | menyembunyikan perbedaan |
| "Dalam frame ini" | "ayat ini membuktikan" |
| "Annotator A mencatat" | "semua orang tahu" |

Contoh microcopy:

```text
Teks untuk edisi ini belum tersedia.
Kami tidak mengisinya dengan teks sintetis.

Message turunan · metode curated:v0 · 2 key · belum reviewed

Annotator B mencatat arah berbeda untuk key ini.
Kedua penilaian ditampilkan.

Salin sitasi · edisi · artefak · checksum · hak
```

---

## 7. Arsitektur brand

```text
ROCKSOUL RESEARCH
└── MOONWITNESS                  brand publik / ekosistem
    └── MOONWITNESS CORPUS       produk korpus terbuka
        ├── RGBL                 domain TEXT / identitas kanonik
        ├── TEXT OBSERVATORY     permukaan baca & riset
        └── KEY WITNESS          lapisan tengah semantik
```

| Nama | Peran | Dipakai di |
|---|---|---|
| **MoonWitness** | brand publik | komunikasi, UI publik, materi produk |
| **MoonWitness Corpus** | produk/korpus terbuka | repo, dokumentasi produk, rilis data |
| **RGBL** | domain TEXT kanonik | spec, API, canonical ID, dokumen teknis |
| **MoonWitness Text Observatory** | permukaan baca/riset | web app |
| **Key Witness** | lapisan tengah | fitur, editorial, anotasi |
| **Rocksoul Research** | lab/ekosistem | kredit, konteks riset |

Aturan penamaan:

- Konsumen melihat **MoonWitness**, bukan RGBL.
- Dokumen teknis dan ID tetap memakai **RGBL**.
- Jangan menyebut RGBL sebagai otoritas agama.
- Jangan menyebut MoonWitness sebagai klaim teologis.
- Jangan menyebut Key Witness sebagai tafsir.
- Jangan mencampur nama teknis dan nama publik dalam satu kalimat promosi.

---

## 8. Audiens dan pekerjaan yang harus diselesaikan

| Audiens | Pekerjaan | Rasa sakit | Keberhasilan |
|---|---|---|---|
| **Pembaca** | memahami apa yang sedang dibaca | takut, bingung, merasa diancam | menemukan sumber dan konteks dalam < 60 detik |
| **Peneliti** | mengutip dengan pertanggungjawaban | sitasi tanpa edisi, teks tanpa provenance | sitasi lengkap dan dapat direproduksi |
| **Verifier** | memeriksa klaim | screenshot tanpa sumber, klaim tanpa bukti | rantai klaim → bukti → passage |
| **Kurator** | menjaga data tetap jujur | alat anotasi tersebar, review tidak terlacak | annotation + review + coverage yang terlihat |
| **Developer** | mengintegrasikan tanpa mengarang | API tidak stabil, data derived tercampur | API/export yang jelas batasnya |
| **Komunitas tradisi** | representasi yang benar | distorsi, salah kutip, konteks hilang | kanal koreksi dan review yang tercatat |

---

## 9. Janji dan bukti

| Janji | Mekanisme | Bukti yang terlihat |
|---|---|---|
| "Kutipan ini nyata" | canonical witness | edisi, artefak, checksum |
| "Kami tidak mengarang" | source-preserving text | label unavailable, tanpa teks sintetis |
| "Konteksnya jelas" | frame | genre, penerima, domain, cakupan |
| "Perbedaan terlihat" | multi-assessment | disagreement panel + annotator |
| "Bisa dikutip" | citation scheme | copy citation + deep link |
| "Hak jelas" | rights metadata | rights badge per witness |
| "Tidak ada ranking" | no global score | balance view + coverage, bukan peringkat |

---

## 10. Garis yang tidak kami lewati

1. Tidak menciptakan teks kitab suci.
2. Tidak memberi skor positif/negatif global pada ayat atau tradisi.
3. Tidak memberi peringkat ayat, tradisi, atau komunitas.
4. Tidak menghapus teks yang sulit agar terlihat ramah.
5. Tidak menampilkan konten tanpa hak yang jelas.
6. Tidak menyembunyikan disagreement.
7. Tidak membiarkan output model menjadi teks kanonik atau tafsir tanpa review.
8. Tidak menjadi "AI pendeta" yang memberi fatwa, nasihat medis, atau keputusan hukum.

---

## 11. Copy bank

### Tagline

```text
TRACE THE TEXT. DON'T QUOTE THE VIBE.
Bukan tafsir. Bukan sekadar teks. Titik tengahnya.
Lihat teksnya utuh, bukan hanya takutnya.
Every quote has a source. Every source has a frame.
Context before conclusion.
Preserve first. Interpret downstream. Reproduce always.
```

### Pitch satu kalimat

> MoonWitness membuat kutipan kitab suci bisa dilacak ke sumber dan konteksnya, lalu menunjukkan titik tengah antara teks dan tafsir.

### Pitch 30 detik

> Bayangkan Anda melihat kutipan yang terasa seperti vonis. Anda tidak tahu itu dari kitab apa, edisi mana, dan untuk siapa. MoonWitness menjawab tiga hal itu: teks persisnya, frame-nya, dan apa yang tidak diklaim. Kami tidak menggantikan tafsir; kami membuat teks dan tafsir tidak lagi bercampur.

### Pitch 2 menit

> Kebanyakan aplikasi kitab suci berhenti di teks mentah atau di tafsir. Di antaranya ada ruang kosong: pembaca tidak tahu genre, penerima, edisi, dan batas klaim. Ruang kosong itu diisi oleh ketakutan, terutama ketika kutipan menyebar tanpa sumber.
>
> MoonWitness mengisi ruang itu dengan Key Witness: key semantik yang di-anchor ke teks, frame yang menjelaskan siapa berbicara kepada siapa, direction yang selalu dibatasi frame, message turunan yang diberi label, dan disagreement yang tidak disembunyikan. Kami tidak memberi skor global "ayat ini baik atau buruk". Kami menunjukkan spektrum dan cakupan konteks.
>
> Hasilnya bukan tafsir baru. Hasilnya adalah pembaca yang bisa melihat teks utuh, memahami batasnya, dan mengutipnya dengan benar.

### UI microcopy

```text
Sumber data: Live API / Full browser DB / Generated catalog
Konteks: 7/9 lengkap · celah: recipient, genre
Message turunan · metode curated:v0 · review: reviewed
Arah: +2 dalam frame ini · bukan penilaian universal
Teks belum tersedia untuk edisi ini · tidak ada teks sintetis
```

---

## 12. Ukuran cerita berhasil

**North star:** *traceable reading session* — sesi di mana pembaca bergerak dari kutipan/pencarian menuju witness, konteks, dan sitasi tanpa bantuan.

| Metrik | Target v1 |
|---|---|
| Waktu kutipan → sitasi | median < 60 detik |
| Trace completeness | ≥ 95% passage yang ditampilkan punya penunjuk edisi/hak/provenance |
| Context coverage | ≥ 80% key card punya konteks lengkap |
| Key coverage pilot | 300 passage dengan minimal satu key reviewed |
| Agreement | alpha ≥ 0.6 per key, atau keputusan revise yang terdokumentasi |
| Boot | tidak ada full-table scan; LCP < 2.5 detik |
| Koreksi | respons pertama < 7 hari |

**Guardrail:**

- 0 teks sintetis;
- 0 skor global/ranking;
- 0 konten tanpa hak;
- 100% label `derived` pada message/score;
- 100% key reviewed punya frame, evidence, dan method.

Cerita berhasil bukan ketika orang merasa terhibur. Cerita berhasil ketika orang bisa menjelaskan apa yang teks katakan, untuk siapa, dan dari mana — tanpa harus percaya pada produk.

---

## 13. Manifesto

> Teks suci bukan bahan konten.
> Ia bukan screenshot tanpa sumber, bukan vonis tanpa penerima, bukan sensasi tanpa konteks.
>
> Kami membangun tempat di mana teks bisa berbicara lebih dulu — dan tafsir datang kemudian, dengan nama, metode, dan batasnya.
>
> Kami tidak menghapus teks yang sulit. Kami menghapus kebingungan di sekitarnya.
>
> **Trace the text. Don't quote the vibe.**
>
> **Bukan tafsir. Bukan sekadar teks. Titik tengahnya.**
