/**
 * SRGBL v8 research-only primitives for MoonWitness Corpus.
 * Values describe an analysis/candidate under a versioned method; never a verse,
 * tradition, human, or theological-truth ranking.
 * This module does not read/write canonical corpus records.
 */
export const SRGBL_LEVELS = ['S1', 'R2', 'G3', 'B4', 'L5'] as const
export type SrgbLLevel = (typeof SRGBL_LEVELS)[number]
export type LevelStatus = 'supported' | 'partial' | 'pending' | 'unsupported' | 'unknown'
export type LevelStates = Partial<Record<SrgbLLevel, LevelStatus>>

export interface MaturityResult {
  verifiedLevel: SrgbLLevel | null
  score: number
  max: 15
  normalized: number
  nextLevel: SrgbLLevel | null
  pending: SrgbLLevel[]
}

/** Only a contiguous, supported prefix may earn cumulative maturity points. */
export function scoreMaturity(states: LevelStates): MaturityResult {
  let reached = 0
  for (const level of SRGBL_LEVELS) {
    const status = states[level]
    if (status !== undefined &&
        !(['supported', 'partial', 'pending', 'unsupported', 'unknown'] as string[]).includes(status)) {
      throw new RangeError(`Invalid status for ${level}: ${status}`)
    }
    if (status !== 'supported') break
    reached++
  }
  const score = reached * (reached + 1) / 2
  return {
    verifiedLevel: reached ? SRGBL_LEVELS[reached - 1] : null,
    score,
    max: 15,
    normalized: score / 15,
    nextLevel: reached === 5 ? null : SRGBL_LEVELS[reached],
    pending: SRGBL_LEVELS.slice(reached)
  }
}

export const QUALITY_DIMENSIONS = [
  'sGrounding', 'rAccuracy', 'gSupport', 'bDiscipline', 'lResponsibility',
  'provenance', 'unknownHonesty', 'alternativeCoverage',
  'confidenceCalibration', 'actionUsefulness'
] as const
export type QualityDimension = (typeof QUALITY_DIMENSIONS)[number]
export type QualityInputs = Record<QualityDimension, number>
/** A quality score without a caller-declared method/profile is unattributable. */
export interface QualityLabel {
  method: string
  profile: string
}
const nonblankText = (x: unknown): x is string => typeof x === 'string' && x.trim().length > 0

/**
 * The 40-point rubric is only ever computed on a complete, labelled bundle: a
 * missing dimension is an error, never a padded 0, and 0 is a measured zero.
 */
export function scoreQuality(input: QualityInputs, label: QualityLabel) {
  if (!label || !nonblankText(label.method) || !nonblankText(label.profile)) {
    throw new TypeError('quality score requires caller-supplied method and profile')
  }
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new TypeError('quality bundle must be an object')
  const declared = QUALITY_DIMENSIONS as readonly string[]
  const unknown = Object.keys(input).filter(key => !declared.includes(key)).sort()
  if (unknown.length) throw new TypeError('unknown quality dimension: ' + unknown.join(', '))
  for (const key of QUALITY_DIMENSIONS) {
    const v = input[key]
    if (!Number.isInteger(v) || v < 0 || v > 4) {
      throw new RangeError(`quality.${key} must be an integer from 0 to 4`)
    }
  }
  const raw = QUALITY_DIMENSIONS.reduce((sum, key) => sum + input[key], 0)
  return {
    rubric: 'srgbl-quality-v8-proposal',
    method: label.method,
    profile: label.profile,
    raw,
    max: 40 as const,
    normalized: raw / 40,
    dimensions: { ...input },
    automaticCanonicalApproval: false as const
  }
}

export interface FrameDirectionInput {
  /** Unique annotation ID in the selected method/profile/frame. */
  id: string
  direction: number
  intensity: number
  confidence: number
  weight: number
}
export interface DirectionResult {
  status: 'scored' | 'unknown'
  value: number | null
  range: readonly [-2, 2]
  count: number
  reason?: string
}
/** Bounded direction of a declared frame-specific bundle; not scriptural worth. */
export function scoreDirection(frame: string, profile: string, items: readonly FrameDirectionInput[]): DirectionResult {
  if (typeof frame !== 'string' || !frame.trim() || typeof profile !== 'string' || !profile.trim()) {
    throw new TypeError('frame and method profile are required')
  }
  if (!Array.isArray(items)) throw new TypeError('direction items must be an array')
  const ids = new Set<string>()
  let numerator = 0
  let denominator = 0
  for (const k of items) {
    // One factor feeds numerator and denominator, so a zero-weight or
    // zero-confidence annotation can never tilt the average by its direction.
    if (typeof k?.id !== 'string' || !k.id.trim() || ids.has(k.id)) throw new TypeError('key assessment IDs must be unique and nonblank')
    ids.add(k.id)
    if (!Number.isInteger(k.direction) || k.direction < -2 || k.direction > 2) throw new RangeError('direction must be -2..2')
    if (!Number.isInteger(k.intensity) || k.intensity < 1 || k.intensity > 3) throw new RangeError('intensity must be 1..3')
    if (!Number.isFinite(k.confidence) || k.confidence < 0 || k.confidence > 1) throw new RangeError('confidence must be 0..1')
    if (!Number.isFinite(k.weight) || k.weight < 0) throw new RangeError('weight must be nonnegative')
    const factor = k.intensity * k.weight * k.confidence
    numerator += factor * k.direction
    denominator += factor
  }
  if (denominator === 0) return { status: 'unknown', value: null, range: [-2, 2], count: items.length, reason: 'no positive evidence weight' }
  const raw = numerator / denominator
  return { status: 'scored', value: Math.max(-2, Math.min(2, raw)), range: [-2, 2], count: items.length }
}

export const WITNESS_COMPONENT_MAX = {
  sourceFidelity: 25, observability: 25, semanticConsistency: 20,
  crossReference: 15, nonOverlapping: 15
} as const
export type WitnessComponents = Record<keyof typeof WITNESS_COMPONENT_MAX, number>
/** Historical 100-point candidate rubric. A threshold never confers canonical authority. */
export function scoreWitnessCandidate(values: WitnessComponents) {
  if (!values || typeof values !== 'object' || Array.isArray(values)) {
    throw new TypeError('witness components must be an object')
  }
  const componentNames = Object.keys(WITNESS_COMPONENT_MAX) as (keyof WitnessComponents)[]
  const unknown = Object.keys(values).filter(key => !(componentNames as string[]).includes(key)).sort()
  if (unknown.length) throw new TypeError('unknown witness component: ' + unknown.join(', '))
  let raw = 0
  for (const key of componentNames) {
    const n = values[key]
    if (!Number.isInteger(n) || n < 0 || n > WITNESS_COMPONENT_MAX[key]) throw new RangeError(`Invalid witness component: ${key}`)
    raw += n
  }
  return {
    rubric: 'legacy-witness-score-v1',
    raw,
    max: 100 as const,
    reviewEligibility: raw >= 70 ? 'eligible-for-review' as const : 'needs-more-evidence' as const,
    automaticCanonicalApproval: false as const
  }
}

export const SWING_OPERATORS = [
  'direction', 'polarity', 'subject-object', 'cause-effect',
  'perspective', 'temporal', 'semantic-opposition'
] as const
export type SwingOperator = (typeof SWING_OPERATORS)[number]
export interface SwingTriple {
  subject: string
  relation: string
  object: string
}
export interface SwingRequest {
  operator: SwingOperator
  subject: string
  relation: string
  object: string
  depth: number
  /** Used to reject a repeat in the caller's candidate chain. */
  seenSignatures?: readonly string[]
  /** Exact prior relation triples, including the starting relation, for cycle checks. */
  seenRelations?: readonly SwingTriple[]
}
export interface SwingCandidate {
  signature: string
  operator: SwingOperator
  subject: string
  relation: string
  object: string
  depth: number
  state: 'candidate'
  evidenceStatus: 'unverified'
  inheritedScore: null
}
/**
 * Generates a QUESTION/CANDIDATE ONLY. Reversal never implies truth;
 * every candidate must independently earn evidence and a new score.
 */
export function proposeSwing(request: SwingRequest): SwingCandidate {
  const { operator, subject, relation, object, depth } = request
  if (!(SWING_OPERATORS as readonly string[]).includes(operator)) throw new RangeError('Invalid swing operator')
  if (!Number.isInteger(depth) || depth < 1 || depth > 3) throw new RangeError('Maximum swing depth is 3')
  if (![subject, relation, object].every(x => typeof x === 'string' && x.trim().length)) throw new TypeError('subject, relation and object are required')
  const transformed: Record<SwingOperator, [string, string, string]> = {
    direction: [object, `candidate-inverse-of:${relation}`, subject],
    polarity: [subject, `candidate-negation-of:${relation}`, object],
    'subject-object': [object, `candidate-object-perspective-of:${relation}`, subject],
    'cause-effect': [object, 'candidate-possible-cause-of', subject],
    perspective: [object, `candidate-perspective-of:${relation}`, subject],
    temporal: [object, `candidate-retrospective-of:${relation}`, subject],
    'semantic-opposition': [subject, `candidate-opposition-of:${relation}`, object]
  }
  const [nextSubject, nextRelation, nextObject] = transformed[operator]
  const signature = JSON.stringify([operator, nextSubject, nextRelation, nextObject])
  if (request.seenSignatures?.includes(signature)) throw new RangeError('Swing duplicate candidate')
  const relationKey = (triple: SwingTriple) => JSON.stringify([triple.subject, triple.relation, triple.object])
  const nextRelationKey = relationKey({ subject: nextSubject, relation: nextRelation, object: nextObject })
  if (request.seenRelations?.some(item => relationKey(item) === nextRelationKey)) throw new RangeError('Swing cycle detected')
  return {
    signature, operator, subject: nextSubject, relation: nextRelation, object: nextObject,
    depth, state: 'candidate', evidenceStatus: 'unverified', inheritedScore: null
  }
}

export interface SwingChainResult {
  candidates: SwingCandidate[]
  stop: 'complete' | 'duplicate-candidate' | 'cycle'
}

/** Apply up to three candidate rotations while retaining path-local duplicate/cycle guards. */
export function proposeSwingChain(start: SwingTriple, operators: readonly SwingOperator[]): SwingChainResult {
  if (![start?.subject, start?.relation, start?.object].every(value => typeof value === 'string' && value.trim())) {
    throw new TypeError('starting subject, relation and object are required')
  }
  if (!Array.isArray(operators) || operators.length > 3) throw new RangeError('Maximum swing depth is 3')
  const candidates: SwingCandidate[] = []
  const seenSignatures: string[] = []
  const seenRelations: SwingTriple[] = [{ ...start }]
  let current = { ...start }
  for (let index = 0; index < operators.length; index++) {
    try {
      const candidate = proposeSwing({ operator: operators[index], ...current, depth: index + 1, seenSignatures, seenRelations })
      candidates.push(candidate)
      seenSignatures.push(candidate.signature)
      const relation = { subject: candidate.subject, relation: candidate.relation, object: candidate.object }
      seenRelations.push(relation)
      current = relation
    } catch (error) {
      if (error instanceof RangeError && error.message === 'Swing duplicate candidate') return { candidates, stop: 'duplicate-candidate' }
      if (error instanceof RangeError && error.message === 'Swing cycle detected') return { candidates, stop: 'cycle' }
      throw error
    }
  }
  return {candidates,stop:'complete'}
}

export const SRGBL_RELATION_TYPES = [
  'AFFIRMS', 'PARALLELS', 'CLARIFIES', 'QUALIFIES', 'CONTRASTS',
  'CORRECTS_WITHIN_FRAME', 'UNRESOLVED', 'NOT_RELATED'
] as const
export type SrgbLRelationType = (typeof SRGBL_RELATION_TYPES)[number]
/** Exact canonical passage id; a fuzzy citation string is not a cross-text endpoint. */
const PASSAGE_ID = /^mw:passage:[^\s:]+(?::[^\s:]+)*$/
export interface ScopedTextRelation {
  leftPassageId: string
  rightPassageId: string
  relation: SrgbLRelationType
  method: string
  frame: string
  evidenceIds: string[]
  reviewer?: string
  reviewStatus: 'draft' | 'reviewed' | 'disputed' | 'deprecated'
}
/** Strictly validates a *record*, never infers a correction or miracle. */
export function validateScopedRelation(record: ScopedTextRelation): void {
  if (![record.leftPassageId, record.rightPassageId, record.method, record.frame].every(x => typeof x === 'string' && x.trim())) {
    throw new TypeError('Both passages, method, and frame are required')
  }
  if (!PASSAGE_ID.test(record.leftPassageId) || !PASSAGE_ID.test(record.rightPassageId)) {
    throw new TypeError('Both relation endpoints must be exact mw:passage IDs, not references')
  }
  if (record.leftPassageId === record.rightPassageId) {
    throw new TypeError('A cross-text relation needs two distinct passages')
  }
  if (!(SRGBL_RELATION_TYPES as readonly string[]).includes(record.relation)) throw new RangeError('Unsupported relation')
  if (!Array.isArray(record.evidenceIds) || record.evidenceIds.some(x => typeof x !== 'string' || !x.trim())) throw new TypeError('Invalid evidence IDs')
  if (new Set(record.evidenceIds).size !== record.evidenceIds.length) throw new TypeError('Evidence IDs must be unique')
  if (record.reviewStatus === 'reviewed' && (!record.reviewer?.trim() || !record.evidenceIds.length)) {
    throw new TypeError('Reviewed relationship requires reviewer and explicit evidence')
  }
  if (record.relation === 'CORRECTS_WITHIN_FRAME' && record.frame === 'comparative-neutral') {
    throw new RangeError('Doctrinal correction cannot be asserted as neutral')
  }
}

/**
 * A repository that can answer "does this exact ID exist?". Abstaining (undefined)
 * is not existence, and a missing hook is not a pass.
 */
export interface RelationSourceLookup {
  hasPassage?: (passageId: string) => boolean | undefined
  hasEvidence?: (evidenceId: string) => boolean | undefined
}
export interface RelationEndpointStatus {
  side: 'left' | 'right' | 'evidence'
  id: string
  status: 'resolved' | 'missing' | 'unavailable'
}
export interface RelationSourceResolution {
  endpoints: RelationEndpointStatus[]
  /** Human-readable reasons, one per endpoint the repository could not confirm. */
  unresolved: string[]
  /** True only for a reviewed record whose every endpoint the repository confirms. */
  publishable: boolean
  automaticCanonicalApproval: false
}
/**
 * Repository lookup, deliberately separate from structural validation: the shape
 * of a relation is judged without any repository, and existence is only ever
 * answered by the caller's repository. Nothing here writes to the record.
 */
export function resolveRelationSources(
  record: ScopedTextRelation, lookup: RelationSourceLookup
): RelationSourceResolution {
  validateScopedRelation(record)
  const ask = (fn?: (id: string) => boolean | undefined) => (id: string): RelationEndpointStatus['status'] => {
    if (typeof fn !== 'function') return 'unavailable'
    const answer = fn(id)
    return answer === true ? 'resolved' : answer === false ? 'missing' : 'unavailable'
  }
  const passage = ask(lookup?.hasPassage)
  const evidence = ask(lookup?.hasEvidence)
  const endpoints: RelationEndpointStatus[] = [
    { side: 'left', id: record.leftPassageId, status: passage(record.leftPassageId) },
    { side: 'right', id: record.rightPassageId, status: passage(record.rightPassageId) },
    ...record.evidenceIds.map(id => ({ side: 'evidence' as const, id, status: evidence(id) }))
  ]
  const unresolved = endpoints
    .filter(endpoint => endpoint.status !== 'resolved')
    .map(endpoint => endpoint.side + ' ' + endpoint.id + (endpoint.status === 'missing'
      ? ' is missing from the repository'
      : ' is unresolvable: no lookup answered'))
  return {
    endpoints,
    unresolved,
    publishable: record.reviewStatus === 'reviewed' && unresolved.length === 0,
    automaticCanonicalApproval: false as const
  }
}
