import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Self-contained Server-Bundle für das Electron-Desktop-Programm
  output: "standalone",
  // Workspace-Root explizit setzen (mehrere Lockfiles vorhanden),
  // damit server.js direkt unter .next/standalone/ landet.
  outputFileTracingRoot: __dirname,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ["better-sqlite3"],
  turbopack: {
    resolveAlias: {
      // jspdf läuft nur im Browser (PDF-Download); die Node-Variante zieht
      // Worker-Code, der sich nicht bundeln lässt.
      jspdf: "jspdf/dist/jspdf.es.min.js",
    },
  },
}

export default nextConfig
