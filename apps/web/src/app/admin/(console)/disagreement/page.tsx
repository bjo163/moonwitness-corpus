"use client"

import { useMemo, useState } from "react"
import { disagreementGroups, disagreementSummary } from "@/lib/key-witness"
import { useKeyWitnessExport } from "@/lib/use-key-witness-export"

/**
 * P18-012: the disagreement view. Two assessors who read the same passage
 * differently get two rows with their own identity, keys, frame and boundary;
 * the screen never merges them into a score, a winner or a resolved reading.
 * An agreement statistic belongs to the annotation report, not here.
 */
export default function DisagreementPage() {
  const feed = useKeyWitnessExport()
  const [onlyAlternates, setOnlyAlternates] = useState(false)

  const groups = useMemo(() => disagreementGroups(feed.citations), [feed.citations])
  const summary = useMemo(() => disagreementSummary(groups), [groups])
  const visible = onlyAlternates
    ? groups.filter(group => group.assessors.length > 1 || group.readings.length > 1)
    : groups

  return <div className="space-y-6">
    <header className="space-y-2">
      <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">P18-012 · disagreement</p>
      <h1 className="text-2xl font-medium">Alternate assessments</h1>
      <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
        Every assessor who recorded a key on the passage, and every reviewed reading, keeps their own name and their own
        boundary. Nothing here is averaged, adjudicated or ranked — no agreement statistic is computed on this screen.
      </p>
    </header>

    {feed.phase === "busy" && <p role="status" className="rounded-md border border-dashed p-4 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Reading the sealed export…</p>}
    {feed.phase === "blocked" && <div className="space-y-3 rounded-md border p-4">
      {feed.message && <p role="status" className="text-sm">{feed.message}</p>}
      {feed.detail && <p role="alert" className="text-sm">{feed.detail}</p>}
      {/* Without an export the screen still has to say what it would show. */}
      <div className="space-y-1 border-t border-border/60 pt-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">What this screen will show</p>
        <ul className="list-inside list-disc text-xs leading-relaxed text-muted-foreground">
          <li>One row per assessor, with the canonical id that signed the record.</li>
          <li>Each reviewed reading with its reviewer, its boundary and its source assessments.</li>
          <li>No weighting, no averaging and no agreement number.</li>
        </ul>
      </div>
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">No disagreement view is drawn from a partial or unverifiable export.</p>
    </div>}

    {feed.phase === "ready" && <>
      <dl className="flex flex-wrap items-baseline gap-x-8 gap-y-3 border-y border-border/60 py-4">
        {[
          {label: "passages", value: summary.passages, hint: "with a record"},
          {label: "alternate assessments", value: summary.alternateAssessments, hint: "2+ assessors"},
          {label: "alternate readings", value: summary.alternateReadings, hint: "2+ reviewed messages"},
          {label: "single assessor", value: summary.singleAssessor, hint: "not agreement"},
        ].map(item => <div key={item.label}>
          <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{item.label}</dt>
          <dd className="mt-1 font-mono text-2xl tabular-nums">{item.value}</dd>
          <dd className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{item.hint}</dd>
        </div>)}
      </dl>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" aria-pressed={onlyAlternates} onClick={() => setOnlyAlternates(value => !value)}
          className={"rounded-sm border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
            (onlyAlternates ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground")}>
          Only alternate assessments
        </button>
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          {visible.length} of {groups.length} passages
        </p>
      </div>

      <div className="divide-y divide-border/60 rounded-md border">
        {visible.map(group => <article key={group.passageId} className="p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="break-all font-mono text-xs">{group.passageId}</h2>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              {group.assessors.length} assessor{group.assessors.length === 1 ? "" : "s"} · {group.distinctKeys} distinct key{group.distinctKeys === 1 ? "" : "s"} · {group.readings.length} reading{group.readings.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {group.assessors.map(entry => <section key={entry.assessor} className="rounded-sm border bg-background/60 p-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Assessor</p>
              <p className="mt-0.5 break-all font-mono text-xs">{entry.assessor}</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">scheme {entry.scheme}</p>
              <ul className="mt-2 space-y-2">
                {entry.keys.map(key => <li key={key.id} className="space-y-0.5 border-t border-border/40 pt-2 first:border-0 first:pt-0">
                  <p className="font-mono text-xs" dir="auto">{key.key}</p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    {key.relation ?? "relation —"} · direction {key.direction === undefined ? "—" : key.direction > 0 ? "+" + key.direction : key.direction} · {key.reviewStatus}
                  </p>
                  {key.frame && <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    frame {key.frame.agent} / {key.frame.genre} · scope {key.frame.scope}
                  </p>}
                </li>)}
              </ul>
            </section>)}
          </div>

          {group.readings.length > 0 && <section className="mt-3 border-t border-border/60 pt-3" aria-label="Reviewed readings">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Reviewed readings</h3>
            <div className="mt-2 space-y-3">
              {group.readings.map(reading => <div key={reading.id} className="space-y-1">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">reviewer {reading.reviewer} · {reading.reviewStatus}</p>
                <p className="max-w-3xl text-sm leading-relaxed" dir="auto">{reading.message}</p>
                <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground" dir="auto">Boundary: {reading.boundaryNote}</p>
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                  {reading.sourceKeyAssessmentIds.length} source assessment{reading.sourceKeyAssessmentIds.length === 1 ? "" : "s"} · derived, not scripture
                </p>
              </div>)}
            </div>
          </section>}

          {group.unpaired && <p className="mt-3 rounded-sm border border-dashed p-2 text-xs leading-relaxed text-muted-foreground">
            A single record is not an agreement. This passage has one assessor on record, so there is nothing to compare yet.
          </p>}
        </article>)}
        {visible.length === 0 && <p className="p-4 text-sm text-muted-foreground">No passage has a second assessor or a second reading in this export. That is a coverage fact, not a consensus.</p>}
      </div>

      <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground">
        Two rows mean two recorded readings, not two votes: this screen has no weighting, no averaging and no resolution.
        Agreement, alpha and any go/no-go recommendation are produced by the annotation report and a human reviewer, and a
        reviewer identity here is the principal who signed the record, not a claim of independence.
      </p>
    </>}
  </div>
}
