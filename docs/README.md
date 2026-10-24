# RGBL — Documentation Hub

## **TRACE THE TEXT. DON’T QUOTE THE VIBE.**

> **/// SOURCE · EDITION · PASSAGE · RIGHTS · PROVENANCE ///**

This is the operator/developer map for the MoonWitness RGBL corpus. The corpus can be broad; authority must stay scoped. Database speed is useful. Reproducible text identity is non-negotiable.

**TEXTUAL PRESENCE ≠ UNIVERSAL AUTHORITY · TRANSLATION ≠ SOURCE TEXT · DATABASE ≠ CANONICAL TRUTH**

Pusat dokumentasi arsitektur, spesifikasi teknis, pedoman upstream ingestion, dan panduan integrasi sistem korpus kitab suci dunia **MoonWitness**.

---

## Product Narrative & Blueprint

- [**Cerita Produk (final)**](./PRODUCT-STORY.md) — narasi kanonik brand dan produk: masalah, lima babak pembaca, titik tengah, suara, dan batas klaim.
- [**Product Blueprint (final)**](./PRODUCT-BLUEPRINT.md) — arsitektur, UX, data, editorial, pengukuran, roadmap, dan work breakdown Key Witness.
- [**SRGBL v8 Master RFC (research extension)**](./SRGBL-V8-MASTER-RFC.md) — S1–L5, scoring 15/40/100, Key, Swing, Positive Correction, research-only guardrails.
- [**SRGBL Historical Concept Crosswalk**](./SRGBL-V8-CONCEPT-CROSSWALK.md) — sejarah WITNESS, Swing, Middle Point, Offside dan beda score.
- [**SRGBL v8 Implementation Status**](./SRGBL-V8-IMPLEMENTATION-STATUS.md) — Completed code slices, API, CLI, rights/pilot/release blockers, and precise gaps.
- [**P18/P19 Progress**](../TODO.md) — issue-synchronized tasks, dependencies, and implementation evidence. Pure SRGBL primitives exist; full application integration is pending.

---

## 🗺️ Index & Navigation

### 1. 🌐 Upstream Ingestion & Data Architecture
- [**Panduan Metode Ingestion (Upstream vs Recipe)**](./INGESTION_METHODS_GUIDE.md) — Penjelasan detail metode penarikan hulu vs resep kanonik.
- [**Upstream Architecture & Policy**](./UPSTREAM_ARCHITECTURE.md) — Arsitektur streaming pagination, checksum pinning, dan registry hulu.
- [**Upstream System Registry**](../config/upstream-registry.json) — Registry resmi URL endpoint, git remotes, dan lisensi 12 tradisi dunia.
- [**Dataset Target & Coverage**](./DATASET_TARGETS.md) — Matriks target kitab suci, hadits, tafsir, dan korpus filosofis.
- [**Sync & Upstream Policy**](./SYNC_AND_UPSTREAM_POLICY.md) — Kebijakan sinkronisasi berkala dan integritas byte-deterministic.
- [**Seed Data Architecture**](./SEED_DATA_ARCHITECTURE.md) — Struktur data seed dan normalisasi multilingual.

### 2. ⚡ Fastify Engine & OpenTelemetry (OTel)
- [**Modular Fastify 5 Microservice**](../apps/api/README.md) — Spesifikasi REST API, Swagger UI `/docs`, dan sub-millisecond FTS5 search.
- [**OpenTelemetry & Prometheus Telemetry**](../apps/api/src/plugins/telemetry.ts) — Distributed tracing W3C context propagation dan metrik `/metrics`.
- [**Application Integration Guide**](./APP_INTEGRATION_ADVICE.md) — Panduan integrasi client/downstream apps dengan `@moonwitness/sdk`.
- [**ORM & Repository Mapping**](./APP_ORM_MAPPING.md) — SQLite schema mapping, indexing table, dan query patterns.

### 3. 📖 World Religious Traditions & Scripture Baselines
| Tradisi | Kitab Suci Utama | Sumber Upstream | Recipe Path |
|---|---|---|---|
| **Islam** | Al-Qur'an, Kutubus Sittah (Bukhari, Muslim, Nawawi 40, Qudsi), Duas, Asmaul Husna | UmmahAPI / Tanzil | `ingestion/recipes/ummah-api/` |
| **Judaism** | Tanakh (WLC), Mishnah (Pirkei Avot), Psalms | Sefaria REST API / OSHB | `ingestion/recipes/sefaria/` |
| **Christianity** | Greek NT (SBLGNT), Indonesian TSI, Early Christian Writings | SBLGNT / ECW | `ingestion/recipes/sblgnt-v1-2/` |
| **Hinduism** | Bhagavad Gita, Yoga Sutras, Principal Upanishads | GRETIL / Sacred Texts | `ingestion/recipes/principal-upanishads/` |
| **Buddhism** | Tipitaka (Dhammapada, Dīgha, Majjhima, Samyutta, Aṅguttara Nikāya) | SuttaCentral Bilara API | `ingestion/recipes/suttacentral/` |
| **Daoism** | Tao Te Ching (Laozi 81 Bab), Zhuangzi | Chinese Text Project API | `ingestion/recipes/ctext/` |
| **Confucianism** | Analects of Confucius (20 Buku) | Chinese Text Project API | `ingestion/recipes/ctext/` |
| **Zoroastrianism** | Gathas of Zarathustra (Yasna 28-53) | Avesta Digital Archive | `ingestion/recipes/zoroastrianism-gathas/` |
| **Sikhism** | Japji Sahib (Sri Guru Granth Sahib) | ShabadOS Open Heritage | `ingestion/recipes/sikhism-japji-sahib/` |
| **Jainism** | Tattvartha Sutra (Acharya Umaswati) | Jain Heritage Data | `ingestion/recipes/jainism-tattvartha-sutra/` |
| **Baháʼí** | The Hidden Words (Kalimát-i-Maknúnih) | Baháʼí Open Data | `ingestion/recipes/bahai-hidden-words/` |
| **Shinto** | Kojiki Sacred Chronicles (Kojiki 712 CE) | Sacred Texts Archive | `ingestion/recipes/shinto-kojiki/` |

### 4. 🧠 Semantics, Lexicons & Intertextual Graph
- [**Key Witness v0 — Titik Tengah**](./KEY-WITNESS-V0.md) — Lapisan antara teks dan tafsir: key, frame, direction, message turunan, dan pilot 300 passage.
- [**Lexicon Coverage & Bridges**](./P15-COVERAGE-REPORT.md) — Kamus bahasa suci: Arab, Ibrani, Yunani Koine, Sanskerta, Pali.
- [**Intertextual Evidence Graph**](./INTERTEXTUAL_EVIDENCE_GRAPH_TARGETS.md) — Relasi paralel dan alignment antar tradisi.
- [**Terminology Review Workflow**](./P15-TERMINOLOGY-REVIEW-WORKFLOW.json) — Tata kelola istilah, desensitisasi, dan tinjauan penerjemahan.

### 5. 🏛️ Architecture Decision Records (ADRs) & Reviews
- [**ADR-0001: Canonical JSON & JSONL**](./decisions/ADR-0001-canonical-json-jsonl.md) — Format kanonik immutable korpus.
- [**ADR-0002: Disposable Indexes & No Database Truth**](./decisions/ADR-0002-no-canonical-database.md) — Database sebagai proyeksi turunan, bukan kebenaran mutlak.
- [**ADR-0003: Assertions Not Global Facts**](./decisions/ADR-0003-assertions-not-global-facts.md) — Pemisahan klaim kontekstual dari kebenaran universal.
- [**ADR-0004: Engine Policy Outside Corpus**](./decisions/ADR-0004-engine-policy-outside-corpus.md) — Isolasi aturan engine dari data naskah suci.
- [**ADR-0005: Modular Fastify 5 REST Engine**](./decisions/ADR-0005-fastify-api-engine.md) — Transisi ke Fastify untuk startup instan dan kueri < 1ms.
- [**ADR-0006: Universal Upstream Registry & Recipes**](./decisions/ADR-0006-universal-upstream-registry.md) — Registry sumber resmi dan resep ingestion.
- [**ADR-0007: OpenTelemetry Distributed Tracing**](./decisions/ADR-0007-opentelemetry-w3c-tracing.md) — Integrasi W3C tracing dan metrik Prometheus.
- [**ADR-0008: SRGBL v8 Derived Research (proposed)**](./decisions/ADR-0008-srgbl-derived-research.md) — Separasi corpus kanonik, penelitian, scoring, dan frame teologis.
- [**P5 Universality Review**](./reviews/P5-universality-review.md) — Tinjauan universalitas teks lintas tradisi awal.
- [**P16-P17 Multi-Tradition Review**](./reviews/P16-P17-multi-tradition-review.md) — Tinjauan hak cipta dan integritas 12 tradisi dunia.

### 6. 🤖 Automation (manual-only)
- [**Continuous Integration (`ci.yml`)**](../.github/workflows/ci.yml) — Validasi, pengujian unit, dan *smoke test* Fastify API runtime; dijalankan lewat dispatch.
- [**Upstream Audit (`upstream-sync.yml`)**](../.github/workflows/upstream-sync.yml) — Audit hulu read-only lewat dispatch; tidak ada jadwal otomatis.
- [**TODO & Issues Sync (`todo-issues-sync.yml`)**](../.github/workflows/todo-issues-sync.yml) — Sinkronisasi dwiarah TODO.md dengan GitHub Issues lewat dispatch.

---

## 🛠️ CLI Task Index

```bash
# Sinkronisasi hulu
pnpm sync:all          # Sinkronisasi live seluruh 12 tradisi
pnpm sync:ummah        # Sinkronisasi Islam (Hadits, Doa, Quran)
pnpm upstream:audit    # Audit konektivitas & latensi API hulu

# Menjalankan Fastify Engine
pnpm serve             # Menjalankan Fastify REST API di port 3000
pnpm api:dev           # Mode developer dengan auto-reload

# Validasi & Pengujian
pnpm check             # Full verification gate (Test + Validate + Build + Release)
pnpm test              # 146+ unit tests
pnpm validate          # Validasi semantik 537k+ records
pnpm build:sqlite      # Rebuild embedded database dist/corpus.sqlite
```
