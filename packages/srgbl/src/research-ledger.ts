import {
  WITNESS_COMPONENT_MAX, scoreWitnessCandidate, validateScopedRelation, type ScopedTextRelation,
  type WitnessComponents, type SwingCandidate
} from './index.js'
import type { ReviewStatus } from './analysis.js'

export interface ReviewedCandidate {
  id: string
  origin: SwingCandidate
  relation: ScopedTextRelation
  supportingEvidenceIds: string[]
  contradictingEvidenceIds: string[]
  independentSourceIds: string[]
  reviewStatus: ReviewStatus
  reviewer?: string
  /** Null while research rubric has not been independently assessed. */
  components: WitnessComponents | null
}
export interface MiracleAttribution {
  id: string
  targetPassageId: string
  tradition: string
  claimant: string
  method: string
  claimText: string
  evidenceIds: string[]
  reviewStatus: ReviewStatus
  reviewer?: string
  /** Record of attribution, never machine certification. */
  empiricallyVerified: false
}
const nonblank = (x: unknown): x is string => typeof x === 'string' && x.trim().length > 0
const validIds = (ids: unknown): ids is string[] =>
  Array.isArray(ids) && ids.every(nonblank) && new Set(ids).size === ids.length

/**
 * Typed, reviewable relationship. A candidate can be stored with no score.
 * Independently-originating source references are tracked explicitly.
 */
export function validateReviewedCandidate(c: ReviewedCandidate): string[] {
  if (!c || typeof c !== 'object') return ['candidate record is missing']
  const errors: string[]=[]
  if (!nonblank(c.id)) errors.push('candidate ID required')
  if (!c.origin || c.origin.state !== 'candidate' || c.origin.inheritedScore !== null) errors.push('candidate must not inherit score')
  try { validateScopedRelation(c.relation) } catch(e) { errors.push(String(e)) }
  // Name the failing array: a missing contradiction list is a different defect
  // from a duplicated ID, and [] is the explicit "searched, found none".
  for (const field of ['supportingEvidenceIds','contradictingEvidenceIds','independentSourceIds'] as const) {
    const ids = c[field]
    if (!Array.isArray(ids)) { errors.push('candidate ' + field + ' must be an array (use [] when the search found none)'); continue }
    if (ids.some(id => !nonblank(id))) { errors.push('candidate ' + field + ' contains a blank ID'); continue }
    if (new Set(ids).size !== ids.length) errors.push('candidate ' + field + ' must not repeat an ID')
  }
  // A source that is also cited as this candidate's evidence does not originate independently.
  const cited = [...(c.supportingEvidenceIds || []), ...(c.contradictingEvidenceIds || [])]
  for (const id of new Set(c.independentSourceIds || [])) {
    if (cited.includes(id)) errors.push('independent source ' + id + ' is also cited as candidate evidence, so it is not independent')
  }
  if (c.reviewStatus==='reviewed' &&
    (!nonblank(c.reviewer) || !c.supportingEvidenceIds?.length || !c.independentSourceIds?.length ||
     c.relation?.reviewStatus!=='reviewed')) errors.push('review requires reviewer, explicit evidence, independent source, and reviewed relation')
  if (c.components !== null && c.components !== undefined) {
    try { scoreWitnessCandidate(c.components) } catch(e) { errors.push(String(e)) }
  }
  return errors
}
export function summarizeCandidate(c: ReviewedCandidate) {
  const errors=validateReviewedCandidate(c)
  const components=c?.components
  const evaluated=components===null||components===undefined?null:scoreWitnessCandidate(components)
  const contrary=Array.isArray(c?.contradictingEvidenceIds)?c.contradictingEvidenceIds:null
  return {
    id:c?.id,relation:c?.relation?.relation,method:c?.relation?.method,
    direction:'perspective-scoped' as const,
    witnessSupport:evaluated,
    reviewStatus:c?.reviewStatus,
    /** Contrary evidence is preserved: [] means searched-and-none, never dropped. */
    contradictionEvidence: contrary===null?'unrecorded':(contrary.length?'present':'searched-none-found') as 'unrecorded'|'present'|'searched-none-found',
    contradictingEvidenceIds: contrary ? [...contrary] : [],
    /** Eligible for *publishing as attributed review*, never global truth. */
    publishable:errors.length===0 && c?.reviewStatus==='reviewed' && c?.relation?.reviewStatus==='reviewed',
    reviewErrors:errors, automaticMiracleProof:false as const
  }
}
export function validateMiracleAttribution(item:MiracleAttribution):string[] {
  const errors:string[]=[]
  for(const k of ['id','targetPassageId','tradition','claimant','method','claimText'] as const) if(!nonblank(item[k])) errors.push(k+' required')
  if (!validIds(item.evidenceIds)) errors.push('invalid miracle attribution evidence')
  if(item.empiricallyVerified!==false) errors.push('empirical certification is prohibited')
  if(item.reviewStatus==='reviewed' && (!nonblank(item.reviewer) || !item.evidenceIds.length)) errors.push('reviewed miracle claim requires reviewer and source evidence')
  return errors
}
const MIRACLE_FIELDS = ['id','targetPassageId','tradition','claimant','method','claimText','evidenceIds',
  'reviewStatus','reviewer','empiricallyVerified'] as const
/** Numeric fields a caller might try to smuggle in as proof of a supernatural claim. */
const SCORE_FIELDS = ['score','witnessScore','witnessSupport','confidence','probability','certainty'] as const
export interface MiracleAttributionView {
  id: string
  claimType: 'attributed-claim'
  /** Echoed exactly as recorded: an absent claimant is an error, never a default name. */
  claimant: string
  tradition: string
  method: string
  claimText: string
  reviewStatus: ReviewStatus
  reviewer: string | null
  evidenceIds: string[]
  /** Typed null so a witness score cannot be attached to the claim. */
  score: null
  empiricallyVerified: false
  universalProof: false
  limitations: string[]
}
/**
 * Presents a claim as what it is: someone's attributed reading, together with the
 * limits of knowing it. A high witness score has no path into this record, so a
 * numeric result can never be displayed as an empirical miracle.
 */
export function describeMiracleAttribution(item:MiracleAttribution):MiracleAttributionView {
  const errors=validateMiracleAttribution(item)
  if (errors.length) throw new TypeError('miracle attribution cannot be displayed: '+errors.join('; '))
  const raw:unknown=item
  const unknown=Object.keys(raw as object)
    .filter(key=>!(MIRACLE_FIELDS as readonly string[]).includes(key) && !(SCORE_FIELDS as readonly string[]).includes(key)).sort()
  if (unknown.length) throw new TypeError('miracle attribution has unknown field(s): '+unknown.join(', '))
  const carried=SCORE_FIELDS.filter(field=>(raw as Record<string, unknown>)[field]!==undefined)
  if (carried.length) throw new TypeError('miracle attribution must not carry '+carried.join(', ')+': a witness score is not empirical proof')
  const limitations=['Claim is attributed to '+item.claimant+' ('+item.tradition+'); MoonWitness does not assert it.',
    'No numeric witness score is carried, and none can turn this claim into empirical proof.']
  if (item.reviewStatus!=='reviewed') limitations.push('Review status is '+item.reviewStatus+': no reviewer has accepted the claim.')
  if (!item.evidenceIds.length) limitations.push('No source evidence is recorded for this claim.')
  return Object.freeze({
    id:item.id, claimType:'attributed-claim' as const, claimant:item.claimant, tradition:item.tradition,
    method:item.method, claimText:item.claimText, reviewStatus:item.reviewStatus,
    reviewer:nonblank(item.reviewer)?item.reviewer:null,
    evidenceIds:Object.freeze([...item.evidenceIds]) as string[],
    score:null, empiricallyVerified:false as const, universalProof:false as const,
    limitations:Object.freeze(limitations) as string[]
  })
}

/**
 * Canonical text form of a candidate ledger. The document is a record of
 * research state, never a ranking: it round-trips only what a reviewer wrote.
 */
export const CANDIDATE_LEDGER_SCHEMA = 'mw-candidate-ledger-v1' as const
/** Read-only view of a deserialized ledger; nothing here can be mutated in place. */
export interface CandidateLedger {
  readonly schema: typeof CANDIDATE_LEDGER_SCHEMA
  readonly candidates: readonly ReviewedCandidate[]
}
const CANDIDATE_FIELDS = ['id','origin','relation','supportingEvidenceIds','contradictingEvidenceIds',
  'independentSourceIds','reviewStatus','reviewer','components'] as const
const ORIGIN_FIELDS = ['signature','operator','subject','relation','object','depth','state',
  'evidenceStatus','inheritedScore'] as const
const RELATION_FIELDS = ['leftPassageId','rightPassageId','relation','method','frame','evidenceIds',
  'counterReadings','reviewer','reviewStatus'] as const
const COMPONENT_FIELDS = Object.keys(WITNESS_COMPONENT_MAX) as (keyof WitnessComponents)[]

const sortedIds = (ids: readonly string[]): string[] => [...ids].sort()
const isRecord = (x: unknown): x is Record<string, unknown> =>
  typeof x === 'object' && x !== null && !Array.isArray(x)
const unknownFields = (record: Record<string, unknown>, allowed: readonly string[]): string[] =>
  Object.keys(record).filter(key => !allowed.includes(key)).sort()
const byId = (a: {id: string}, b: {id: string}): number => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)

/**
 * One record in a fixed field order with every ID set sorted, so two ledgers of
 * the same candidates serialize to the same bytes whatever order they arrived in.
 */
function canonicalCandidate(c: ReviewedCandidate) {
  const { origin, relation } = c
  return {
    id: c.id,
    origin: {
      signature: origin.signature, operator: origin.operator, subject: origin.subject,
      relation: origin.relation, object: origin.object, depth: origin.depth,
      state: origin.state, evidenceStatus: origin.evidenceStatus, inheritedScore: origin.inheritedScore
    },
    relation: {
      leftPassageId: relation.leftPassageId, rightPassageId: relation.rightPassageId,
      relation: relation.relation, method: relation.method, frame: relation.frame,
      evidenceIds: sortedIds(relation.evidenceIds), reviewStatus: relation.reviewStatus,
      // Counterreadings are prose: their order is the reviewer's, so they are never sorted.
      ...(relation.counterReadings?.length ? { counterReadings: [...relation.counterReadings] } : {}),
      ...(nonblank(relation.reviewer) ? { reviewer: relation.reviewer } : {})
    },
    supportingEvidenceIds: sortedIds(c.supportingEvidenceIds),
    contradictingEvidenceIds: sortedIds(c.contradictingEvidenceIds),
    independentSourceIds: sortedIds(c.independentSourceIds),
    reviewStatus: c.reviewStatus,
    ...(nonblank(c.reviewer) ? { reviewer: c.reviewer } : {}),
    /** null is the recorded "not independently assessed", never a padded 0/100. */
    components: c.components ? COMPONENT_FIELDS.reduce<Record<string, number>>(
      (bundle, key) => ({ ...bundle, [key]: c.components![key] }), {}) : null
  }
}

/** Refuses to serialize a record a reviewer could not defend, including extra truth fields. */
export function serializeCandidateLedger(candidates: readonly ReviewedCandidate[]): string {
  if (!Array.isArray(candidates)) throw new TypeError('candidate ledger must be an array of candidates')
  const seen = new Set<string>()
  const canonical = candidates.map((candidate, index) => {
    const raw: unknown = candidate
    if (!isRecord(raw)) throw new TypeError('candidate at index ' + index + ' must be an object')
    const extra = unknownFields(raw, CANDIDATE_FIELDS)
    if (extra.length) throw new TypeError('candidate at index ' + index + ' has unknown field(s): ' + extra.join(', '))
    const errors = validateReviewedCandidate(candidate)
    if (errors.length) throw new TypeError('candidate at index ' + index + ' cannot be serialized: ' + errors.join('; '))
    if (seen.has(candidate.id)) throw new RangeError('duplicate candidate id ' + candidate.id)
    seen.add(candidate.id)
    return canonicalCandidate(candidate)
  })
  return JSON.stringify({ schema: CANDIDATE_LEDGER_SCHEMA, candidates: canonical.sort(byId) }, null, 2) + '\n'
}

/** Requires the key to exist: a dropped contradiction list is not an empty search. */
function requiredKeys(record: Record<string, unknown>, names: readonly string[], label: string): void {
  const missing = names.filter(name => !(name in record))
  if (missing.length) throw new TypeError(label + ' is missing ' + missing.join(', ') + ' (use [] or null, never omit it)')
}
function nested(record: Record<string, unknown>, name: string, allowed: readonly string[], label: string): Record<string, unknown> {
  const value = record[name]
  if (!isRecord(value)) throw new TypeError(label + ' ' + name + ' must be an object')
  const extra = unknownFields(value, allowed)
  if (extra.length) throw new TypeError(label + ' ' + name + ' has unknown field(s): ' + extra.join(', '))
  return value
}

/** Rebuilds one typed record from parsed text, rejecting anything a reviewer did not write. */
function reviveCandidate(raw: unknown, index: number): ReviewedCandidate {
  const label = 'candidate at index ' + index
  if (!isRecord(raw)) throw new TypeError(label + ' must be an object')
  const extra = unknownFields(raw, CANDIDATE_FIELDS)
  if (extra.length) throw new TypeError(label + ' has unknown field(s): ' + extra.join(', '))
  requiredKeys(raw, CANDIDATE_FIELDS.filter(name => name !== 'reviewer'), label)
  const origin = nested(raw, 'origin', ORIGIN_FIELDS, label)
  requiredKeys(origin, ORIGIN_FIELDS, label + ' origin')
  const relation = nested(raw, 'relation', RELATION_FIELDS, label)
  requiredKeys(relation, RELATION_FIELDS.filter(name => name !== 'reviewer' && name !== 'counterReadings'), label + ' relation')
  const components = raw.components
  if (components !== null) {
    if (!isRecord(components)) throw new TypeError(label + ' components must be an object or null')
    const componentExtra = unknownFields(components, COMPONENT_FIELDS)
    if (componentExtra.length) throw new TypeError(label + ' components has unknown field(s): ' + componentExtra.join(', '))
    requiredKeys(components, COMPONENT_FIELDS, label + ' components')
  }
  const candidate = {
    id: raw.id, origin, relation,
    supportingEvidenceIds: raw.supportingEvidenceIds, contradictingEvidenceIds: raw.contradictingEvidenceIds,
    independentSourceIds: raw.independentSourceIds, reviewStatus: raw.reviewStatus,
    reviewer: raw.reviewer, components
  } as unknown as ReviewedCandidate
  const errors = validateReviewedCandidate(candidate)
  if (errors.length) throw new TypeError('candidate ' + String(candidate.id) + ' cannot be deserialized: ' + errors.join('; '))
  return candidate
}

const frozenIds = (ids: readonly string[]): string[] => Object.freeze([...ids]) as string[]
function freezeCandidate(c: ReviewedCandidate): ReviewedCandidate {
  return Object.freeze({
    ...c,
    origin: Object.freeze({ ...c.origin }),
    relation: Object.freeze({ ...c.relation, evidenceIds: frozenIds(c.relation.evidenceIds),
      ...(c.relation.counterReadings ? { counterReadings: frozenIds(c.relation.counterReadings) } : {})
    }) as ScopedTextRelation,
    supportingEvidenceIds: frozenIds(c.supportingEvidenceIds),
    contradictingEvidenceIds: frozenIds(c.contradictingEvidenceIds),
    independentSourceIds: frozenIds(c.independentSourceIds),
    components: c.components ? Object.freeze({ ...c.components }) : null
  }) as ReviewedCandidate
}

/** Parses a candidate ledger into an immutable, ID-ordered view. */
export function deserializeCandidateLedger(text: string): CandidateLedger {
  if (typeof text !== 'string') throw new TypeError('candidate ledger must be serialized text')
  let document: unknown
  try { document = JSON.parse(text) } catch { throw new TypeError('candidate ledger is not valid JSON') }
  if (!isRecord(document)) throw new TypeError('candidate ledger must be a JSON object')
  const extra = unknownFields(document, ['schema', 'candidates'])
  if (extra.length) throw new TypeError('candidate ledger has unknown field(s): ' + extra.join(', '))
  if (document.schema !== CANDIDATE_LEDGER_SCHEMA) throw new TypeError('candidate ledger schema must be ' + CANDIDATE_LEDGER_SCHEMA)
  if (!Array.isArray(document.candidates)) throw new TypeError('candidate ledger candidates must be an array')
  const seen = new Set<string>()
  const candidates = document.candidates.map((raw, index) => {
    const candidate = reviveCandidate(raw, index)
    if (seen.has(candidate.id)) throw new RangeError('duplicate candidate id ' + candidate.id)
    seen.add(candidate.id)
    return candidate
  })
  return Object.freeze({
    schema: CANDIDATE_LEDGER_SCHEMA,
    candidates: Object.freeze(candidates.sort(byId).map(freezeCandidate)) as readonly ReviewedCandidate[]
  })
}

/** Counts what the ledger does not know; disputed and unassessed are never hidden. */
export function summarizeCandidateLedger(ledger: CandidateLedger) {
  const records = ledger?.candidates || []
  const count = (predicate: (c: ReviewedCandidate) => boolean): number => records.filter(predicate).length
  return {
    schema: ledger?.schema,
    total: records.length,
    reviewed: count(c => c.reviewStatus === 'reviewed'),
    disputed: count(c => c.reviewStatus === 'disputed'),
    draft: count(c => c.reviewStatus === 'draft'),
    /** Records whose witness rubric was never independently assessed. */
    unassessed: count(c => !c.components),
    withContraryEvidence: count(c => c.contradictingEvidenceIds.length > 0),
    contrarySearchedNoneFound: count(c => c.contradictingEvidenceIds.length === 0),
    frames: [...new Set(records.map(c => c.relation.frame))].sort(),
    methods: [...new Set(records.map(c => c.relation.method))].sort(),
    automaticCanonicalApproval: false as const
  }
}
