// Electron-Hauptprozess: startet den Next.js-Server intern und zeigt ihn im App-Fenster.
const { app, BrowserWindow, dialog, shell } = require("electron")
const path = require("path")
const fs = require("fs")
const http = require("http")
const { spawn } = require("child_process")

const isDev = !app.isPackaged
const PORT = process.env.NOTIZSERVICE_PORT || "37100" // ungewöhnlicher Port, damit nichts kollidiert
const HOST = "127.0.0.1"
const APP_URL = `http://${HOST}:${PORT}`

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

// --- Wartet, bis der Server antwortet ---
function waitForServer(timeoutMs = 30000) {
  const start = Date.now()
  return new Promise((resolve, reject) => {
    const tryConnect = () => {
      const req = http.get(APP_URL, () => resolve())
      req.on("error", () => {
        if (Date.now() - start > timeoutMs) {
          reject(new Error("Server-Start hat zu lange gedauert."))
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
    PORT,
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
  mainWindow.loadURL(APP_URL)

  mainWindow.once("ready-to-show", () => mainWindow.show())

  // Externe Links im Standard-Browser öffnen
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(APP_URL)) {
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
