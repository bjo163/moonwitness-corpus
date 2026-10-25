"use client"

import { useMemo, useState } from "react"
import { filterSpectrum, spectrumFacets, spectrumRows, type SpectrumFilter } from "@/lib/key-witness"
import { useKeyWitnessExport } from "@/lib/use-key-witness-export"

/**
 * P18-011: the key spectrum. It filters the published citations by key, relation,
 * direction and frame, and lists what matched. It never says which reading is
 * right: a spectrum is a way to see the spread, not a way to pick a winner.
 *
 * A facet that the sealed export does not publish is shown as unpublished instead
 * of being offered as an empty filter that silently matches nothing.
 */
const EMPTY: SpectrumFilter = {key: "", relation: "", direction: "", frame: ""}

export default function SpectrumPage() {
  const feed = useKeyWitnessExport()
  const [filter, setFilter] = useState<SpectrumFilter>(EMPTY)

  const rows = useMemo(() => spectrumRows(feed.citations), [feed.citations])
  const facets = useMemo(() => spectrumFacets(rows), [rows])
  const matched = useMemo(() => filterSpectrum(rows, filter), [rows, filter])
  const active = filter.key !== "" || filter.relation !== "" || filter.direction !== "" || filter.frame !== ""
  const ready = feed.phase === "ready"
  // A disabled control still has to say why it is disabled.
  const hint = (available: number) => !ready ? "Waiting for the sealed export" : available === 0 ? "Not published by this export" : null

  const control = "mt-1 w-full rounded-sm border bg-background px-2 py-1.5 font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
  return <div className="space-y-6">
    <header className="space-y-2">
      <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">P18-011 · spectrum</p>
      <h1 className="text-2xl font-medium">Key spectrum</h1>
      <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
        Filter the recorded keys by key, relation, direction and frame. Results are listed by passage and key, never by strength;
        a match is a citation to look at, not a conclusion to adopt.
      </p>
    </header>

    {feed.phase === "busy" && <p role="status" className="rounded-md border border-dashed p-4 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Reading the sealed export…</p>}
    {feed.phase === "blocked" && <div className="space-y-2 rounded-md border p-4">
      {feed.message && <p className="text-sm">{feed.message}</p>}
      {feed.detail && <p role="alert" className="text-sm">{feed.detail}</p>}
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">No spectrum is drawn from a partial or unverifiable export.</p>
    </div>}

      <section className="rounded-md border p-4" aria-labelledby="spectrum-filters">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="spectrum-filters" className="text-sm font-medium">Filters</h2>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{ready ? matched.length + " of " + rows.length + " cited keys" : "no export published"}</p>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block text-xs" htmlFor="filter-key">Key
            <select id="filter-key" className={control} value={filter.key} disabled={!ready}
              onChange={event => setFilter({...filter, key: event.target.value})}>
              <option value="">Any key</option>
              {facets.keys.map(key => <option key={key} value={key}>{key}</option>)}
            </select>
            {hint(facets.keys.length) && <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{hint(facets.keys.length)}</span>}
          </label>
          <label className="block text-xs" htmlFor="filter-relation">Relation
            <select id="filter-relation" className={control} value={filter.relation}
              disabled={!ready || facets.available.relation === 0}
              onChange={event => setFilter({...filter, relation: event.target.value})}>
              <option value="">Any relation</option>
              {facets.relations.map(relation => <option key={relation} value={relation}>{relation}</option>)}
            </select>
            {hint(facets.available.relation) && <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{hint(facets.available.relation)}</span>}
          </label>
          <label className="block text-xs" htmlFor="filter-direction">Direction
            <select id="filter-direction" className={control} value={filter.direction}
              disabled={!ready || facets.available.direction === 0}
              onChange={event => setFilter({...filter, direction: event.target.value})}>
              <option value="">Any direction</option>
              {facets.directions.map(direction => <option key={direction} value={String(direction)}>{direction > 0 ? "+" + direction : String(direction)}</option>)}
            </select>
            {hint(facets.available.direction) && <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{hint(facets.available.direction)}</span>}
          </label>
          <label className="block text-xs" htmlFor="filter-frame">Frame
            <select id="filter-frame" className={control} value={filter.frame}
              disabled={!ready || facets.available.frame === 0}
              onChange={event => setFilter({...filter, frame: event.target.value})}>
              <option value="">Any frame</option>
              {facets.frames.map(frame => <option key={frame} value={frame}>{frame}</option>)}
            </select>
            {hint(facets.available.frame) && <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{hint(facets.available.frame)}</span>}
          </label>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => setFilter(EMPTY)} disabled={!active}
            className="rounded-sm border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] motion-safe:transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50">
            Clear filters
          </button>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            relation {facets.available.relation}/{facets.total} · direction {facets.available.direction}/{facets.total} · frame {facets.available.frame}/{facets.total}
          </p>
        </div>
      </section>

      {ready && <>
        <div className="overflow-x-auto rounded-md border">
        <table className="w-full min-w-[52rem] border-collapse text-left">
          <caption className="sr-only">Cited keys matching the selected facets</caption>
          <thead>
            <tr className="border-b border-border/60 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              <th scope="col" className="px-3 py-2">Passage</th>
              <th scope="col" className="px-3 py-2">Key</th>
              <th scope="col" className="px-3 py-2">Relation</th>
              <th scope="col" className="px-3 py-2">Direction</th>
              <th scope="col" className="px-3 py-2">Frame</th>
              <th scope="col" className="px-3 py-2">Assessor</th>
              <th scope="col" className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {matched.map(row => <tr key={row.recordId + ":" + row.assessor} className="border-b border-border/40 last:border-0">
              <td className="px-3 py-2 font-mono text-[11px] break-all">{row.passageId}</td>
              <td className="px-3 py-2 font-mono text-xs" dir="auto">{row.key}</td>
              <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground">{row.relation ?? "—"}</td>
              <td className="px-3 py-2 font-mono text-[11px] tabular-nums text-muted-foreground">{row.direction === null ? "—" : row.direction > 0 ? "+" + row.direction : row.direction}</td>
              <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground">{row.frameLabel ?? "—"}</td>
              <td className="px-3 py-2 font-mono text-[11px] break-all text-muted-foreground">{row.assessor}</td>
              <td className="px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em]">{row.reviewStatus}</td>
            </tr>)}
          </tbody>
        </table>
        {matched.length === 0 && <p className="p-4 text-sm text-muted-foreground">No cited key matches these filters. That is an empty selection, not evidence that the key is absent from the tradition.</p>}
      </div>

      <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground">
        A dash means the annotation did not record that facet; it is not a neutral zero and it is not a missing judgement. This
        screen shows the spread of recorded readings and never scores a verse, a work or a tradition.
      </p>
      </>}
  </div>
}
