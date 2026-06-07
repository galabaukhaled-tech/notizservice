import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, color } = body

    if (name !== undefined && (typeof name !== "string" || !name.trim())) {
      return NextResponse.json({ error: "Ungültiger Name" }, { status: 400 })
    }
    if (color !== undefined && (typeof color !== "string" || !/^#[0-9A-Fa-f]{6}$/.test(color))) {
      return NextResponse.json({ error: "Ungültige Farbe" }, { status: 400 })
    }

    const existing = db.prepare("SELECT * FROM Employee WHERE id = ?").get(id)
    if (!existing) {
      return NextResponse.json({ error: "Mitarbeiter nicht gefunden" }, { status: 404 })
    }

    const updates: string[] = []
    const values: unknown[] = []
    if (name) { updates.push("name = ?"); values.push(name.trim()) }
    if (color) { updates.push("color = ?"); values.push(color) }
    values.push(id)

    if (updates.length > 0) {
      db.prepare(`UPDATE Employee SET ${updates.join(", ")} WHERE id = ?`).run(...values)
    }

    const employee = db.prepare("SELECT * FROM Employee WHERE id = ?").get(id)
    return NextResponse.json(employee)
  } catch (err) {
    console.error("[PUT /api/employees/[id]]", err)
    return NextResponse.json({ error: "Fehler beim Aktualisieren" }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const result = db.prepare("DELETE FROM Employee WHERE id = ?").run(id)
    if (result.changes === 0) {
      return NextResponse.json({ error: "Mitarbeiter nicht gefunden" }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[DELETE /api/employees/[id]]", err)
    return NextResponse.json({ error: "Fehler beim Löschen" }, { status: 500 })
  }
}
