import { validateKeyMessage, type FramedKeyAssessment, type KeyMessage } from './keys.js'
import type { ResearchFrame, ReviewStatus } from './analysis.js'

/**
 * P18-004: a key message is derived editorial text, never scripture. The
 * contract below keeps the three things a reader needs separable: the message
 * itself, the boundary that limits it, and the context that qualifies it — all
 * traceable to the key assessments they came from.
 */
export type MessageProvenance = {
  readonly derived: true
  readonly textIsOriginalScripture: false
  readonly passageId: string
  readonly method: string
  readonly frame: ResearchFrame
  readonly sourceKeyAssessmentIds: readonly string[]
  readonly evidenceIds: readonly string[]
  readonly reviewStatus: ReviewStatus
  readonly reviewer: string | null
}

const nonblank = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0
const sameText = (a: unknown, b: unknown) =>
  typeof a === 'string' && typeof b === 'string' && a.trim() === b.trim()

/**
 * `null` means no provenance can be stated — not that the message came from
 * nowhere. A message with no cited key has nothing to trace.
 */
export function messageProvenance(message: KeyMessage): MessageProvenance | null {
  if (!message || !Array.isArray(message.sourceKeyAssessmentIds) || message.sourceKeyAssessmentIds.length === 0) return null
  if (!nonblank(message.id) || !nonblank(message.passageId) || !nonblank(message.method)) return null
  return Object.freeze({
    derived: true as const,
    textIsOriginalScripture: false as const,
    passageId: message.passageId,
    method: message.method,
    frame: Object.freeze({...message.frame}),
    sourceKeyAssessmentIds: Object.freeze([...message.sourceKeyAssessmentIds]),
    evidenceIds: Object.freeze([...(message.evidenceIds ?? [])]),
    reviewStatus: message.reviewStatus,
    reviewer: nonblank(message.reviewer) ? message.reviewer : null
  })
}

export function validateDerivedMessage(message: KeyMessage, keys: readonly FramedKeyAssessment[]): string[] {
  const errors = validateKeyMessage(message, keys)
  // A boundary or context note that repeats the message adds nothing and hides
  // where the reading stops, so both must say something else.
  if (sameText(message?.boundaryNote, message?.message))
    errors.push('boundary note must describe the limit, not restate the message')
  if (sameText(message?.contextNote, message?.message))
    errors.push('context note must describe the setting, not restate the message')
  if (sameText(message?.boundaryNote, message?.contextNote))
    errors.push('boundary note and context note must stay distinguishable')
  if (messageProvenance(message) === null) errors.push('derived message must carry provenance from cited key assessments')
  return errors
}
