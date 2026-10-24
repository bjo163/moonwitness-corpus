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
  const errors: string[]=[]
  if (!nonblank(c.id)) errors.push('candidate ID required')
  if (c.origin.state !== 'candidate' || c.origin.inheritedScore !== null) errors.push('candidate must not inherit score')
  try { validateScopedRelation(c.relation) } catch(e) { errors.push(String(e)) }
  if (!validIds(c.supportingEvidenceIds) || !validIds(c.contradictingEvidenceIds) || !validIds(c.independentSourceIds)) errors.push('candidate evidence and origin arrays must contain unique IDs')
  if (c.reviewStatus==='reviewed' &&
    (!nonblank(c.reviewer) || !c.supportingEvidenceIds.length || !c.independentSourceIds.length ||
     c.relation.reviewStatus!=='reviewed')) errors.push('review requires reviewer, explicit evidence, independent source, and reviewed relation')
  if (c.components !== null) {
    try { scoreWitnessCandidate(c.components) } catch(e) { errors.push(String(e)) }
  }
  return errors
}
export function summarizeCandidate(c: ReviewedCandidate) {
  const errors=validateReviewedCandidate(c)
  const evaluated=c.components===null?null:scoreWitnessCandidate(c.components)
  return {
    id:c.id,relation:c.relation.relation,method:c.relation.method,
    direction:'perspective-scoped' as const,
    witnessSupport:evaluated,
    reviewStatus:c.reviewStatus,
    /** Eligible for *publishing as attributed review*, never global truth. */
    publishable:errors.length===0 && c.reviewStatus==='reviewed' && c.relation.reviewStatus==='reviewed',
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
