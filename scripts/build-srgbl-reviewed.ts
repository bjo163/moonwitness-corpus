import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { resolve, dirname, relative, isAbsolute } from 'node:path'
import { createReviewedSnapshot, canonicalJson, type SnapshotInput } from '../packages/srgbl/src/derived.js'

function args() {
  const v=process.argv.slice(2)
  const source=v.indexOf('--input'), output=v.indexOf('--out')
  if(source<0 || output<0 || !v[source+1] || !v[output+1]) throw new Error(
    'Usage: pnpm exec tsx scripts/build-srgbl-reviewed.ts --input <reviewed-source.json> --out dist/srgbl/reviewed.json [--check]')
  return {source:resolve(v[source+1]),out:resolve(v[output+1]),check:v.includes('--check')}
}
async function main(){
  const {source,out,check}=args()
  const allowed=resolve('dist/srgbl')
  const rel=relative(allowed,out)
  if(!rel || rel.startsWith('..') || isAbsolute(rel) || !out.endsWith('.json')) throw new Error('Output must be a JSON file nested under dist/srgbl/')
  const payload=JSON.parse(await readFile(source,'utf8')) as SnapshotInput
  const snapshot=createReviewedSnapshot(payload)
  const text=canonicalJson(snapshot)+'\n'
  if(check){
    const current=await readFile(out,'utf8')
    if(current!==text) throw new Error('SRGBL derived snapshot differs; regenerate from pinned inputs')
    console.log('SRGBL snapshot reproducibility verified: '+snapshot.inputSha256)
  } else {
    await mkdir(dirname(out),{recursive:true})
    await writeFile(out,text,'utf8')
    console.log('Wrote derived SRGBL snapshot: '+snapshot.inputSha256)
  }
}
main().catch(e=>{console.error(e);process.exitCode=1})
