import { readFile, writeFile, mkdir, stat } from 'node:fs/promises'
import { resolve, dirname, relative, isAbsolute } from 'node:path'
import { createStaticResearchPublication } from '../packages/srgbl/src/static.js'
import { canonicalJson } from '../packages/srgbl/src/derived.js'

const MAX_INPUT_BYTES=5*1024*1024
function args(){
  const values=process.argv.slice(2)
  const source=values.indexOf('--input'),output=values.indexOf('--out')
  if(source<0||!values[source+1]) throw new Error(
    'Usage: pnpm srgbl:export-static --input dist/srgbl/reviewed.json [--out apps/web/public/research/srgbl/reviewed.json] [--check]')
  if(output>=0&&!values[output+1]) throw new Error('--out requires a destination path')
  return {
    input:resolve(values[source+1]),
    output:resolve(output<0?'apps/web/public/research/srgbl/reviewed.json':values[output+1]),
    check:values.includes('--check')
  }
}

async function main(){
  const {input,output,check}=args()
  const publicRoot=resolve('apps/web/public')
  const outputPath=relative(publicRoot,output)
  if(!outputPath||outputPath.startsWith('..')||isAbsolute(outputPath)||!output.endsWith('.json')) {
    throw new Error('Static research output must be a JSON file nested under apps/web/public/')
  }
  const inputInfo=await stat(input)
  if(!inputInfo.isFile()||inputInfo.size>MAX_INPUT_BYTES) throw new Error('Reviewed SRGBL input exceeds configured limit')
  const catalog=JSON.parse(await readFile(resolve('apps/web/public/corpus-catalog.json'),'utf8')) as {schemaVersion?:unknown;corpusHash?:unknown}
  if(catalog.schemaVersion!==1||typeof catalog.corpusHash!=='string') throw new Error('Trusted corpus catalog is unavailable')
  const publication=JSON.parse(await readFile(input,'utf8')) as unknown
  const projected=createStaticResearchPublication(publication,catalog.corpusHash)
  const rendered=canonicalJson(projected)+'\n'
  if(check){
    if(await readFile(output,'utf8')!==rendered) throw new Error('Static SRGBL export differs; regenerate from the pinned reviewed input')
    console.log('Static SRGBL export reproducibility verified: '+projected.corpusHash)
    return
  }
  await mkdir(dirname(output),{recursive:true})
  await writeFile(output,rendered,'utf8')
  console.log('Wrote public static SRGBL projection for corpus: '+projected.corpusHash)
}

main().catch(error=>{console.error(error);process.exitCode=1})
