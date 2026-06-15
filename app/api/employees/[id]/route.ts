import { NextResponse } from "next/server"
import { db, toRow } from "@/lib/db"
import type { InValue } from "@libsql/client"

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

    const existing = toRow(await db.execute({ sql: "SELECT * FROM Employee WHERE id = ?", args: [id] }))
    if (!existing) {
      return NextResponse.json({ error: "Mitarbeiter nicht gefunden" }, { status: 404 })
    }

    const updates: string[] = []
    const values: InValue[] = []
    if (name) { updates.push("name = ?"); values.push(name.trim()) }
    if (color) { updates.push("color = ?"); values.push(color) }
    values.push(id)

    if (updates.length > 0) {
      await db.execute({ sql: `UPDATE Employee SET ${updates.join(", ")} WHERE id = ?`, args: values })
    }

    const employee = toRow(await db.execute({ sql: "SELECT * FROM Employee WHERE id = ?", args: [id] }))
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
    const result = await db.execute({ sql: "DELETE FROM Employee WHERE id = ?", args: [id] })
    if (result.rowsAffected === 0) {
      return NextResponse.json({ error: "Mitarbeiter nicht gefunden" }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[DELETE /api/employees/[id]]", err)
    return NextResponse.json({ error: "Fehler beim Löschen" }, { status: 500 })
  }
}
