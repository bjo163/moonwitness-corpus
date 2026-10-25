import { createHash } from 'node:crypto'
import { canonicalJson, sha256Json } from './derived.js'
import { buildCitationBundle, type CitationBundle, type CitationInput, type CitationKey, type CitationMessage } from './citation.js'
import { PUBLIC_DOMAIN_INFERENCE, validateAnnotationLicense, type AnnotationLicense } from './licensing.js'
import type { RightsStatus } from './analysis.js'

/**
 * P18-020: the read-only key/message layer is a *sealed index* plus the JSONL
 * derived from it. Sealing is what makes the API honest: the bytes a reader is
 * served are the bytes that were hashed, so an edit without a new checksum is
 * drift and never a quietly improved reading.
 */
export const KEY_WITNESS_INDEX_SCHEMA = 'mw:key-witness-index:v0'
export const KEY_WITNESS_EXPORT_SCHEMA = 'mw:key-witness-export:v0'

const RIGHTS_STATUSES: readonly RightsStatus[] = ['cleared', 'restricted', 'unknown']
const MAX_RECORDS = 5000
const nonblank = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0
const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)
const rawSha256 = (text: string): string => createHash('sha256').update(text, 'utf8').digest('hex')

export type KeyWitnessRecord = {
  passageId: string
  editionId: string
  artifactId: string
  contentId?: string
  /** Witness text; present only when `textRights` is 'cleared'. */
  text?: string
  textRights: RightsStatus
  annotationLicense: AnnotationLicense
  keys: CitationKey[]
  messages?: CitationMessage[]
  provenanceIds: string[]
  evidenceIds: string[]
}

export type KeyWitnessIndex = {
  schema: typeof KEY_WITNESS_INDEX_SCHEMA
  corpusHash: string
  methodVersion: string
  /** Deployment-supplied; this module never invents a host. */
  deepLinkBase: string
  entries: KeyWitnessRecord[]
  indexSha256: string
}

export type KeyWitnessIndexInput = {
  corpusHash: string
  methodVersion: string
  deepLinkBase: string
  entries: readonly KeyWitnessRecord[]
}

export type KeyWitnessExportManifest = {
  schema: typeof KEY_WITNESS_EXPORT_SCHEMA
  recordSchema: 'mw:citation:v0'
  corpusHash: string
  methodVersion: string
  deepLinkBase: string
  indexSha256: string
  recordCount: number
  byteLength: number
  jsonlSha256: string
  formats: { jsonl: 'available'; parquet: 'not-implemented' }
  parquetGap: string
  /** A score is research-only and never leaves this layer. */
  scoresIncluded: false
  publicDomainInference: typeof PUBLIC_DOMAIN_INFERENCE
  frameNote: string
}

const RECORD_FIELDS = ['passageId','editionId','artifactId','contentId','text','textRights',
  'annotationLicense','keys','messages','provenanceIds','evidenceIds'] as const
const KEY_FIELDS = ['id','key','scheme','method','assessor','reviewStatus','relation','direction','frame'] as const
const MESSAGE_FIELDS = ['id','message','boundaryNote','reviewStatus','reviewer','sourceKeyAssessmentIds'] as const
const LICENSE_FIELDS = ['kind','licenseId','attestedBy'] as const

/** A closed structure: an unexpected field is a defect, not an extension. */
function unknownFields(value: unknown, allowed: readonly string[], what: string): string[] {
  if (!isRecord(value)) return [what + ' must be an object']
  return Object.keys(value).filter(key => !allowed.includes(key)).map(key => 'unknown field in ' + what + ': ' + key)
}

const dropUndefined = <T extends object>(value: T): T =>
  Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as T

/** Absent is meaningful, undefined is not: normalise before hashing. */
function normalizeRecord(entry: KeyWitnessRecord): KeyWitnessRecord {
  const base = dropUndefined(entry)
  return {
    ...base,
    ...(isRecord(base.annotationLicense) ? {annotationLicense: dropUndefined(base.annotationLicense)} : {}),
    ...(Array.isArray(base.keys) ? {keys: base.keys.map(key => isRecord(key) ? dropUndefined(key) : key)} : {}),
    ...(Array.isArray(base.messages)
      ? {messages: base.messages.map(message => isRecord(message) ? dropUndefined(message) : message)}
      : {})
  }
}

function recordErrors(entry: KeyWitnessRecord, position: number): string[] {
  const where = 'entry[' + position + ']'
  const structural = unknownFields(entry, RECORD_FIELDS, where)
  if (structural.length) return structural
  const errors: string[] = []
  for (const field of ['passageId','editionId','artifactId'] as const)
    if (!nonblank(entry[field])) errors.push(where + '.' + field + ' required')
  if (nonblank(entry.passageId) && !entry.passageId.startsWith('mw:passage:'))
    errors.push(where + '.passageId must be canonical')
  if (!RIGHTS_STATUSES.includes(entry.textRights)) {
    errors.push(where + '.textRights is not a known rights state')
  } else if (entry.textRights !== 'cleared' && nonblank(entry.text)) {
    // A restricted quotation does not become storable because an index wants it.
    errors.push(where + ' stores ' + entry.textRights + ' text; only cleared text may be stored')
  } else if (entry.textRights === 'cleared' && entry.text !== undefined && !nonblank(entry.text)) {
    errors.push(where + '.text is blank')
  }
  errors.push(...unknownFields(entry.annotationLicense, LICENSE_FIELDS, where + '.annotationLicense'))
  errors.push(...validateAnnotationLicense(entry.annotationLicense).map(error => where + '.annotationLicense: ' + error))
  if (!Array.isArray(entry.keys) || entry.keys.length === 0) {
    errors.push(where + '.keys needs at least one key assessment')
  } else {
    for (const key of entry.keys) errors.push(...unknownFields(key, KEY_FIELDS, where + '.key'))
  }
  if (entry.messages !== undefined) {
    if (!Array.isArray(entry.messages)) errors.push(where + '.messages must be an array')
    else for (const message of entry.messages) errors.push(...unknownFields(message, MESSAGE_FIELDS, where + '.message'))
  }
  for (const field of ['provenanceIds','evidenceIds'] as const) {
    const value = entry[field]
    if (!Array.isArray(value) || value.length === 0 || value.some(item => !nonblank(item)))
      errors.push(where + '.' + field + ' needs at least one nonblank reference')
  }
  return errors
}

/** Restricted text is never handed to the citation builder, so the export path
 * cannot launder a quotation through an annotation licence. */
function citationInput(index: KeyWitnessIndexInput, entry: KeyWitnessRecord): CitationInput {
  return {
    passageId: entry.passageId,
    editionId: entry.editionId,
    artifactId: entry.artifactId,
    ...(nonblank(entry.contentId) ? {contentId: entry.contentId} : {}),
    ...(entry.textRights === 'cleared' && nonblank(entry.text) ? {text: entry.text} : {}),
    textRights: entry.textRights,
    annotationLicense: entry.annotationLicense,
    keys: entry.keys,
    ...(entry.messages ? {messages: entry.messages} : {}),
    provenanceIds: entry.provenanceIds,
    evidenceIds: entry.evidenceIds,
    methodVersion: index.methodVersion,
    corpusHash: index.corpusHash,
    deepLinkBase: index.deepLinkBase
  }
}

export function sealKeyWitnessIndex(input: KeyWitnessIndexInput): KeyWitnessIndex {
  const errors: string[] = []
  if (typeof input?.corpusHash !== 'string' || !/^[a-f0-9]{64}$/.test(input.corpusHash))
    errors.push('index.corpusHash must be a sha256 of the canonical corpus')
  if (!nonblank(input?.methodVersion)) errors.push('index.methodVersion required')
  if (!nonblank(input?.deepLinkBase)) errors.push('index needs a deployment-provided deep-link base')
  if (!Array.isArray(input?.entries) || input.entries.length === 0)
    errors.push('an index with no entries is not an export')
  else if (input.entries.length > MAX_RECORDS) errors.push('too many entries: ' + input.entries.length)

  const entries = (Array.isArray(input?.entries) ? input.entries : [])
    .map(entry => isRecord(entry) ? normalizeRecord(entry as unknown as KeyWitnessRecord) : entry)
  entries.forEach((entry, position) => errors.push(...recordErrors(entry as KeyWitnessRecord, position)))
  const seen = new Set<string>()
  entries.forEach(entry => {
    const id = (entry as KeyWitnessRecord)?.passageId
    if (!nonblank(id)) return
    if (seen.has(id)) errors.push('duplicate entry for passage ' + id)
    seen.add(id)
  })
  if (!errors.length) for (const entry of entries as KeyWitnessRecord[]) {
    // The contract a citation must satisfy is the contract an index must satisfy.
    const built = buildCitationBundle(citationInput(input, entry))
    if (built.errors.length) errors.push(entry.passageId + ': ' + built.errors.join('; '))
  }
  if (errors.length) throw new TypeError('invalid key-witness index: ' + errors.join('; '))

  const sorted = [...(entries as KeyWitnessRecord[])].sort((a, b) => a.passageId.localeCompare(b.passageId))
  // The seal covers the record set, not the caller's array order: the same
  // entries passed in a different order must produce the same checksum.
  const projection = {
    schema: KEY_WITNESS_INDEX_SCHEMA as KeyWitnessIndex['schema'],
    corpusHash: input.corpusHash,
    methodVersion: input.methodVersion,
    deepLinkBase: input.deepLinkBase,
    entries: sorted
  }
  return {...projection, indexSha256: sha256Json(projection)}
}

export function verifyKeyWitnessIndex(value: unknown, expectedCorpusHash: string): KeyWitnessIndex {
  const fail = (reason: string): never => { throw new Error('invalid key-witness index: ' + reason) }
  if (typeof expectedCorpusHash !== 'string' || !/^[a-f0-9]{64}$/.test(expectedCorpusHash))
    fail('untrusted corpus identity')
  if (!isRecord(value)) fail('missing object')
  const o = value as Record<string, unknown>
  for (const key of Object.keys(o))
    if (!['schema','corpusHash','methodVersion','deepLinkBase','entries','indexSha256'].includes(key))
      fail('unknown field: ' + key)
  if (o.schema !== KEY_WITNESS_INDEX_SCHEMA) fail('schema mismatch')
  if (o.corpusHash !== expectedCorpusHash) fail('corpus hash mismatch')
  if (typeof o.indexSha256 !== 'string' || !/^[a-f0-9]{64}$/.test(o.indexSha256)) fail('index checksum missing')
  if (!Array.isArray(o.entries)) fail('entries missing')
  // Re-sealing the loaded bytes is the only check that proves the checksum
  // covers the records that would actually be served.
  try {
    const resealed = sealKeyWitnessIndex({
      corpusHash: o.corpusHash as string,
      methodVersion: o.methodVersion as string,
      deepLinkBase: o.deepLinkBase as string,
      entries: o.entries as KeyWitnessRecord[]
    })
    if (canonicalJson(resealed) !== canonicalJson(o)) fail('index has changed since it was sealed')
  } catch (error) {
    const message = (error as Error).message
    if (message.startsWith('invalid key-witness index: ')) throw error
    fail(message)
  }
  return o as unknown as KeyWitnessIndex
}

export function buildKeyWitnessExport(index: KeyWitnessIndex): {
  jsonl: string | null
  manifest: KeyWitnessExportManifest | null
  records: CitationBundle[]
  errors: string[]
} {
  const errors: string[] = []
  const entries = Array.isArray(index?.entries) ? index.entries : []
  if (!entries.length) errors.push('export needs at least one indexed entry')
  const records: CitationBundle[] = []
  for (const entry of entries) {
    const built = buildCitationBundle(citationInput(index, entry))
    if (built.citation === null) { errors.push(String(entry?.passageId) + ': ' + built.errors.join('; ')); continue }
    records.push(built.citation)
  }
  // A partial export would look complete, so the whole batch is refused instead.
  if (errors.length) return {jsonl: null, manifest: null, records: [], errors}

  records.sort((a, b) => a.passageId.localeCompare(b.passageId))
  // One canonical JSON object per line, so the bytes are reproducible.
  const jsonl = records.map(record => canonicalJson(record) + '\n').join('')
  const manifest: KeyWitnessExportManifest = {
    schema: KEY_WITNESS_EXPORT_SCHEMA,
    recordSchema: 'mw:citation:v0',
    corpusHash: index.corpusHash,
    methodVersion: index.methodVersion,
    deepLinkBase: index.deepLinkBase,
    indexSha256: index.indexSha256,
    recordCount: records.length,
    byteLength: Buffer.byteLength(jsonl, 'utf8'),
    jsonlSha256: rawSha256(jsonl),
    formats: {jsonl: 'available', parquet: 'not-implemented'},
    parquetGap: 'Parquet is not written: this repository carries no columnar writer, and an export ' +
      'may not claim a format it does not emit. The JSONL lines plus this manifest checksum are the export.',
    scoresIncluded: false,
    publicDomainInference: PUBLIC_DOMAIN_INFERENCE,
    frameNote: 'Derived key and message records under an explicit frame; not canonical scripture, not a verdict, no score.'
  }
  return {jsonl, manifest, records, errors}
}
