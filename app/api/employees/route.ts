import { NextResponse } from "next/server"
import { db, toRows, toRow } from "@/lib/db"
import { randomUUID } from "crypto"

export async function GET() {
  try {
    const result = await db.execute("SELECT * FROM Employee ORDER BY name ASC")
    return NextResponse.json(toRows(result))
  } catch (err) {
    console.error("[GET /api/employees]", err)
    return NextResponse.json({ error: "Fehler beim Laden der Mitarbeiter" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, color } = body

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Name ist erforderlich" }, { status: 400 })
    }
    if (!color || typeof color !== "string" || !/^#[0-9A-Fa-f]{6}$/.test(color)) {
      return NextResponse.json({ error: "Ungültige Farbe" }, { status: 400 })
    }

    const id = randomUUID()
    await db.execute({ sql: "INSERT INTO Employee (id, name, color) VALUES (?, ?, ?)", args: [id, name.trim(), color] })
    const employee = toRow(await db.execute({ sql: "SELECT * FROM Employee WHERE id = ?", args: [id] }))
    return NextResponse.json(employee, { status: 201 })
  } catch (err) {
    console.error("[POST /api/employees]", err)
    return NextResponse.json({ error: "Fehler beim Erstellen des Mitarbeiters" }, { status: 500 })
  }
}
