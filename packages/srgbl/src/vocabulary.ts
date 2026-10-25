import type { ReviewStatus } from './analysis.js'

/**
 * P18-002: one declaration point for every controlled vocabulary a key
 * assessment depends on. The validators import these lists instead of repeating
 * literals, so a value cannot be accepted by one check and rejected by another.
 *
 * This module imports nothing but a type, which keeps it usable from `keys.ts`
 * and `analysis.ts` without a cycle.
 */
export const FRAME_FIELDS = ['agent','recipient','domain','scope','genre'] as const
export const RELATION_VOCABULARY = [
  'expresses','commands','prohibits','promises','warns','narrates','praises',
  'condemns','comforts','questions','describes','covenants'
] as const
export const DIRECTION_VALUES = [-2,-1,0,1,2] as const
export const INTENSITY_VALUES = [1,2,3] as const
export const REVIEW_STATUS_VALUES: readonly ReviewStatus[] = ['draft','reviewed','disputed','deprecated']
export const REPRESENTATION_VALUES = ['source_text','translation','variant','transliteration','other'] as const
export const RIGHTS_STATUS_VALUES = ['cleared','restricted','unknown'] as const

export const CONTROLLED_VOCABULARIES = {
  frameField: FRAME_FIELDS,
  relation: RELATION_VOCABULARY,
  direction: DIRECTION_VALUES,
  intensity: INTENSITY_VALUES,
  reviewStatus: REVIEW_STATUS_VALUES,
  representation: REPRESENTATION_VALUES,
  rightsStatus: RIGHTS_STATUS_VALUES
} as const

export type VocabularyName = keyof typeof CONTROLLED_VOCABULARIES
export type VocabularyValue = string | number

/**
 * Empty means the value belongs to the vocabulary. A value that is missing is
 * reported as missing rather than as a member, so an absent field never reads
 * as a valid one.
 */
export function validateVocabularyEntry(name: VocabularyName, value: unknown): string[] {
  const vocabulary = CONTROLLED_VOCABULARIES[name]
  if (vocabulary === undefined) return ['unknown controlled vocabulary ' + String(name)]
  if (value === undefined || value === null || value === '') return [name + ' is missing']
  return (vocabulary as readonly VocabularyValue[]).includes(value as VocabularyValue)
    ? [] : [name + ' is not a controlled value: ' + String(value)]
}
