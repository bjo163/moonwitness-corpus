import { useEffect, useMemo, useRef, useState, type FormEvent } from "react"
import {
  AlertTriangle,
  BookOpen,
  Database,
  FileSearch,
  Library,
  ScrollText,
  Search,
  ServerCog,
  ShieldCheck,
} from "lucide-react"

import {
  loadAssertionTraversal,
  loadHealth,
  loadSemanticRules,
  loadPassageById,
  loadPassageTrace,
  loadPassages,
  loadTraditions,
  loadWorkHierarchy,
  loadWorks,
  rgblApiBaseUrl,
  rgblApiConfigured,
  searchCorpus,
  type ApiHealth,
} from "./api"
import {
  type AssertionTraversal,
  type CorpusResource,
  type Passage,
  type PassageTrace,
  type SearchRecord,
  type SemanticRuleRow,
  type Tradition,
  type Work,
  type WorkHierarchy,
} from "./data"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  EmptyState,
  EvidenceList,
  HierarchyTrace,
  IdCode,
  ProvenanceTimeline,
  RelationsTable,
  RightsTable,
  SectionHeading,
  SemanticRulesTable,
  StatCard,
  TextLanes,
  type HierarchyItem,
  type RelationRow,
  type RightsRow,
} from "@/components/corpus-panels"
import { cn } from "@/lib/utils"

type SourceMode = "api" | "browser" | "catalog"

const ALL_TRADITIONS = "all"

const sections = [
  { id: "explore", label: "Corpus" },
  { id: "passage", label: "Text trace" },
  { id: "evidence", label: "Evidence" },
  { id: "provenance", label: "Provenance" },
  { id: "principles", label: "Rules" },
]

function strongestSource(...sources: SourceMode[]): SourceMode {
  if (sources.includes("api")) return "api"
  if (sources.includes("browser")) return "browser"
  return "catalog"
}

function sourceModeLabel(source: SourceMode) {
  if (source === "api") return "Live API"
  if (source === "browser") return "Full browser DB"
  return "Generated catalog"
}

function formatCount(value?: number) {
  if (typeof value !== "number") return "—"
  return new Intl.NumberFormat("en-US", { notation: value > 9999 ? "compact" : "standard" }).format(value)
}

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
}

function labelsOf(resource?: CorpusResource | null) {
  if (!resource?.labels?.length) return resource?.id ?? "Unknown"
  return resource.labels.find((label) => label.role === "preferred")?.value ?? resource.labels[0]?.value ?? resource.id
}

function extension(resource: CorpusResource | undefined, key: string) {
  return object(object(resource?.extensions)[key])
}

function compactId(id?: string) {
  if (!id) return "—"
  return id.length > 48 ? `${id.slice(0, 26)}…${id.slice(-16)}` : id
}

function updateQuery(params: Record<string, string | undefined>) {
  const url = new URL(window.location.href)
  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value)
    else url.searchParams.delete(key)
  }
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`)
}

function initialParam(key: string) {
  return new URLSearchParams(window.location.search).get(key) ?? ""
}

function stringOr(...values: unknown[]) {
  for (const value of values) if (typeof value === "string" && value.trim()) return value
  return "—"
}

export default function CorpusApp() {
  const [traditions, setTraditions] = useState<Tradition[]>([])
  const [works, setWorks] = useState<Work[]>([])
  const [selectedTradition, setSelectedTradition] = useState(() => initialParam("tradition"))
  const [selectedWorkId, setSelectedWorkId] = useState(() => initialParam("work"))
  const [hierarchy, setHierarchy] = useState<WorkHierarchy | null>(null)
  const [passages, setPassages] = useState<Passage[]>([])
  const [passageOffset, setPassageOffset] = useState(0)
  const [passageTotal, setPassageTotal] = useState<number | undefined>()
  const [passageHasMore, setPassageHasMore] = useState(false)
  const [selectedPassageId, setSelectedPassageId] = useState(() => initialParam("passage"))
  const [trace, setTrace] = useState<PassageTrace | null>(null)
  const [query, setQuery] = useState(() => initialParam("q"))
  const [results, setResults] = useState<SearchRecord[]>([])
  const [searchOffset, setSearchOffset] = useState(0)
  const [searchHasMore, setSearchHasMore] = useState(false)
  const [searchLatency, setSearchLatency] = useState<number | undefined>()
  const [searching, setSearching] = useState(false)
  const [loadingPassages, setLoadingPassages] = useState(false)
  const [health, setHealth] = useState<ApiHealth | null>(null)
  const [sourceMode, setSourceMode] = useState<SourceMode>("catalog")
  const [apiNotice, setApiNotice] = useState<string>("")
  const [semanticRows, setSemanticRows] = useState<SemanticRuleRow[]>([])
  const [assertionId, setAssertionId] = useState("")
  const [assertionTrace, setAssertionTrace] = useState<AssertionTraversal | null>(null)
  const [assertionLoading, setAssertionLoading] = useState(false)
  const [assertionNotice, setAssertionNotice] = useState("")
  const pendingPassageId = useRef("")

  const selectedWork = useMemo(
    () => works.find((work) => work.id === selectedWorkId) ?? works[0],
    [works, selectedWorkId],
  )
  const selectedPassage = useMemo(
    () => passages.find((passage) => passage.id === selectedPassageId) ?? passages[0],
    [passages, selectedPassageId],
  )
  const visibleWorks = useMemo(
    () => works.filter((work) => !selectedTradition || work.tradition === selectedTradition),
    [works, selectedTradition],
  )
  const aggregateRecords = useMemo(
    () => traditions.reduce((sum, tradition) => sum + (tradition.totalRecords ?? 0), 0),
    [traditions],
  )

  useEffect(() => {
    let active = true
    void Promise.all([loadHealth(), loadTraditions(), loadWorks(), loadSemanticRules()]).then(
      ([healthResult, traditionResult, workResult, semanticResult]) => {
        if (!active) return
        setHealth(healthResult.data)
        setTraditions(traditionResult.data)
        setWorks(workResult.data)
        setSourceMode(healthResult.source)
        setApiNotice(healthResult.error || traditionResult.error || workResult.error || semanticResult.error || "")
        const requested = initialParam("work")
        const candidates = workResult.data
        if (!candidates.some((work) => work.id === (requested || selectedWorkId))) {
          setSelectedWorkId(candidates[0]?.id ?? "")
        }
      },
    )
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!selectedWorkId) return
    let active = true
    setLoadingPassages(true)
    setPassageOffset(0)
    void (async () => {
      const [hierarchyResult, passageResult] = await Promise.all([
        loadWorkHierarchy(selectedWorkId),
        loadPassages(selectedWorkId, 0, 12),
      ])
      if (!active) return

      let pageData = passageResult.data
      const requestedPassage = pendingPassageId.current || initialParam("passage")
      let nextPassage = pageData.find((item) => item.id === requestedPassage)

      if (requestedPassage && !nextPassage) {
        const direct = await loadPassageById(requestedPassage)
        if (!active) return
        if (direct.data?.workId === selectedWorkId) {
          nextPassage = direct.data
          pageData = [direct.data, ...pageData.filter((item) => item.id !== direct.data?.id)]
        }
      }

      nextPassage ??= pageData[0]
      pendingPassageId.current = ""
      setHierarchy(hierarchyResult.data)
      setPassages(pageData)
      setPassageTotal(passageResult.total)
      setPassageHasMore(passageResult.hasMore)
      setPassageOffset(passageResult.offset)
      setSourceMode(strongestSource(hierarchyResult.source, passageResult.source))
      setApiNotice(hierarchyResult.error || passageResult.error || "")
      setSelectedPassageId(nextPassage?.id ?? "")
      updateQuery({ work: selectedWorkId, passage: nextPassage?.id })
      setLoadingPassages(false)
    })().catch((error) => {
      if (!active) return
      setApiNotice(error instanceof Error ? error.message : "Unable to load canonical passages")
      setLoadingPassages(false)
    })
    return () => {
      active = false
    }
  }, [selectedWorkId])

  useEffect(() => {
    if (!selectedPassage) {
      setTrace(null)
      return
    }
    let active = true
    void loadPassageTrace(selectedPassage).then((result) => {
      if (!active) return
      setTrace(result.data)
      if (result.error) setApiNotice(result.error)
      if (result.source !== "catalog") setSourceMode(result.source)
    })
    return () => {
      active = false
    }
  }, [selectedPassage?.id])

  useEffect(() => {
    if (query) void executeSearch(0)
  }, [])

  async function executeSearch(offset: number) {
    const clean = query.trim()
    if (!clean) {
      setResults([])
      setSearchOffset(0)
      setSearchHasMore(false)
      updateQuery({ q: undefined })
      return
    }
    setSearching(true)
    const page = await searchCorpus(clean, selectedTradition || undefined, offset, 20)
    setResults(page.data)
    setSearchOffset(page.offset)
    setSearchHasMore(page.hasMore)
    setSearchLatency(page.latencyMs)
    setSourceMode(page.source)
    if (page.error) setApiNotice(page.error)
    updateQuery({ q: clean, tradition: selectedTradition || undefined })
    setSearching(false)
  }

  async function runSearch(event?: FormEvent) {
    event?.preventDefault()
    await executeSearch(0)
  }

  function chooseWork(work: Work) {
    setSelectedWorkId(work.id)
    setSelectedPassageId("")
    updateQuery({ work: work.id, passage: undefined })
    document.getElementById("passage")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  function choosePassage(passage: Passage) {
    setSelectedPassageId(passage.id)
    updateQuery({ work: selectedWork?.id, passage: passage.id })
  }

  async function inspectSearchResult(result: SearchRecord) {
    if (!result.workId || result.kind !== "textual.passage") return
    updateQuery({ work: result.workId, passage: result.id, q: query || undefined })

    if (result.workId === selectedWorkId) {
      const direct = await loadPassageById(result.id)
      if (direct.data) {
        setPassages((current) => [direct.data!, ...current.filter((item) => item.id !== direct.data?.id)])
        setSelectedPassageId(direct.data.id)
        setSourceMode(strongestSource(sourceMode, direct.source))
      }
    } else {
      pendingPassageId.current = result.id
      setSelectedWorkId(result.workId)
    }

    document.getElementById("passage")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  async function movePassagePage(nextOffset: number) {
    if (!selectedWork) return
    setLoadingPassages(true)
    const page = await loadPassages(selectedWork.id, Math.max(0, nextOffset), 12)
    setPassages(page.data)
    setPassageOffset(page.offset)
    setPassageTotal(page.total)
    setPassageHasMore(page.hasMore)
    setSelectedPassageId(page.data[0]?.id ?? "")
    if (page.error) setApiNotice(page.error)
    setLoadingPassages(false)
  }

  async function traceAssertion(event: FormEvent) {
    event.preventDefault()
    const id = assertionId.trim()
    if (!id) return
    setAssertionLoading(true)
    setAssertionNotice("")
    const result = await loadAssertionTraversal(id)
    setAssertionTrace(result.data)
    setAssertionNotice(result.error || (result.data ? "" : "No canonical assertion with that ID was resolved."))
    setAssertionLoading(false)
  }

  const selectedTraditionName = selectedTradition
    ? traditions.find((tradition) => tradition.id === selectedTradition)?.name ?? selectedTradition
    : "All traditions"

  const hierarchyArtifacts = hierarchy?.artifacts ?? []
  const sourceArtifacts = [...hierarchyArtifacts, ...(trace?.artifacts ?? [])].filter(
    (artifact, index, all) => all.findIndex((candidate) => candidate.id === artifact.id) === index,
  )

  const hierarchyItems: HierarchyItem[] = [
    ...(hierarchy?.work
      ? [{ id: hierarchy.work.id, kind: hierarchy.work.kind ?? "textual.work", label: labelsOf(hierarchy.work), state: "available" as const }]
      : []),
    ...(hierarchy?.expressions ?? []).map((item) => ({ id: item.id, kind: item.kind ?? "textual.expression", label: labelsOf(item), state: "available" as const })),
    ...(hierarchy?.editions ?? []).map((item) => ({ id: item.id, kind: item.kind ?? "textual.edition", label: labelsOf(item), state: "available" as const })),
    ...hierarchyArtifacts.map((item) => ({ id: item.id, kind: item.kind ?? "textual.artifact", label: labelsOf(item), state: "available" as const })),
    ...(selectedPassage ? [{ id: selectedPassage.id, kind: "textual.passage", label: selectedPassage.label, detail: selectedPassage.locator, state: "available" as const }] : []),
    ...(trace?.contents ?? []).map((item) => ({
      id: item.id,
      kind: "textual.content",
      label: `${item.language} · ${item.representation}`,
      detail: item.artifact,
      state: item.text ? ("available" as const) : ("missing" as const),
    })),
  ]

  const rightsRows: RightsRow[] = sourceArtifacts.length
    ? sourceArtifacts.map((artifact) => {
        const source = extension(artifact, "source")
        const descriptor = object(source.descriptor)
        const rights = object(source.rights)
        return {
          id: artifact.id,
          label: stringOr(source.title, labelsOf(artifact)),
          revision: stringOr(source.revision),
          sha256: stringOr(descriptor.sha256),
          rights: stringOr(rights.status, hierarchy?.dataset?.rights),
          license: stringOr(rights.license_expression),
          availability: stringOr(descriptor.availability, hierarchy?.dataset?.availability),
          sourceReference: stringOr(source.canonical_url, descriptor.locations),
          state: "available" as const,
        }
      })
    : hierarchy?.dataset
      ? [
          {
            id: hierarchy.dataset.id,
            label: hierarchy.dataset.id,
            rights: hierarchy.dataset.rights,
            availability: hierarchy.dataset.availability,
            state: "partial" as const,
          },
        ]
      : []

  const relationRows: RelationRow[] = (trace?.relations ?? []).flatMap<RelationRow>((relation) => {
    const textual = extension(relation, "textual")

    if (relation.kind === "textual.variant") {
      const locus = Array.isArray(textual.locus)
        ? textual.locus.map(object).map((item) => stringOr(item.target)).filter((value): value is string => Boolean(value))
        : []
      const readings = Array.isArray(textual.readings) ? textual.readings.map(object) : []
      const subjects = locus.length ? locus : [selectedPassage?.id ?? relation.id]

      return subjects.flatMap((subject) =>
        readings.flatMap((reading, readingIndex) => {
          const witnesses = Array.isArray(reading.witnesses)
            ? reading.witnesses.filter((value): value is string => typeof value === "string")
            : []
          const objects = [stringOr(reading.content), ...witnesses].filter(
            (value, index, all): value is string => Boolean(value) && all.indexOf(value) === index,
          )

          return (objects.length ? objects : [`${relation.id}:reading:${String(readingIndex)}`]).map((target, targetIndex) => ({
            id: `${relation.id}:variant:${String(readingIndex)}:${String(targetIndex)}`,
            subject,
            relation: stringOr(reading.label, "variant_reading"),
            object: target,
            method: stringOr(
              textual.method,
              reading.text ? "Witness reading recorded directly in the canonical variant resource." : undefined,
            ),
            provenance: stringOr(textual.provenance),
            state: "partial" as const,
          }))
        }),
      )
    }

    const sources = Array.isArray(textual.sources) ? textual.sources.map(object) : []
    const targets = Array.isArray(textual.targets) ? textual.targets.map(object) : []
    const subjectIds = sources.map((item) => stringOr(item.target)).filter((value): value is string => Boolean(value))
    const objectIds = targets.map((item) => stringOr(item.target)).filter((value): value is string => Boolean(value))
    const subjects = subjectIds.length ? subjectIds : [selectedPassage?.id ?? relation.id]
    const objects = objectIds.length ? objectIds : [relation.id]
    return subjects.flatMap((subject) =>
      objects.map((target, index) => ({
        id: `${relation.id}:${String(index)}:${subject}:${target}`,
        subject,
        relation: stringOr(textual.relation, relation.kind, "explicit_relation"),
        object: target,
        method: stringOr(textual.method),
        provenance: stringOr(textual.provenance),
        state: "available" as const,
      })),
    )
  })

  const provenanceNodes = trace?.provenanceRecords.length
    ? trace.provenanceRecords.map((record, index) => ({
        id: record.id,
        kind: index === 0 ? "source" : "evidence",
        label: index === 0 ? "Pinned provenance" : `Provenance activity ${index + 1}`,
        detail: record.source_reference ?? record.source ?? record.id,
        active: index === 0,
      }))
    : [
        {
          id: "source-boundary",
          kind: "source",
          label: "Source trace unavailable",
          detail: "No provenance record resolved for the current canonical selection.",
          active: true,
        },
        {
          id: "text-boundary",
          kind: "text",
          label: "Canonical passage identity",
          detail: selectedPassage?.id ?? "No passage selected",
        },
      ]

  const lanes = trace?.contents ?? selectedPassage?.contents ?? []

  return (
    <div className="min-h-svh bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
          <a href="#top" className="flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-md bg-primary text-[11px] font-bold text-primary-foreground">
              R
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-semibold tracking-tight">RGBL</span>
              <span className="block text-[10px] tracking-[0.16em] text-muted-foreground uppercase">Trace the text</span>
            </span>
          </a>
          <nav className="ml-4 hidden items-center gap-0.5 md:flex" aria-label="Primary">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="rounded-md px-3 py-1.5 text-sm whitespace-nowrap text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {section.label}
              </a>
            ))}
            <a
              href="https://github.com/bjo163/rocksoul-rgbl"
              target="_blank"
              rel="noreferrer"
              className="rounded-md px-3 py-1.5 text-sm whitespace-nowrap text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              Repository
            </a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Badge variant={sourceMode === "catalog" ? "secondary" : "default"} className="hidden sm:inline-flex">
              {sourceModeLabel(sourceMode)}
            </Badge>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main id="top">
        <section className="border-b bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 py-14">
            <Badge variant="outline" className="tracking-[0.16em] uppercase">
              Scripture & revelation reference intelligence
            </Badge>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-balance md:text-5xl">
              Trace the text.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
              Inspect canonical work identity, expression, edition, source artifact, exact passage content, rights,
              provenance and explicit textual relations — without collapsing their semantic boundaries.
            </p>
            <p className="mt-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Text ≠ interpretation · Translation ≠ source identity · Inclusion ≠ authority
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button onClick={() => document.getElementById("explore")?.scrollIntoView({ behavior: "smooth" })}>
                Explore corpus
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  window.open(
                    "https://github.com/bjo163/rocksoul-rgbl/blob/main/docs/ROCKSOUL_INTEROP.md",
                    "_blank",
                    "noopener,noreferrer",
                  )
                }
              >
                Interop contract
              </Button>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard
                label="Indexed records"
                value={health?.totalRecords ? formatCount(health.totalRecords) : aggregateRecords ? formatCount(aggregateRecords) : "—"}
                hint={sourceModeLabel(sourceMode)}
              />
              <StatCard label="Traditions" value={String(traditions.length)} hint="registry scope" />
              <StatCard label="Visible works" value={String(visibleWorks.length)} hint={selectedTraditionName} />
              <StatCard
                label="Datasets"
                value={formatCount(health?.datasetCount ?? traditions.reduce((sum, tradition) => sum + (tradition.datasetCount ?? 0), 0))}
                hint="declared corpus packages"
              />
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl space-y-10 px-4 py-10">
          {apiNotice ? (
            <div className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
              <div className="text-sm">
                <p className="font-medium">Canonical runtime notice</p>
                <p className="mt-1 text-muted-foreground">
                  {apiNotice}. Active source: {sourceModeLabel(sourceMode)}. Missing records stay unavailable rather than
                  being synthesized.
                </p>
              </div>
            </div>
          ) : null}

          <section aria-label="Corpus search" className="space-y-4">
            <SectionHeading
              kicker={`Exact search · ${sourceMode === "api" ? "FTS5" : sourceMode === "browser" ? "FTS3 WASM" : "catalog"}`}
              title="Find the record before interpreting the record."
            />
            <Card className="py-4">
              <CardContent className="px-4">
                <form className="flex flex-col gap-2 sm:flex-row" onSubmit={runSearch}>
                  <div className="relative flex-1">
                    <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                    <Input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search exact text, passage or indexed corpus term…"
                      aria-label="Search corpus"
                      className="pl-9"
                    />
                  </div>
                  <Select
                    value={selectedTradition || ALL_TRADITIONS}
                    onValueChange={(value) => {
                      const next = value === ALL_TRADITIONS ? "" : value
                      setSelectedTradition(next)
                      updateQuery({ tradition: next || undefined })
                    }}
                  >
                    <SelectTrigger className="w-full sm:w-56" aria-label="Filter by tradition">
                      <SelectValue placeholder="All traditions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_TRADITIONS}>All traditions</SelectItem>
                      {traditions.map((tradition) => (
                        <SelectItem key={tradition.id} value={tradition.id}>
                          {tradition.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="submit" loading={searching}>
                    Search
                  </Button>
                </form>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Database className="size-3.5" aria-hidden="true" />
                    Filter · {selectedTraditionName}
                  </span>
                  <span>
                    {typeof searchLatency === "number"
                      ? `Server search · ${searchLatency.toFixed(2)} ms`
                      : sourceModeLabel(sourceMode)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {results.length ? (
              <div className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  {results.map((result) => (
                    <Card key={result.id} className="gap-3 py-4">
                      <CardContent className="px-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary" className="font-mono text-[10px]">
                            {result.kind}
                          </Badge>
                          {result.tradition ? (
                            <Badge variant="outline" className="text-[10px]">
                              {result.tradition}
                            </Badge>
                          ) : null}
                        </div>
                        <h3 className="mt-2 text-sm font-semibold break-words">{result.title}</h3>
                        <IdCode id={result.id} className="mt-1" />
                        {result.snippet ? (
                          <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground">{result.snippet}</p>
                        ) : null}
                        <div className="mt-3 flex items-center justify-between gap-2">
                          <span className="truncate text-[11px] text-muted-foreground">
                            {[result.datasetId, typeof result.score === "number" ? `score ${result.score.toFixed(3)}` : undefined]
                              .filter(Boolean)
                              .join(" · ")}
                          </span>
                          {result.workId ? (
                            <Button variant="outline" size="sm" onClick={() => void inspectSearchResult(result)}>
                              Inspect trace
                            </Button>
                          ) : null}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={searchOffset === 0 || searching}
                    onClick={() => void executeSearch(Math.max(0, searchOffset - 20))}
                  >
                    Previous
                  </Button>
                  <span className="text-xs text-muted-foreground">Offset {searchOffset}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!searchHasMore || searching}
                    onClick={() => void executeSearch(searchOffset + 20)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            ) : query && !searching ? (
              <EmptyState icon={FileSearch} title="No matching records in the active data source" />
            ) : null}
          </section>

          <Separator />

          <section id="explore" className="scroll-mt-20 space-y-6">
            <SectionHeading
              kicker="01 / Corpus atlas"
              title="Multi-tradition by design. Authority stays scoped."
              description="RGBL preserves many textual traditions without collapsing translation, canon, revelation, identity or doctrinal status into a single global verdict."
            />

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard label="Passages" value={formatCount(health?.passageCount)} hint="canonical textual units" />
              <StatCard label="Content lanes" value={formatCount(health?.contentCount)} hint="exact searchable text" />
              <StatCard label="Evidence" value={formatCount(health?.evidenceCount)} hint="explicit target records" />
              <StatCard label="Relations" value={formatCount(health?.relationCount)} hint="alignment / variant graph" />
            </div>

            <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
              <Card className="h-fit gap-0 py-0">
                <CardHeader className="flex-row items-center justify-between py-3">
                  <CardTitle className="text-xs tracking-wider text-muted-foreground uppercase">Traditions</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedTradition("")
                      updateQuery({ tradition: undefined })
                    }}
                  >
                    Reset
                  </Button>
                </CardHeader>
                <Separator />
                <ScrollArea className="h-[420px]">
                  <div className="space-y-1 p-2">
                    {traditions.map((tradition) => (
                      <button
                        key={tradition.id}
                        type="button"
                        onClick={() => {
                          setSelectedTradition(tradition.id)
                          updateQuery({ tradition: tradition.id })
                        }}
                        className={cn(
                          "flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left transition-colors hover:bg-accent",
                          selectedTradition === tradition.id && "bg-accent",
                        )}
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">{tradition.name}</span>
                          <span className="block truncate text-[11px] text-muted-foreground">
                            {tradition.primaryLanguage ?? "und"} · {(tradition.scripts ?? []).join(", ") || "script metadata"}
                          </span>
                        </span>
                        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                          {formatCount(tradition.totalRecords)}
                        </span>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </Card>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium tracking-wider text-muted-foreground uppercase">Canonical work index</h3>
                  <span className="text-xs tabular-nums text-muted-foreground">{visibleWorks.length}</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {visibleWorks.map((work) => (
                    <button
                      key={work.id}
                      type="button"
                      onClick={() => chooseWork(work)}
                      className="text-left"
                      aria-pressed={selectedWork?.id === work.id}
                    >
                      <Card
                        className={cn(
                          "h-full gap-3 py-4 transition-colors hover:border-ring",
                          selectedWork?.id === work.id && "ring-2 ring-ring",
                        )}
                      >
                        <CardContent className="px-4">
                          <div className="flex items-center justify-between gap-2">
                            <Badge variant={selectedWork?.id === work.id ? "default" : "secondary"} className="text-[10px]">
                              {work.tradition}
                            </Badge>
                            <span className="text-[11px] font-mono uppercase text-muted-foreground">{work.language ?? "mul"}</span>
                          </div>
                          <h4 className="mt-2 text-sm font-semibold break-words">{work.title}</h4>
                          <IdCode id={work.id} className="mt-1" />
                          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                            {work.description ?? "Canonical textual.work metadata."}
                          </p>
                          <p className="mt-3 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                            <BookOpen className="size-3" aria-hidden="true" /> Trace hierarchy
                          </p>
                        </CardContent>
                      </Card>
                    </button>
                  ))}
                  {!visibleWorks.length ? (
                    <div className="sm:col-span-2 xl:col-span-3">
                      <EmptyState icon={Library} title="No work in the current tradition filter" />
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          <Separator />

          <section id="passage" className="scroll-mt-20 space-y-6">
            <SectionHeading
              kicker="02 / Canonical text trace"
              title={selectedWork?.title ?? "Select a canonical work"}
              description="WORK → EXPRESSION → EDITION → ARTIFACT → PASSAGE → CONTENT. Work, expression, edition and source artifact remain separate identities; passage content is displayed only when supplied by the live corpus runtime or the generated canonical catalog."
            />

            <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
              <Card className="h-fit gap-0 py-0">
                <CardHeader className="flex-row items-center justify-between py-3">
                  <CardTitle className="text-xs tracking-wider text-muted-foreground uppercase">Passages</CardTitle>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {typeof passageTotal === "number" ? passageTotal : passages.length}
                  </span>
                </CardHeader>
                <Separator />
                {loadingPassages ? (
                  <div className="space-y-2 p-3">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <Skeleton key={index} className="h-9 w-full" />
                    ))}
                  </div>
                ) : passages.length ? (
                  <ScrollArea className="h-[440px]">
                    <div className="space-y-1 p-2">
                      {passages.map((passage) => (
                        <button
                          key={passage.id}
                          type="button"
                          onClick={() => choosePassage(passage)}
                          className={cn(
                            "flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left transition-colors hover:bg-accent",
                            selectedPassage?.id === passage.id && "bg-accent",
                          )}
                        >
                          <span className="truncate text-sm">{passage.locator}</span>
                          <span className="shrink-0 text-[11px] text-muted-foreground">
                            {passage.contents?.length ? `${passage.contents.length} lanes` : passage.language ?? "meta"}
                          </span>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="p-3">
                    <EmptyState icon={ScrollText} title="No passage page returned" />
                  </div>
                )}
                <Separator />
                <div className="flex items-center justify-between gap-2 p-3">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={passageOffset === 0 || loadingPassages}
                    onClick={() => void movePassagePage(passageOffset - 12)}
                  >
                    Previous
                  </Button>
                  <span className="text-[11px] text-muted-foreground">
                    {passageOffset + 1}–{passageOffset + passages.length}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!passageHasMore || loadingPassages}
                    onClick={() => void movePassagePage(passageOffset + 12)}
                  >
                    Next
                  </Button>
                </div>
              </Card>

              <Card className="gap-4">
                {selectedPassage ? (
                  <CardContent className="px-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge>Canonical passage</Badge>
                      <span className="text-[11px] tracking-wide text-muted-foreground uppercase">
                        {lanes.length} content {lanes.length === 1 ? "lane" : "lanes"}
                      </span>
                    </div>
                    <h3 className="mt-3 text-lg font-semibold break-words">{selectedPassage.label}</h3>
                    <IdCode id={selectedPassage.id} className="mt-1" />

                    <Tabs defaultValue="lanes" className="mt-5">
                      <TabsList>
                        <TabsTrigger value="lanes">Text lanes</TabsTrigger>
                        <TabsTrigger value="hierarchy">Hierarchy</TabsTrigger>
                        <TabsTrigger value="rights">Source & rights</TabsTrigger>
                      </TabsList>
                      <TabsContent value="lanes" className="pt-2">
                        <TextLanes lanes={lanes} />
                      </TabsContent>
                      <TabsContent value="hierarchy" className="pt-2">
                        <HierarchyTrace items={hierarchyItems} />
                      </TabsContent>
                      <TabsContent value="rights" className="pt-2">
                        <RightsTable records={rightsRows} />
                      </TabsContent>
                    </Tabs>

                    <Separator className="my-5" />

                    <dl className="grid gap-3 sm:grid-cols-2">
                      <div className="min-w-0">
                        <dt className="text-[11px] tracking-wider text-muted-foreground uppercase">Source</dt>
                        <dd className="mt-0.5 truncate text-sm" title={lanes[0]?.artifact ?? selectedPassage.source}>
                          {lanes[0]?.artifact ?? selectedPassage.source}
                        </dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="text-[11px] tracking-wider text-muted-foreground uppercase">Locator</dt>
                        <dd className="mt-0.5 text-sm">{selectedPassage.locator}</dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="text-[11px] tracking-wider text-muted-foreground uppercase">Dataset</dt>
                        <dd className="mt-0.5 truncate text-sm" title={trace?.dataset?.id ?? hierarchy?.dataset?.id}>
                          {trace?.dataset?.id ?? hierarchy?.dataset?.id ?? "not available"}
                        </dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="text-[11px] tracking-wider text-muted-foreground uppercase">Relations</dt>
                        <dd className="mt-0.5 text-sm tabular-nums">{trace?.relations.length ?? 0}</dd>
                      </div>
                    </dl>
                  </CardContent>
                ) : (
                  <CardContent className="px-5">
                    <EmptyState icon={BookOpen} title="Select a canonical passage" description="Its generated or live trace appears here." />
                  </CardContent>
                )}
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Alignments, variants & explicit textual relations</CardTitle>
                <CardDescription>
                  Correspondence and variation are shown with their recorded method. No identity or theological
                  equivalence is inferred.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-0">
                <RelationsTable rows={relationRows} />
              </CardContent>
            </Card>
          </section>

          <Separator />

          <section id="evidence" className="scroll-mt-20 space-y-6">
            <SectionHeading
              kicker="03 / Assertion × evidence"
              title="Actual evidence stays distinct from semantic guardrails."
              description="Evidence below comes from canonical records targeting the selected passage or content. The guardrail matrix is a contract summary, not fabricated evidence counts."
            />

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Selected passage evidence</CardTitle>
                  <CardDescription>{trace?.evidence.length ?? 0} explicit target records</CardDescription>
                </CardHeader>
                <CardContent>
                  <EvidenceList items={trace?.evidence ?? []} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="inline-flex items-center gap-2 text-base">
                    <ShieldCheck className="size-4" aria-hidden="true" /> Static semantic guardrails
                  </CardTitle>
                  <p className="text-[11px] tracking-wider text-muted-foreground uppercase">
                    STATIC SEMANTIC GUARDRAILS · CONTRACT
                  </p>
                  <CardDescription>Machine-readable contract summary</CardDescription>
                </CardHeader>
                <CardContent className="px-0">
                  <SemanticRulesTable rows={semanticRows} />
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Assertion trace</CardTitle>
                <CardDescription>Resolve explicit evidence references by canonical assertion ID.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <form className="flex flex-col gap-2 sm:flex-row" onSubmit={traceAssertion}>
                  <Input
                    value={assertionId}
                    onChange={(event) => setAssertionId(event.target.value)}
                    placeholder="mw:assertion:…"
                    aria-label="Canonical assertion ID"
                    className="font-mono text-xs"
                  />
                  <Button type="submit" variant="outline" loading={assertionLoading}>
                    Trace
                  </Button>
                </form>
                {assertionNotice ? <p className="text-xs text-muted-foreground">{assertionNotice}</p> : null}
                {assertionTrace ? (
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border p-3">
                      <p className="text-[11px] tracking-wider text-muted-foreground uppercase">Assertion</p>
                      <IdCode id={String(assertionTrace.assertion.id ?? assertionId)} className="mt-1" />
                      <p className="mt-1 text-xs text-muted-foreground">
                        {String(assertionTrace.assertion.assertion_class ?? "scoped assertion")}
                      </p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-[11px] tracking-wider text-muted-foreground uppercase">Evidence</p>
                      <p className="mt-1 text-lg font-semibold tabular-nums">{assertionTrace.evidence.length}</p>
                      <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
                        {assertionTrace.evidence.map((item) => compactId(item.id)).join(" · ") || "No explicit evidence IDs"}
                      </p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-[11px] tracking-wider text-muted-foreground uppercase">Targets</p>
                      <p className="mt-1 text-lg font-semibold tabular-nums">{assertionTrace.targets.length}</p>
                      <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
                        {assertionTrace.targets.map((item) => compactId(String(item.id ?? "unknown"))).join(" · ") ||
                          "No targets resolved"}
                      </p>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </section>

          <Separator />

          <section id="provenance" className="scroll-mt-20 space-y-6">
            <SectionHeading
              kicker="04 / Provenance & rights"
              title="Every displayed text should be traceable to a pinned source."
              description="Artifact revision, checksum, rights and acquisition activity are shown only when supplied by the selected canonical records."
            />

            <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Provenance rail</CardTitle>
                  <CardDescription>
                    {trace?.provenanceRecords.length
                      ? "Live provenance records resolved from the selected exact content lane."
                      : "No live provenance record is available; passage identity stays visible without inventing source history."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ProvenanceTimeline nodes={provenanceNodes} />
                </CardContent>
              </Card>

              <div className="space-y-3">
                {trace?.provenanceRecords.length ? (
                  trace.provenanceRecords.map((record) => (
                    <Card key={record.id} className="gap-3 py-4">
                      <CardContent className="px-4">
                        <Badge variant="secondary" className="text-[10px]">
                          provenance
                        </Badge>
                        <h3 className="mt-2 text-sm font-semibold break-words">
                          {record.source_reference ?? record.source ?? record.id}
                        </h3>
                        <IdCode id={record.id} className="mt-1" />
                        {(record.activities ?? []).length ? (
                          <div className="mt-3 space-y-2">
                            {(record.activities ?? []).map((activity, index) => (
                              <div key={`${record.id}-${index}`} className="rounded-md border bg-muted/20 p-2">
                                <p className="text-[11px] tracking-wider text-muted-foreground uppercase">
                                  {String(activity.type ?? "activity")}
                                </p>
                                <p className="mt-0.5 text-xs">{String(activity.method ?? "Method not declared")}</p>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <EmptyState
                    icon={ServerCog}
                    title="No provenance record resolved"
                    description="Missing provenance is shown as missing rather than backfilled."
                  />
                )}
              </div>
            </div>
          </section>

          <Separator />

          <section id="principles" className="scroll-mt-20 space-y-6">
            <SectionHeading
              kicker="05 / Golden rules"
              title="Preserve first. Interpret downstream."
              description="These boundaries are enforced in data presentation: missing text is unavailable, not false; source identity and translation identity remain separate."
            />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ["Textual presence", "≠ Universal authority"],
                ["Translation", "≠ Source identity"],
                ["Similarity", "≠ Equivalence"],
                ["Assertion", "≠ Global fact"],
                ["Missing", "≠ False"],
                ["Provenance", "is required"],
              ].map(([left, right]) => (
                <Card key={left} className="gap-1 py-4">
                  <CardContent className="px-4">
                    <p className="text-[11px] tracking-wider text-muted-foreground uppercase">{left}</p>
                    <p className="mt-1 text-sm font-semibold">{right}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="flex size-7 items-center justify-center rounded-md bg-primary text-[11px] font-bold text-primary-foreground">
                R
              </span>
              <div className="leading-tight">
                <p className="text-sm font-semibold">RGBL</p>
                <p className="text-[10px] tracking-[0.16em] text-muted-foreground uppercase">Trace the text.</p>
              </div>
            </div>
            <nav className="flex items-center gap-4 text-xs text-muted-foreground">
              <a className="hover:text-foreground" href="https://github.com/bjo163/rocksoul-rgbl" target="_blank" rel="noreferrer">
                RGBL
              </a>
              <a className="hover:text-foreground" href="https://github.com/bjo163/rocksoul-assets" target="_blank" rel="noreferrer">
                Assets
              </a>
            </nav>
          </div>
          <p className="mt-4 max-w-3xl text-xs leading-relaxed text-muted-foreground">
            RGBL owns canonical TEXT identity and provenance. Interpretation, event claims, person identity and legal
            conclusions stay downstream.
          </p>
        </div>
      </footer>
    </div>
  )
}
