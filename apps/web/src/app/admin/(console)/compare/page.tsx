"use client"

import { useMemo, useState } from "react"
import { compareByKey, spectrumFacets, spectrumRows } from "@/lib/key-witness"
import { useKeyWitnessExport } from "@/lib/use-key-witness-export"

/**
 * P18-015: compare one key across two passages.
 *
 * The comparison is only offered when both sides were recorded with the same
 * method and scheme; frame differences are printed as boundaries instead of
 * being normalised away, and there is no delta, no winner and no global score.
 */
export default function ComparePage() {
  const feed = useKeyWitnessExport()
  const [key, setKey] = useState("")
  const [left, setLeft] = useState("")
  const [right, setRight] = useState("")

  const rows = useMemo(() => spectrumRows(feed.citations), [feed.citations])
  const passages = useMemo(() => [...new Set(rows.map(row => row.passageId))].sort(), [rows])
  const facets = useMemo(() => spectrumFacets(rows), [rows])

  const comparison = useMemo(() => key && left && right ? compareByKey(feed.citations, key, left, right) : null, [feed.citations, key, left, right])
  const ready = feed.phase === "ready"
  const chosen = key !== "" && left !== "" && right !== ""
  const control = "mt-1 w-full rounded-sm border bg-background px-2 py-1.5 font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"

  return <div className="space-y-6">
    <header className="space-y-2">
      <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">P18-015 · compare</p>
      <h1 className="text-2xl font-medium">Compare by key</h1>
      <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
        One key, two passages. The screen refuses a comparison made with two different methods or schemes, prints every frame
        boundary that differs, and never subtracts one reading from the other.
      </p>
    </header>

    {feed.phase === "busy" && <p role="status" className="rounded-md border border-dashed p-4 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Reading the sealed export…</p>}
    {feed.phase === "blocked" && <div className="space-y-2 rounded-md border p-4">
      {feed.message && <p role="status" className="text-sm">{feed.message}</p>}
      {feed.detail && <p role="alert" className="text-sm">{feed.detail}</p>}
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">No comparison is drawn from a partial or unverifiable export.</p>
    </div>}

    <section className="rounded-md border p-4" aria-labelledby="compare-inputs">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="compare-inputs" className="text-sm font-medium">Selection</h2>
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          {ready ? passages.length + " passages · " + facets.keys.length + " keys published" : "no export published"}
        </p>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <label className="block text-xs" htmlFor="compare-key">Key
          <select id="compare-key" className={control} value={key} disabled={!ready}
            onChange={event => setKey(event.target.value)}>
            <option value="">Choose a key</option>
            {facets.keys.map(option => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
        <label className="block text-xs" htmlFor="compare-left">Passage A
          <select id="compare-left" className={control} value={left} disabled={!ready}
            onChange={event => setLeft(event.target.value)}>
            <option value="">Choose a passage</option>
            {passages.map(passage => <option key={passage} value={passage}>{passage}</option>)}
          </select>
        </label>
        <label className="block text-xs" htmlFor="compare-right">Passage B
          <select id="compare-right" className={control} value={right} disabled={!ready}
            onChange={event => setRight(event.target.value)}>
            <option value="">Choose a passage</option>
            {passages.map(passage => <option key={passage} value={passage}>{passage}</option>)}
          </select>
        </label>
      </div>
      {!ready && <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Waiting for the sealed export</p>}
    </section>

    {comparison && <section className="space-y-3" aria-labelledby="compare-result">
      <h2 id="compare-result" className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Result · {comparison.key}</h2>
      {comparison.refusals.length > 0 && <div className="space-y-1 rounded-md border border-dashed p-4">
        {comparison.refusals.map(refusal => <p key={refusal} role="alert" className="text-sm">{refusal}</p>)}
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          Status: {comparison.status} · nothing is compared across methods or schemes
        </p>
      </div>}

      <div className="grid gap-3 md:grid-cols-2">
        {comparison.sides.map(side => <section key={side.passageId} className="rounded-sm border p-3">
          <p className="break-all font-mono text-xs">{side.passageId}</p>
          {side.assessorCount > 1 && <p className="mt-1 font-mono text-[10px] text-muted-foreground">
            {side.assessorCount} assessors recorded this key · showing the first by assessor id
          </p>}
          <dl className="mt-2 space-y-1">
            {[
              ["assessor", side.assessor],
              ["method", side.method],
              ["scheme", side.scheme],
              ["relation", side.relation ?? "—"],
              ["direction", side.direction === null ? "—" : side.direction > 0 ? "+" + side.direction : String(side.direction)],
              ["review", side.reviewStatus],
            ].map(([label, value]) => <div key={label} className="grid grid-cols-[5.5rem_1fr] gap-2">
              <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{label}</dt>
              <dd className="break-all font-mono text-[11px]" dir="auto">{value}</dd>
            </div>)}
          </dl>
          <div className="mt-2 border-t border-border/60 pt-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Frame</p>
            {side.frame ? <p className="mt-1 font-mono text-[10px] leading-relaxed">
              {side.frame.agent} / {side.frame.recipient} · {side.frame.domain} · scope {side.frame.scope} · {side.frame.genre}
            </p> : <p className="mt-1 font-mono text-[10px] text-muted-foreground">not recorded</p>}
          </div>
        </section>)}
      </div>

      <div className="rounded-md border p-4">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Frame boundaries</h3>
        {comparison.frameBoundaries.length > 0
          ? <ul className="mt-2 space-y-1">
              {comparison.frameBoundaries.map(boundary => <li key={boundary} className="font-mono text-[11px]" dir="auto">{boundary}</li>)}
            </ul>
          : <p className="mt-2 text-sm text-muted-foreground">The two frames match field for field. That is a shared frame, not a shared verdict.</p>}
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          A differing frame means the two readings are scoped differently: compare them inside their boundaries, never by
          subtracting one direction from the other.
        </p>
      </div>
    </section>}

    {ready && !chosen && <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
      Choose a key and two passages. Only published citations are compared; the console does not fetch a reading it has not
      been given.
    </p>}

    <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground">
      There is no global score on this screen, and no delta between the two passages: a comparison shows method, frame and
      direction side by side so a reader can see the boundary, not a winner.
    </p>
  </div>
}
