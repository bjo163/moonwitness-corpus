import { copyFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises"
import path from "node:path"

const root = process.cwd()
const catalogPath = path.join(root, "apps/web/public/corpus-catalog.json")
const chunksPath = path.join(root, "dist/browser/chunks")
const catalog = JSON.parse(await readFile(catalogPath, "utf8"))
const hash = catalog.corpusHash
if (typeof hash !== "string" || !/^[a-f0-9]{64}$/.test(hash)) {
  throw new Error("The generated web catalog does not contain a valid corpus hash")
}

const target = path.join(root, "apps/web/public/corpus-db", `v3-${hash}`)
await mkdir(target, { recursive: true })
for (const name of await readdir(chunksPath)) {
  await copyFile(path.join(chunksPath, name), path.join(target, name))
}

const config = JSON.parse(await readFile(path.join(chunksPath, "config.json"), "utf8"))
if (config.schemaVersion !== 3 || config.corpusHash !== hash || config.serverMode !== "chunked") {
  throw new Error("The local browser database does not match the generated catalog")
}
config.urlPrefix = `/corpus-db/v3-${hash}/db.sqlite3.`
await writeFile(
  path.join(root, "apps/web/public/corpus-db/config.json"),
  `${JSON.stringify(config, null, 2)}\n`,
)
console.log(`Prepared local browser database for ${hash}`)
