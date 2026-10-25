import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, isAbsolute, relative, resolve } from 'node:path'
import {
  appendKeyAnnotation, readKeyAnnotationLedger, summarizePassageAnnotations,
  type KeyAnnotationInput
} from '../packages/srgbl/src/annotation-tool.js'

/**
 * P18-006: the two-annotator intake tool. Each annotator submits a JSON file;
 * the tool validates it and appends one line to a ledger. It writes only under
 * dist/annotations/ so a synthetic or pilot submission can never be mistaken
 * for a canonical corpus record, and it never rewrites or reorders what was
 * already recorded.
 */
function usage(): never {
  throw new Error([
    'Usage:',
    '  pnpm exec tsx scripts/key-annotate.ts --ledger <dist/annotations/ledger.jsonl> --record <submission.json>',
    '  pnpm exec tsx scripts/key-annotate.ts --ledger <dist/annotations/ledger.jsonl> --passage <mw:passage:...>',
    '  pnpm exec tsx scripts/key-annotate.ts --ledger <dist/annotations/ledger.jsonl> --check'
  ].join('\n'))
}

function args() {
  const argv = process.argv.slice(2)
  const value = (flag: string) => {
    const at = argv.indexOf(flag)
    return at < 0 ? undefined : argv[at + 1]
  }
  const ledger = value('--ledger')
  if (!ledger) usage()
  const target = resolve(ledger)
  const rel = relative(resolve('dist/annotations'), target)
  if (!rel || rel.startsWith('..') || isAbsolute(rel) || !target.endsWith('.jsonl')) {
    throw new Error('Ledger must be a .jsonl file nested under dist/annotations/')
  }
  return {ledger: target, record: value('--record'), passage: value('--passage'), check: argv.includes('--check')}
}

const readLedger = async (filename: string): Promise<string> => {
  try { return await readFile(filename, 'utf8') }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return ''
    throw error
  }
}

async function main() {
  const options = args()
  const current = await readLedger(options.ledger)

  if (options.check) {
    const checked = readKeyAnnotationLedger(current)
    if (checked.errors.length) throw new Error('Ledger is invalid:\n- ' + checked.errors.join('\n- '))
    console.log('Annotation ledger valid: ' + checked.records.length + ' submission(s)')
    return
  }

  if (options.passage) {
    const checked = readKeyAnnotationLedger(current)
    if (checked.errors.length) throw new Error('Ledger is invalid:\n- ' + checked.errors.join('\n- '))
    const summary = summarizePassageAnnotations(checked.records, options.passage)
    console.log(JSON.stringify(summary, null, 2))
    return
  }

  if (!options.record) usage()
  const submitted = JSON.parse(await readFile(resolve(options.record), 'utf8')) as Omit<KeyAnnotationInput,'at'> & {at?: string}
  // The tool records the instant it received the file; it never backdates or
  // infers one from a commit, and an annotator-supplied instant wins.
  const input: KeyAnnotationInput = {...submitted, at: submitted.at ?? new Date().toISOString()}
  const {ledger, record, errors} = appendKeyAnnotation(current, input)
  if (ledger === null || record === null) {
    throw new Error('Submission was not recorded:\n- ' + errors.join('\n- '))
  }
  await mkdir(dirname(options.ledger), {recursive: true})
  await writeFile(options.ledger, ledger, 'utf8')
  const checked = readKeyAnnotationLedger(ledger)
  console.log('Recorded ' + record.id + ' for ' + record.passageId + ' by ' + record.assessor +
    ' (ledger now holds ' + checked.records.length + ' submission(s))')
}

main().catch(error => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1 })
