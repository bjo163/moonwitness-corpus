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

/**
 * Read-only view of the canonical source/edition registry (config/sources.json
 * and config/editions.json). The caller supplies already-loaded records; this
 * module never creates a second database layer and never infers existence from
 * a nonblank identifier.
 */
export interface CanonicalSourceRecord { id: string }
export interface CanonicalEditionRecord { id: string; sourceId?: string; source?: string }
export interface SourceCatalog {
  sources: readonly CanonicalSourceRecord[]
  editions: readonly CanonicalEditionRecord[]
}

export type SourceResolutionGap =
  | 'source_unresolved'
  | 'edition_unresolved'
  | 'edition_source_mismatch'
  | 'source_resolution_unavailable'

export interface SourceResolution {
  resolved: boolean
  /** null only when a real lookup proved source and edition exist and agree. */
  gap: SourceResolutionGap | null
}

/**
 * Resolves a content pointer pair against canonical records. Failure is an
 * explicit gap, never a silent success; without a catalog nothing is proven.
 */
export function resolveSourceReference(sourceId: string, editionId: string,
  catalog?: SourceCatalog | null): SourceResolution {
  if (!catalog || !Array.isArray(catalog.sources) || !Array.isArray(catalog.editions)) {
    return { resolved: false, gap: 'source_resolution_unavailable' }
  }
  const source = catalog.sources.find(item => item?.id === sourceId)
  if (!source) return { resolved: false, gap: 'source_unresolved' }
  if (!editionId.trim()) return { resolved: true, gap: null }
  const edition = catalog.editions.find(item => item?.id === editionId)
  if (!edition) return { resolved: false, gap: 'edition_unresolved' }
  const owner = text(edition.sourceId) || text(edition.source)
  if (owner && owner !== sourceId) return { resolved: false, gap: 'edition_source_mismatch' }
  return { resolved: true, gap: null }
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
 * A rights *claim* is not a licence. 'cleared' is only honoured when an
 * independently verified rights record covers this edition; a bare string or
 * an unattested claim can never expose licensed text.
 */
export interface RightsAttestation {
  status: RightsStatus
  /** Identifier of the verified permission record, never free-text approval. */
  rightsRecordId?: string
  /** Edition the permission actually covers. */
  editionId?: string
}
export type RightsInput = Readonly<Record<string, RightsStatus | RightsAttestation>>

function resolveRights(entry: RightsStatus | RightsAttestation | undefined,
  editionId: string, contentId: string, gaps: string[]): RightsStatus {
  if (!entry) return 'unknown'
  const status = typeof entry === 'string' ? entry : entry.status
  if (status === 'restricted') return 'restricted'
  if (status !== 'cleared') return 'unknown'
  const attestation = typeof entry === 'string' ? null : entry
  if (!attestation || !text(attestation.rightsRecordId).trim()) {
    gaps.push(contentId + ':rights_claim_unattested')
    return 'unknown'
  }
  if (text(attestation.editionId).trim() && attestation.editionId !== editionId) {
    gaps.push(contentId + ':rights_edition_mismatch')
    return 'unknown'
  }
  return 'cleared'
}

/**
 * A rights reviewer supplies a verified attestation only after checking a
 * concrete edition and permissions. Default is UNKNOWN (fail closed).
 * This adapter never guesses license from religion/age/dataset name.
 */
export function adaptPassageSources(detail: CorpusPassageDetail,
  rightsByContentId: RightsInput = {},
  catalog?: SourceCatalog | null): AdaptedPassage {
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
    const rights=resolveRights(rightsByContentId[c.id], editionId, c.id, gaps)
    if(!editionId) gaps.push(c.id+':edition_unknown')
    if(!sourceId) gaps.push(c.id+':source_unknown')
    if(!artifactId || !artifacts.has(artifactId)) gaps.push(c.id+':artifact_unresolved')
    if(!provenanceId || !provenance.has(provenanceId)) gaps.push(c.id+':provenance_unresolved')
    // A nonblank pointer is not proof: require a canonical lookup result.
    if(sourceId || editionId){
      const resolution = resolveSourceReference(sourceId, editionId, catalog)
      if(!resolution.resolved && resolution.gap) gaps.push(c.id+':'+resolution.gap)
    }
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
