import type { WitnessSource, RightsStatus } from './analysis.js'

/** Minimal adapter to the existing /v1/passages/:id canonical detail response. */
export interface CorpusRecordLike {
  id: string
  record_type?: string
  text?: string
  language?: string
  representation?: string
  extensions?: Record<string, unknown>
  [key: string]: unknown
}
export interface CorpusPassageDetail {
  passage: CorpusRecordLike
  contents: CorpusRecordLike[]
  artifacts: CorpusRecordLike[]
  provenance: CorpusRecordLike[]
  evidence: CorpusRecordLike[]
  dataset?: Record<string, unknown> | null
}
export interface AdaptedPassage {
  passageId: string
  sources: WitnessSource[]
  evidenceIds: string[]
  gaps: string[]
  /** Even a valid passage is not automatically a reviewed SRGBL analysis. */
  defaultLevelStatus: 'pending'
}

const text = (v: unknown): string => typeof v === 'string' ? v : ''
function ref(source: CorpusRecordLike, kind: string): string {
  const root=source.extensions
  const s=root && typeof root.source === 'object' && root.source !== null ?
    root.source as Record<string, unknown> : {}
  return text(s[kind])
}
function kindOf(s: CorpusRecordLike): WitnessSource['representation'] {
  const x=text(s.representation).toLowerCase()
  if(['source_text','original','original_text','source','primary'].includes(x)) return 'source_text'
  if(x.includes('translat')) return 'translation'
  if(x.includes('variant')) return 'variant'
  if(x.includes('translit')) return 'transliteration'
  return 'other'
}
/**
 * A rights reviewer explicitly sets `rightsByContentId` only after checking
 * a concrete edition and permissions. Default is UNKNOWN (fail closed).
 * This adapter never guesses license from religion/age/dataset name.
 */
export function adaptPassageSources(detail: CorpusPassageDetail,
  rightsByContentId: Readonly<Record<string, RightsStatus>> = {}): AdaptedPassage {
  if (!detail?.passage?.id || !Array.isArray(detail.contents) ||
    !Array.isArray(detail.artifacts) || !Array.isArray(detail.provenance) ||
    !Array.isArray(detail.evidence)) throw new TypeError('Passage detail requires canonical passage and trace arrays')
  const artifacts = new Set(detail.artifacts.map(x=>x.id))
  const provenance = new Set(detail.provenance.map(x=>x.id))
  const gaps: string[] = []
  const sources: WitnessSource[] = detail.contents.map(c=>{
    const sourceId=text(c.source_id) || ref(c,'source')
    const editionId=text(c.edition_id) || ref(c,'edition')
    const artifactId=ref(c,'artifact')
    const provenanceId=ref(c,'provenance')
    const rights=rightsByContentId[c.id] || 'unknown'
    if(!editionId) gaps.push(c.id+':edition_unknown')
    if(!sourceId) gaps.push(c.id+':source_unknown')
    if(!artifactId || !artifacts.has(artifactId)) gaps.push(c.id+':artifact_unresolved')
    if(!provenanceId || !provenance.has(provenanceId)) gaps.push(c.id+':provenance_unresolved')
    if(rights!=='cleared') gaps.push(c.id+':rights_not_cleared')
    return {
      id:'srgbl:source:'+c.id, passageId:detail.passage.id, contentId:c.id,
      sourceId,editionId,artifactId,provenanceId,
      language:text(c.language)||'und',representation:kindOf(c),rights,
      ...(rights==='cleared' && typeof c.text==='string' ? {text:c.text} : {})
    }
  })
  if(!sources.length) gaps.push('no_content_witnesses')
  if(!detail.evidence.length) gaps.push('no_attached_evidence')
  return {
    passageId:detail.passage.id,sources,evidenceIds:detail.evidence.map(e=>e.id),
    gaps:[...new Set(gaps)].sort(),defaultLevelStatus:'pending'
  }
}
