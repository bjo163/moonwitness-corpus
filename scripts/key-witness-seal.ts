#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  buildKeyWitnessExport, sealKeyWitnessIndex, verifyKeyWitnessIndex,
  type KeyWitnessIndex, type KeyWitnessIndexInput,
} from '../packages/srgbl/src/key-witness.js'

/**
 * Publication entry point for the sealed key-witness index.
 *
 * The API serves `dist/key-witness/index.json` and refuses anything whose bytes
 * no longer hash to their seal, so the index has to be produced by this one
 * script: it reads the corpus hash from the same catalog the API trusts, seals
 * the document, and proves the result can be exported before writing it.
 *
 * A document marked `"synthetic": true` can be sealed and exported, but it may
 * not be written into `dist/` without an explicit override: a fixture must never
 * be served as published research.
 */
export const DEFAULT_CATALOG = 'apps/web/public/corpus-catalog.json'
export const DEFAULT_INDEX = 'dist/key-witness/index.json'

export type SealDocument = Omit<KeyWitnessIndexInput, 'corpusHash'> & {synthetic?: boolean}
export type SealedResult = {index: KeyWitnessIndex; jsonl: string; recordCount: number; bytes: number}

export async function readCorpusHash(catalogPath = DEFAULT_CATALOG): Promise<string> {
  const catalog = JSON.parse(await readFile(resolve(catalogPath), 'utf8')) as {schemaVersion?: unknown; corpusHash?: unknown}
  if (catalog.schemaVersion !== 1 || typeof catalog.corpusHash !== 'string' || !/^[a-f0-9]{64}$/.test(catalog.corpusHash))
    throw new Error('Trusted corpus catalog is unavailable: ' + catalogPath)
  return catalog.corpusHash
}

export async function sealDocument(document: SealDocument, catalogPath = DEFAULT_CATALOG): Promise<SealedResult> {
  if (!document || typeof document !== 'object') throw new Error('the seal document must be a JSON object')
  const {synthetic: _synthetic, ...input} = document
  const index = sealKeyWitnessIndex({...input, corpusHash: await readCorpusHash(catalogPath)})
  // A seal that cannot be exported is not publishable, so the export is proof, not a nicety.
  const exported = buildKeyWitnessExport(index)
  if (exported.jsonl === null || exported.manifest === null) throw new Error(exported.errors.join('; '))
  return {index, jsonl: exported.jsonl, recordCount: exported.manifest.recordCount, bytes: exported.manifest.byteLength}
}

/** A fixture may be sealed and checked; it may not become the served index. */
export function assertPublishable(document: SealDocument, outPath: string, allowSynthetic = false): void {
  if (!document?.synthetic || allowSynthetic) return
  const target = resolve(outPath)
  const distRoot = resolve('dist') + sep
  if (target.startsWith(distRoot))
    throw new Error('a synthetic seal document may not be written under dist/; add "synthetic": false only when the records are real and reviewed')
}

export async function writeSealed(result: SealedResult, outPath: string): Promise<void> {
  const target = resolve(outPath)
  await mkdir(dirname(target), {recursive: true})
  await writeFile(target, JSON.stringify(result.index, null, 2) + '\n', 'utf8')
}

export async function verifySealed(indexPath = DEFAULT_INDEX, catalogPath = DEFAULT_CATALOG): Promise<{recordCount: number; corpusHash: string}> {
  const raw = await readFile(resolve(indexPath), 'utf8')
  const index = verifyKeyWitnessIndex(JSON.parse(raw), await readCorpusHash(catalogPath))
  const exported = buildKeyWitnessExport(index)
  if (exported.jsonl === null) throw new Error(exported.errors.join('; '))
  return {recordCount: index.entries.length, corpusHash: index.corpusHash}
}

export function usage(): string {
  return [
    'Usage: pnpm keys:seal -- --records <document.json> --out <index.json> [--catalog <catalog.json>] [--allow-synthetic]',
    '       pnpm keys:seal -- --check [<index.json>] [--catalog <catalog.json>]',
    '',
    'The document is {"methodVersion","deepLinkBase","entries":[...],"synthetic"?:boolean}.',
    'Coverage of one CLI run: seal -> export -> write, or verify an existing seal against the trusted catalog.',
  ].join('\n')
}

function flag(args: readonly string[], name: string): string | null {
  const index = args.indexOf(name)
  return index >= 0 && args[index + 1] && !args[index + 1].startsWith('--') ? args[index + 1] : null
}

export async function main(argv: readonly string[]): Promise<number> {
  const args = [...argv]
  const catalog = flag(args, '--catalog') ?? DEFAULT_CATALOG
  if (args.includes('--check')) {
    const positional = args.filter((arg, index) => !arg.startsWith('--') && (index === 0 || !['--catalog'].includes(args[index - 1])))
    const checked = await verifySealed(positional[0] ?? DEFAULT_INDEX, catalog)
    console.log('sealed index verified: ' + checked.recordCount + ' record(s), corpus ' + checked.corpusHash)
    return 0
  }
  const records = flag(args, '--records')
  const out = flag(args, '--out')
  if (!records || !out) {
    console.error(usage())
    return 2
  }
  const document = JSON.parse(await readFile(resolve(records), 'utf8')) as SealDocument
  assertPublishable(document, out, args.includes('--allow-synthetic'))
  const sealed = await sealDocument(document, catalog)
  await writeSealed(sealed, out)
  console.log('sealed ' + sealed.recordCount + ' record(s) into ' + out +
    ' (' + sealed.bytes + ' export bytes, index ' + sealed.index.indexSha256.slice(0, 12) + ')')
  return 0
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).then(code => { process.exitCode = code }).catch(error => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  })
}
