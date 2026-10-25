import { evaluateFramedKeys, type FramedDirectionBundle } from './keys.js'
import type { ResearchFrame } from './analysis.js'

/**
 * P18-014: the v0 score profile is a research instrument. It reports a number
 * only together with its coverage, its `n` and its agreement, and it is never a
 * property of a verse, a tradition or a religion.
 */
export const RESEARCH_SCORE_PROFILES = ['key-direction:v0'] as const
export type ResearchScoreProfile = (typeof RESEARCH_SCORE_PROFILES)[number]

/** The only scopes a profile may be computed at. Broader scopes are rankings. */
export const SCORE_PROFILE_SCOPES = ['passage','passage-frame'] as const
export type ScoreProfileScope = (typeof SCORE_PROFILE_SCOPES)[number]

export type ScoreProfileInput = FramedDirectionBundle & {
  profileId?: string
  scope?: ScoreProfileScope
  publicationSurface?: 'research' | 'public'
}

export type ScoreProfile = {
  profileId: string
  method: string
  scope: ScoreProfileScope
  frame: ResearchFrame
  direction: number | null
  coverage: number | null
  n: number
  uniqueKeyCount: number
  agreement: number | null
  reviewerCount: number
  /** Why a number is absent or weak, stated rather than smoothed over. */
  missing: string[]
  displayable: boolean
  publicationSurface: 'research' | 'public'
  isGlobalScriptureScore: false
  errors: string[]
}

const nonblank = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0

export function computeScoreProfile(input: ScoreProfileInput): ScoreProfile {
  const errors: string[] = []
  const profileId = nonblank(input?.profileId) ? input.profileId : 'key-direction:v0'
  if (!(RESEARCH_SCORE_PROFILES as readonly string[]).includes(profileId))
    errors.push('unknown research score profile ' + String(profileId))
  const scope = input?.scope ?? 'passage-frame'
  if (!(SCORE_PROFILE_SCOPES as readonly string[]).includes(scope))
    errors.push('score profile scope ' + String(scope) + ' would aggregate beyond one passage; allowed: ' + SCORE_PROFILE_SCOPES.join(','))
  const surface = input?.publicationSurface ?? 'research'
  if (surface !== 'research') errors.push('the v0 score profile is research-only and may not be published')

  const scored = evaluateFramedKeys(input)
  errors.push(...scored.errors)
  const missing: string[] = []
  if (input.agreement === null) missing.push('agreement:not-measured')
  if (!input.reviewerCount) missing.push('reviewers:none')
  if (scored.coverage === null) missing.push('coverage:uncomputable')
  else if (scored.coverage < 1) missing.push('coverage:' + scored.uniqueKeyCount + '/' + input.expectedKeyCount)
  if (!scored.n) missing.push('assessments:none')
  if (errors.length) missing.push('profile:invalid')

  // A failed profile reports null, never a neutral midpoint that reads as 0.
  const direction = errors.length ? null : scored.direction?.value ?? null
  return {
    profileId,
    method: input.method,
    scope,
    frame: input.frame,
    direction,
    coverage: errors.length ? null : scored.coverage,
    n: input.assessments.length,
    uniqueKeyCount: scored.uniqueKeyCount,
    agreement: input.agreement,
    reviewerCount: input.reviewerCount,
    missing,
    // Displayable means the number may be shown with its caveats: a real
    // direction, a measured agreement and at least one human reviewer behind it.
    displayable: errors.length === 0 && direction !== null && input.agreement !== null && input.reviewerCount > 0,
    publicationSurface: surface,
    isGlobalScriptureScore: false,
    errors
  }
}
