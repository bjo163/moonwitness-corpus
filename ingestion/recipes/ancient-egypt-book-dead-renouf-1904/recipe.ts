import type { CorpusRecord } from '@moonwitness/corpus-core'
import type { RecipeHooks } from '@moonwitness/corpus-ingestion'
import { assertRenoufSourceIdentity, parseRenoufBookOfTheDead } from '@moonwitness/corpus-ingestion'

const WORK = 'mw:work:ancient-egyptian:book-dead-renouf-1904'
const EXPRESSION = 'mw:expression:ancient-egyptian:book-dead:renouf-1904'
const EDITION = 'mw:edition:ancient-egyptian:book-dead:renouf-1904'
const ARTIFACT = 'mw:artifact:ancient-egyptian:book-dead:renouf-1904'
const PROVENANCE = 'mw:provenance:ancient-egyptian:book-dead-renouf-1904'

export type ParsedRenouf = ReturnType<typeof parseRenoufBookOfTheDead>

export const hooks: RecipeHooks<ParsedRenouf, ParsedRenouf> = {
  parse(bytes) {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
    assertRenoufSourceIdentity(text)
    return parseRenoufBookOfTheDead(text)
  },
  normalize(parsed) {
    return parsed
  },
  map(parsed, context) {
    const records: CorpusRecord[] = [
      { id: WORK, record_type: 'resource', kind: 'textual.work', labels: [{ value: 'The Egyptian Book of the Dead', role: 'preferred', language: 'en', script: 'Latn' }], extensions: { textual: { work_type: 'religious_text' } } },
      { id: EXPRESSION, record_type: 'resource', kind: 'textual.expression', description: 'Translation and commentary by P. Le Page Renouf, continued and completed by Edouard Naville; 1904 edition.', extensions: { textual: { work: WORK, language: 'en', script: 'Latn' } } },
      { id: EDITION, record_type: 'resource', kind: 'textual.edition', extensions: { textual: { expressions: [EXPRESSION], edition_statement: 'The Egyptian Book of the Dead — Renouf / Naville, 1904' } } },
      { id: ARTIFACT, record_type: 'resource', kind: 'textual.artifact', labels: [{ value: 'Project Gutenberg #69566', role: 'preferred', language: 'en' }], extensions: { textual: { represents: EDITION, representation_kind: 'plain_text', media_type: 'text/plain' }, source: { title: 'The Egyptian Book of the dead', canonical_url: 'https://www.gutenberg.org/ebooks/69566', identifiers: [{ scheme: 'gutenberg', value: '69566', uri: 'https://www.gutenberg.org/ebooks/69566' }], language: 'en', revision: 'eBook #69566', descriptor: { availability: 'external', locations: ['https://www.gutenberg.org/cache/epub/69566/pg69566.txt'], media_type: 'text/plain', byte_size: context.acquisition.source.byte_size, sha256: context.acquisition.sha256 }, rights: { status: 'public_domain', redistribution: 'unknown', attribution: 'P. Le Page Renouf / Edouard Naville / Project Gutenberg', rights_uri: 'https://www.gutenberg.org/ebooks/69566', note: 'Project Gutenberg identifies this edition as public domain in the USA; redistribution status outside the USA requires separate verification.' } } } },
      { id: PROVENANCE, record_type: 'provenance', source: ARTIFACT, source_reference: `Project Gutenberg eBook #69566; source SHA-256 ${parsed.sourceSha256}`, activities: [{ type: 'acquisition', method: 'HTTP download of pinned plain-text edition with source identity and payload checks', software: { name: 'mw:recipe:ancient-egyptian:book-dead-renouf-1904', version: '2' } }, { type: 'parsing', method: `Parse centered printed CHAPTER/CHAPTERS headings, exclude ${parsed.captionCount} structural plate/illustration captions, merge page-continued sections, and preserve chapter bodies`, software: { name: 'mw:recipe:ancient-egyptian:book-dead-renouf-1904', version: '2' } }] }
    ]
    for (const chapter of parsed.chapters) {
      const passage = `mw:passage:ancient-egyptian:book-dead-renouf:${chapter.localId}`
      const content = `mw:content:ancient-egyptian:book-dead-renouf:${chapter.localId}:en`
      records.push({ id: passage, record_type: 'resource', kind: 'textual.passage', labels: [{ value: chapter.title, role: 'preferred', language: 'en', script: 'Latn' }], extensions: { textual: { container: EXPRESSION, unit: 'chapter', sequence: chapter.sequence, local_id: chapter.localId } } } as CorpusRecord)
      records.push({ id: content, record_type: 'resource', kind: 'textual.content', extensions: { textual: { target: passage, language: 'en', script: 'Latn', representation: 'source', text: chapter.text }, source: { artifact: ARTIFACT, provenance: PROVENANCE } } } as CorpusRecord)
    }
    return records
  },
  validate(records) {
    const passages = records.filter(record => record.kind === 'textual.passage')
    const contents = records.filter(record => record.kind === 'textual.content')
    const findings: string[] = []
    if (passages.length < 100) findings.push(`Expected at least 100 chapters, received ${passages.length}`)
    if (contents.length !== passages.length) findings.push('Chapter/content cardinality mismatch')
    if (new Set(records.map(record => record.id)).size !== records.length) findings.push('Duplicate record IDs')
    const localIds = passages.map(record => (record.extensions?.textual as Record<string, unknown> | undefined)?.local_id)
    if (new Set(localIds).size !== localIds.length) findings.push('Duplicate chapter local identifiers')
    return findings
  }
}
