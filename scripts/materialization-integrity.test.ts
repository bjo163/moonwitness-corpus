import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'

interface CorpusRecord {
  id: string
  record_type: string
  kind?: string
  extensions?: {
    textual?: { text?: string; target?: string }
    [key: string]: unknown
  }
}

interface DatasetExpectation {
  path: string
  resources: number
  provenance: number
  passages: number
  contents: number
  artifact: string
  provenanceId: string
  pinnedSourceHash?: string
}

const root = process.cwd()

const DATASETS: DatasetExpectation[] = [
  {
    path: 'datasets/ancient-egypt-book-dead-renouf',
    resources: 376,
    provenance: 1,
    passages: 186,
    contents: 186,
    artifact: 'mw:artifact:ancient-egyptian:book-dead:renouf-1904',
    provenanceId: 'mw:provenance:ancient-egyptian:book-dead-renouf-1904',
    pinnedSourceHash: '3ac04b55080286653c66b1f631a5d2ef66b16ea956b51c96d9767cf25f8a98a4'
  },
  {
    path: 'datasets/zhuangzi-giles-1889',
    resources: 70,
    provenance: 1,
    passages: 33,
    contents: 33,
    artifact: 'mw:artifact:zhuangzi:giles-1889',
    provenanceId: 'mw:provenance:zhuangzi:giles-1889'
  },
  {
    path: 'datasets/ancient-egypt-book-dead-budge',
    resources: 24,
    provenance: 1,
    passages: 10,
    contents: 10,
    artifact: 'mw:artifact:ancient-egyptian:book-dead:budge',
    provenanceId: 'mw:provenance:ancient-egyptian:book-dead:budge'
  }
]

async function readJsonl(relativePath: string): Promise<CorpusRecord[]> {
  const content = await readFile(path.join(root, relativePath), 'utf8')
  return content
    .split(/\r?\n/u)
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line) as CorpusRecord)
}

async function partitionFile(dataset: string, partition: string): Promise<string> {
  const files = await readdir(path.join(root, dataset, 'data/core', partition))
  const jsonl = files.filter((file) => file.endsWith('.jsonl'))
  assert.equal(jsonl.length, 1, `${dataset} must keep exactly one ${partition} partition`)
  return jsonl[0]
}

async function verifyChecksums(dataset: string): Promise<string[]> {
  const lines = (await readFile(path.join(root, dataset, 'CHECKSUMS.sha256'), 'utf8'))
    .trim()
    .split(/\r?\n/u)
  assert.ok(lines.length > 0, `${dataset} must publish checksums`)

  for (const line of lines) {
    const match = line.match(/^([0-9a-f]{64})\s{2}(.+)$/u)
    assert.ok(match, `${dataset} has a malformed checksum line: ${line}`)
    const [, expected, target] = match
    if (/^https?:\/\//u.test(target)) continue
    const actual = createHash('sha256')
      .update(await readFile(path.join(root, target)))
      .digest('hex')
    assert.equal(actual, expected, `${target} does not match its recorded SHA-256`)
  }

  return lines
}

for (const dataset of DATASETS) {
  test(`${dataset.path} is internally consistent and byte-identical to its checksums`, async () => {
    const checksums = await verifyChecksums(dataset.path)

    const resources = await readJsonl(
      `${dataset.path}/data/core/resources/${await partitionFile(dataset.path, 'resources')}`
    )
    const provenance = await readJsonl(
      `${dataset.path}/data/core/provenance/${await partitionFile(dataset.path, 'provenance')}`
    )

    assert.equal(resources.length, dataset.resources)
    assert.equal(provenance.length, dataset.provenance)

    const ids = new Set<string>()
    for (const record of [...resources, ...provenance]) {
      assert.ok(!ids.has(record.id), `${dataset.path} has a duplicate canonical ID: ${record.id}`)
      ids.add(record.id)
    }

    const passages = resources.filter((record) => record.kind === 'textual.passage')
    const contents = resources.filter((record) => record.kind === 'textual.content')
    assert.equal(passages.length, dataset.passages)
    assert.equal(contents.length, dataset.contents)

    const passageIds = new Set(passages.map((record) => record.id))
    const targets = new Set<string>()
    for (const content of contents) {
      const target = content.extensions?.textual?.target
      assert.ok(target && passageIds.has(target), `${content.id} targets a missing passage`)
      assert.ok((content.extensions?.textual?.text ?? '').trim().length > 0, `${content.id} must not be empty`)
      assert.ok(!targets.has(target), `${target} has more than one content record`)
      targets.add(target)
    }

    assert.ok(resources.some((record) => record.id === dataset.artifact))
    assert.ok(provenance.some((record) => record.id === dataset.provenanceId))
    assert.ok(checksums.some((line) => /^https?:\/\//u.test(line.slice(66))))

    if (dataset.pinnedSourceHash) {
      assert.ok(
        checksums.some((line) => line.startsWith(`${dataset.pinnedSourceHash}  https://`)),
        `${dataset.path} must pin the upstream source SHA-256`
      )
    }
  })
}
