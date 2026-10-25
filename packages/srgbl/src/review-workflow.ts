import { REVIEW_STATUS_VALUES } from './vocabulary.js'
import type { ReviewStatus } from './analysis.js'

/**
 * P18-017: the review lifecycle is a stated machine, not a vibes progression.
 * `deprecated` is terminal and nothing promotes itself: a status only changes
 * through an explicit, attributable event.
 */
export const REVIEW_TRANSITIONS: Readonly<Record<ReviewStatus, readonly ReviewStatus[]>> = {
  draft: ['reviewed','disputed','deprecated'],
  reviewed: ['disputed','deprecated'],
  disputed: ['reviewed','deprecated'],
  deprecated: []
}

export type ReviewEvent = {
  id: string
  subjectId: string
  from: ReviewStatus
  to: ReviewStatus
  /** ISO-8601 instant, supplied by the caller; never inferred from a PR or commit. */
  at: string
  actor: string
  reason: string
  evidenceIds: string[]
  previousEventId: string | null
}

const nonblank = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0

export function validateReviewTransition(from: ReviewStatus, to: ReviewStatus): string[] {
  if (!REVIEW_STATUS_VALUES.includes(from)) return ['invalid review status: ' + String(from)]
  if (!REVIEW_STATUS_VALUES.includes(to)) return ['invalid review status: ' + String(to)]
  if (REVIEW_TRANSITIONS[from].includes(to)) return []
  return ['illegal review transition ' + from + ' -> ' + to + '; allowed: ' +
    (REVIEW_TRANSITIONS[from].length ? REVIEW_TRANSITIONS[from].join(',') : 'none (terminal)')]
}

export function validateReviewEvent(event: ReviewEvent): string[] {
  const errors = validateReviewTransition(event?.from, event?.to)
  for (const field of ['id','subjectId','at','actor','reason'] as const)
    if (!nonblank(event?.[field])) errors.push('review event ' + field + ' required')
  if (nonblank(event?.at) && Number.isNaN(Date.parse(event.at))) errors.push('review event at is not an ISO-8601 instant')
  if (nonblank(event?.actor) && !event.actor.startsWith('mw:')) errors.push('review actor must be a canonical mw: principal')
  // An automated principal cannot review: promotion is a human claim.
  if (event?.actor === 'mw:agent:system' || event?.actor === 'mw:agent:automation')
    errors.push('review actor may not be an automated principal')
  // An empty evidence list is not an evidence-backed review.
  if (!Array.isArray(event?.evidenceIds) || event.evidenceIds.length === 0 || event.evidenceIds.some(x => !nonblank(x)))
    errors.push('review event evidence required')
  if (event?.to === 'reviewed' && (!nonblank(event?.actor) || !nonblank(event?.reason) || !event?.evidenceIds?.length))
    errors.push('promotion to reviewed needs actor, reason and evidence')
  if (event?.to === 'disputed' && !nonblank(event?.reason)) errors.push('a dispute needs a stated reason')
  return errors
}

export type ReviewHistory = {
  subjectId: string | null
  status: ReviewStatus
  audit: ReviewEvent[]
  errors: string[]
  /** A record cannot be reviewed on the strength of existing. */
  reviewed: boolean
}

/**
 * Replays the event chain in order. A missing link, a re-used id, a backwards
 * timestamp or a from-state that does not match the current status all stop the
 * replay, because a partially trusted audit trail is not an audit trail.
 */
export function replayReviewHistory(events: readonly ReviewEvent[]): ReviewHistory {
  const audit: ReviewEvent[] = []
  const errors: string[] = []
  const ids = new Set<string>()
  let status: ReviewStatus = 'draft'
  let subjectId: string | null = null
  let previous: string | null = null
  let lastTime = Number.NEGATIVE_INFINITY
  for (const [index, event] of (events ?? []).entries()) {
    const eventErrors = validateReviewEvent(event)
    if (ids.has(event.id)) eventErrors.push('duplicate review event id ' + event.id)
    ids.add(event.id)
    if (subjectId !== null && event.subjectId !== subjectId) eventErrors.push('review history mixes subjects')
    if (subjectId === null && nonblank(event.subjectId)) subjectId = event.subjectId
    // Number() cannot read an ISO date; an unparseable instant stays NaN and is
    // already reported by the event validator.
    const position = Date.parse(event.at)
    if (position < lastTime) eventErrors.push('review events must be ordered by time')
    if (event.previousEventId !== previous) eventErrors.push('broken audit chain at event ' + (index + 1))
    if (event.from !== status) eventErrors.push('review event from ' + event.from + ' does not match current status ' + status)
    if (status === 'deprecated') eventErrors.push('deprecated is terminal; no further transition is recorded')
    if (eventErrors.length) {
      errors.push(...eventErrors.map(error => 'event[' + index + '] ' + error))
      continue
    }
    lastTime = position
    previous = event.id
    status = event.to
    audit.push({...event, evidenceIds: [...event.evidenceIds]})
  }
  return {subjectId, status, audit, errors, reviewed: status === 'reviewed'}
}

/**
 * A stored record may claim a status. The claim is only honoured when the
 * history actually reaches it, so an edited field cannot fake a review.
 */
export function validateClaimedReviewStatus(claimed: ReviewStatus, events: readonly ReviewEvent[]): string[] {
  const history = replayReviewHistory(events)
  if (history.errors.length) return history.errors
  // A claim only holds if the chain actually reaches it, so an empty history can
  // never support 'reviewed' - it stops at 'draft'.
  if (claimed !== history.status)
    return ['claimed review status ' + claimed + ' does not match audited status ' + history.status]
  return []
}
