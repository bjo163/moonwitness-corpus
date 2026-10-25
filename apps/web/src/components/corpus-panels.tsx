import type { LucideIcon } from "lucide-react"
import { ArrowRight, FileText, Link2, ScrollText } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { ContentLane, EvidenceRecord, SemanticRuleRow } from "@/data"
import { cn } from "@/lib/utils"

export function SectionHeading({
  kicker,
  title,
  description,
}: {
  kicker: string
  title: string
  description?: string
}) {
  return (
    <div className="max-w-3xl">
      <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">{kicker}</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-balance md:text-3xl">{title}</h2>
      {description ? <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p> : null}
    </div>
  )
}

export function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  // A ledger cell, not a KPI card: one hairline, mono figures, no shadow to imply emphasis.
  return (
    <div className="border-l border-border py-1 pl-3">
      <p className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">{label}</p>
      <p className="mt-1 font-mono text-xl tabular-nums">{value}</p>
      {hint ? <p className="mt-0.5 font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">{hint}</p> : null}
    </div>
  )
}

export function IdCode({ id, className }: { id?: string; className?: string }) {
  if (!id) return <span className="text-xs text-muted-foreground">—</span>
  return (
    <code
      className={cn("block truncate font-mono text-[11px] text-muted-foreground", className)}
      title={id}
    >
      {id}
    </code>
  )
}

export function EmptyState({
  icon: Icon = FileText,
  title,
  description,
}: {
  icon?: LucideIcon
  title: string
  description?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-10 text-center">
      <Icon className="size-5 text-muted-foreground" aria-hidden="true" />
      <p className="text-sm font-medium">{title}</p>
      {description ? <p className="max-w-md text-xs leading-relaxed text-muted-foreground">{description}</p> : null}
    </div>
  )
}

export interface HierarchyItem {
  id: string
  kind: string
  label: string
  detail?: string
  state: "available" | "missing"
}

export function HierarchyTrace({ items }: { items: HierarchyItem[] }) {
  if (!items.length) {
    return <EmptyState icon={ScrollText} title="No hierarchy records resolved" description="Select a work to trace work → expression → edition → artifact → passage → content." />
  }

  return (
    <ol className="space-y-2">
      {items.map((item, index) => (
        <li key={`${item.id}-${index}`} className="flex items-start gap-3">
          <div className="flex flex-col items-center self-stretch">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full border bg-background text-[10px] font-semibold tabular-nums text-muted-foreground">
              {index + 1}
            </span>
            {index < items.length - 1 ? <span className="my-1 w-px flex-1 bg-border" aria-hidden="true" /> : null}
          </div>
          <div className="min-w-0 flex-1 pb-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="font-mono text-[10px]">
                {item.kind}
              </Badge>
              {item.state === "missing" ? (
                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                  missing
                </Badge>
              ) : null}
            </div>
            <p className="mt-1 text-sm font-medium break-words">{item.label}</p>
            {item.detail ? <p className="mt-0.5 text-xs text-muted-foreground">{item.detail}</p> : null}
            <IdCode id={item.id} className="mt-1" />
          </div>
        </li>
      ))}
    </ol>
  )
}

function directionFor(script?: string) {
  if (script === "Arab" || script === "Hebr") return "rtl"
  if (script === "Jpan" || script === "Hani" || script === "Hant" || script === "Hans") return "ltr"
  return "ltr"
}

export function TextLanes({ lanes }: { lanes: ContentLane[] }) {
  if (!lanes.length) {
    return (
      <EmptyState
        icon={FileText}
        title="No exact-text lane for this passage"
        description="Missing text stays unavailable rather than being synthesized from a translation or a model."
      />
    )
  }

  return (
    <div className="space-y-3">
      {lanes.map((lane) => (
        <div key={lane.id} className="rounded-lg border bg-muted/20 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="default" className="font-mono text-[10px] uppercase">
              {lane.language}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {lane.representation}
            </Badge>
            {lane.script ? (
              <Badge variant="secondary" className="font-mono text-[10px]">
                {lane.script}
              </Badge>
            ) : null}
          </div>
          <p
            dir={directionFor(lane.script)}
            lang={lane.language}
            className="mt-3 text-[15px] leading-8 whitespace-pre-wrap break-words"
          >
            {lane.text}
          </p>
          <Separator className="my-3" />
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
            <span className="truncate" title={lane.artifact}>
              artifact · {lane.artifact ?? "—"}
            </span>
            <span className="truncate" title={lane.provenance}>
              provenance · {lane.provenance ?? "—"}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

export interface RightsRow {
  id: string
  label: string
  revision?: string
  sha256?: string
  rights?: string
  license?: string
  availability?: string
  sourceReference?: string
  state: "available" | "partial"
}

export function RightsTable({ records }: { records: RightsRow[] }) {
  if (!records.length) {
    return <EmptyState icon={ScrollText} title="No source/rights metadata resolved" />
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Source</TableHead>
          <TableHead>Availability</TableHead>
          <TableHead>Rights</TableHead>
          <TableHead>License</TableHead>
          <TableHead>SHA-256</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {records.map((record) => (
          <TableRow key={record.id}>
            <TableCell className="max-w-[18rem]">
              <p className="truncate text-sm font-medium" title={record.label}>
                {record.label}
              </p>
              <IdCode id={record.id} />
              {record.revision ? <p className="mt-1 text-[11px] text-muted-foreground">{record.revision}</p> : null}
            </TableCell>
            <TableCell>
              <Badge variant={record.state === "available" ? "secondary" : "outline"} className="text-[10px]">
                {record.availability ?? "unknown"}
              </Badge>
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">{record.rights ?? "—"}</TableCell>
            <TableCell className="text-xs text-muted-foreground">{record.license ?? "—"}</TableCell>
            <TableCell>
              {record.sha256 ? (
                <code className="font-mono text-[10px] text-muted-foreground" title={record.sha256}>
                  {record.sha256.slice(0, 12)}…{record.sha256.slice(-6)}
                </code>
              ) : (
                <span className="text-xs text-muted-foreground">—</span>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export interface RelationRow {
  id: string
  subject: string
  relation: string
  object: string
  method?: string
  provenance?: string
  state: "available" | "partial"
}

export function RelationsTable({ rows }: { rows: RelationRow[] }) {
  if (!rows.length) {
    return (
      <EmptyState
        icon={Link2}
        title="No alignment, variant or relation records"
        description="Correspondence is never inferred from similarity; only recorded relations are shown."
      />
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Relation</TableHead>
          <TableHead>Subject</TableHead>
          <TableHead>Object</TableHead>
          <TableHead>Method</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell>
              <Badge variant={row.state === "available" ? "secondary" : "outline"} className="text-[10px]">
                {row.relation}
              </Badge>
            </TableCell>
            <TableCell className="max-w-[14rem]">
              <IdCode id={row.subject} />
            </TableCell>
            <TableCell className="max-w-[14rem]">
              <IdCode id={row.object} />
            </TableCell>
            <TableCell className="max-w-[16rem] text-xs text-muted-foreground">
              <span className="line-clamp-2">{row.method ?? "—"}</span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export function EvidenceList({ items }: { items: EvidenceRecord[] }) {
  if (!items.length) {
    return (
      <EmptyState
        icon={Link2}
        title="No evidence record targets this passage"
        description="Absence of evidence is recorded as absence, never as a negative finding."
      />
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="rounded-lg border p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="text-[10px]">
              {item.relation ?? "evidence"}
            </Badge>
            <IdCode id={item.target} className="max-w-[22rem]" />
          </div>
          <IdCode id={item.id} className="mt-1.5" />
          <p className="mt-1.5 text-xs text-muted-foreground">
            {item.provenance ? `provenance · ${item.provenance}` : "No provenance pointer on this evidence record."}
          </p>
        </div>
      ))}
    </div>
  )
}

export function SemanticRulesTable({ rows }: { rows: SemanticRuleRow[] }) {
  if (!rows.length) return <EmptyState title="No semantic guardrail rows" />

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Guardrail</TableHead>
          <TableHead>Context</TableHead>
          <TableHead>Epistemic state</TableHead>
          <TableHead className="text-right">Sources</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="text-sm font-medium">{row.label}</TableCell>
            <TableCell className="text-xs text-muted-foreground">{row.context}</TableCell>
            <TableCell className="text-xs text-muted-foreground">{row.epistemic}</TableCell>
            <TableCell className="text-right text-sm tabular-nums">{row.sourceCount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export interface ProvenanceNode {
  id: string
  kind: string
  label: string
  detail?: string
  active?: boolean
}

export function ProvenanceTimeline({ nodes }: { nodes: ProvenanceNode[] }) {
  return (
    <ol className="space-y-4">
      {nodes.map((node, index) => (
        <li key={node.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span
              className={cn(
                "mt-0.5 size-2.5 shrink-0 rounded-full border",
                node.active ? "border-primary bg-primary" : "border-border bg-muted",
              )}
              aria-hidden="true"
            />
            {index < nodes.length - 1 ? <span className="my-1 w-px flex-1 bg-border" aria-hidden="true" /> : null}
          </div>
          <div className="min-w-0 flex-1 pb-1">
            <p className="text-sm font-medium">{node.label}</p>
            {node.detail ? <p className="mt-0.5 text-xs break-words text-muted-foreground">{node.detail}</p> : null}
            <IdCode id={node.id} className="mt-1" />
          </div>
        </li>
      ))}
    </ol>
  )
}

export function TraceLink({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      {children}
      <ArrowRight className="size-3" aria-hidden="true" />
    </span>
  )
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent }
