"use client"

import { useMemo } from "react"
import { CONTEXT_FIELDS, coverageSummary, measureCitationCoverage, scoreReadiness } from "@/lib/key-witness"
import { useKeyWitnessExport } from "@/lib/use-key-witness-export"

/**
 * P18-013 / P18-014: the coverage meter and the score-profile readiness block.
 *
 * Coverage is nine named readiness fields, shown as `x/9` with the gaps spelled
 * out. The v0 score profile is research-only and needs a weight, an intensity and
 * a confidence per assessment; the citation export publishes none of the three,
 * so this screen reports what is missing instead of producing a number that a
 * reader could mistake for a verdict on the verse.
 */
export default function CoveragePage() {
  const feed = useKeyWitnessExport()

  const summary = useMemo(() => coverageSummary(feed.citations), [feed.citations])
  const readiness = useMemo(() => feed.citations.map(citation => {
    const measured = measureCitationCoverage(citation)
    return {measured, profile: scoreReadiness(citation, measured)}
  }), [feed.citations])
  // The export publishes none of the three formula inputs, so a count of computable
  // profiles could only ever be zero; the honest figure is what is missing.
  const missingInputs = readiness.length
    ? Math.min(...readiness.map(entry => entry.profile.missingInputs.length))
    : 0

  const gapEntries = CONTEXT_FIELDS.filter(field => (summary.gaps[field] ?? 0) > 0)

  return <div className="space-y-6">
    <header className="space-y-2">
      <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">P18-013 · coverage</p>
      <h1 className="text-2xl font-medium">Context coverage</h1>
      <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
        Nine fields a reader needs in order to know what they are looking at. This is a readiness meter for the card, not a
        judgement of the text: an incomplete card is a question for a curator, never a low grade for a verse.
      </p>
    </header>

    {feed.phase === "busy" && <p role="status" className="rounded-md border border-dashed p-4 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Reading the sealed export…</p>}
    {feed.phase === "blocked" && <div className="space-y-2 rounded-md border p-4">
      {feed.message && <p role="status" className="text-sm">{feed.message}</p>}
      {feed.detail && <p role="alert" className="text-sm">{feed.detail}</p>}
      <div className="space-y-1 border-t border-border/60 pt-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">The nine required fields</p>
        <p className="font-mono text-[11px] break-words">{CONTEXT_FIELDS.join(" · ")}</p>
      </div>
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">No coverage figure is drawn from a partial or unverifiable export.</p>
    </div>}

    {feed.phase === "ready" && <>
      <dl className="flex flex-wrap items-baseline gap-x-8 gap-y-3 border-y border-border/60 py-4">
        {[
          {label: "passages", value: String(summary.measured.length), hint: "with a record"},
          {label: "complete", value: String(summary.complete), hint: "9/9 fields"},
          {label: "average", value: (summary.average * CONTEXT_FIELDS.length).toFixed(1) + "/9", hint: "not a grade"},
          {label: "profile v0", value: String(missingInputs), hint: "inputs missing"},
        ].map(item => <div key={item.label}>
          <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{item.label}</dt>
          <dd className="mt-1 font-mono text-2xl tabular-nums">{item.value}</dd>
          <dd className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{item.hint}</dd>
        </div>)}
      </dl>

      {gapEntries.length > 0 && <section className="rounded-md border p-4" aria-labelledby="gap-summary">
        <h2 id="gap-summary" className="text-sm font-medium">Most frequent gaps</h2>
        <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-1">
          {gapEntries.map(field => <li key={field} className="font-mono text-[11px]">
            {field}<span className="px-1.5 text-border">/</span><span className="text-muted-foreground">{summary.gaps[field]} missing</span>
          </li>)}
        </ul>
      </section>}

      <div className="divide-y divide-border/60 rounded-md border">
        {readiness.map(({measured, profile}) => <article key={profile.passageId} className="p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="break-all font-mono text-xs">{profile.passageId}</h2>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              context {measured.display} · n {profile.n} · agreement n/a
            </p>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="flex gap-1" aria-hidden="true">
              {CONTEXT_FIELDS.map(field => <span key={field}
                className={"h-1.5 w-6 rounded-sm " + (measured.gaps.includes(field) ? "bg-muted" : "bg-foreground/70")} />)}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              {measured.gaps.length === 0 ? "no gaps" : "gaps: " + measured.gaps.join(", ")}
            </span>
          </div>
          {measured.frameSource && <p className="mt-1 font-mono text-[10px] text-muted-foreground">
            frame read from {measured.frameSource}
          </p>}
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            profile v0: {profile.status}
            {profile.missingInputs.length > 0 ? " (missing " + profile.missingInputs.join(", ") + ")" : ""}
          </p>
        </article>)}
        {readiness.length === 0 && <p className="p-4 text-sm text-muted-foreground">The export contains no records to measure.</p>}
      </div>

      <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground">
        The v0 score profile is research-only and is never part of the canonical JSONL. It requires a weight, an intensity and a confidence per assessment; a citation carries none of them, so no score is computed here. Coverage of the card and agreement between assessors are reported as they are, and neither is a property of the text.
      </p>
    </>}
  </div>
}
