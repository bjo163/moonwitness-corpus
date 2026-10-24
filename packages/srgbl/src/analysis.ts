import { scoreMaturity, type LevelStatus, type SrgbLLevel, SRGBL_LEVELS } from './index.js'

/**
 * P19 derived research contract. Pure validation: NEVER updates canonical corpus.
 * A text witness, textual assertion, historical occurrence, and interpretation
 * are explicitly different objects.
 */
export type EpistemicKind = 'observed' | 'inferred' | 'interpreted'
export type ReviewStatus = 'draft' | 'reviewed' | 'disputed' | 'deprecated'
export type RightsStatus = 'cleared' | 'restricted' | 'unknown'
export type ResearchFrame = {
  agent: string
  recipient: string
  domain: string
  scope: string
  genre: string
  tradition?: string
}

export interface WitnessSource {
  id: string
  passageId: string
  contentId: string
  sourceId: string
  editionId: string
  artifactId: string
  provenanceId: string
  language: string
  representation: 'source_text' | 'translation' | 'variant' | 'transliteration' | 'other'
  rights: RightsStatus
  /** Exact text is never rewritten as part of a derived claim. */
  text?: string
}

export interface LevelClaim {
  id: string
  level: SrgbLLevel
  status: LevelStatus
  epistemic: EpistemicKind
  claim: string
  evidenceIds: string[]
  /** Dependencies on other level claims, not implicit inference links. */
  dependsOn: string[]
  method: string
  frame: ResearchFrame
  sourceContentIds: string[]
  boundaryNote?: string
}

export interface AnalysisRun {
  id: string
  passageId: string
  method: string
  methodVersion: string
  corpusHash: string
  inputHash: string
  reviewer?: string
  reviewStatus: ReviewStatus
  sourceWitnesses: WitnessSource[]
  claims: LevelClaim[]
  uncertainty: { unknowns: string[]; disagreements: string[] }
}

export interface AnalysisValidation {
  states: Partial<Record<SrgbLLevel, LevelStatus>>
  maturity: ReturnType<typeof scoreMaturity>
  errors: string[]
  warnings: string[]
  publishable: boolean
}

const requiredFrame = ['agent', 'recipient', 'domain', 'scope', 'genre'] as const
const nonblank = (x: unknown): x is string => typeof x === 'string' && x.trim().length > 0

export function validateResearchFrame(frame: ResearchFrame): string[] {
  if (!frame || typeof frame !== 'object') return ['frame is missing']
  return requiredFrame.filter(key => !nonblank(frame[key])).map(key => 'frame.' + key + ' is missing')
}

/** OFFSIDE is a frame diagnostic, not a literal sacred-scripture word. */
export type OffsideReason =
  | 'no-mismatch'
  | 'frame_incomplete'
  | 'evidence_mismatch'
  | 'frame_incomplete_and_evidence_mismatch'

export function diagnoseOffside(frame: ResearchFrame, evidenceFrame: Partial<ResearchFrame>) {
  const missing = validateResearchFrame(frame)
  const differences = requiredFrame.filter(key =>
    nonblank(evidenceFrame[key]) && frame[key] !== evidenceFrame[key]
  )
  const reason: OffsideReason = missing.length && differences.length
    ? 'frame_incomplete_and_evidence_mismatch'
    : missing.length ? 'frame_incomplete'
    : differences.length ? 'evidence_mismatch' : 'no-mismatch'
  /**
   * The proposal exists only for human examination: it adopts just the nonblank
   * evidence values that actually differ, keeps every other canonical field,
   * ignores unknown evidence keys, and never means divine approval.
   */
  const proposedFrame: ResearchFrame = { ...frame }
  for (const key of differences) proposedFrame[key] = evidenceFrame[key] as string
  return { status: missing.length || differences.length ? 'candidate-offside' as const : 'no-detected-mismatch' as const,
    reason, missing, differences, proposedFrame,
    verified: false as const }
}

export function validateWitnessSource(source: WitnessSource): string[] {
  const mandatory: (keyof WitnessSource)[] = [
    'id','passageId','contentId','sourceId','editionId','artifactId','provenanceId','language'
  ]
  const errors = mandatory.filter(key => !nonblank(source[key])).map(key => 'source.' + key + ' required')
  if (!['source_text','translation','variant','transliteration','other'].includes(source.representation)) errors.push('source.representation invalid')
  if (!['cleared','restricted','unknown'].includes(source.rights)) errors.push('source.rights invalid')
  if (source.rights !== 'cleared' && typeof source.text === 'string') errors.push('source text must be omitted without explicit rights clearance')
  return errors
}

/**
 * A translation is a derived lane and can never take the identity of the
 * original reading: it may not reuse the edition of a source_text witness, and
 * representation/language/edition stay exactly as recorded (no silent swap).
 */
export function validateRepresentationLanes(witnesses: readonly WitnessSource[],
  citedContentIds: readonly string[]): string[] {
  const cited = (witnesses || []).filter(source => (citedContentIds || []).includes(source.contentId))
  const originalEditions = new Set(cited.filter(s => s.representation === 'source_text').map(s => s.editionId))
  return cited
    .filter(s => s.representation === 'translation' && originalEditions.has(s.editionId))
    .map(s => 'translation ' + s.id + ' reuses original edition ' + s.editionId)
}

/**
 * A supported stage requires source witnesses, explicit evidence IDs and typed
 * claims. No reviewer or algorithm may silently promote unverified stages.
 * The checker returns diagnostics rather than mutating the run.
 */
export function validateAnalysisRun(run: AnalysisRun): AnalysisValidation {
  const errors: string[] = []
  const warnings: string[] = []
  for (const field of ['id','passageId','method','methodVersion','corpusHash','inputHash'] as const) {
    if (!nonblank(run[field])) errors.push(field + ' required')
  }
  if (!Array.isArray(run.sourceWitnesses) || run.sourceWitnesses.length === 0) errors.push('source witness required')
  const sourceIds = new Set<string>()
  for (const source of run.sourceWitnesses || []) {
    errors.push(...validateWitnessSource(source))
    if (sourceIds.has(source.id)) errors.push('duplicate source witness ' + source.id)
    sourceIds.add(source.id)
    if (source.passageId !== run.passageId) errors.push('source witness passage mismatch')
  }
  const contentIds = new Set((run.sourceWitnesses || []).map(s => s.contentId))
  const claimIds = new Set<string>()
  const claims = Array.isArray(run.claims) ? run.claims : []
  const byLevel = new Map<SrgbLLevel, LevelClaim[]>()
  claims.forEach((c, index) => {
    // Every diagnostic must name the claim it rejects: 'duplicate/blank' alone
    // is not actionable for a researcher holding a five-claim run.
    const where = nonblank(c?.id) ? c.id : 'claim at index ' + index
    if (!nonblank(c?.id)) errors.push(where + ' has a blank id')
    else if (claimIds.has(c.id)) errors.push('duplicate claim id ' + c.id + ' in the dependency graph')
    if (!claimIds.has(c.id)) claimIds.add(c.id)
    if (!SRGBL_LEVELS.includes(c.level)) errors.push(where + ': invalid claim level')
    if (!['supported','partial','pending','unsupported','unknown'].includes(c.status)) errors.push(where + ': invalid claim status')
    if (!['observed','inferred','interpreted'].includes(c.epistemic)) errors.push(where + ': invalid epistemic class')
    if (!nonblank(c.claim) || !nonblank(c.method)) errors.push(where + ': claim and method required')
    errors.push(...validateResearchFrame(c.frame))
    if (!Array.isArray(c.evidenceIds) || !Array.isArray(c.dependsOn) || !Array.isArray(c.sourceContentIds)) errors.push(where + ': claim references must be arrays')
    if (c.method !== run.method) errors.push(where + ': claim method mismatch')
    if (c.status === 'supported' && (!c.evidenceIds?.length || !c.sourceContentIds?.length)) errors.push(where + ': supported claim must cite evidence and source')
    for (const id of c.sourceContentIds || []) if (!contentIds.has(id)) errors.push(where + ': claim references unavailable source content')
    errors.push(...validateRepresentationLanes(run.sourceWitnesses || [], c.sourceContentIds || []))
    // Only an observed claim asserts what the text itself says; a translation
    // lane cannot substitute for a missing original reading.
    if (c.epistemic === 'observed' && c.status === 'supported') {
      const cited = (run.sourceWitnesses || []).filter(s => (c.sourceContentIds || []).includes(s.contentId))
      if (cited.length && !cited.some(s => s.representation === 'source_text')) {
        errors.push(where + ': observed claim cites no original text witness')
      }
    }
    if (c.level === 'R2' && c.epistemic !== 'observed' && c.status === 'supported') errors.push('R2 supported claim must be observed text, not inference')
    if (c.level === 'L5' && c.status === 'supported' && !nonblank(c.boundaryNote)) errors.push('L5 supported claim requires boundary note')
    if (SRGBL_LEVELS.includes(c.level)) byLevel.set(c.level,[...(byLevel.get(c.level) || []),c])
  })
  for (const c of claims) {
    const where = nonblank(c?.id) ? c.id : 'claim with blank id'
    if (c.dependsOn?.includes(c.id)) errors.push(where + ' depends on itself')
    for (const parent of c.dependsOn || []) if (!claimIds.has(parent)) errors.push('dangling claim dependency ' + parent + ' in ' + where)
  }
  // Detect dependency cycles (even if status is pending). Two claims sharing an
  // id merge their outgoing edges instead of one silently replacing the other.
  const refs = new Map<string, string[]>()
  for (const c of claims) {
    if (!nonblank(c?.id)) continue
    const known = refs.get(c.id) || []
    const edges = Array.isArray(c.dependsOn) ? c.dependsOn : []
    refs.set(c.id, edges.reduce((list: string[], dep: string) => list.includes(dep) ? list : [...list, dep], known))
  }
  const visiting: string[] = []
  const visited = new Set<string>()
  const reported = new Set<string>()
  const visit = (id: string): void => {
    const at = visiting.indexOf(id)
    if (at >= 0) {
      // Rotate the ring so the same cycle reads identically whatever order the
      // claims were supplied in.
      const ring = visiting.slice(at)
      const smallest = ring.reduce((min, node) => node < min ? node : min, ring[0])
      const start = ring.indexOf(smallest)
      const canonical = [...ring.slice(start), ...ring.slice(0, start)]
      canonical.push(canonical[0])
      const message = 'claim dependency cycle: ' + canonical.join(' -> ')
      if (!reported.has(canonical.join('>'))) { reported.add(canonical.join('>')); errors.push(message) }
      return
    }
    if (visited.has(id)) return
    visiting.push(id)
    for (const dep of refs.get(id) || []) if (refs.has(dep)) visit(dep)
    visiting.pop()
    visited.add(id)
  }
  for (const id of claimIds) visit(id)
  const states: Partial<Record<SrgbLLevel,LevelStatus>> = {}
  for (const level of SRGBL_LEVELS) {
    const group = byLevel.get(level) || []
    if (!group.length) { states[level] = 'pending'; continue }
    if (group.some(c => c.status === 'unsupported')) states[level] = 'unsupported'
    else if (group.some(c => c.status === 'unknown')) states[level] = 'unknown'
    else if (group.some(c => c.status === 'partial' || c.status === 'pending')) states[level] = 'partial'
    else states[level] = 'supported'
  }
  if (!run.sourceWitnesses?.length || (run.sourceWitnesses || []).some(s => !s.editionId || !s.artifactId || !s.provenanceId)) states.S1 = 'pending'
  for (let i=1; i<SRGBL_LEVELS.length; i++) {
    const level = SRGBL_LEVELS[i]
    if (states[level] !== 'supported') continue
    const prev = SRGBL_LEVELS[i-1]
    const parents = byLevel.get(prev) || []
    for (const claim of byLevel.get(level) || []) {
      if (claim.status !== 'supported') continue
      if (!claim.dependsOn?.some(id => parents.some(parent => parent.id === id && parent.status === 'supported'))) {
        errors.push(level + ' supported claim missing supported ' + prev + ' dependency')
      }
    }
  }
  if (!run.uncertainty || !Array.isArray(run.uncertainty.unknowns) || !Array.isArray(run.uncertainty.disagreements)) errors.push('uncertainty must preserve unknowns and disagreements')
  if (run.reviewStatus === 'reviewed' && !nonblank(run.reviewer)) errors.push('reviewed analysis requires reviewer')
  if (run.reviewStatus !== 'reviewed') warnings.push('unreviewed analysis cannot be displayed as a reviewed finding')
  const invalidLevels = errors.some(e => e.includes('supported') || e.includes('source') || e.includes('dependency') || e.includes('required'))
  if (invalidLevels) for (const level of SRGBL_LEVELS) {
    if (states[level] === 'supported') states[level] = 'pending'
  }
  const maturity = scoreMaturity(states)
  return { states, maturity, errors, warnings,
    publishable: errors.length === 0 && maturity.score > 0 && run.reviewStatus === 'reviewed' &&
      run.sourceWitnesses.every(s => s.rights === 'cleared') }
}
