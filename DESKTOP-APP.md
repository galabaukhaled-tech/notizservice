# Notizservice als Windows-Desktop-Programm (.exe)

Das Projekt ist als **Electron-Desktop-App** eingerichtet. Ein Doppelklick startet
den Server intern und öffnet das Notizsystem in einem eigenen App-Fenster –
kein Terminal, kein Browser, kein `npm run dev` nötig.

Die Daten liegen weiterhin in der **Turso-Cloud-Datenbank** (wie bisher).

---

## Die `.exe` auf einem Windows-PC bauen

> Einmalig nötig, um die fertige `.exe` zu erzeugen. Danach kann die `.exe`
> beliebig kopiert und per Doppelklick gestartet werden.

### Voraussetzungen auf dem Windows-PC
- **Node.js 20 oder neuer** – Download: https://nodejs.org (LTS nehmen)
- Das Projekt als Ordner auf dem PC (siehe unten)

### Projekt auf den Windows-PC bringen
Wichtig: **NICHT** die Ordner `node_modules`, `.next` und `dist-electron`
mitkopieren (die enthalten Mac-Dateien). Am einfachsten:

1. Auf dem Mac im Projektordner ein ZIP erstellen, das diese Ordner auslässt.
   (z. B. mit dem Befehl unten im Mac-Terminal)
2. ZIP auf den Windows-PC kopieren (USB-Stick, Cloud o. Ä.) und entpacken.

Mac-Terminal:
```bash
cd /Users/mdanyl/Documents
zip -r notizservice-windows.zip notizservice \
  -x "notizservice/node_modules/*" \
  -x "notizservice/.next/*" \
  -x "notizservice/dist-electron/*" \
  -x "notizservice/.git/*"
```

> Die Datei `.env.local` mit den Turso-Zugangsdaten **muss** im ZIP enthalten
> sein (sie ist es, wenn du den Befehl oben nutzt). Daraus werden beim Build
> automatisch die Zugangsdaten ins Programm übernommen.

### Build-Befehle (auf dem Windows-PC, in der Eingabeaufforderung / PowerShell)
```bat
cd Pfad\zum\notizservice
npm install
npm run dist:win
```

Das dauert beim ersten Mal ein paar Minuten. Ergebnis liegt danach im Ordner
**`dist-electron`**:

- `Notizservice Setup x.y.z.exe` → **Installer** (legt Startmenü- und Desktop-Verknüpfung an)
- `Notizservice x.y.z.exe` → **Portable-Version** (läuft ohne Installation, einfach Doppelklick)

Fertig. Die `.exe` kann jetzt verteilt und per Doppelklick gestartet werden.

---

## Lokal testen (ohne Build)

Auf jedem Rechner mit Node.js:
```bash
npm install
npm run desktop:build   # baut den internen Server einmalig
npm run electron:dev    # öffnet das App-Fenster
```

---

## Wie es funktioniert (Kurzüberblick)

- `next.config.mjs` → `output: "standalone"`: Next.js bündelt einen
  selbstständig lauffähigen Server (`.next/standalone/server.js`).
- `electron/main.js`: startet diesen Server intern auf Port `37100`
  (nutzt Electrons eigenes Node – keine separate Node-Installation auf dem
  Zielrechner nötig) und zeigt ihn im App-Fenster.
- `electron/env.json`: Turso-Zugangsdaten, werden beim Build automatisch
  aus `.env.local` erzeugt (`scripts/generate-env.mjs`).
- `electron-builder.yml`: Konfiguration für die Windows-Pakete (Installer + Portable).

## Eigenes Icon (optional)
Eine `icon.ico` (mind. 256×256) unter `build/icon.ico` ablegen und in
`electron-builder.yml` die Zeile `# icon: build/icon.ico` einkommentieren.
