import { readFile } from "node:fs/promises"
import path from "node:path"
import process from "node:process"

const root = process.cwd()
const read = (file) => readFile(path.join(root, file), "utf8")

const [data, main, api, browserDb, pkgRaw, layout, page, explorer, styles, generator, semanticRules, catalog, srgbl, keyWitness, keyWitnessLib, exportHook, consoleSession, consoleLogin, consoleLayout, consoleLedger, consoleBalance, consoleSpectrum, consoleDisagreement, consoleProfile] = await Promise.all([
  read("src/data.ts"),
  read("src/corpus-app.tsx"),
  read("src/api.ts"),
  read("src/browser-db.ts"),
  read("package.json"),
  read("src/app/layout.tsx"),
  read("src/app/page.tsx"),
  read("src/app/explorer/page.tsx"),
  read("src/app/globals.css"),
  read("../../scripts/export-web-catalog.mjs"),
  read("../../config/textual-semantic-rules.json"),
  read("public/corpus-catalog.json"),
  read("src/app/research/srgbl/page.tsx"),
  read("src/app/research/key-witness/page.tsx"),
  read("src/lib/key-witness.ts"),
  read("src/lib/use-key-witness-export.ts"),
  read("src/lib/console-session.ts"),
  read("src/app/admin/page.tsx"),
  read("src/app/admin/(console)/layout.tsx"),
  read("src/app/admin/(console)/ledger/page.tsx"),
  read("src/app/admin/(console)/balance/page.tsx"),
  read("src/app/admin/(console)/spectrum/page.tsx"),
  read("src/app/admin/(console)/disagreement/page.tsx"),
  read("src/app/admin/(console)/profile/page.tsx"),
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
expect(explorer.includes('ssr: false'), "browser-only corpus app must not be server-rendered")
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
expect(keyWitness.includes("citation.passageId!==envelope.passageId"), "a card must describe the passage that was requested")
expect(keyWitness.includes("citation.corpusHash!==envelope.corpusHash"), "a card must be bound to the corpus version it was served for")
expect(keyWitness.includes("validateCitation"), "the card must render only a validated citation bundle")
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

// The citation contract is shared, so one validator decides what every surface may render.
expect(keyWitnessLib.includes('c.schema !== "mw:citation:v0"'), "the shared validator must pin the citation schema")
expect(keyWitnessLib.includes('rights.publicDomainInference !== "prohibited"'), "the shared validator may not infer public domain")
expect(keyWitnessLib.includes("Withheld witness text arrived from the API and was refused"), "withheld text must be refused even when a server sends it")
expect(keyWitnessLib.includes('m.reviewStatus !== "reviewed"'), "a draft message may never render as a card message")
expect(keyWitnessLib.includes("A card message needs text, a boundary and a reviewer"), "a message without a boundary or reviewer must be withheld")
expect(keyWitnessLib.includes("if (!strings(c.provenance))"), "a citation without provenance must be refused")
expect(keyWitnessLib.includes("deep link is not an http(s) address"), "a citation must refuse a non-http deep link")
expect(keyWitnessLib.includes("the export contains no records"), "an empty export must fail rather than render an empty balance")
expect(keyWitnessLib.includes("sort(([a], [b]) => a.localeCompare(b))"), "keys and works must be listed alphabetically, never by size")
expect(keyWitnessLib.includes("ordering by count would be a ranking"), "the no-ranking rule must be stated where the order is chosen")
expect(keyWitnessLib.includes("export function balanceByWork") && keyWitnessLib.includes("export function balanceByPassage"), "the balance view must aggregate per work and per passage")

// The console is a separate surface with a local-only gate.
expect(consoleSession.includes('DEFAULT_CONSOLE_USER = "admin"'), "the shipped console user must be the documented admin")
expect(consoleSession.includes("crypto.subtle.digest(\"SHA-256\""), "the console credential must be stored as a hash, never as plain text")
expect(consoleSession.includes("CREDENTIAL_SALT"), "the credential hash must be salted")
expect(consoleSession.includes("It does not protect data from anyone holding this device"), "the local gate must state its own limit")
expect(consoleSession.includes("Date.parse(stored.expiresAt) <= Date.now()"), "an expired session must stop being a session")
expect(consoleSession.includes("verifyCredential(active, currentPassword)"), "changing the credential must require the current password")
expect(consoleSession.includes("password.length < 6"), "a replacement password must have a stated minimum length")
expect(consoleLogin.includes("admin / admin"), "the entrance must state the shipped default credentials")
expect(consoleLogin.includes("not server authentication"), "the entrance must not present the gate as authentication")
expect(consoleLogin.includes('role="alert"'), "a failed sign-in must be announced")
expect(consoleLogin.includes("motion-safe:"), "the entrance must respect reduced motion")
expect(!consoleLayout.includes("corpus-app"), "the console shell must not reuse the reader application")
expect(consoleLayout.includes('aria-label="Console sections"') && consoleLayout.includes("aria-current"), "console navigation must expose a labelled, current section")
expect(consoleLayout.includes("Console locked"), "a console without a session must say so instead of rendering data")
expect(consoleLayout.includes("Local gate · not server auth"), "the shell must keep the gate's limit visible")
expect(consoleLedger.includes('m.schema !== "mw:key-witness-export:v0"'), "the ledger must validate the export schema it displays")
expect(consoleLedger.includes("catalog.corpusHash !== verified.corpusHash"), "a manifest from another corpus must be refused")
expect(consoleLedger.includes("m.scoresIncluded !== false"), "the ledger must refuse an export that carries scores")
expect(consoleLedger.includes("manifest.parquetGap"), "the ledger must state the Parquet gap instead of implying a file")
expect(consoleBalance.includes("No distribution is drawn from a partial"), "the balance must refuse a partial or unverifiable export")
expect(consoleBalance.includes('aria-pressed={view === option}'), "the grouping toggle must expose its pressed state")
expect(consoleBalance.includes("Keys are listed alphabetically"), "the balance must say why the order is not a ranking")
expect(consoleBalance.includes("not a ranking of the passage"), "a bar length must not read as a ranking")
expect(consoleProfile.includes("changeCredential") && consoleProfile.includes("Not server authentication"), "the profile must change a local credential and state its limit")

// The shared export reader keeps "not published" and "failed integrity" distinguishable.
expect(exportHook.includes("parseExportJsonl") && exportHook.includes("One unreadable line invalidates"), "one reader must reject a partial export for every screen")
expect(exportHook.includes("key_witness_not_materialized") && exportHook.includes("key_witness_index_integrity_failure"), "the export reader must keep both fail-closed states distinct")
expect(exportHook.includes("does not invent records"), "a static build must say it invents no records")

// P18-011 spectrum: facets are filtered, unpublished facets are named.
expect(consoleSpectrum.includes("filterSpectrum") && consoleSpectrum.includes("spectrumFacets"), "the spectrum must filter by key, relation, direction and frame")
expect(consoleSpectrum.includes("Not published by this export"), "a facet the export does not carry must be named, not offered as an empty filter")
expect(consoleSpectrum.includes("A dash means the annotation did not record that facet"), "an absent facet must not be read as a neutral zero")
expect(consoleSpectrum.includes("never scores a verse"), "the spectrum must not score a verse or a tradition")
expect(consoleSpectrum.includes("empty selection, not evidence"), "an empty result must not be read as evidence of absence")
expect(keyWitnessLib.includes("frameLabel") && keyWitnessLib.includes("available: {"), "the spectrum must expose facet availability")

// The landing page routes a reader; the corpus app lives on its own route.
expect(page.includes("Trace the text") && page.includes('href="/explorer"'), "the landing page must state the thesis and route to the explorer")
expect(page.includes('href="/admin"') && page.includes('href="/research/key-witness"'), "the landing page must route to the console and the key card")
expect(page.includes("No global score") && page.includes("no tradition ranking"), "the landing page must state the boundaries")
expect(!page.includes("CorpusApp") && !page.includes("use client"), "the landing page must stay static, not the browser corpus app")
expect(explorer.includes("CorpusApp"), "the corpus app must remain reachable at /explorer")

// The reader app must read as the same product as the landing page and the console.
expect(main.includes("MoonWitness") && !main.includes("RGBL"), "the explorer must carry the MoonWitness brand, not the legacy RGBL one")
expect(main.includes('href="/admin"') && main.includes('href="/research/key-witness"'), "the explorer must route to the console and the key card")
expect(main.includes("This surface shows canonical corpus records only"), "the explorer must say which layer it shows")
expect(main.includes("MoonWitness owns canonical TEXT identity"), "the explorer footer must state the ownership boundary")
expect(!api.includes('"RGBL API'), "reader API errors must not leak the legacy brand into the interface")

// P18-012 disagreement: alternate assessments keep their own name and boundary.
expect(consoleDisagreement.includes("disagreementGroups") && consoleDisagreement.includes("disagreementSummary"), "the disagreement view must group per passage and per assessor")
expect(consoleDisagreement.includes("reviewer {reading.reviewer}"), "every reviewed reading must name its reviewer")
expect(consoleDisagreement.includes("A single record is not an agreement"), "one assessor must never read as consensus")
expect(consoleDisagreement.includes("no agreement statistic is computed"), "the disagreement view must state that it computes no agreement")
expect(consoleDisagreement.includes('aria-pressed={onlyAlternates}'), "the alternate-only filter must expose its pressed state")
expect(consoleDisagreement.includes('dir="auto"'), "messages must keep an automatic writing direction")
expect(consoleDisagreement.includes("derived, not scripture"), "a reading must be labeled as derived")
expect(keyWitnessLib.includes("agreementComputed: false") && keyWitnessLib.includes("adjudicated: false"), "the model must carry literal false flags instead of a computed agreement")
expect(!keyWitnessLib.toLowerCase().includes("kappa"), "no agreement statistic may be introduced into the exported model")
expect(consoleLayout.includes('/admin/disagreement'), "the console rail must expose the disagreement section")

if (failures.length) {
  console.error("RGBL web contract smoke failed:")
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log("RGBL web contract smoke: OK")
