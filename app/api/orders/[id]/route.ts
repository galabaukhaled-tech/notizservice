import { NextResponse } from "next/server"
import { db, toRow } from "@/lib/db"
import { GEWERKE, ORDER_PHASES, ORDER_PRIORITIES } from "@/lib/types"
import type { InValue } from "@libsql/client"

const VALID_CATEGORIES = ["OM Haustechnik", "OMO Gartenservice"]
const VALID_GEWERKE = GEWERKE as readonly string[]
const VALID_STATUSES = ["offen", "in-bearbeitung", "erledigt", "storniert"]
const VALID_PRIORITIES = ORDER_PRIORITIES as readonly string[]
const VALID_PHASES = ORDER_PHASES as readonly string[]
const TIME_RE = /^\d{2}:\d{2}$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

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
    if (body.gewerk !== undefined && body.gewerk !== "" && !VALID_GEWERKE.includes(body.gewerk)) {
      return NextResponse.json({ error: "Ungültiges Gewerk" }, { status: 400 })
    }
    if (body.status !== undefined && !VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: "Ungültiger Status" }, { status: 400 })
    }
    if (body.priority !== undefined && !VALID_PRIORITIES.includes(body.priority)) {
      return NextResponse.json({ error: "Ungültige Priorität" }, { status: 400 })
    }
    if (body.phase !== undefined && body.phase !== "" && !VALID_PHASES.includes(body.phase)) {
      return NextResponse.json({ error: "Ungültige Phase" }, { status: 400 })
    }

    const existing = toRow(await db.execute({ sql: 'SELECT * FROM "Order" WHERE id = ?', args: [id] }))
    if (!existing) {
      return NextResponse.json({ error: "Auftrag nicht gefunden" }, { status: 404 })
    }

    const updates: string[] = []
    const values: InValue[] = []
    // customOrderId wird automatisch vergeben und ist nicht änderbar.
    if (body.customerId !== undefined) { updates.push("customerId = ?"); values.push(body.customerId) }
    if (body.description !== undefined) { updates.push("description = ?"); values.push(body.description.trim()) }
    if (body.employeeId !== undefined) { updates.push("employeeId = ?"); values.push(body.employeeId) }
    if (body.category !== undefined) { updates.push("category = ?"); values.push(body.category) }
    if (body.gewerk !== undefined) { updates.push("gewerk = ?"); values.push(typeof body.gewerk === "string" ? body.gewerk : "") }
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
      const t = typeof body.time === "string" && TIME_RE.test(body.time) ? body.time : ""
      updates.push("time = ?")
      values.push(t)
    }
    if (body.endTime !== undefined) {
      const t = typeof body.endTime === "string" && TIME_RE.test(body.endTime) ? body.endTime : ""
      updates.push("endTime = ?")
      values.push(t)
    }
    if (body.priority !== undefined) { updates.push("priority = ?"); values.push(body.priority) }
    if (body.phase !== undefined) { updates.push("phase = ?"); values.push(typeof body.phase === "string" ? body.phase : "") }
    if (body.value !== undefined) {
      const num = Number(body.value)
      updates.push("value = ?")
      values.push(Number.isFinite(num) && num > 0 ? num : 0)
    }
    if (body.followUpDate !== undefined) {
      const d = typeof body.followUpDate === "string" && DATE_RE.test(body.followUpDate) ? body.followUpDate : ""
      updates.push("followUpDate = ?")
      values.push(d)
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
