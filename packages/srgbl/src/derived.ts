import { createHash } from 'node:crypto'
import { validateAnalysisRun, type AnalysisRun } from './analysis.js'
import { summarizeCandidate, validateMiracleAttribution, type ReviewedCandidate, type MiracleAttribution } from './research-ledger.js'

export interface SnapshotInput {
  corpusHash: string
  methodVersion: string
  runs: AnalysisRun[]
  candidates: ReviewedCandidate[]
  miracleClaims: MiracleAttribution[]
}
export type ResearchPublication = {
  schema: 'srgbl-v8-reviewed-derived-v1'
  corpusHash: string
  methodVersion: string
  inputSha256: string
  /** Checksum of the exact public + research projection, not an author signature. */
  projectionSha256: string
  /**
   * A content checksum binds bytes. It authenticates no person, is not a reviewer
   * signature and grants no rights; it is therefore always false.
   */
  authenticatedSignature: false
  records: {
    /** Full assessment details are retained in review-only view. */
    reviewedAnalyses: Array<{id:string;passageId:string;reviewer:string;maturity:number;max:15}>
    reviewedRelations: Array<{id:string;method:string;relation:string;reviewer:string}>
    attributedClaims: Array<{id:string;targetPassageId:string;tradition:string;method:string;claimant:string;reviewer:string}>
  }
  /** Public projection deliberately lacks ranking scores, text, and unreviewed claims. */
  publicSummaries: Array<{id:string;passageId:string;method:string;status:'reviewed';
    levels:Array<{level:string;epistemic:string;claim:string;evidenceIds:string[];sourceContentIds:string[];boundaryNote?:string}>}>
}

/** Stable JSON used for reproducible SHA-256. Reject unsupported data structures. */
export function canonicalJson(value:unknown):string {
  if (value===null) return 'null'
  if (typeof value==='string' || typeof value==='boolean') return JSON.stringify(value)
  if (typeof value==='number' && Number.isFinite(value)) return JSON.stringify(value)
  if (Array.isArray(value)) return '['+value.map(canonicalJson).join(',')+']'
  if (typeof value==='object' && value && Object.getPrototypeOf(value)===Object.prototype) {
    const v=value as Record<string,unknown>
    const keys=Object.keys(v).sort()
    if(keys.some(k=>v[k]===undefined)) throw new TypeError('Undefined property is forbidden')
    return '{'+keys.map(k=>JSON.stringify(k)+':'+canonicalJson(v[k])).join(',')+'}'
  }
  throw new TypeError('Unsupported value in canonical research record')
}
export function sha256Json(value:unknown):string {
  return createHash('sha256').update(canonicalJson(value),'utf8').digest('hex')
}

/** Bind an analysis to its exact source/claim/reviewer bytes, excluding the hash field itself.
 * This proves byte-identity of what a reviewer sealed; it is not authorship or permission. */
export function computeAnalysisInputHash(run: Omit<AnalysisRun,'inputHash'>): string {
  return sha256Json(run)
}

/** Fail closed on any ineligible records, preserving exact analysis associations. */
export function createReviewedSnapshot(input:SnapshotInput):ResearchPublication {
  if(!input.corpusHash?.trim() || !input.methodVersion?.trim()) throw new TypeError('corpusHash and methodVersion are required')
  if(!Array.isArray(input.runs)||!Array.isArray(input.candidates)||!Array.isArray(input.miracleClaims)) throw new TypeError('input records must be arrays')
  const ids=new Set<string>()
  const guard=(id:string)=>{if(!id?.trim()||ids.has(id))throw new TypeError('duplicated/blank derived ID');ids.add(id)}
  const reviewedAnalyses=[] as ResearchPublication['records']['reviewedAnalyses']
  const publicSummaries=[] as ResearchPublication['publicSummaries']
  for(const run of input.runs) {
    guard(run.id)
    if(run.corpusHash!==input.corpusHash||run.methodVersion!==input.methodVersion) throw new Error('analysis corpus/method snapshot mismatch')
    const {inputHash,...hashable}=run
    if(typeof inputHash !== 'string' || !/^[a-f0-9]{64}$/.test(inputHash) ||
       inputHash !== computeAnalysisInputHash(hashable)) throw new Error('analysis input hash mismatch')
    const check=validateAnalysisRun(run)
    if(!check.publishable) throw new Error('analysis is not publishable: '+check.errors.join('; '))
    reviewedAnalyses.push({id:run.id,passageId:run.passageId,reviewer:run.reviewer!,maturity:check.maturity.score,max:15})
    // Public five-stage trace is explicitly derived/reviewed, NEVER an original scripture lane.
    // Only a contiguous verified prefix can appear; no speculative later-stage promotion.
    const stages=['S1','R2','G3','B4','L5'].slice(0,
      check.maturity.verifiedLevel ? ['S1','R2','G3','B4','L5'].indexOf(check.maturity.verifiedLevel)+1 : 0)
    const levels=run.claims.filter(c=>c.status==='supported' && stages.includes(c.level))
      .map(c=>({level:c.level,epistemic:c.epistemic,claim:c.claim,
        evidenceIds:[...c.evidenceIds],sourceContentIds:[...c.sourceContentIds],
        ...(c.boundaryNote ? {boundaryNote:c.boundaryNote} : {})}))
    publicSummaries.push({id:run.id,passageId:run.passageId,method:run.method,status:'reviewed',levels})
  }
  const reviewedRelations=[] as ResearchPublication['records']['reviewedRelations']
  for(const item of input.candidates){
    guard(item.id)
    const review=summarizeCandidate(item)
    if(!review.publishable) throw new Error('candidate requires full independent review')
    reviewedRelations.push({id:item.id,method:item.relation.method,relation:item.relation.relation,reviewer:item.reviewer!})
  }
  const attributedClaims=[] as ResearchPublication['records']['attributedClaims']
  for(const item of input.miracleClaims){
    guard(item.id)
    if(item.reviewStatus!=='reviewed'||validateMiracleAttribution(item).length) throw new Error('miracle attribution requires reviewed, evidenced claimant')
    attributedClaims.push({id:item.id,targetPassageId:item.targetPassageId,tradition:item.tradition,method:item.method,claimant:item.claimant,reviewer:item.reviewer!})
  }
  reviewedAnalyses.sort((a,b)=>a.id.localeCompare(b.id))
  reviewedRelations.sort((a,b)=>a.id.localeCompare(b.id))
  attributedClaims.sort((a,b)=>a.id.localeCompare(b.id))
  publicSummaries.sort((a,b)=>a.id.localeCompare(b.id))
  // The seal covers the record sets, not the caller's array order: the same reviewed
  // records passed in a different order must produce the same input SHA.
  const sealed={corpusHash:input.corpusHash,methodVersion:input.methodVersion,
    runs:[...input.runs].sort((a,b)=>a.id.localeCompare(b.id)),
    candidates:[...input.candidates].sort((a,b)=>a.id.localeCompare(b.id)),
    miracleClaims:[...input.miracleClaims].sort((a,b)=>a.id.localeCompare(b.id))}
  const projection={schema:'srgbl-v8-reviewed-derived-v1' as const,corpusHash:input.corpusHash,
    methodVersion:input.methodVersion,inputSha256:sha256Json(sealed),
    authenticatedSignature:false as const,
    records:{reviewedAnalyses,reviewedRelations,attributedClaims},publicSummaries}
  return {...projection,projectionSha256:sha256Json(projection)}
}
