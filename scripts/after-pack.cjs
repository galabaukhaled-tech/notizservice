// electron-builder afterPack-Hook.
// Grund: electron-builder schließt beim Kopieren von extraResources den Ordner
// `node_modules` per Default-Filter ("!**/node_modules/**") aus – auch wenn man
// einen eigenen filter setzt. Dadurch fehlt im gepackten Next.js-Standalone-Server
// der komplette node_modules-Ordner (u.a. `next`, `@libsql`) und der Server
// stürzt beim Start ab: "Cannot find module 'next'" -> Fenster zeigt Code 1.
//
// Dieser Hook kopiert node_modules nach dem Packen manuell an die richtige Stelle.
const fs = require("node:fs")
const path = require("node:path")

exports.default = async function afterPack(context) {
  const projectRoot = context.packager.projectDir
  const src = path.join(projectRoot, ".next", "standalone", "node_modules")
  const dest = path.join(
    context.appOutDir,
    "resources",
    "standalone",
    "node_modules"
  )

  if (!fs.existsSync(src)) {
    throw new Error(
      "afterPack: .next/standalone/node_modules fehlt – erst `next build` + prepare:standalone ausführen."
    )
  }

  // Falls (teilweise) vorhanden, sauber neu kopieren.
  fs.rmSync(dest, { recursive: true, force: true })
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.cpSync(src, dest, { recursive: true, dereference: true })

  const count = fs.readdirSync(dest).length
  console.log(`  • afterPack: node_modules kopiert (${count} Einträge) -> ${dest}`)
}
