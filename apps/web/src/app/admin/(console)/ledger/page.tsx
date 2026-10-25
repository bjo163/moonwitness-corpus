"use client"

import { useEffect, useState } from "react"

/**
 * The sealed ledger screen. It reports what was published and what was withheld,
 * and it refuses to display a manifest that does not agree with the deployed
 * corpus catalog — a console showing the wrong corpus is worse than an empty one.
 */
const API = (process.env.NEXT_PUBLIC_RGBL_API_URL || "").replace(/\/+$/, "")
type Manifest = {
  schema: string
  recordSchema: string
  corpusHash: string
  methodVersion: string
  indexSha256: string
  recordCount: number
  byteLength: number
  jsonlSha256: string
  formats: {jsonl: string; parquet: string}
  parquetGap: string
  scoresIncluded: boolean
  publicDomainInference: string
  frameNote: string
}

const nonBlank = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0

function validateManifest(value: unknown): Manifest {
  const m = value as Record<string, unknown> | undefined
  if (!m || typeof m !== "object") throw new Error("The key layer returned no manifest")
  if (m.schema !== "mw:key-witness-export:v0") throw new Error("Unsupported export schema: " + String(m.schema))
  if (m.recordSchema !== "mw:citation:v0") throw new Error("The export record schema is not a citation bundle")
  for (const field of ["corpusHash", "methodVersion", "indexSha256", "jsonlSha256"] as const)
    if (!nonBlank(m[field])) throw new Error("The manifest is missing its " + field)
  if (!/^[a-f0-9]{64}$/.test(m.corpusHash as string)) throw new Error("The manifest corpus hash is not a sha256")
  if (!Number.isInteger(m.recordCount) || (m.recordCount as number) < 1) throw new Error("A manifest with no records is not a publication")
  if (!Number.isInteger(m.byteLength) || (m.byteLength as number) < 1) throw new Error("The manifest has no byte length")
  if (m.scoresIncluded !== false) throw new Error("An export that carries scores is not this layer's export")
  if (m.publicDomainInference !== "prohibited") throw new Error("The manifest may not infer public domain")
  const formats = m.formats as Record<string, unknown> | undefined
  if (!formats || typeof formats.jsonl !== "string" || typeof formats.parquet !== "string") throw new Error("The manifest does not state its formats")
  if (!nonBlank(m.frameNote)) throw new Error("The manifest has no frame note")
  return m as unknown as Manifest
}

export default function LedgerPage() {
  const [state, setState] = useState<"idle" | "busy" | "ready" | "blocked">("idle")
  const [manifest, setManifest] = useState<Manifest | null>(null)
  const [deployed, setDeployed] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (!API) {
      setState("blocked")
      setMessage("The sealed ledger is served by the research API. Set NEXT_PUBLIC_RGBL_API_URL; this static build publishes nothing by itself.")
      return
    }
    let cancelled = false
    const load = async () => {
      setState("busy"); setError(""); setMessage("")
      try {
        const [manifestResponse, catalogResponse] = await Promise.all([
          fetch(API + "/v1/research/key-witness/manifest", {headers: {accept: "application/json"}, signal: AbortSignal.timeout(15000)}),
          fetch("/corpus-catalog.json", {headers: {accept: "application/json"}, signal: AbortSignal.timeout(15000)}),
        ])
        if (!manifestResponse.ok) {
          const failure = await manifestResponse.json().catch(() => ({})) as {error?: unknown}
          const code = typeof failure.error === "string" ? failure.error : ""
          if (cancelled) return
          setState("blocked")
          setMessage(code === "key_witness_not_materialized"
            ? "No sealed key/message index is published. The console shows an empty ledger instead of a draft one."
            : code === "key_witness_index_integrity_failure"
              ? "The published index failed its integrity check, so no ledger is shown."
              : "The key layer answered " + manifestResponse.status + " without a readable manifest.")
          return
        }
        const verified = validateManifest(await manifestResponse.json())
        if (!catalogResponse.ok) throw new Error("The generated corpus catalog is unavailable, so the ledger cannot be bound to a corpus")
        const catalog = await catalogResponse.json() as {schemaVersion?: unknown; corpusHash?: unknown}
        if (catalog.schemaVersion !== 1 || typeof catalog.corpusHash !== "string") throw new Error("The corpus catalog failed its contract")
        // A manifest from another corpus snapshot is not this deployment's ledger.
        if (catalog.corpusHash !== verified.corpusHash) throw new Error("The manifest belongs to a different corpus than this deployment")
        if (cancelled) return
        setManifest(verified)
        setDeployed(catalog.corpusHash)
        setState("ready")
      } catch (reason) {
        if (cancelled) return
        setState("blocked")
        setError(reason instanceof Error ? reason.message : "The ledger could not be read")
      }
    }
    void load()
    return () => { cancelled = true }
  }, [])

  return <div className="space-y-6">
    <header className="space-y-2">
      <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Sealed ledger</p>
      <h1 className="text-2xl font-medium">What this deployment publishes</h1>
      <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
        One sealed export, bound to one corpus. The console reports its checksum, its size and its formats, and it will not draw a
        balance from a manifest that disagrees with the corpus catalog.
      </p>
    </header>

    {state === "busy" && <p role="status" className="rounded-md border border-dashed p-4 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Verifying the manifest…</p>}
    {state === "blocked" && <div className="space-y-2 rounded-md border p-4">
      {message && <p className="text-sm">{message}</p>}
      {error && <p role="alert" className="text-sm">{error}</p>}
    </div>}

    {state === "ready" && manifest && <>
      <dl className="divide-y divide-border/60 rounded-md border">
        {[
          ["corpus", manifest.corpusHash],
          ["method", manifest.methodVersion],
          ["records", manifest.recordCount + " citation bundle(s)"],
          ["bytes", manifest.byteLength.toLocaleString()],
          ["index sha256", manifest.indexSha256],
          ["jsonl sha256", manifest.jsonlSha256],
          ["jsonl", manifest.formats.jsonl],
          ["parquet", manifest.formats.parquet],
          ["scores included", String(manifest.scoresIncluded)],
          ["public-domain inference", manifest.publicDomainInference],
        ].map(([label, value]) => <div key={label} className="grid gap-1 p-3 sm:grid-cols-[minmax(9rem,14rem)_1fr]">
          <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</dt>
          <dd className="break-all font-mono text-xs">{value}</dd>
        </div>)}
      </dl>

      <section className="space-y-2 rounded-md border p-4" aria-labelledby="ledger-parquet">
        <h2 id="ledger-parquet" className="text-sm font-medium">Parquet</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{manifest.parquetGap}</p>
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Deployment corpus {deployed.slice(0, 12)} · manifest bound</p>
      </section>

      <section className="space-y-2 rounded-md border p-4" aria-labelledby="ledger-boundary">
        <h2 id="ledger-boundary" className="text-sm font-medium">Frame</h2>
        <p dir="auto" className="text-sm leading-relaxed">{manifest.frameNote}</p>
        <div className="flex flex-wrap gap-2 pt-2">
          <a href="/admin/balance" className="rounded-sm border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] hover:bg-accent">Open the balance</a>
          <a href="/research/key-witness" className="rounded-sm border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] hover:bg-accent">Reader card</a>
        </div>
      </section>
    </>}

    <section className="space-y-2 rounded-md border border-dashed p-4" aria-labelledby="ledger-limits">
      <h2 id="ledger-limits" className="text-sm font-medium">What this console will not do</h2>
      <ul className="list-inside list-disc space-y-1 text-xs leading-relaxed text-muted-foreground">
        <li>It will not draft a key, a message or an export when none is sealed.</li>
        <li>It will not turn a count into a score, a rank or a verdict on a passage or a tradition.</li>
        <li>It will not adjudicate a disagreement between assessors; the review workflow owns that, and it keeps the disagreement on the record.</li>
        <li>It will not treat this browser gate as authentication, and it grants no editorial authority.</li>
      </ul>
    </section>
  </div>
}
