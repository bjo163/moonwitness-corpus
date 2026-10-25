import { parseExportJsonl, type Citation } from "./key-witness"

/**
 * One reader for the sealed export, shared by every console screen: a facet must
 * not be counted one way on one page and another way on the next, and five pages
 * must not each download the same file. A missing API, a missing publication and
 * an integrity failure stay distinguishable states; an empty list is never
 * allowed to look like "nothing was recorded".
 *
 * This module deliberately has no React import: it is the part worth testing, and
 * the root suite runs `apps/web` sources without installing the web app's own
 * dependencies.
 */
export type ExportLoad = {ok: boolean; citations: Citation[]; message: string; detail: string}

export const EXPORT_PATH = "/v1/research/key-witness/export.jsonl"
export const API_BASE = (process.env.NEXT_PUBLIC_RGBL_API_URL || "").replace(/\/+$/, "")

const NO_API = "This screen reads the sealed export from the research API. Set NEXT_PUBLIC_RGBL_API_URL; the static build does not invent records."

/**
 * A page load is one request per API base. Failures are evicted, so a transient
 * outage does not poison the cache for the rest of the session; `fresh` forces a
 * re-read.
 */
const cache = new Map<string, Promise<ExportLoad>>()

export function resetExportCache(): void {
  cache.clear()
}

export function loadKeyWitnessExport(base: string = API_BASE, options: {fresh?: boolean} = {}): Promise<ExportLoad> {
  if (!base) return Promise.resolve({ok: false, citations: [], message: NO_API, detail: ""})
  if (options.fresh) cache.delete(base)
  const cached = cache.get(base)
  if (cached) return cached
  const pending = fetchExport(base).catch(reason => ({
    ok: false, citations: [],
    message: "The research API could not be reached, so nothing is shown.",
    detail: reason instanceof Error ? reason.message : "",
  })).then(result => {
    if (!result.ok) cache.delete(base)
    return result
  })
  cache.set(base, pending)
  return pending
}

async function fetchExport(base: string): Promise<ExportLoad> {
  const response = await fetch(base + EXPORT_PATH,
    {headers: {accept: "application/x-ndjson"}, signal: AbortSignal.timeout(20000)})
  if (!response.ok) {
    const failure = await response.json().catch(() => ({})) as {error?: unknown}
    const code = typeof failure.error === "string" ? failure.error : ""
    return {
      ok: false, citations: [], detail: "",
      message: code === "key_witness_not_materialized"
        ? "No sealed export is published yet, so there is nothing to show."
        : code === "key_witness_index_integrity_failure"
          ? "The published index failed its integrity check; no records are shown."
          : "The key layer answered " + response.status + " without a readable export.",
    }
  }
  const parsed = parseExportJsonl(await response.text())
  // One unreadable line invalidates the whole export rather than shrinking it quietly.
  if (parsed.errors.length) return {
    ok: false, citations: [], detail: "",
    message: "The export failed its contract, so nothing is displayed: " + parsed.errors.slice(0, 3).join("; "),
  }
  return {ok: true, citations: parsed.citations, message: "", detail: ""}
}
