# RGBL Web Observatory

Next.js research frontend for **rocksoul-rgbl**.

## Product boundary

- **RGBL** owns canonical TEXT identity, passages, exact content, assertions, evidence, provenance, textual relations, and corpus assessments.
- **shadcn/ui** supplies the application component layer, built from local primitives in `src/components/ui`.
- Missing text is rendered as unavailable. The web app never invents scripture content.
- Translation, source identity, textual correspondence, authority, and theological equivalence remain distinct concepts.

## Runtime architecture

Production has three deterministic data planes, in precedence order:

```text
1. RGBL REST API (when NEXT_PUBLIC_RGBL_API_URL is configured and healthy)
2. Immutable browser SQLite over HTTP-range/WASM
3. Generated canonical catalog
```

The browser SQLite database is the default production runtime when no REST endpoint is configured. It is generated from the same non-fixture corpus inputs as the server database and includes:

```text
datasets
work / expression / edition / artifact hierarchy
passages
exact searchable content
provenance
evidence
alignment / variant relations
assertions + evidence references
```

Search and passage reads therefore do **not** depend on hardcoded UI fixtures.

The catalog plane is a genuine fallback, not a mirror of the corpus: it carries sampled passages and search records for startup metadata and last-resort rendering. When it is active, counts and pagination describe the sample, not the full corpus.

### Content-addressed browser database

`scripts/build-browser-search-db.mjs` builds the browser-compatible SQLite database.

`scripts/chunk-browser-search-db.mjs` publishes it as HTTP-range-friendly chunks. GitHub Actions attaches the compressed chunk set to an immutable release named:

```text
browser-db-v3-<corpusHash>
```

At build time, `apps/web/scripts/ensure-browser-db.mjs` downloads that matching release and serves chunks from:

```text
/corpus-db/<corpusHash>/db.sqlite3.<chunk>
```

The stable `/corpus-db/config.json` always revalidates. Content-addressed chunks may be cached immutably.

If no release exists for the current `corpusHash`, the build fails instead of silently falling back to stale data.

## Generated catalog

`scripts/export-web-catalog.mjs` derives `apps/web/public/corpus-catalog.json` from:

```text
datasets/registry.json
dataset manifests
config/upstream-registry.json
config/textual-semantic-rules.json
canonical JSONL records
```

The catalog provides startup metadata, semantic rules, and a safe fallback if the browser database cannot initialize. It is data-derived; it is not a hand-maintained React fallback.

## Stack

```text
Next.js 16 (App Router, static export)
React 19
TypeScript strict
Tailwind CSS 4 via @tailwindcss/postcss
shadcn/ui + Radix primitives
sql.js-httpvfs
Node 24
npm 11.6
Vercel
```

The app is exported statically (`output: "export"`) and rendered client-only (`ssr: false`). Browser storage and `window.location` access stay out of the server render path.

## Local development

Install the frontend:

```bash
cd apps/web
npm install
```

The browser data plane is a build input, not something `next build` downloads by itself. To prepare it locally:

```bash
node scripts/build-browser-search-db.mjs
node scripts/chunk-browser-search-db.mjs
node scripts/prepare-local-browser-db.mjs
```

Then run the dev server:

```bash
npm run dev
```

The frontend runs on `http://localhost:5174` and, in development mode, connects to the REST API at `http://localhost:4310` (see `.env.development`).

Optionally connect the REST service:

```bash
cp .env.example .env.local
# set NEXT_PUBLIC_RGBL_API_URL
npm run dev
```

`NEXT_PUBLIC_*` values are inlined at build time in a static export; changing them requires a rebuild.

## REST contract

When configured, REST takes precedence over the browser data plane:

```text
GET /v1/health
GET /v1/traditions
GET /v1/works
GET /v1/works/:id
GET /v1/works/:id/passages?limit=&offset=
GET /v1/passages/:id
GET /v1/search?q=&tradition=&limit=&offset=
GET /v1/assertions/:id/traversal
```

The same UI continues to work if REST is absent or temporarily unavailable because the full browser graph is separately generated and content-addressed.

## Canonical trace

The interface preserves:

```text
WORK → EXPRESSION → EDITION → ARTIFACT → PASSAGE → CONTENT
```

Passage trace surfaces exact content lanes, artifact and rights metadata, provenance, evidence, explicit alignment/variant relations, and assertion traversal without collapsing those identities.

## Deep links

Research state is shareable:

```text
?work=mw:work:...
?passage=mw:passage:...
?q=mercy
?tradition=islam
```

Parameters can be combined. Search results that resolve to canonical passages can open their trace directly.

## Validation

Frontend validation remains independent from the root pnpm workspace:

```bash
cd apps/web
npm install
npm run typecheck
npm test
npm run build
```

`npm test` reads source files and asserts the application contract. `npm run build` exports the static site to `out/`.

The smoke contract verifies, among other things:

- no hardcoded corpus fallback arrays;
- generated catalog integrity and full-corpus inventory;
- Next.js App Router with client-only rendering and no Vite toolchain;
- full browser graph surfaces;
- dynamic corpus metrics rather than literal counts;
- canonical hierarchy visualization;
- reduced-motion and visible-focus contracts.

Root GitHub Actions also runs the corpus/API `pnpm check` job on Node 24.

## Vercel

The root `vercel.json` builds `apps/web` with the Next.js preset, npm 11.6, and Node 24.

No production secret is required for the default browser data plane. `NEXT_PUBLIC_RGBL_API_URL` is optional and upgrades the runtime to the REST service when supplied.

The generated catalog and browser database are matched by `corpusHash`; a mismatched schema/hash causes the build to fail instead of silently serving mixed corpus versions.

## Component contract

The interface composes local shadcn/ui primitives and corpus-specific panels:

```text
src/components/ui/*          shadcn primitives (button, card, table, …)
src/components/*             corpus panels (text lanes, rights table, relations, evidence)
src/corpus-app.tsx           client-only application shell
src/app/page.tsx             dynamic import boundary with ssr: false
src/app/layout.tsx           document shell, metadata, theme
```

Canonical meaning remains accessible semantic HTML; decorative styling never substitutes for record identity or provenance.
