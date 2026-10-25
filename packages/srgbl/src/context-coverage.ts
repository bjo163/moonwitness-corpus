import type { ResearchFrame, RightsStatus } from './analysis.js'

/**
 * P18-013: context coverage is a reading-readiness meter, never a judgement of
 * the text's content. The nine required fields are the ones a reader needs in
 * order to know what they are looking at, listed in `docs/PRODUCT-BLUEPRINT.md`
 * section 6.4 and `docs/KEY-WITNESS-V0.md` section 4.5.
 */
export const CONTEXT_COVERAGE_FIELDS = [
  'textualWitness','rights','genre','agent','recipient','domain','scope','key','evidence'
] as const
export type ContextCoverageField = (typeof CONTEXT_COVERAGE_FIELDS)[number]

export const REQUIRED_CONTEXT_FIELDS = CONTEXT_COVERAGE_FIELDS.length

export type ContextCard = {
  /** Field 1 needs both: an edition and the specific artifact behind the witness. */
  editionId?: string
  artifactId?: string
  /** Field 2. `unknown` is a question, not an answer, so it does not count. */
  rights?: RightsStatus
  frame?: ResearchFrame
  /** Field 8: at least one anchored key. */
  keyIds?: readonly string[]
  /** Field 9: evidence or provenance; either one is a traceable pointer. */
  evidenceIds?: readonly string[]
  provenanceIds?: readonly string[]
}

export type ContextCoverage = {
  required: number
  filled: number
  /** Present/expected as a fraction, kept exact rather than rounded to a grade. */
  ratio: number
  gaps: ContextCoverageField[]
  /** Reader-facing form, e.g. `7/9`. */
  display: string
  /** Coverage is a readiness meter and must never be read as a value judgement. */
  isTextQualityScore: false
}

const nonblank = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0
const hasEntry = (list: readonly string[] | undefined) => Array.isArray(list) && list.some(nonblank)

export function measureContextCoverage(card: ContextCard): ContextCoverage {
  const frame = card?.frame
  const present: Record<ContextCoverageField, boolean> = {
    // An edition without an artifact names a book but not the object, so both are needed.
    textualWitness: nonblank(card?.editionId) && nonblank(card?.artifactId),
    rights: card?.rights === 'cleared' || card?.rights === 'restricted',
    genre: nonblank(frame?.genre),
    agent: nonblank(frame?.agent),
    recipient: nonblank(frame?.recipient),
    domain: nonblank(frame?.domain),
    scope: nonblank(frame?.scope),
    key: hasEntry(card?.keyIds),
    evidence: hasEntry(card?.evidenceIds) || hasEntry(card?.provenanceIds)
  }
  // Gaps keep the canonical order so two runs of the same card agree.
  const gaps = CONTEXT_COVERAGE_FIELDS.filter(field => !present[field])
  const filled = REQUIRED_CONTEXT_FIELDS - gaps.length
  return {
    required: REQUIRED_CONTEXT_FIELDS,
    filled,
    ratio: filled / REQUIRED_CONTEXT_FIELDS,
    gaps,
    display: filled + '/' + REQUIRED_CONTEXT_FIELDS,
    isTextQualityScore: false
  }
}

/**
 * A card may store its coverage. The stored form is only honoured when it
 * matches a fresh measurement, so an edited field cannot inflate readiness.
 */
export function validateReportedContextCoverage(reported: string, card: ContextCard): string[] {
  const measured = measureContextCoverage(card)
  const errors: string[] = []
  if (typeof reported !== 'string' || !/^\d+\/\d+$/.test(reported.trim()))
    return ['reported context coverage ' + String(reported) + ' is not an x/9 form']
  const [numerator, denominator] = reported.trim().split('/')
  if (Number(denominator) !== REQUIRED_CONTEXT_FIELDS)
    errors.push('reported context coverage denominator ' + denominator + ' must be ' + REQUIRED_CONTEXT_FIELDS)
  if (Number(numerator) !== measured.filled)
    errors.push('reported context coverage ' + reported.trim() + ' does not match measured ' + measured.display +
      '; gaps: ' + (measured.gaps.join(',') || 'none'))
  return errors
}
