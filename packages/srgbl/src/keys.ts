import { scoreDirection, type FrameDirectionInput } from './index.js'
import { validateResearchFrame, type ResearchFrame, type ReviewStatus } from './analysis.js'
import { DIRECTION_VALUES, INTENSITY_VALUES, RELATION_VOCABULARY, REVIEW_STATUS_VALUES } from './vocabulary.js'

export const P18_KEY_CANDIDATES = [
  'mercy','compassion','forgiveness','comfort','justice','truth','accountability','restoration',
  'praise','gratitude','trust','hope','patience','humility','generosity','wisdom',
  'narrative','warning','promise','covenant'
] as const
/** Single source for relations: the declared vocabulary, not a second copy. */
export const KEY_RELATIONS = RELATION_VOCABULARY
export type KeyToken = (typeof P18_KEY_CANDIDATES)[number]
export type KeyRelation = (typeof KEY_RELATIONS)[number]

/**
 * Versioned P18 semantic-core registry. A token is only valid inside the scheme
 * version that lists it, so a future scheme needs its own entry instead of
 * silently inheriting these tokens. v0 stays a *candidate* vocabulary until P18
 * review ratifies it; nothing here may be auto-mapped into an approved list.
 */
export const KEY_REGISTRY_SCHEMES = ['semantic-core:v0'] as const
export type KeySchemeVersion = (typeof KEY_REGISTRY_SCHEMES)[number]
export const KEY_REGISTRY: Readonly<Record<KeySchemeVersion,
  { readonly tokens: readonly KeyToken[]; readonly status: 'candidate' | 'ratified' }>> = {
  'semantic-core:v0': { tokens: P18_KEY_CANDIDATES, status: 'candidate' }
}

/** null means the scheme version itself is unknown, not that every token is valid. */
export function registeredKeyTokens(scheme: string): readonly string[] | null {
  return Object.prototype.hasOwnProperty.call(KEY_REGISTRY, scheme)
    ? KEY_REGISTRY[scheme as KeySchemeVersion].tokens
    : null
}

/** Syntactic vocabulary check only: no registry decision is edited or inferred. */
export function validateKeyToken(scheme: string, key: string): string[] {
  const tokens = registeredKeyTokens(scheme)
  if (!tokens) return ['unknown key scheme version ' + scheme]
  if (!tokens.includes(key)) return ['key not in ' + scheme + ' controlled candidate registry']
  return []
}

/** v0 registry remains unratified until P18 review; do not silently extend it. */
export type FramedKeyAssessment = {
  id: string
  passageId: string
  contentId: string
  key: KeyToken
  scheme: KeySchemeVersion
  method: string
  assessor: string
  reviewer?: string
  evidenceIds: string[]
  relation: KeyRelation
  frame: ResearchFrame
  direction: -2|-1|0|1|2
  intensity: 1|2|3
  confidence: number
  weight: number
  reviewStatus: ReviewStatus
}

export type KeyMessage = {
  id: string
  passageId: string
  method: string
  frame: ResearchFrame
  sourceKeyAssessmentIds: string[]
  message: string
  boundaryNote: string
  contextNote: string
  evidenceIds: string[]
  reviewStatus: ReviewStatus
  reviewer?: string
}

const string = (s: unknown): s is string => typeof s === 'string' && s.trim().length > 0
export function validateKeyAssessment(record: FramedKeyAssessment): string[] {
  const errors = validateResearchFrame(record.frame)
  for (const k of ['id','passageId','contentId','method','assessor'] as const) if (!string(record[k])) errors.push('key.'+k+' required')
  errors.push(...validateKeyToken(record.scheme, record.key))
  if (!(KEY_RELATIONS as readonly string[]).includes(record.relation)) errors.push('invalid key relation')
  if (!(DIRECTION_VALUES as readonly number[]).includes(record.direction)) errors.push('direction out of range')
  if (!(INTENSITY_VALUES as readonly number[]).includes(record.intensity)) errors.push('intensity out of range')
  // A status outside the vocabulary is not a softer draft; it is unreadable state.
  if (!REVIEW_STATUS_VALUES.includes(record.reviewStatus)) errors.push('invalid review status')
  if (!Number.isFinite(record.confidence) || record.confidence<0 || record.confidence>1) errors.push('confidence out of range')
  if (!Number.isFinite(record.weight) || record.weight < 0) errors.push('weight must be nonnegative')
  if (!Array.isArray(record.evidenceIds) || record.evidenceIds.some(x=>!string(x))) errors.push('invalid key evidence')
  if (record.reviewStatus === 'reviewed' && (!record.evidenceIds?.length || !string(record.reviewer))) errors.push('reviewed key requires evidence and reviewer')
  return errors
}

/** Every message is a derived editorial object with explicit text boundary. */
export function validateKeyMessage(message: KeyMessage, keys: readonly FramedKeyAssessment[]): string[] {
  const errors = validateResearchFrame(message.frame)
  for (const k of ['id','passageId','method','message','boundaryNote','contextNote'] as const)
    if (!string(message[k])) errors.push('message.'+k+' required')
  if (!Array.isArray(message.sourceKeyAssessmentIds) || !message.sourceKeyAssessmentIds.length) errors.push('message must cite key assessments')
  if (!Array.isArray(message.evidenceIds) || message.evidenceIds.some(x => !string(x))) errors.push('message evidence missing')
  if (!REVIEW_STATUS_VALUES.includes(message.reviewStatus)) errors.push('invalid review status')
  // A supplied record set with two identical IDs resolves arbitrarily, so the
  // reference is reported as ambiguous instead of silently picking the last one.
  const index = new Map<string, FramedKeyAssessment>()
  const duplicateKeyIds = new Set<string>()
  for (const record of keys || []) {
    if (index.has(record.id)) duplicateKeyIds.add(record.id)
    else index.set(record.id, record)
  }
  for (const id of duplicateKeyIds) errors.push('duplicate key assessment record id ' + id)
  const cited = Array.isArray(message.sourceKeyAssessmentIds) ? message.sourceKeyAssessmentIds : []
  const seenCitations = new Set<string>()
  cited.forEach((id, position) => {
    if (!string(id)) { errors.push('message.sourceKeyAssessmentIds[' + position + '] is not a nonblank key id'); return }
    if (seenCitations.has(id)) { errors.push('duplicate message key reference ' + id); return }
    seenCitations.add(id)
    const key = index.get(id)
    if (!key) { errors.push('missing source key ' + id); return }
    if (duplicateKeyIds.has(id)) return
    // Passage and method drift are different defects and must stay separable.
    if (key.passageId !== message.passageId) errors.push('message key ' + id + ' belongs to passage ' + key.passageId + ', not ' + message.passageId)
    else if (key.method !== message.method) errors.push('message key ' + id + ' uses method ' + key.method + ', not ' + message.method)
  })
  if (message.reviewStatus === 'reviewed' && (!string(message.reviewer) || !message.evidenceIds?.length ||
    (message.sourceKeyAssessmentIds || []).some(id=>index.get(id)?.reviewStatus!=='reviewed'))) errors.push('reviewed message needs reviewed keys, evidence and reviewer')
  return errors
}

export type FramedDirectionBundle = {
  method: string
  profile: string
  frame: ResearchFrame
  expectedKeyCount: number
  assessments: FramedKeyAssessment[]
  /** Observed agreement only; null when pilot measurements are unavailable. */
  agreement: number | null
  reviewerCount: number
}
export function evaluateFramedKeys(bundle: FramedDirectionBundle) {
  const errors = validateResearchFrame(bundle.frame)
  if (!string(bundle.method) || !string(bundle.profile)) errors.push('method/profile required')
  if (!Number.isInteger(bundle.expectedKeyCount) || bundle.expectedKeyCount<1) errors.push('expectedKeyCount must be positive')
  if (!Number.isInteger(bundle.reviewerCount) || bundle.reviewerCount<0) errors.push('reviewerCount invalid')
  if (bundle.agreement !== null && (!Number.isFinite(bundle.agreement) || bundle.agreement<0 || bundle.agreement>1)) errors.push('agreement invalid')
  const ids=new Set<string>(),uniqueKeys=new Set<string>()
  const items:FrameDirectionInput[]=[]
  for(const a of bundle.assessments){
    errors.push(...validateKeyAssessment(a))
    if(ids.has(a.id)) errors.push('duplicate key annotation')
    ids.add(a.id)
    uniqueKeys.add(a.key)
    if(a.method!==bundle.method) errors.push('key method mismatch')
    if(JSON.stringify(a.frame)!==JSON.stringify(bundle.frame)) errors.push('key frame mismatch')
    items.push({id:a.id,direction:a.direction,intensity:a.intensity,confidence:a.confidence,weight:a.weight})
  }
  if(uniqueKeys.size>bundle.expectedKeyCount) errors.push('annotated keys exceed expected keys')
  const coverage=errors.length?null:uniqueKeys.size/bundle.expectedKeyCount
  // No score if invalid inputs. Do not infer cross-annotator agreement from confidence.
  const direction=errors.length?null:scoreDirection(JSON.stringify(bundle.frame),bundle.profile,items)
  return {method:bundle.method,profile:bundle.profile,frame:bundle.frame,
    direction,coverage,n:bundle.assessments.length,uniqueKeyCount:uniqueKeys.size,
    agreement:bundle.agreement,reviewerCount:bundle.reviewerCount,errors}
}

/**
 * Annotation intake for a paired sample. Two independent submissions for one
 * passage are retained as separate entries: nothing here ranks, merges or
 * adjudicates them, and one assessor can never be counted as two raters.
 */
export type KeyAnnotationSubmission = {
  id: string
  passageId: string
  assessor: string
  scheme: string
  key: string
  method: string
  justification: string
  evidenceIds: string[]
  frame: ResearchFrame
  status: 'submitted' | 'withdrawn'
}

export type RetainedAnnotationEntry = {
  id: string
  assessor: string
  scheme: string
  key: string
  justification: string
  evidenceIds: string[]
  status: 'submitted' | 'withdrawn'
}

export function validateAnnotationSubmission(record: KeyAnnotationSubmission): string[] {
  const errors = validateResearchFrame(record?.frame)
  for (const k of ['id', 'passageId', 'assessor', 'method', 'justification'] as const)
    if (!string(record?.[k])) errors.push('annotation.' + k + ' required')
  if (string(record?.passageId) && !record.passageId.startsWith('mw:passage:')) errors.push('annotation.passageId must be canonical')
  errors.push(...validateKeyToken(record?.scheme ?? '', record?.key ?? ''))
  if (record?.status !== 'submitted' && record?.status !== 'withdrawn') errors.push('annotation.status must be submitted or withdrawn')
  if (!Array.isArray(record?.evidenceIds) || record.evidenceIds.length === 0 || record.evidenceIds.some(x => !string(x)))
    errors.push('annotation evidence required')
  // A verdict belongs to a human adjudication record, never to the input.
  for (const forbidden of ['verdict', 'adjudicated', 'consensus', 'agreed']) {
    if (record && Object.prototype.hasOwnProperty.call(record, forbidden)) errors.push('annotation must not carry ' + forbidden)
  }
  return errors
}

export function collectAnnotationPair(first: KeyAnnotationSubmission, second: KeyAnnotationSubmission) {
  const errors = [
    ...validateAnnotationSubmission(first).map(e => 'A: ' + e),
    ...validateAnnotationSubmission(second).map(e => 'B: ' + e)
  ]
  if (string(first?.passageId) && first.passageId !== second?.passageId)
    errors.push('paired annotations must address the same passage')
  if (string(first?.assessor) && first.assessor.trim().toLowerCase() === (second?.assessor ?? '').trim().toLowerCase())
    errors.push('a single assessor cannot stand in for two independent raters')
  if (string(first?.id) && first.id === second?.id)
    errors.push('paired annotations need two distinct submission ids')
  if (string(first?.scheme) && first.scheme !== second?.scheme)
    errors.push('paired annotations must share one scheme version')
  const entries: RetainedAnnotationEntry[] = [first, second].map(x => ({
    id: x?.id, assessor: x?.assessor, scheme: x?.scheme, key: x?.key,
    justification: x?.justification, evidenceIds: [...(x?.evidenceIds ?? [])], status: x?.status
  }))
  // Both submissions survive validation verbatim: differing keys stay separate entries.
  return {ok: errors.length === 0, errors, entries, retained: 2, adjudicated: false as const}
}
