import { validateKeyAssessment, type FramedKeyAssessment } from './keys.js'

/**
 * P18-003: a key assessment is a profile extension of the core `assessment`
 * record, so it validates without adding a core record type, a core field or a
 * new profile id. Everything below describes the extension; nothing here may
 * widen `CORE_RECORD_TYPES` or `PROFILE_IDS`.
 */
export const KEY_ASSESSMENT_EXTENSION = {
  coreRecordType: 'assessment',
  profile: 'textual@0.1',
  /** Every field this extension stores, so an undeclared field is visible. */
  fields: [
    'id','passageId','contentId','method','assessor','reviewer','evidenceIds',
    'key','scheme','relation','frame','direction','intensity','confidence','weight','reviewStatus'
  ],
  producesNewCoreSchema: false,
  producesNewProfile: false
} as const

export type ExtensionEnvelope = {
  /** Optional wrapper fields; absent means the record is stored as a bare assessment. */
  recordType?: string
  profile?: string
}

export type KeyAssessmentExtensionResult = {
  valid: boolean
  errors: string[]
  coreRecordType: 'assessment'
  profile: 'textual@0.1'
  producesNewCoreSchema: false
}

export function validateKeyAssessmentExtension(
  record: FramedKeyAssessment & ExtensionEnvelope
): KeyAssessmentExtensionResult {
  const errors: string[] = []
  if (record?.recordType !== undefined && record.recordType !== KEY_ASSESSMENT_EXTENSION.coreRecordType)
    errors.push('key assessment must be a core assessment record, not ' + String(record.recordType))
  if (record?.profile !== undefined && record.profile !== KEY_ASSESSMENT_EXTENSION.profile)
    errors.push('key assessment profile must be ' + KEY_ASSESSMENT_EXTENSION.profile + ', not ' + String(record.profile))
  // An undeclared field would be a silent core-schema change, so it is rejected
  // instead of being stored under a name the core contract never agreed to.
  const declared = new Set<string>([...KEY_ASSESSMENT_EXTENSION.fields, 'recordType', 'profile'])
  for (const field of Object.keys(record ?? {}))
    if (!declared.has(field)) errors.push('undeclared extension field ' + field)
  errors.push(...validateKeyAssessment(record))
  return {
    valid: errors.length === 0,
    errors,
    coreRecordType: 'assessment',
    profile: 'textual@0.1',
    producesNewCoreSchema: false
  }
}
