// Electron-Hauptprozess: startet den Next.js-Server intern und zeigt ihn im App-Fenster.
const { app, BrowserWindow, dialog, shell } = require("electron")
const path = require("path")
const fs = require("fs")
const http = require("http")
const net = require("net")
const { spawn } = require("child_process")

const isDev = !app.isPackaged
const DEFAULT_PORT = Number(process.env.NOTIZSERVICE_PORT || "37100")
const HOST = "127.0.0.1"
let currentPort = DEFAULT_PORT
let appUrl = `http://${HOST}:${currentPort}`

let serverProcess = null
let mainWindow = null

// --- Turso-Zugangsdaten laden (gebündelt in env.json) ---
function loadEnv() {
  const envPath = isDev
    ? path.join(__dirname, "env.json")
    : path.join(process.resourcesPath, "env.json")
  try {
    if (fs.existsSync(envPath)) {
      return JSON.parse(fs.readFileSync(envPath, "utf-8"))
    }
  } catch (err) {
    console.error("env.json konnte nicht gelesen werden:", err)
  }
  return {}
}

// --- Pfad zum standalone server.js ---
function getServerPath() {
  return isDev
    ? path.join(__dirname, "..", ".next", "standalone", "server.js")
    : path.join(process.resourcesPath, "standalone", "server.js")
}

function findAvailablePort(preferredPort) {
  return new Promise((resolve, reject) => {
    const probe = net.createServer()
    probe.unref()
    probe.on("error", () => {
      const fallback = net.createServer()
      fallback.unref()
      fallback.on("error", reject)
      fallback.listen(0, HOST, () => {
        const addr = fallback.address()
        const port = typeof addr === "object" && addr ? addr.port : preferredPort
        fallback.close(() => resolve(port))
      })
    })
    probe.listen(preferredPort, HOST, () => {
      const addr = probe.address()
      const port = typeof addr === "object" && addr ? addr.port : preferredPort
      probe.close(() => resolve(port))
    })
  })
}

// --- Wartet, bis der Server antwortet ---
function waitForServer(timeoutMs = 90000) {
  const start = Date.now()
  return new Promise((resolve, reject) => {
    let settled = false
    const onExit = (code) => {
      if (settled) return
      settled = true
      reject(new Error(`Server-Prozess wurde vorzeitig beendet (Code ${code ?? "?"}).`))
    }
    if (serverProcess) {
      serverProcess.once("exit", onExit)
    }

    const tryConnect = () => {
      const req = http.get(appUrl, () => {
        if (settled) return
        settled = true
        if (serverProcess) {
          serverProcess.removeListener("exit", onExit)
        }
        resolve()
      })
      req.on("error", () => {
        if (settled) return
        if (Date.now() - start > timeoutMs) {
          settled = true
          if (serverProcess) {
            serverProcess.removeListener("exit", onExit)
          }
          reject(new Error(`Server-Start hat zu lange gedauert (${timeoutMs / 1000}s): ${appUrl}`))
        } else {
          setTimeout(tryConnect, 300)
        }
      })
    }
    tryConnect()
  })
}

function startServer() {
  const serverPath = getServerPath()
  if (!fs.existsSync(serverPath)) {
    throw new Error("server.js nicht gefunden: " + serverPath)
  }

  const env = {
    ...process.env,
    ...loadEnv(),
    PORT: String(currentPort),
    HOSTNAME: HOST,
    NODE_ENV: "production",
    // Electrons eigene Binary als Node verwenden – keine separate Node-Installation nötig
    ELECTRON_RUN_AS_NODE: "1",
  }

  serverProcess = spawn(process.execPath, [serverPath], {
    cwd: path.dirname(serverPath),
    env,
    stdio: ["ignore", "pipe", "pipe"],
  })

  serverProcess.stdout.on("data", (d) => console.log("[next]", d.toString().trim()))
  serverProcess.stderr.on("data", (d) => console.error("[next]", d.toString().trim()))
  serverProcess.on("exit", (code) => {
    console.log("Next-Server beendet, Code:", code)
  })
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: "Notizservice",
    backgroundColor: "#ffffff",
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  mainWindow.removeMenu()
  mainWindow.loadURL(appUrl)

  mainWindow.once("ready-to-show", () => mainWindow.show())

  // Externe Links im Standard-Browser öffnen
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(appUrl)) {
      shell.openExternal(url)
      return { action: "deny" }
    }
    return { action: "allow" }
  })

  mainWindow.on("closed", () => {
    mainWindow = null
  })
}

app.whenReady().then(async () => {
  try {
    currentPort = await findAvailablePort(DEFAULT_PORT)
    appUrl = `http://${HOST}:${currentPort}`
    startServer()
    await waitForServer()
    createWindow()
  } catch (err) {
    dialog.showErrorBox(
      "Notizservice konnte nicht starten",
      String(err && err.message ? err.message : err)
    )
    app.quit()
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

function shutdown() {
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill()
    serverProcess = null
  }
}

app.on("window-all-closed", () => {
  shutdown()
  if (process.platform !== "darwin") app.quit()
})

app.on("before-quit", shutdown)
process.on("exit", shutdown)
