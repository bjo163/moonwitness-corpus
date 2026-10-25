"use client"

import { useEffect, useMemo, useState } from "react"
import {
  balanceByPassage, balanceByWork, maxCount, parseExportJsonl,
  type KeyCount, type PassageBalance, type WorkBalance,
} from "@/lib/key-witness"

/**
 * P18-010: the balance view. A reader worried that every passage feels like a
 * warning should be able to see the spread of recorded keys instead of a single
 * number. So this screen shows counts per work and per passage, alphabetically —
 * sorting by size would smuggle a ranking back in.
 */
const API = (process.env.NEXT_PUBLIC_RGBL_API_URL || "").replace(/\/+$/, "")
type View = "work" | "passage"
type Balance = {citations: number; passages: number; works: number; assessors: number}

function KeyRow({entry, max}:{entry:KeyCount;max:number}) {
  const width = Math.max(2, Math.round((entry.count / max) * 100))
  return <li className="grid grid-cols-[minmax(6rem,10rem)_1fr_auto] items-center gap-3 py-1.5">
    <span className="truncate font-mono text-xs" dir="auto" title={entry.token}>{entry.token}</span>
    <span className="flex items-center gap-2">
      <span className="h-1.5 w-full overflow-hidden rounded-full bg-muted" aria-hidden="true">
        <span className="block h-full rounded-full bg-foreground/70" style={{width: width + "%"}} />
      </span>
    </span>
    <span className="font-mono text-xs tabular-nums text-muted-foreground">
      {entry.count}<span className="px-1 text-border">/</span>{entry.assessors.length}a
    </span>
  </li>
}

function KeyList({keys}:{keys:KeyCount[]}) {
  const max = maxCount(keys)
  return <ul className="mt-2 border-t border-border/50 pt-2">{keys.map(entry => <KeyRow key={entry.token} entry={entry} max={max} />)}</ul>
}

export default function BalancePage() {
  const [state, setState] = useState<"idle" | "busy" | "ready" | "blocked">("idle")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [view, setView] = useState<View>("work")
  const [works, setWorks] = useState<WorkBalance[]>([])
  const [passages, setPassages] = useState<PassageBalance[]>([])
  const [balance, setBalance] = useState<Balance>({citations: 0, passages: 0, works: 0, assessors: 0})

  useEffect(() => {
    if (!API) {
      setState("blocked")
      setMessage("The balance view reads the sealed export from the research API. Set NEXT_PUBLIC_RGBL_API_URL; this static build does not invent counts.")
      return
    }
    let cancelled = false
    const load = async () => {
      setState("busy"); setError(""); setMessage("")
      try {
        const response = await fetch(API + "/v1/research/key-witness/export.jsonl",
          {headers: {accept: "application/x-ndjson"}, signal: AbortSignal.timeout(20000)})
        if (!response.ok) {
          const failure = await response.json().catch(() => ({})) as {error?: unknown}
          const code = typeof failure.error === "string" ? failure.error : ""
          if (cancelled) return
          setState("blocked")
          setMessage(code === "key_witness_not_materialized"
            ? "No sealed export is published yet, so there is no distribution to show."
            : code === "key_witness_index_integrity_failure"
              ? "The published index failed its integrity check; no counts are displayed."
              : "The key layer answered " + response.status + " without a readable export.")
          return
        }
        const parsed = parseExportJsonl(await response.text())
        if (cancelled) return
        // One unreadable line invalidates the whole export rather than shrinking it quietly.
        if (parsed.errors.length) throw new Error("The export failed its contract: " + parsed.errors.slice(0, 3).join("; "))
        setWorks(balanceByWork(parsed.citations))
        setPassages(balanceByPassage(parsed.citations))
        setBalance({
          citations: parsed.citations.length,
          passages: new Set(parsed.citations.map(citation => citation.passageId)).size,
          works: new Set(parsed.citations.map(citation => citation.passageId.split(":").slice(2, 4).join(":"))).size,
          assessors: new Set(parsed.citations.flatMap(citation => citation.keys.map(key => key.assessor))).size,
        })
        setState("ready")
      } catch (reason) {
        if (cancelled) return
        setState("blocked")
        setError(reason instanceof Error ? reason.message : "The export could not be read")
      }
    }
    void load()
    return () => { cancelled = true }
  }, [])

  const summary = useMemo(() => [
    {label: "records", value: balance.citations},
    {label: "passages", value: balance.passages},
    {label: "works", value: balance.works},
    {label: "assessors", value: balance.assessors},
  ], [balance])

  return <div className="space-y-6">
    <header className="space-y-2">
      <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">P18-010 · balance</p>
      <h1 className="text-2xl font-medium">Key balance</h1>
      <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
        How often each key was recorded, per work and per passage. Keys are listed alphabetically and the bar shows the count of
        records; it is not a weight, not an approval and not a ranking of the passage.
      </p>
    </header>

    {state === "busy" && <p role="status" className="rounded-md border border-dashed p-4 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Reading the sealed export…</p>}
    {state === "blocked" && <div className="space-y-2 rounded-md border p-4">
      {message && <p className="text-sm">{message}</p>}
      {error && <p role="alert" className="text-sm">{error}</p>}
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">No distribution is drawn from a partial or unverifiable export.</p>
    </div>}

    {state === "ready" && <>
      <dl className="flex flex-wrap items-baseline gap-x-8 gap-y-3 border-y border-border/60 py-4">
        {summary.map(item => <div key={item.label}>
          <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{item.label}</dt>
          <dd className="mt-1 font-mono text-2xl tabular-nums">{item.value}</dd>
        </div>)}
      </dl>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label="Balance grouping" className="flex gap-1">
          {(["work", "passage"] as View[]).map(option => <button key={option} type="button" aria-pressed={view === option}
            onClick={() => setView(option)}
            className={"rounded-sm border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
              (view === option ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground")}>
            {option === "work" ? "By work" : "By passage"}
          </button>)}
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">count / distinct assessors</p>
      </div>

      {view === "work"
        ? <div className="divide-y divide-border/60 rounded-md border">
            {works.map(work => <section key={work.workId} className="p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="break-all font-mono text-xs">{work.workId}</h2>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  {work.passageCount} passage{work.passageCount === 1 ? "" : "s"} · {work.recordCount} record{work.recordCount === 1 ? "" : "s"}
                </p>
              </div>
              <KeyList keys={work.keys} />
            </section>)}
          </div>
        : <div className="divide-y divide-border/60 rounded-md border">
            {passages.map(passage => <section key={passage.passageId} className="p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="break-all font-mono text-xs">{passage.passageId}</h2>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  {passage.workId} · {passage.recordCount} record{passage.recordCount === 1 ? "" : "s"} · {passage.assessorCount} assessor{passage.assessorCount === 1 ? "" : "s"}
                </p>
              </div>
              <KeyList keys={passage.keys} />
            </section>)}
          </div>}

      <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground">
        Counts describe what annotators recorded, not what a text means. A short bar is an absent annotation, not an absence of
        a theme; a long bar is a busy annotator, not a stronger claim. Nothing on this screen is exported as a score.
      </p>
    </>}
  </div>
}
