import type { ResearchPublication } from './derived.js'
import { verifyReviewedPublication } from './publication.js'

export interface StaticResearchPublication {
  schema: 'srgbl-v8-static-public-v1'
  /** True only when the file matched the catalog it is served next to. */
  available: true
  corpusHash: string
  methodVersion: string
  /** Public claims and exact evidence/source pointers only; no reviewer or score records. */
  analyses: ResearchPublication['publicSummaries']
}

export interface StaticResearchUnavailable {
  schema: 'srgbl-v8-static-public-v1'
  available: false
  reason: string
  corpusHash: null
  methodVersion: null
  /** An explicit unavailable state has no claims: it must never borrow another corpus. */
  analyses: []
}

/** Build the static/browser data plane from the same fail-closed publication gate as the API. */
export function createStaticResearchPublication(
  value: unknown,
  expectedCorpusHash: string
): StaticResearchPublication {
  const publication = verifyReviewedPublication(value, expectedCorpusHash)
  // Deterministic output: the page renders passage order regardless of materialization order.
  const analyses = publication.publicSummaries
    .map(item => ({...item, levels: item.levels.map(level => ({...level,
      evidenceIds: [...level.evidenceIds], sourceContentIds: [...level.sourceContentIds]}))}))
    .sort((a, b) => a.passageId.localeCompare(b.passageId) || a.id.localeCompare(b.id))
  return {
    schema: 'srgbl-v8-static-public-v1',
    available: true,
    corpusHash: publication.corpusHash,
    methodVersion: publication.methodVersion,
    analyses
  }
}

/** The explicit state for a static export that is missing, corrupt or pinned to another corpus. */
export function staticResearchUnavailable(reason: string): StaticResearchUnavailable {
  if (!reason.trim()) throw new TypeError('An unavailable static projection needs a stated reason')
  return {schema: 'srgbl-v8-static-public-v1', available: false, reason,
    corpusHash: null, methodVersion: null, analyses: []}
}
