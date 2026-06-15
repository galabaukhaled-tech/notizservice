import { NextResponse } from "next/server"
import { db, toRow } from "@/lib/db"
import type { InValue } from "@libsql/client"

const VALID_CATEGORIES = ["OM Haustechnik", "OMO Gartenservice"]
const VALID_STATUSES = ["offen", "in-bearbeitung", "erledigt"]

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    if (body.description !== undefined && (typeof body.description !== "string" || !body.description.trim())) {
      return NextResponse.json({ error: "Ungültige Beschreibung" }, { status: 400 })
    }
    if (body.category !== undefined && !VALID_CATEGORIES.includes(body.category)) {
      return NextResponse.json({ error: "Ungültige Kategorie" }, { status: 400 })
    }
    if (body.status !== undefined && !VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: "Ungültiger Status" }, { status: 400 })
    }

    const existing = toRow(await db.execute({ sql: 'SELECT * FROM "Order" WHERE id = ?', args: [id] }))
    if (!existing) {
      return NextResponse.json({ error: "Auftrag nicht gefunden" }, { status: 404 })
    }

    const updates: string[] = []
    const values: InValue[] = []
    if (body.customOrderId !== undefined) { updates.push("customOrderId = ?"); values.push(typeof body.customOrderId === "string" ? body.customOrderId.trim() : "") }
    if (body.customerId !== undefined) { updates.push("customerId = ?"); values.push(body.customerId) }
    if (body.description !== undefined) { updates.push("description = ?"); values.push(body.description.trim()) }
    if (body.employeeId !== undefined) { updates.push("employeeId = ?"); values.push(body.employeeId) }
    if (body.category !== undefined) { updates.push("category = ?"); values.push(body.category) }
    if (body.status !== undefined) { updates.push("status = ?"); values.push(body.status) }
    if (body.date !== undefined) {
      const parsed = new Date(body.date)
      if (isNaN(parsed.getTime())) {
        return NextResponse.json({ error: "Ungültiges Datum" }, { status: 400 })
      }
      updates.push("date = ?")
      values.push(parsed.toISOString())
    }
    if (body.time !== undefined) {
      const t = typeof body.time === "string" && /^\d{2}:\d{2}$/.test(body.time) ? body.time : ""
      updates.push("time = ?")
      values.push(t)
    }
    values.push(id)

    if (updates.length > 0) {
      await db.execute({ sql: `UPDATE "Order" SET ${updates.join(", ")} WHERE id = ?`, args: values })
    }

    const order = toRow(await db.execute({ sql: 'SELECT * FROM "Order" WHERE id = ?', args: [id] }))
    return NextResponse.json(order)
  } catch (err) {
    console.error("[PUT /api/orders/[id]]", err)
    return NextResponse.json({ error: "Fehler beim Aktualisieren" }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const result = await db.execute({ sql: 'DELETE FROM "Order" WHERE id = ?', args: [id] })
    if (result.rowsAffected === 0) {
      return NextResponse.json({ error: "Auftrag nicht gefunden" }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[DELETE /api/orders/[id]]", err)
    return NextResponse.json({ error: "Fehler beim Löschen" }, { status: 500 })
  }
}
