import { readFile } from "node:fs/promises"
import path from "node:path"
import process from "node:process"

const root = process.cwd()
const read = (file) => readFile(path.join(root, file), "utf8")

const [data, main, api, browserDb, pkgRaw, layout, page, styles, generator, semanticRules, catalog, srgbl, keyWitness] = await Promise.all([
  read("src/data.ts"),
  read("src/corpus-app.tsx"),
  read("src/api.ts"),
  read("src/browser-db.ts"),
  read("package.json"),
  read("src/app/layout.tsx"),
  read("src/app/page.tsx"),
  read("src/app/globals.css"),
  read("../../scripts/export-web-catalog.mjs"),
  read("../../config/textual-semantic-rules.json"),
  read("public/corpus-catalog.json"),
  read("src/app/research/srgbl/page.tsx"),
  read("src/app/research/key-witness/page.tsx"),
])

const pkg = JSON.parse(pkgRaw)
const rules = JSON.parse(semanticRules)
const generated = JSON.parse(catalog)
const failures = []
const expect = (condition, message) => {
  if (!condition) failures.push(message)
}

for (const legacy of [
  "fallbackTraditions",
  "fallbackWorks",
  "fallbackPassages",
  "fallbackSearchRecords",
  "evidenceRows",
]) expect(!data.includes(legacy), `hardcoded UI fallback remains: ${legacy}`)

expect(pkg.dependencies?.tailwindcss, "standard shadcn/ui base (tailwindcss) must be a declared dependency")
expect(pkg.dependencies?.["@radix-ui/react-slot"], "standard shadcn/ui primitives (radix) must be a declared dependency")
expect(!pkg.dependencies?.["@rocksoul/ui"], "web UI must no longer depend on the merged Rocksoul UI package")
expect(main.includes('from "@/components/ui/'), "web UI must compose standard shadcn/ui components")
expect(!main.includes("raw.githubusercontent.com/bjo163/rocksoul-assets/main"), "runtime must not consume rocksoul-assets/main")
expect(!main.includes("ASSET_BASE"), "runtime must use the stable @rocksoul/ui asset resolver")
expect(layout.includes("4050b6b5ea88f187a31a304bf978abfe637db9ce"), "document assets must use the stable Rocksoul asset release")
expect(api.includes("/v1/passages/"), "passage trace API adapter is missing")
expect(api.includes("/v1/assertions/"), "assertion traversal API adapter is missing")
expect(api.includes('const CATALOG_URL = "/corpus-catalog.json"'), "generated catalog adapter is missing")
expect(api.includes("loadCatalog"), "catalog loader is missing")
expect(api.includes("browserLoadWorkHierarchy"), "browser hierarchy adapter is missing")
expect(api.includes("browserTraverseAssertion"), "browser assertion traversal adapter is missing")
expect(browserDb.includes("CREATE TABLE") === false, "browser runtime must consume, not build, the corpus database")
for (const surface of ["browserLoadWorkHierarchy", "browserLoadPassageTrace", "browserTraverseAssertion", "browserDbStats"]) {
  expect(browserDb.includes(surface), `full browser graph surface is missing: ${surface}`)
}
expect(generator.includes('datasets/registry.json'), "catalog generator must use the canonical dataset registry")
expect(generator.includes('config/upstream-registry.json'), "catalog generator must use the upstream tradition registry")
expect(generator.includes('config/textual-semantic-rules.json'), "catalog generator must use machine-readable semantic rules")
expect(Array.isArray(rules.rules) && rules.rules.length >= 6, "machine-readable semantic rules are incomplete")
expect(generated.schemaVersion === 1, "generated corpus catalog schema version is invalid")
expect(typeof generated.corpusHash === "string" && generated.corpusHash.length === 64, "generated corpus catalog must be content-addressed")
expect(generated.summary?.totalRecords > 500000, "generated canonical catalog must represent the full non-fixture corpus inventory")
expect(generated.summary?.workCount > 0 && generated.summary?.sampledPassageCount > 0, "generated catalog must expose canonical work and passage samples")
expect(main.includes("WORK → EXPRESSION → EDITION → ARTIFACT → PASSAGE → CONTENT"), "canonical textual hierarchy is not surfaced")
for (const surface of ["HierarchyTrace", "TextLanes", "RightsTable", "RelationsTable"]) {
  expect(main.includes(surface), `canonical trace surface is not rendered: ${surface}`)
}
expect(main.includes("STATIC SEMANTIC GUARDRAILS"), "semantic matrix must be labeled as a contract rather than live evidence")
expect(styles.includes("prefers-reduced-motion"), "reduced-motion contract is missing")
expect(styles.includes("focus-visible"), "visible focus contract is missing")
expect(pkg.scripts?.build?.includes("ensure-browser-db.mjs"), "production build must materialize the full browser database")
expect(pkg.dependencies?.next, "web runtime must be Next.js")
expect(!pkg.devDependencies?.vite && !pkg.dependencies?.vite, "web runtime must not depend on Vite")
expect(pkg.scripts?.build?.includes("next build"), "production build must run next build")
expect(page.includes('ssr: false'), "browser-only corpus app must not be server-rendered")
expect(api.includes("NEXT_PUBLIC_RGBL_API_URL"), "REST base URL must use the Next public env prefix")
expect(!api.includes("import.meta.env"), "Vite-only import.meta.env must be removed")
expect(main.includes("239,841") === false && main.includes("537K+") === false, "runtime corpus metrics must not be hardcoded")
expect(srgbl.includes('/research/srgbl/reviewed.json'), "SRGBL static reviewed fallback path is missing")
expect(srgbl.includes('catalog.corpusHash!==body.corpusHash'), "SRGBL static fallback must reject a stale corpus projection")
expect(srgbl.includes("ArrowRight")&&srgbl.includes("Home"), "the five tabs must be operable with arrow, Home and End keys")
expect(srgbl.includes("tabIndex={active===x.id?0:-1}"), "the tablist must use one roving tab stop")
expect(srgbl.includes('aria-labelledby={"stage-tab-"+active}'), "the tabpanel must be labelled by the selected tab")
expect(srgbl.includes('dir="auto"'), "textual and derived content must keep an automatic writing direction")
expect(srgbl.includes("motion-safe:"), "transitions must be motion-safe so reduced motion is respected")
expect(!srgbl.includes("animate-"), "no decorative animation may gate reading the research view")
expect(srgbl.includes("Comparative lens (interpretation, not neutral truth)"), "the comparative lens must be labeled as interpretation")
expect(srgbl.includes("CORRECTS_WITHIN_FRAME"), "a within-frame correction must be typed rather than implied")
expect(srgbl.includes("not a cross-relational neutral truth"), "a correction must never read as neutral cross-religious truth")
expect(srgbl.includes("Filter by lens"), "the lens filter must be explicit and keyboard reachable")
expect(srgbl.includes("Unverified"), "a swing candidate must carry an explicit Unverified badge")
expect(srgbl.includes("evidenceStatus===\"unverified\""), "a swing candidate may not render as reviewed or with inherited evidence")
expect(srgbl.includes("depth {s.depth}"), "a swing candidate must state its depth")
expect(srgbl.includes("aria-pressed={swing===s.id}"), "swing candidates must be selectable from the keyboard with a pressed state")
expect(srgbl.includes("Derived message (not original scripture)"), "a reviewed key message must be labeled as derived")
expect(srgbl.includes("isReviewedKeyMessage"), "a key message must pass a boundary and evidence validator before rendering")
expect(srgbl.includes("nonBlank(m.boundaryNote)"), "an empty boundary note must never render a derived message")
expect(srgbl.includes("data-stage-status"), "each S1-L5 tab must render its own approved-evidence status")
expect(srgbl.includes('if(level==="S1"&&trace) return "source trace"'), "S1 must remain a source trace until a reviewed claim exists")
expect(srgbl.includes("No synthetic interpretation is generated"), "an empty stage must state that nothing was generated")
expect(srgbl.includes('UNKNOWN / not materialized'), "SRGBL UI must retain UNKNOWN when no reviewed static or API claim exists")
expect(srgbl.includes('/research/key-witness'), "the SRGBL view must link to the derived key/message card")

// P18-009 Titik Tengah card: derived, rights-bound and never a verdict.
expect(keyWitness.includes('c.schema!=="mw:citation:v0"'), "the card must pin the citation schema it renders")
expect(keyWitness.includes("c.passageId!==envelope.passageId"), "a card must describe the passage that was requested")
expect(keyWitness.includes("c.corpusHash!==envelope.corpusHash"), "a card must be bound to the corpus version it was served for")
expect(keyWitness.includes(`rights.publicDomainInference!=="prohibited"`), "a card may not infer public domain")
expect(keyWitness.includes("Withheld witness text arrived from the API and was refused"), "the card must refuse withheld text even when a server sends it")
expect(keyWitness.includes('m.reviewStatus!=="reviewed"'), "a draft message must never render as a card message")
expect(keyWitness.includes("A card message needs text, a boundary and a reviewer"), "a message without a boundary or reviewer must be withheld")
expect(keyWitness.includes("!strings(c.provenance)"), "a card without provenance must be refused")
expect(keyWitness.includes("deep link is not an http(s) address"), "a card must refuse a non-http deep link")
expect(keyWitness.includes("key_witness_not_materialized"), "an unpublished key layer must be shown as unavailable, not drafted")
expect(keyWitness.includes("key_witness_index_integrity_failure"), "an integrity failure must withhold the card entirely")
expect(keyWitness.includes("A single record is not an agreement"), "one assessor must never be presented as agreement")
expect(keyWitness.includes("Nothing here is averaged, adjudicated or ranked"), "the disagreement view must state that it adjudicates nothing")
expect(keyWitness.includes('dir="auto"'), "card text must keep an automatic writing direction for RTL scripts")
expect(keyWitness.includes('aria-live="polite"'), "the card status must be announced to assistive technology")
expect(keyWitness.includes('role="alert"'), "a failed lookup must be announced as an alert")
expect(keyWitness.includes("motion-safe:"), "transitions must be motion-safe so reduced motion is respected")
expect(!keyWitness.includes("animate-"), "no decorative animation may gate reading the card")
expect(!keyWitness.includes('"score"'), "the card must not render a score field")
expect(!keyWitness.includes("witnessScore"), "the card must not render a witness score")
expect(keyWitness.includes("NEXT_PUBLIC_RGBL_API_URL"), "the card must read the documented research API base")

if (failures.length) {
  console.error("RGBL web contract smoke failed:")
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log("RGBL web contract smoke: OK")
