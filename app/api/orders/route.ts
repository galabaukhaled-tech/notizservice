import { NextResponse } from "next/server"
import { db, toRows, toRow } from "@/lib/db"
import { GEWERKE, ORDER_PHASES, ORDER_PRIORITIES } from "@/lib/types"
import { randomUUID } from "crypto"

const VALID_CATEGORIES = ["OM Haustechnik", "OMO Gartenservice"]
const VALID_GEWERKE = GEWERKE as readonly string[]
const VALID_STATUSES = ["offen", "in-bearbeitung", "erledigt", "storniert"]
const VALID_PRIORITIES = ORDER_PRIORITIES as readonly string[]
const VALID_PHASES = ORDER_PHASES as readonly string[]

const TIME_RE = /^\d{2}:\d{2}$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

// Nächste fortlaufende Auftrags-ID im Format AU-0001 ermitteln.
async function nextCustomOrderId(): Promise<string> {
  const result = await db.execute('SELECT customOrderId FROM "Order"')
  let max = 0
  for (const row of toRows<{ customOrderId: string | null }>(result)) {
    const match = /^AU-(\d+)$/.exec(row.customOrderId ?? "")
    if (match) max = Math.max(max, parseInt(match[1], 10))
  }
  return `AU-${String(max + 1).padStart(4, "0")}`
}

export async function GET() {
  try {
    const result = await db.execute('SELECT * FROM "Order" ORDER BY createdAt DESC')
    return NextResponse.json(toRows(result))
  } catch (err) {
    console.error("[GET /api/orders]", err)
    return NextResponse.json({ error: "Fehler beim Laden der Aufträge" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { customerId, description, date, time, endTime, employeeId, category, gewerk, status, priority, phase, value, followUpDate } = body

    if (!customerId || typeof customerId !== "string") {
      return NextResponse.json({ error: "Kunde ist erforderlich" }, { status: 400 })
    }
    if (!description || typeof description !== "string" || !description.trim()) {
      return NextResponse.json({ error: "Beschreibung ist erforderlich" }, { status: 400 })
    }
    if (!employeeId || typeof employeeId !== "string") {
      return NextResponse.json({ error: "Mitarbeiter ist erforderlich" }, { status: 400 })
    }
    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: "Ungültige Kategorie" }, { status: 400 })
    }
    if (gewerk !== undefined && gewerk !== "" && !VALID_GEWERKE.includes(gewerk)) {
      return NextResponse.json({ error: "Ungültiges Gewerk" }, { status: 400 })
    }
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Ungültiger Status" }, { status: 400 })
    }
    if (priority !== undefined && !VALID_PRIORITIES.includes(priority)) {
      return NextResponse.json({ error: "Ungültige Priorität" }, { status: 400 })
    }
    if (phase !== undefined && phase !== "" && !VALID_PHASES.includes(phase)) {
      return NextResponse.json({ error: "Ungültige Phase" }, { status: 400 })
    }

    const parsedDate = date ? new Date(date) : new Date()
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: "Ungültiges Datum" }, { status: 400 })
    }

    const id = randomUUID()
    const createdAt = new Date().toISOString()
    const timeValue = typeof time === "string" && TIME_RE.test(time) ? time : ""
    const endTimeValue = typeof endTime === "string" && TIME_RE.test(endTime) ? endTime : ""
    const gewerkValue = typeof gewerk === "string" ? gewerk : ""
    const priorityValue = VALID_PRIORITIES.includes(priority) ? priority : "normal"
    const phaseValue = typeof phase === "string" && VALID_PHASES.includes(phase) ? phase : ""
    const valueNum = Number(value)
    const valueValue = Number.isFinite(valueNum) && valueNum > 0 ? valueNum : 0
    const followUpValue = typeof followUpDate === "string" && DATE_RE.test(followUpDate) ? followUpDate : ""

    // Auftrags-ID wird immer automatisch fortlaufend vergeben.
    const customOrderIdValue = await nextCustomOrderId()

    await db.execute({
      sql: 'INSERT INTO "Order" (id, customOrderId, customerId, description, date, time, endTime, employeeId, category, gewerk, status, priority, phase, value, followUpDate, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      args: [id, customOrderIdValue, customerId, description.trim(), parsedDate.toISOString(), timeValue, endTimeValue, employeeId, category, gewerkValue, status ?? "offen", priorityValue, phaseValue, valueValue, followUpValue, createdAt],
    })

    const order = toRow(await db.execute({ sql: 'SELECT * FROM "Order" WHERE id = ?', args: [id] }))
    return NextResponse.json(order, { status: 201 })
  } catch (err) {
    console.error("[POST /api/orders]", err)
    return NextResponse.json({ error: "Fehler beim Erstellen des Auftrags" }, { status: 500 })
  }
}
