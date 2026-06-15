import { NextResponse } from "next/server"
import { db, toRows, toRow } from "@/lib/db"
import { randomUUID } from "crypto"

const VALID_CATEGORIES = ["OM Haustechnik", "OMO Gartenservice"]

export async function GET() {
  try {
    const result = await db.execute("SELECT * FROM Customer ORDER BY createdAt DESC")
    return NextResponse.json(toRows(result))
  } catch (err) {
    console.error("[GET /api/customers]", err)
    return NextResponse.json({ error: "Fehler beim Laden der Kunden" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, phone, address, notes, category } = body

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Name ist erforderlich" }, { status: 400 })
    }
    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: "Ungültige Kategorie" }, { status: 400 })
    }

    const id = randomUUID()
    const createdAt = new Date().toISOString()

    await db.execute({
      sql: "INSERT INTO Customer (id, name, phone, address, notes, category, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
      args: [
        id,
        name.trim(),
        typeof phone === "string" ? phone.trim() : "",
        typeof address === "string" ? address.trim() : "",
        typeof notes === "string" ? notes.trim() : "",
        category,
        createdAt,
      ],
    })

    const customer = toRow(await db.execute({ sql: "SELECT * FROM Customer WHERE id = ?", args: [id] }))
    return NextResponse.json(customer, { status: 201 })
  } catch (err) {
    console.error("[POST /api/customers]", err)
    return NextResponse.json({ error: "Fehler beim Erstellen des Kunden" }, { status: 500 })
  }
}
