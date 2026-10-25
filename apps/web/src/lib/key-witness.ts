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
export type CitationKey = {
  id: string
  key: string
  scheme: string
  method: string
  assessor: string
  reviewStatus: "draft" | "reviewed" | "disputed" | "deprecated"
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
