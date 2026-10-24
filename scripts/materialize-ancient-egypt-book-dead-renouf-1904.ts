import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import {
  assertRenoufSourceIdentity,
  deterministicJsonl,
  parseRenoufBookOfTheDead
} from '@moonwitness/corpus-ingestion'
import type { CorpusRecord } from '@moonwitness/corpus-core'

const ROOT = process.cwd()
const URL = 'https://www.gutenberg.org/cache/epub/69566/pg69566.txt'
const DATASET = 'datasets/ancient-egypt-book-dead-renouf'
const CORE = path.join(ROOT, DATASET, 'data/core')
const WORK = 'mw:work:ancient-egyptian:book-dead-renouf-1904'
const EXPRESSION = 'mw:expression:ancient-egyptian:book-dead:renouf-1904'
const EDITION = 'mw:edition:ancient-egyptian:book-dead:renouf-1904'
const ARTIFACT = 'mw:artifact:ancient-egyptian:book-dead:renouf-1904'
const PROVENANCE = 'mw:provenance:ancient-egyptian:book-dead-renouf-1904'
const sha256 = (value: string) => createHash('sha256').update(value, 'utf8').digest('hex')

async function main(): Promise<void> {
  const response = await fetch(URL, { headers: { accept: 'text/plain' } })
  if (!response.ok) throw new Error(`Gutenberg download failed: ${response.status} ${response.statusText}`)
  const contentType = response.headers.get('content-type') ?? ''
  const text = await response.text()
  if (!contentType.toLowerCase().includes('text/plain')) throw new Error(`Unexpected content-type: ${contentType}`)
  const sourceHash = assertRenoufSourceIdentity(text)
  const { chapters, captionCount } = parseRenoufBookOfTheDead(text)
  const records: CorpusRecord[] = [
    { id: WORK, record_type: 'resource', kind: 'textual.work', labels: [{ value: 'The Egyptian Book of the Dead', role: 'preferred', language: 'en', script: 'Latn' }], extensions: { textual: { work_type: 'religious_text' } } },
    { id: EXPRESSION, record_type: 'resource', kind: 'textual.expression', description: 'Translation by P. Le Page Renouf, continued and completed by Edouard Naville; original publication 1904.', extensions: { textual: { work: WORK, language: 'en', script: 'Latn' } } },
    { id: EDITION, record_type: 'resource', kind: 'textual.edition', extensions: { textual: { expressions: [EXPRESSION], edition_statement: 'The Egyptian Book of the Dead — Renouf / Naville, 1904' } } },
    { id: ARTIFACT, record_type: 'resource', kind: 'textual.artifact', labels: [{ value: 'Project Gutenberg #69566', role: 'preferred', language: 'en' }], extensions: { textual: { represents: EDITION, representation_kind: 'plain_text', media_type: 'text/plain' }, source: { title: 'The Egyptian Book of the dead', canonical_url: 'https://www.gutenberg.org/ebooks/69566', identifiers: [{ scheme: 'gutenberg', value: '69566', uri: 'https://www.gutenberg.org/ebooks/69566' }], language: 'en', revision: 'eBook #69566', descriptor: { availability: 'external', locations: [URL], media_type: 'text/plain', byte_size: Buffer.byteLength(text), sha256: sourceHash }, rights: { status: 'public_domain', redistribution: 'unknown', attribution: 'P. Le Page Renouf / Edouard Naville / Project Gutenberg', rights_uri: 'https://www.gutenberg.org/ebooks/69566', note: 'Project Gutenberg identifies this edition as public domain in the USA; redistribution status outside the USA requires separate verification.' } } } },
    { id: PROVENANCE, record_type: 'provenance', source: ARTIFACT, source_reference: `Project Gutenberg #69566; source SHA-256 ${sourceHash}`, activities: [{ type: 'acquisition', method: 'Fetch pinned Project Gutenberg plain text and validate identity/content type', software: { name: 'scripts/materialize-ancient-egypt-book-dead-renouf-1904.ts', version: '4' } }, { type: 'parsing', method: `Parse centered printed CHAPTER/CHAPTERS headings, exclude plate and illustration captions structurally (${captionCount} captions excluded), merge page-continued sections, and preserve chapter bodies`, software: { name: 'scripts/materialize-ancient-egypt-book-dead-renouf-1904.ts', version: '4' } }] }
  ]

  for (const chapter of chapters) {
    const passage = `mw:passage:ancient-egyptian:book-dead-renouf:${chapter.localId}`
    const content = `mw:content:ancient-egyptian:book-dead-renouf:${chapter.localId}:en`
    records.push({ id: passage, record_type: 'resource', kind: 'textual.passage', labels: [{ value: chapter.title, role: 'preferred', language: 'en', script: 'Latn' }], extensions: { textual: { container: EXPRESSION, unit: 'chapter', sequence: chapter.sequence, local_id: chapter.localId } } } as CorpusRecord)
    records.push({ id: content, record_type: 'resource', kind: 'textual.content', extensions: { textual: { target: passage, language: 'en', script: 'Latn', representation: 'source', text: chapter.text }, source: { artifact: ARTIFACT, provenance: PROVENANCE } } } as CorpusRecord)
  }
  const materializedChapters = chapters.length

  await mkdir(path.join(CORE, 'resources'), { recursive: true })
  await mkdir(path.join(CORE, 'provenance'), { recursive: true })
  await writeFile(path.join(CORE, 'resources/book-dead-renouf-1904.jsonl'), deterministicJsonl(records.filter(r => r.record_type === 'resource')), 'utf8')
  await writeFile(path.join(CORE, 'provenance/book-dead-renouf-1904.jsonl'), deterministicJsonl(records.filter(r => r.record_type === 'provenance')), 'utf8')
  const manifestPath = path.join(ROOT, DATASET, 'manifest.json')
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as Record<string, unknown>
  manifest.partitions = [
    { recordType: 'resource', path: 'data/core/resources/*.jsonl' },
    { recordType: 'provenance', path: 'data/core/provenance/*.jsonl' }
  ]
  manifest.availability = 'bundled'
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  const files = [`${DATASET}/data/core/resources/book-dead-renouf-1904.jsonl`, `${DATASET}/data/core/provenance/book-dead-renouf-1904.jsonl`, `${DATASET}/manifest.json`]
  const checksums: string[] = []
  for (const file of files) checksums.push(`${sha256(await readFile(path.join(ROOT, file), 'utf8'))}  ${file}`)
  checksums.push(`${sourceHash}  ${URL}`)
  await writeFile(path.join(ROOT, DATASET, 'CHECKSUMS.sha256'), `${checksums.join('\n')}\n`, 'utf8')
  console.log(`Materialized ${materializedChapters} non-empty Renouf/Naville chapters (${records.length} canonical records)`)
}

await main()
