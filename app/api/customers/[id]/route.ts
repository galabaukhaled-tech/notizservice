import { NextResponse } from "next/server"
import { db } from "@/lib/db"

const VALID_CATEGORIES = ["OM Haustechnik", "OMO Gartenservice"]

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, phone, address, notes, category } = body

    if (name !== undefined && (typeof name !== "string" || !name.trim())) {
      return NextResponse.json({ error: "Ungültiger Name" }, { status: 400 })
    }
    if (category !== undefined && !VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: "Ungültige Kategorie" }, { status: 400 })
    }

    const existing = db.prepare("SELECT * FROM Customer WHERE id = ?").get(id)
    if (!existing) {
      return NextResponse.json({ error: "Kunde nicht gefunden" }, { status: 404 })
    }

    const updates: string[] = []
    const values: unknown[] = []
    if (name !== undefined) { updates.push("name = ?"); values.push(name.trim()) }
    if (phone !== undefined) { updates.push("phone = ?"); values.push(String(phone).trim()) }
    if (address !== undefined) { updates.push("address = ?"); values.push(String(address).trim()) }
    if (notes !== undefined) { updates.push("notes = ?"); values.push(String(notes).trim()) }
    if (category !== undefined) { updates.push("category = ?"); values.push(category) }
    values.push(id)

    if (updates.length > 0) {
      db.prepare(`UPDATE Customer SET ${updates.join(", ")} WHERE id = ?`).run(...values)
    }

    const customer = db.prepare("SELECT * FROM Customer WHERE id = ?").get(id)
    return NextResponse.json(customer)
  } catch (err) {
    console.error("[PUT /api/customers/[id]]", err)
    return NextResponse.json({ error: "Fehler beim Aktualisieren" }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const result = db.prepare("DELETE FROM Customer WHERE id = ?").run(id)
    if (result.changes === 0) {
      return NextResponse.json({ error: "Kunde nicht gefunden" }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[DELETE /api/customers/[id]]", err)
    return NextResponse.json({ error: "Fehler beim Löschen" }, { status: 500 })
  }
}
