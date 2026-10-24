import {
  scoreWitnessCandidate, validateScopedRelation, type ScopedTextRelation,
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
