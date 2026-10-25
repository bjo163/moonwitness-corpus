/**
 * P18-010: the balance view counts what was recorded, per passage and per work.
 * It never reduces those counts to one verdict, and it never sorts keys by size,
 * because "the biggest bar" is exactly the ranking this layer refuses to make.
 */
export type Rights = {
  text: "cleared" | "restricted" | "unknown"
  annotation: { kind: string; licenseId?: string; attestedBy?: string }
  publicDomainInference: "prohibited"
}
export type KeyFrame = {agent: string; recipient: string; domain: string; scope: string; genre: string}
export type CitationKey = {
  id: string
  key: string
  scheme: string
  method: string
  assessor: string
  reviewStatus: "draft" | "reviewed" | "disputed" | "deprecated"
  /** Annotation facets, present only when the assessment recorded them. */
  relation?: string
  direction?: number
  frame?: KeyFrame
}
export type CitationMessage = {
  id: string
  message: string
  boundaryNote: string
  reviewStatus: "reviewed"
  reviewer: string
  sourceKeyAssessmentIds: string[]
}
export type Citation = {
  schema: "mw:citation:v0"
  passageId: string
  editionId: string
  artifactId: string
  contentId: string | null
  text: string | null
  textOmissionReason: string | null
  keys: CitationKey[]
  messages: CitationMessage[]
  rights: Rights
  provenance: string[]
  evidence: string[]
  methodVersion: string
  corpusHash: string
  deepLink: string
  frameNote: string
}

const RIGHTS = ["cleared", "restricted", "unknown"]
const REVIEW = ["draft", "reviewed", "disputed", "deprecated"]
const DIRECTIONS = [-2, -1, 0, 1, 2]
const FRAME_FIELDS = ["agent", "recipient", "domain", "scope", "genre"] as const
const nonBlank = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0
const strings = (value: unknown): value is string[] => Array.isArray(value) && value.length > 0 && value.every(nonBlank)

/**
 * One validator for every surface that renders a citation. In particular it
 * refuses witness text whose own rights statement is not `cleared`, even if a
 * server sent it: a client that trusts the field name would leak the text.
 */
export function validateCitation(value: unknown): Citation {
  const c = value as Record<string, unknown> | undefined
  if (!c || typeof c !== "object") throw new Error("The card is missing its citation bundle")
  if (c.schema !== "mw:citation:v0") throw new Error("Unsupported citation schema: " + String(c.schema))
  if (!nonBlank(c.passageId) || !c.passageId.startsWith("mw:passage:")) throw new Error("The card's passage id is not canonical")
  if (!nonBlank(c.corpusHash) || !/^[a-f0-9]{64}$/.test(c.corpusHash)) throw new Error("The card is not bound to a corpus version")
  if (!nonBlank(c.methodVersion)) throw new Error("The card's method version is missing")
  if (!nonBlank(c.editionId) || !nonBlank(c.artifactId)) throw new Error("The card does not name its witness edition and artifact")
  if (!nonBlank(c.frameNote)) throw new Error("A card without a frame note would read as a claim")
  if (typeof c.deepLink !== "string" || !/^https?:\/\//.test(c.deepLink)) throw new Error("The card's deep link is not an http(s) address")

  const rights = c.rights as Record<string, unknown> | undefined
  if (!rights || typeof rights.text !== "string" || !RIGHTS.includes(rights.text)) throw new Error("The card's text rights statement is missing")
  if (rights.publicDomainInference !== "prohibited") throw new Error("The card may not infer public domain")
  const annotation = rights.annotation as Record<string, unknown> | undefined
  if (!annotation || !nonBlank(annotation.kind)) throw new Error("The card's annotation licence is missing")
  if (annotation.kind !== "unlicensed" && !nonBlank(annotation.attestedBy)) throw new Error("An annotation licence needs an attestation")

  const withheld = rights.text !== "cleared"
  if (withheld && c.text !== null && c.text !== undefined) throw new Error("Withheld witness text arrived from the API and was refused")
  if (!withheld && !nonBlank(c.text)) throw new Error("Cleared witness text is missing from the card")
  if (withheld && !nonBlank(c.textOmissionReason)) throw new Error("Withheld text must state why it is withheld")

  const keys = Array.isArray(c.keys) ? c.keys : []
  if (keys.length === 0) throw new Error("A card without a cited key is not a key witness")
  for (const raw of keys) {
    const k = raw as Record<string, unknown>
    if (!nonBlank(k.id) || !k.id.startsWith("mw:")) throw new Error("A cited key id is not canonical")
    for (const field of ["key", "scheme", "method"] as const) if (!nonBlank(k[field])) throw new Error("A cited key is missing its " + field)
    if (!nonBlank(k.assessor) || !k.assessor.startsWith("mw:")) throw new Error("A cited key names no canonical assessor")
    if (typeof k.reviewStatus !== "string" || !REVIEW.includes(k.reviewStatus)) throw new Error("A cited key has an unknown review status")
    // A facet that was not recorded must stay absent; a wrong one is a defect.
    if (k.relation !== undefined && !nonBlank(k.relation)) throw new Error("A cited key carries a blank relation")
    if (k.direction !== undefined && (typeof k.direction !== "number" || !DIRECTIONS.includes(k.direction)))
      throw new Error("A cited key has a direction outside -2..+2")
    if (k.frame !== undefined) {
      const frame = k.frame as Record<string, unknown>
      if (!frame || typeof frame !== "object") throw new Error("A cited key has a frame that is not an object")
      for (const field of FRAME_FIELDS) if (!nonBlank(frame[field])) throw new Error("A cited key frame is missing its " + field)
    }
  }
  const messages = Array.isArray(c.messages) ? c.messages : []
  for (const raw of messages) {
    const m = raw as Record<string, unknown>
    if (m.reviewStatus !== "reviewed") throw new Error("A draft message may not be rendered as a card message")
    if (!nonBlank(m.message) || !nonBlank(m.boundaryNote) || !nonBlank(m.reviewer)) throw new Error("A card message needs text, a boundary and a reviewer")
    if (!strings(m.sourceKeyAssessmentIds)) throw new Error("A card message must cite the key assessments it came from")
  }
  if (!strings(c.provenance)) throw new Error("The card has no provenance")
  if (!strings(c.evidence)) throw new Error("The card has no evidence")

  return {
    schema: "mw:citation:v0",
    passageId: c.passageId,
    editionId: c.editionId,
    artifactId: c.artifactId,
    contentId: nonBlank(c.contentId) ? c.contentId : null,
    text: withheld ? null : (c.text as string),
    textOmissionReason: nonBlank(c.textOmissionReason) ? c.textOmissionReason : null,
    keys: keys.map(k => ({
      id: k.id as string, key: k.key as string, scheme: k.scheme as string, method: k.method as string,
      assessor: k.assessor as string, reviewStatus: k.reviewStatus as CitationKey["reviewStatus"],
      ...(k.relation !== undefined ? {relation: k.relation as string} : {}),
      ...(k.direction !== undefined ? {direction: k.direction as number} : {}),
      ...(k.frame !== undefined ? {frame: {...(k.frame as KeyFrame)}} : {}),
    })),
    messages: messages.map(m => ({
      id: m.id as string, message: m.message as string, boundaryNote: m.boundaryNote as string,
      reviewStatus: "reviewed" as const, reviewer: m.reviewer as string,
      sourceKeyAssessmentIds: [...(m.sourceKeyAssessmentIds as string[])],
    })),
    rights: {
      text: rights.text as Rights["text"],
      annotation: { kind: annotation.kind as string, ...(nonBlank(annotation.licenseId) ? { licenseId: annotation.licenseId } : {}) },
      publicDomainInference: "prohibited",
    },
    provenance: [...(c.provenance as string[])],
    evidence: [...(c.evidence as string[])],
    methodVersion: c.methodVersion,
    corpusHash: c.corpusHash,
    deepLink: c.deepLink,
    frameNote: c.frameNote,
  }
}

/** A whole-corpus export is all-or-nothing: one bad line invalidates the set. */
export function parseExportJsonl(text: string): {citations: Citation[]; errors: string[]} {
  const citations: Citation[] = []
  const errors: string[] = []
  text.split(/\r?\n/).forEach((line, position) => {
    if (line.trim().length === 0) return
    let parsed: unknown
    try { parsed = JSON.parse(line) } catch { errors.push("line " + (position + 1) + " is not JSON"); return }
    try { citations.push(validateCitation(parsed)) }
    catch (error) { errors.push("line " + (position + 1) + ": " + (error as Error).message) }
  })
  if (!errors.length && citations.length === 0) errors.push("the export contains no records")
  return {citations, errors}
}

/** `mw:passage:<tradition>:<work>:<rest>` maps to `mw:work:<tradition>:<work>`. */
export function workIdOf(passageId: string): string {
  const parts = passageId.split(":")
  if (parts.length < 5 || parts[0] !== "mw" || parts[1] !== "passage") return "mw:work:UNKNOWN"
  return "mw:work:" + parts[2] + ":" + parts[3]
}

export type KeyCount = {token: string; count: number; assessors: string[]}
export type PassageBalance = {passageId: string; workId: string; recordCount: number; assessorCount: number; keys: KeyCount[]}
export type WorkBalance = {workId: string; passageCount: number; recordCount: number; keys: KeyCount[]}

/** Keys are grouped alphabetically on purpose: ordering by count would be a ranking. */
function countKeys(citations: Citation[]): KeyCount[] {
  const byToken = new Map<string, {count: number; assessors: Set<string>}>()
  for (const citation of citations) for (const key of citation.keys) {
    const entry = byToken.get(key.key) ?? {count: 0, assessors: new Set<string>()}
    entry.count += 1
    entry.assessors.add(key.assessor)
    byToken.set(key.key, entry)
  }
  return [...byToken.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([token, entry]) => ({token, count: entry.count, assessors: [...entry.assessors].sort()}))
}

export function balanceByPassage(citations: readonly Citation[]): PassageBalance[] {
  const byPassage = new Map<string, Citation[]>()
  for (const citation of citations) byPassage.set(citation.passageId, [...(byPassage.get(citation.passageId) ?? []), citation])
  return [...byPassage.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([passageId, group]) => ({
      passageId,
      workId: workIdOf(passageId),
      recordCount: group.length,
      assessorCount: new Set(group.flatMap(citation => citation.keys.map(key => key.assessor))).size,
      keys: countKeys(group),
    }))
}

export function balanceByWork(citations: readonly Citation[]): WorkBalance[] {
  const byWork = new Map<string, Citation[]>()
  for (const citation of citations) {
    const work = workIdOf(citation.passageId)
    byWork.set(work, [...(byWork.get(work) ?? []), citation])
  }
  return [...byWork.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([workId, group]) => ({
      workId,
      passageCount: new Set(group.map(citation => citation.passageId)).size,
      recordCount: group.length,
      keys: countKeys(group),
    }))
}

/** How many distinct assessors recorded each key token: a shared view, never a merge. */
export function groupByKey(keys: readonly CitationKey[]): Array<[string, CitationKey[]]> {
  const byKey = new Map<string, CitationKey[]>()
  for (const key of keys) byKey.set(key.key, [...(byKey.get(key.key) ?? []), key])
  return [...byKey.entries()].sort(([a], [b]) => a.localeCompare(b))
}

/** The maximum count in a set, used only to size a bar, never to rank a reading. */
export function maxCount(keys: readonly KeyCount[]): number {
  return keys.reduce((max, key) => Math.max(max, key.count), 1)
}

export type SpectrumRow = {
  passageId: string
  workId: string
  key: string
  relation: string | null
  direction: number | null
  frame: KeyFrame | null
  frameLabel: string | null
  assessor: string
  scheme: string
  reviewStatus: string
  recordId: string
}

export type SpectrumFacets = {
  keys: string[]
  relations: string[]
  directions: number[]
  frames: string[]
  /** How many cited keys carry each facet: a zero names an unpublished facet. */
  available: {relation: number; direction: number; frame: number}
  total: number
}

/** One row per cited key, with the annotation facets the export actually carries. */
export function spectrumRows(citations: readonly Citation[]): SpectrumRow[] {
  const rows: SpectrumRow[] = []
  for (const citation of citations) for (const key of citation.keys) {
    rows.push({
      passageId: citation.passageId,
      workId: workIdOf(citation.passageId),
      key: key.key,
      relation: key.relation ?? null,
      direction: key.direction ?? null,
      frame: key.frame ?? null,
      frameLabel: key.frame ? key.frame.agent + " / " + key.frame.genre : null,
      assessor: key.assessor,
      scheme: key.scheme,
      reviewStatus: key.reviewStatus,
      recordId: key.id,
    })
  }
  // Ordered by passage, then key: a spectrum is for scanning, not for ranking.
  return rows.sort((a, b) => a.passageId.localeCompare(b.passageId) || a.key.localeCompare(b.key) || a.assessor.localeCompare(b.assessor))
}

export function spectrumFacets(rows: readonly SpectrumRow[]): SpectrumFacets {
  const unique = <T,>(values: T[]) => [...new Set(values)]
  return {
    keys: unique(rows.map(row => row.key)).sort(),
    relations: unique(rows.flatMap(row => (row.relation ? [row.relation] : []))).sort(),
    directions: unique(rows.flatMap(row => (row.direction === null ? [] : [row.direction]))).sort((a, b) => a - b),
    frames: unique(rows.flatMap(row => (row.frameLabel ? [row.frameLabel] : []))).sort(),
    available: {
      relation: rows.filter(row => row.relation !== null).length,
      direction: rows.filter(row => row.direction !== null).length,
      frame: rows.filter(row => row.frame !== null).length,
    },
    total: rows.length,
  }
}

export type SpectrumFilter = {key: string; relation: string; direction: string; frame: string}

/** An empty filter value means "any", which is why it is compared as a string. */
export function filterSpectrum(rows: readonly SpectrumRow[], filter: SpectrumFilter): SpectrumRow[] {
  return rows.filter(row =>
    (filter.key === "" || row.key === filter.key) &&
    (filter.relation === "" || row.relation === filter.relation) &&
    (filter.direction === "" || String(row.direction) === filter.direction) &&
    (filter.frame === "" || row.frameLabel === filter.frame))
}

export type AssessorGroup = {assessor: string; scheme: string; keys: CitationKey[]}

export type DisagreementGroup = {
  passageId: string
  workId: string
  assessors: AssessorGroup[]
  readings: CitationMessage[]
  distinctKeys: number
  /** Fewer than two assessors means there is nothing to compare yet. */
  unpaired: boolean
  /** Literal: this screen has no method for agreement and must not imply one. */
  agreementComputed: false
  adjudicated: false
}

/**
 * P18-012: alternate assessments and the identity of whoever recorded them.
 * The grouping is deliberately plain - one row per assessor, one row per reviewed
 * reading - because an agreement statistic belongs to the annotation report, not
 * to a screen that a reader might mistake for a verdict.
 */
export function disagreementGroups(citations: readonly Citation[]): DisagreementGroup[] {
  return citations
    .map(citation => {
      const byAssessor = new Map<string, AssessorGroup>()
      for (const key of citation.keys) {
        const group = byAssessor.get(key.assessor) ?? {assessor: key.assessor, scheme: key.scheme, keys: []}
        group.keys.push(key)
        byAssessor.set(key.assessor, group)
      }
      const assessors = [...byAssessor.values()]
        .map(group => ({...group, keys: [...group.keys].sort((a, b) => a.key.localeCompare(b.key))}))
        .sort((a, b) => a.assessor.localeCompare(b.assessor))
      const readings = [...citation.messages].sort((a, b) => a.reviewer.localeCompare(b.reviewer) || a.id.localeCompare(b.id))
      const keys = new Set(citation.keys.map(key => key.key))
      return {
        passageId: citation.passageId,
        workId: workIdOf(citation.passageId),
        assessors,
        readings,
        distinctKeys: keys.size,
        unpaired: assessors.length < 2,
        agreementComputed: false as const,
        adjudicated: false as const,
      }
    })
    .sort((a, b) => a.passageId.localeCompare(b.passageId))
}

/** `alternate` counts passages where a second assessor or a second reading exists. */
export function disagreementSummary(groups: readonly DisagreementGroup[]) {
  return {
    passages: groups.length,
    alternateAssessments: groups.filter(group => group.assessors.length > 1).length,
    alternateReadings: groups.filter(group => group.readings.length > 1).length,
    singleAssessor: groups.filter(group => group.unpaired).length,
  }
}
