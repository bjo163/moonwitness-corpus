import { sha256Json, type ResearchPublication } from './derived.js'
import { SRGBL_LEVELS, SRGBL_RELATION_TYPES } from './index.js'

/** Validates a materialized, review-only research projection before any API use.
 * A checksum detects accidental drift, not forgery; authorization still comes
 * from the controlled build/reviewer workflow, not from this method. */
export function verifyReviewedPublication(value: unknown, expectedCorpusHash: string): ResearchPublication {
  const fail = (reason: string): never => { throw new Error('invalid reviewed SRGBL publication: ' + reason) }
  if (typeof expectedCorpusHash !== 'string' || !/^[a-f0-9]{64}$/.test(expectedCorpusHash)) fail('untrusted corpus identity')
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('missing object')
  const o = value as Record<string, unknown>
  /** A projection is a closed structure: an unexpected field is a defect, not an extension. */
  const exact = (record: Record<string, unknown>, allowed: readonly string[], what: string) => {
    for (const key of Object.keys(record)) if (!allowed.includes(key)) fail('unknown field in ' + what + ': ' + key)
  }
  exact(o, ['schema','corpusHash','methodVersion','inputSha256','authenticatedSignature',
    'projectionSha256','records','publicSummaries'], 'reviewed projection')
  if (o.schema !== 'srgbl-v8-reviewed-derived-v1') fail('schema mismatch')
  if (o.corpusHash !== expectedCorpusHash) fail('corpus hash mismatch')
  if (typeof o.methodVersion !== 'string' || !o.methodVersion.trim()) fail('method missing')
  if (typeof o.inputSha256 !== 'string' || !/^[a-f0-9]{64}$/.test(o.inputSha256)) fail('input checksum missing')
  if (typeof o.projectionSha256 !== 'string' || !/^[a-f0-9]{64}$/.test(o.projectionSha256)) fail('projection checksum missing')
  if (o.authenticatedSignature !== false) fail('a content checksum is not an authenticated signature')
  const { projectionSha256, ...projection } = o
  if (sha256Json(projection) !== projectionSha256) fail('projection has changed')
  if (!o.records || typeof o.records !== 'object' || Array.isArray(o.records)) fail('records missing')
  const records = o.records as Record<string, unknown>
  exact(records, ['reviewedAnalyses','reviewedRelations','attributedClaims'], 'reviewed records')
  if (!Array.isArray(records.reviewedAnalyses) || !Array.isArray(records.reviewedRelations) ||
      !Array.isArray(records.attributedClaims) || !Array.isArray(o.publicSummaries)) fail('reviewed arrays missing')
  const reviewedAnalyses = records.reviewedAnalyses as unknown[]
  const publicSummaries = o.publicSummaries as unknown[]
  if (publicSummaries.length > 10000 || reviewedAnalyses.length > 10000) fail('too many records')
  const text = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0
  const analyses = new Map<string, {passageId:string; maturity:number}>()
  const derivedIds = new Set<string>()
  for (const raw of reviewedAnalyses) {
    if (!raw || typeof raw !== 'object') fail('invalid reviewed analysis')
    const a = raw as Record<string, unknown>
    exact(a, ['id','passageId','reviewer','maturity','max'], 'reviewed analysis')
    if (!text(a.id) || !text(a.passageId) || !text(a.reviewer) ||
       !Number.isInteger(a.maturity) || ![1,3,6,10,15].includes(a.maturity as number) ||
       a.max !== 15 || analyses.has(a.id as string)) fail('bad or duplicate reviewed analysis')
    derivedIds.add(a.id as string)
    analyses.set(a.id as string, {passageId:a.passageId as string,maturity:a.maturity as number})
  }
  // Relations and attributed claims carry their own reviewer, id and relation kind:
  // a valid recomputed checksum must never paper over a blank or unsupported entry.
  const reviewedRelations = records.reviewedRelations as unknown[]
  const attributedClaims = records.attributedClaims as unknown[]
  if (reviewedRelations.length > 10000 || attributedClaims.length > 10000) fail('too many records')
  for (const raw of reviewedRelations) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) fail('invalid reviewed relation')
    const r = raw as Record<string, unknown>
    exact(r, ['id','method','relation','reviewer'], 'reviewed relation')
    if (!text(r.id) || !text(r.method) || !text(r.reviewer) ||
       !(SRGBL_RELATION_TYPES as readonly string[]).includes(r.relation as string)) fail('bad or unsupported reviewed relation')
    if (derivedIds.has(r.id as string)) fail('duplicate derived ID')
    derivedIds.add(r.id as string)
  }
  for (const raw of attributedClaims) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) fail('invalid attributed claim')
    const c = raw as Record<string, unknown>
    exact(c, ['id','targetPassageId','tradition','method','claimant','reviewer'], 'attributed claim')
    if (!text(c.id) || !text(c.targetPassageId) || !(c.targetPassageId as string).startsWith('mw:passage:') ||
       !text(c.tradition) || !text(c.method) || !text(c.claimant) || !text(c.reviewer)) fail('bad attributed claim')
    if (derivedIds.has(c.id as string)) fail('duplicate derived ID')
    derivedIds.add(c.id as string)
  }
  const seen = new Set<string>()
  for (const raw of publicSummaries) {
    if (!raw || typeof raw !== 'object') fail('invalid public summary')
    const s = raw as Record<string, unknown>
    exact(s, ['id','passageId','method','status','levels'], 'public summary')
    if (!text(s.id) || seen.has(s.id) || !text(s.passageId) ||
        !(s.passageId as string).startsWith('mw:passage:') ||
        !text(s.method) || s.status !== 'reviewed' || !Array.isArray(s.levels)) fail('bad public summary')
    const summaryId = s.id as string
    const passageId = s.passageId as string
    seen.add(summaryId)
    const a = analyses.get(summaryId)
    if (a === undefined || a.passageId !== passageId) fail('orphan public summary')
    const analysis = a as {passageId:string;maturity:number}
    const stageCount = {1:1,3:2,6:3,10:4,15:5}[analysis.maturity as 1|3|6|10|15]
    if (!stageCount) fail('invalid level count')
    const represented = new Set<string>()
    for (const rawClaim of s.levels as unknown[]) {
      if (!rawClaim || typeof rawClaim !== 'object') fail('bad level claim')
      const c = rawClaim as Record<string, unknown>
      exact(c, ['level','epistemic','claim','evidenceIds','sourceContentIds','boundaryNote'], 'public level')
      if (!SRGBL_LEVELS.slice(0,stageCount).includes(c.level as typeof SRGBL_LEVELS[number]) ||
         !['observed','inferred','interpreted'].includes(c.epistemic as string) ||
         !text(c.claim) || (c.claim as string).length > 5000 ||
         !Array.isArray(c.evidenceIds) || !c.evidenceIds.length ||
         !Array.isArray(c.sourceContentIds) || !c.sourceContentIds.length ||
         !(c.evidenceIds as unknown[]).every(text) ||
         !(c.sourceContentIds as unknown[]).every(text) ||
         (c.level === 'L5' && !text(c.boundaryNote))) fail('unsupported or untraceable public level')
      represented.add(c.level as string)
    }
    if (represented.size !== stageCount) fail('missing stage in published reviewed trace')
    // A verified prefix is ordered: shuffled stages are not the same reviewed trace.
    if ([...represented].join(',') !== SRGBL_LEVELS.slice(0,stageCount).join(',')) fail('reviewed stages are out of order')
  }
  if (seen.size !== analyses.size) fail('review-only analysis without matching public summary')
  return value as ResearchPublication
}
