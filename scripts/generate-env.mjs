// Erzeugt electron/env.json aus .env.local, damit die Turso-Zugangsdaten
// im Desktop-Build landen. Wird automatisch vor jedem Build ausgeführt.
import { readFile, writeFile, access } from "node:fs/promises"
import { constants } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const envLocal = path.join(root, ".env.local")
const out = path.join(root, "electron", "env.json")

const KEYS = ["TURSO_DATABASE_URL", "TURSO_AUTH_TOKEN"]

async function exists(p) {
  try {
    await access(p, constants.F_OK)
    return true
  } catch {
    return false
  }
}

function parseEnv(text) {
  const result = {}
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eq = trimmed.indexOf("=")
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    result[key] = value
  }
  return result
}

async function main() {
  if (await exists(envLocal)) {
    const parsed = parseEnv(await readFile(envLocal, "utf-8"))
    const data = {}
    for (const k of KEYS) if (parsed[k]) data[k] = parsed[k]
    if (Object.keys(data).length === 0) {
      console.warn("Keine TURSO_* Variablen in .env.local gefunden.")
    }
    await writeFile(out, JSON.stringify(data, null, 2) + "\n")
    console.log("electron/env.json aus .env.local erzeugt.")
    return
  }

  if (await exists(out)) {
    console.log(".env.local fehlt – bestehende electron/env.json wird verwendet.")
    return
  }

  console.error(
    "FEHLER: Weder .env.local noch electron/env.json vorhanden.\n" +
      "Lege eine .env.local mit TURSO_DATABASE_URL und TURSO_AUTH_TOKEN an."
  )
  process.exit(1)
}

main()
