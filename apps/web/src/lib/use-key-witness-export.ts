"use client"

import { useEffect, useState } from "react"
import { parseExportJsonl, type Citation } from "./key-witness"

/**
 * One reader for the sealed export, shared by the balance and the spectrum so a
 * facet cannot be counted one way in one screen and another way in the next. A
 * missing API, a missing publication and an integrity failure stay distinguishable
 * states: an empty list is never allowed to look like "nothing was recorded".
 */
export type ExportState = {
  phase: "busy" | "ready" | "blocked"
  citations: Citation[]
  message: string
  detail: string
}

const API = (process.env.NEXT_PUBLIC_RGBL_API_URL || "").replace(/\/+$/, "")

export function useKeyWitnessExport(): ExportState {
  const [state, setState] = useState<ExportState>({phase: "busy", citations: [], message: "", detail: ""})

  useEffect(() => {
    if (!API) {
      setState({
        phase: "blocked", citations: [], detail: "",
        message: "This screen reads the sealed export from the research API. Set NEXT_PUBLIC_RGBL_API_URL; the static build does not invent records.",
      })
      return
    }
    let cancelled = false
    const load = async () => {
      setState({phase: "busy", citations: [], message: "", detail: ""})
      try {
        const response = await fetch(API + "/v1/research/key-witness/export.jsonl",
          {headers: {accept: "application/x-ndjson"}, signal: AbortSignal.timeout(20000)})
        if (!response.ok) {
          const failure = await response.json().catch(() => ({})) as {error?: unknown}
          const code = typeof failure.error === "string" ? failure.error : ""
          if (cancelled) return
          setState({
            phase: "blocked", citations: [], detail: "",
            message: code === "key_witness_not_materialized"
              ? "No sealed export is published yet, so there is nothing to show."
              : code === "key_witness_index_integrity_failure"
                ? "The published index failed its integrity check; no records are shown."
                : "The key layer answered " + response.status + " without a readable export.",
          })
          return
        }
        const parsed = parseExportJsonl(await response.text())
        if (cancelled) return
        // One unreadable line invalidates the whole export rather than shrinking it quietly.
        if (parsed.errors.length) {
          setState({
            phase: "blocked", citations: [], detail: "",
            message: "The export failed its contract, so nothing is displayed: " + parsed.errors.slice(0, 3).join("; "),
          })
          return
        }
        setState({phase: "ready", citations: parsed.citations, message: "", detail: ""})
      } catch (reason) {
        if (cancelled) return
        setState({
          phase: "blocked", citations: [], message: "The research API could not be reached, so nothing is shown.",
          detail: reason instanceof Error ? reason.message : "",
        })
      }
    }
    void load()
    return () => { cancelled = true }
  }, [])

  return state
}
