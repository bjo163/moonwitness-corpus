import type { ResearchPublication } from './derived.js'
import { verifyReviewedPublication } from './publication.js'

export interface StaticResearchPublication {
  schema: 'srgbl-v8-static-public-v1'
  corpusHash: string
  methodVersion: string
  /** Public claims and exact evidence/source pointers only; no reviewer or score records. */
  analyses: ResearchPublication['publicSummaries']
}

/** Build the static/browser data plane from the same fail-closed publication gate as the API. */
export function createStaticResearchPublication(
  value: unknown,
  expectedCorpusHash: string
): StaticResearchPublication {
  const publication = verifyReviewedPublication(value, expectedCorpusHash)
  return {
    schema: 'srgbl-v8-static-public-v1',
    corpusHash: publication.corpusHash,
    methodVersion: publication.methodVersion,
    analyses: publication.publicSummaries
  }
}
