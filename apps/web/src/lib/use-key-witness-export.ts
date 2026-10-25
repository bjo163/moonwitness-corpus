"use client"

import { useEffect, useState } from "react"
import { loadKeyWitnessExport, type ExportLoad } from "./key-witness-export"

/**
 * The React shell around the shared export reader. The reader itself lives in
 * `key-witness-export.ts` so it can be tested without React installed.
 */
export type ExportState = {
  phase: "busy" | "ready" | "blocked"
  citations: ExportLoad["citations"]
  message: string
  detail: string
}

export function useKeyWitnessExport(): ExportState {
  const [state, setState] = useState<ExportState>({phase: "busy", citations: [], message: "", detail: ""})

  useEffect(() => {
    let cancelled = false
    void loadKeyWitnessExport().then(result => {
      if (cancelled) return
      setState(result.ok
        ? {phase: "ready", citations: result.citations, message: "", detail: ""}
        : {phase: "blocked", citations: [], message: result.message, detail: result.detail})
    })
    return () => { cancelled = true }
  }, [])

  return state
}
