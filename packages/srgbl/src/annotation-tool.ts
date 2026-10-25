import { canonicalJson, sha256Json } from './derived.js'
import { KEY_RELATIONS, validateAnnotationSubmission, type KeyAnnotationSubmission, type KeyRelation } from './keys.js'
import type { ResearchFrame } from './analysis.js'
import { DIRECTION_VALUES, INTENSITY_VALUES } from './vocabulary.js'

/**
 * P18-006: the v0 annotation tool for two annotators. It records what a person
 * actually entered — key, relation, frame, direction, intensity and confidence —
 * into an append-only ledger. It never merges the two voices, never scores
 * agreement and never writes `reviewed`: adjudication belongs to the review
 * workflow, and agreement belongs to the agreement module.
 */
export const KEY_ANNOTATION_SCHEMA = 'mw:key-annotation:v0'

export type KeyAnnotationInput = {
  id: string
  passageId: string
  assessor: string
  scheme: string
  key: string
  relation: KeyRelation
  frame: ResearchFrame
  direction: -2 | -1 | 0 | 1 | 2
  intensity: 1 | 2 | 3
  confidence: number
  method: string
  justification: string
  evidenceIds: string[]
  /** Instant supplied by the recording tool; never inferred from a file mtime. */
  at: string
  tool: string | null
}

export type KeyAnnotationRecord = KeyAnnotationInput & {
  schema: typeof KEY_ANNOTATION_SCHEMA
  /** An annotator submits; a reviewer decides. Both literals stay false. */
  reviewStatus: 'draft'
  attestsIndependence: false
  attestsCorrectness: false
  /** Detects drift, not forgery: an edited line without a new checksum is refused. */
  recordSha256: string
}

const INPUT_FIELDS = ['id','passageId','assessor','scheme','key','relation','frame','direction',
  'intensity','confidence','method','justification','evidenceIds','at','tool'] as const
const RECORD_FIELDS = ['schema','reviewStatus','attestsIndependence','attestsCorrectness','recordSha256',...INPUT_FIELDS] as const

const nonblank = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0

/** A closed record: an unexpected field is a defect, not a richer submission. */
function unknownFields(value: unknown, allowed: readonly string[], what: string): string[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [what + ' must be an object']
  return Object.keys(value).filter(key => !allowed.includes(key)).map(key => 'unknown field in ' + what + ': ' + key)
}

/**
 * The intake contract already knows what a submission may not claim, so the
 * annotation record is validated through it instead of re-implementing the ban
 * on verdict, consensus, adjudication and agreement fields.
 */
function asSubmission(record: KeyAnnotationInput | KeyAnnotationRecord): KeyAnnotationSubmission {
  return {
    id: record?.id,
    passageId: record?.passageId,
    assessor: record?.assessor,
    scheme: record?.scheme,
    key: record?.key,
    method: record?.method,
    justification: record?.justification,
    evidenceIds: [...(record?.evidenceIds ?? [])],
    frame: record?.frame,
    status: 'submitted'
  }
}

export function createKeyAnnotation(input: KeyAnnotationInput): {record: KeyAnnotationRecord | null; errors: string[]} {
  const errors = unknownFields(input, INPUT_FIELDS, 'annotation')
  if (!errors.length) {
    errors.push(...validateAnnotationSubmission(asSubmission(input)))
    // An untraceable label is not an assessor: a person cannot be cited by nickname.
    if (nonblank(input.assessor) && !input.assessor.startsWith('mw:'))
      errors.push('annotation.assessor must be a canonical mw: reference')
    if (!(KEY_RELATIONS as readonly string[]).includes(input.relation))
      errors.push('annotation.relation is not a declared relation: ' + String(input.relation))
    if (!(DIRECTION_VALUES as readonly number[]).includes(input.direction))
      errors.push('annotation.direction is outside -2..+2')
    if (!(INTENSITY_VALUES as readonly number[]).includes(input.intensity))
      errors.push('annotation.intensity is outside 1..3')
    if (!Number.isFinite(input.confidence) || input.confidence < 0 || input.confidence > 1)
      errors.push('annotation.confidence must be between 0 and 1')
    if (!nonblank(input.at) || Number.isNaN(Date.parse(input.at)))
      errors.push('annotation.at must be an ISO-8601 instant')
    if (input.tool !== null && !nonblank(input.tool))
      errors.push('annotation.tool must be null or a nonblank name')
  }
  if (errors.length) return {record: null, errors}
  const record: Omit<KeyAnnotationRecord,'recordSha256'> = {
    schema: KEY_ANNOTATION_SCHEMA,
    id: input.id,
    passageId: input.passageId,
    assessor: input.assessor,
    scheme: input.scheme,
    key: input.key,
    relation: input.relation,
    frame: {...input.frame},
    direction: input.direction,
    intensity: input.intensity,
    confidence: input.confidence,
    method: input.method,
    justification: input.justification,
    evidenceIds: [...input.evidenceIds],
    at: input.at,
    tool: input.tool,
    // A submission is a draft even when the annotator is confident.
    reviewStatus: 'draft' as const,
    attestsIndependence: false as const,
    attestsCorrectness: false as const
  }
  return {record: {...record, recordSha256: sha256Json(record)}, errors}
}

/** Reads a ledger strictly: one bad line invalidates the whole file's trust. */
export function readKeyAnnotationLedger(text: string): {records: KeyAnnotationRecord[]; errors: string[]} {
  const records: KeyAnnotationRecord[] = []
  const errors: string[] = []
  if (typeof text !== 'string') return {records, errors: ['ledger must be text']}
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0)
  const ids = new Set<string>()
  lines.forEach((line, position) => {
    const where = 'line ' + (position + 1)
    let parsed: unknown
    try { parsed = JSON.parse(line) } catch { errors.push(where + ' is not JSON'); return }
    const structural = unknownFields(parsed, RECORD_FIELDS, where)
    if (structural.length) { errors.push(...structural); return }
    const stored = parsed as KeyAnnotationRecord
    if (stored.schema !== KEY_ANNOTATION_SCHEMA) errors.push(where + ' has schema ' + String(stored.schema))
    if (stored.reviewStatus !== 'draft') errors.push(where + ' claims review status ' + String(stored.reviewStatus) + '; an annotator cannot review')
    if (stored.attestsIndependence !== false) errors.push(where + ' must not attest independence')
    if (stored.attestsCorrectness !== false) errors.push(where + ' must not attest correctness')
    const {recordSha256, ...hashable} = stored
    if (typeof recordSha256 !== 'string' || !/^[a-f0-9]{64}$/.test(recordSha256)) {
      errors.push(where + ' has no content checksum'); return
    }
    if (sha256Json(hashable) !== recordSha256) { errors.push(where + ' has changed since it was recorded'); return }
    const created = createKeyAnnotation({
      id: stored.id, passageId: stored.passageId, assessor: stored.assessor, scheme: stored.scheme,
      key: stored.key, relation: stored.relation, frame: stored.frame, direction: stored.direction,
      intensity: stored.intensity, confidence: stored.confidence, method: stored.method,
      justification: stored.justification, evidenceIds: stored.evidenceIds, at: stored.at, tool: stored.tool
    })
    if (created.record === null) { errors.push(...created.errors.map(error => where + ': ' + error)); return }
    // Comparing against the re-created record catches an edit that kept the shape.
    if (canonicalJson(created.record) !== canonicalJson(stored)) { errors.push(where + ' has changed since it was recorded'); return }
    if (ids.has(stored.id)) { errors.push(where + ' repeats annotation id ' + stored.id); return }
    ids.add(stored.id)
    records.push(created.record)
  })
  return {records, errors}
}

export function appendKeyAnnotation(ledgerText: string, input: KeyAnnotationInput): {
  ledger: string | null
  record: KeyAnnotationRecord | null
  errors: string[]
} {
  const existing = readKeyAnnotationLedger(ledgerText)
  // Appending to a damaged ledger would bury the defect under new lines.
  if (existing.errors.length) return {ledger: null, record: null, errors: existing.errors.map(error => 'existing ledger: ' + error)}
  const created = createKeyAnnotation(input)
  if (created.record === null) return {ledger: null, record: null, errors: created.errors}
  const record = created.record
  const errors: string[] = []
  if (existing.records.some(item => item.id === record.id)) errors.push('duplicate annotation id ' + record.id)
  // The same person recording the same key twice would read as two observations.
  const repeated = existing.records.find(item => item.passageId === record.passageId &&
    item.assessor.trim().toLowerCase() === record.assessor.trim().toLowerCase() &&
    item.scheme === record.scheme && item.key === record.key)
  if (repeated) errors.push(record.assessor + ' already recorded ' + record.key + ' for ' + record.passageId)
  if (errors.length) return {ledger: null, record: null, errors}
  const base = ledgerText.trim().length === 0
    ? ''
    : (ledgerText.endsWith('\n') ? ledgerText : ledgerText + '\n')
  return {ledger: base + JSON.stringify(record) + '\n', record, errors}
}

export type PassageAnnotationSummary = {
  passageId: string
  assessors: string[]
  entries: KeyAnnotationRecord[]
  /** Two distinct assessors recorded something for this passage. */
  paired: boolean
  perAssessor: Array<{assessor: string; keys: string[]; directions: Array<{key: string; direction: number}>}>
  /** A key only one assessor recorded. That is a gap in the pair, not a verdict. */
  keysRecordedOnce: Array<{key: string; assessor: string}>
  /** The same key read in different directions by different assessors. */
  directionConflicts: Array<{key: string; byAssessor: Record<string, number>}>
  adjudicated: false
  agreementComputed: false
  note: string
}

/** A shared view of what each annotator entered. It keeps both voices and
 * decides nothing: no merge, no score, no winner, no agreement statistic. */
export function summarizePassageAnnotations(records: readonly KeyAnnotationRecord[], passageId: string): PassageAnnotationSummary {
  const entries = records.filter(record => record.passageId === passageId)
  const assessors = [...new Set(entries.map(record => record.assessor))].sort()
  const perAssessor = assessors.map(assessor => {
    const own = entries.filter(record => record.assessor === assessor)
    return {
      assessor,
      keys: [...new Set(own.map(record => record.key))].sort(),
      directions: own.map(record => ({key: record.key, direction: record.direction}))
        .sort((a, b) => a.key.localeCompare(b.key))
    }
  })
  const byKey = new Map<string, Map<string, number>>()
  for (const entry of entries) {
    if (!byKey.has(entry.key)) byKey.set(entry.key, new Map())
    const holders = byKey.get(entry.key)!
    if (!holders.has(entry.assessor)) holders.set(entry.assessor, entry.direction)
  }
  const keysRecordedOnce: Array<{key: string; assessor: string}> = []
  const directionConflicts: Array<{key: string; byAssessor: Record<string, number>}> = []
  for (const key of [...byKey.keys()].sort()) {
    const holders = byKey.get(key)!
    if (holders.size === 1) keysRecordedOnce.push({key, assessor: [...holders.keys()][0]})
    const directions = new Set([...holders.values()])
    if (holders.size > 1 && directions.size > 1) {
      directionConflicts.push({key, byAssessor: Object.fromEntries([...holders].sort(([a], [b]) => a.localeCompare(b)))})
    }
  }
  return {
    passageId,
    assessors,
    entries,
    paired: assessors.length >= 2,
    perAssessor,
    keysRecordedOnce,
    directionConflicts,
    adjudicated: false as const,
    agreementComputed: false as const,
    note: 'Both submissions are retained verbatim. This view does not adjudicate, rank or compute agreement.'
  }
}
