import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { randomUUID } from "crypto"

const VALID_CATEGORIES = ["OM Haustechnik", "OMO Gartenservice"]
const VALID_STATUSES = ["offen", "in-bearbeitung", "erledigt"]

export async function GET() {
  try {
    const orders = db.prepare('SELECT * FROM "Order" ORDER BY createdAt DESC').all()
    return NextResponse.json(orders)
  } catch (err) {
    console.error("[GET /api/orders]", err)
    return NextResponse.json({ error: "Fehler beim Laden der Aufträge" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { customerId, description, date, time, employeeId, category, status } = body

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
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Ungültiger Status" }, { status: 400 })
    }

    const parsedDate = date ? new Date(date) : new Date()
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: "Ungültiges Datum" }, { status: 400 })
    }

    const id = randomUUID()
    const createdAt = new Date().toISOString()

    const timeValue = typeof time === "string" && /^\d{2}:\d{2}$/.test(time) ? time : ""

    db.prepare(
      'INSERT INTO "Order" (id, customerId, description, date, time, employeeId, category, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(
      id,
      customerId,
      description.trim(),
      parsedDate.toISOString(),
      timeValue,
      employeeId,
      category,
      status ?? "offen",
      createdAt
    )

    const order = db.prepare('SELECT * FROM "Order" WHERE id = ?').get(id)
    return NextResponse.json(order, { status: 201 })
  } catch (err) {
    console.error("[POST /api/orders]", err)
    return NextResponse.json({ error: "Fehler beim Erstellen des Auftrags" }, { status: 500 })
  }
}
