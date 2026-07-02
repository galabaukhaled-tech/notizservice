// Nach `next build` (output: "standalone") fehlen im standalone-Ordner die statischen
// Assets und der public-Ordner. Dieses Skript kopiert sie an die richtige Stelle,
// damit der gebündelte Server alle Dateien beisammen hat.
import { cp, access } from "node:fs/promises"
import { constants } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const standalone = path.join(root, ".next", "standalone")

async function exists(p) {
  try {
    await access(p, constants.F_OK)
    return true
  } catch {
    return false
  }
}

async function copyDir(from, to) {
  if (!(await exists(from))) {
    console.warn("Übersprungen (existiert nicht):", from)
    return
  }
  await cp(from, to, { recursive: true })
  console.log("Kopiert:", path.relative(root, from), "->", path.relative(root, to))
}

async function main() {
  if (!(await exists(standalone))) {
    console.error("Kein .next/standalone gefunden. Erst `next build` ausführen.")
    process.exit(1)
  }
  // .next/static -> .next/standalone/.next/static
  await copyDir(
    path.join(root, ".next", "static"),
    path.join(standalone, ".next", "static")
  )
  // public -> .next/standalone/public
  await copyDir(path.join(root, "public"), path.join(standalone, "public"))
  console.log("Standalone-Bundle bereit.")
}

main()
