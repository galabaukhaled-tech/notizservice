import { ORDER_STATUS_LABELS, type Customer, type Employee, type Order } from "./types"
import { formatTimeRange } from "./utils"
import { format } from "date-fns"
import { de } from "date-fns/locale"

const PAGE_W = 210
const MARGIN = 20
const CONTENT_W = PAGE_W - MARGIN * 2
const LINE = 5.5

const COMPANY = {
  name: "OM Haustechnik UG",
  owner: "Faissal Khaled",
  street: "Westerdorfplatz 1",
  city: "45326 Essen",
  phone: "0163 8891637",
  email: "om.haustechnikug@gmail.com",
}

/** Logo aus /public laden und als PNG-DataURL zurückgeben (null bei Fehler). */
async function loadLogo(): Promise<string | null> {
  try {
    const img = new Image()
    img.src = "/pdf-logo.png"
    await img.decode()
    const canvas = document.createElement("canvas")
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    canvas.getContext("2d")!.drawImage(img, 0, 0)
    return canvas.toDataURL("image/png")
  } catch {
    return null
  }
}

/**
 * Erzeugt einen Arbeitsauftrag als A4-PDF und lädt ihn direkt herunter.
 * Plattformunabhängig – kein System-Druckdialog nötig.
 */
export async function downloadOrderPdf(order: Order, customer?: Customer, employee?: Employee) {
  // Lazy-Import: jspdf wird nur im Browser beim Klick geladen (nicht beim SSR).
  const { jsPDF } = await import("jspdf")
  const doc = new jsPDF({ unit: "mm", format: "a4" })
  const logo = await loadLogo()

  // ── Kopf mit Logo ────────────────────────────────────────────────
  const logoSize = 20
  let textX = MARGIN
  if (logo) {
    doc.addImage(logo, "PNG", MARGIN, 13, logoSize, logoSize)
    textX = MARGIN + logoSize + 5
  }

  doc.setFont("helvetica", "bold")
  doc.setFontSize(17)
  doc.setTextColor(0)
  doc.text(COMPANY.name, textX, 20)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.setTextColor(110)
  doc.text("Arbeitsauftrag", textX, 26)
  doc.setFontSize(8)
  doc.text(
    `${COMPANY.street} · ${COMPANY.city} · Tel: ${COMPANY.phone} · ${COMPANY.email}`,
    textX,
    31
  )

  if (order.customOrderId) {
    doc.setFont("courier", "bold")
    doc.setFontSize(14)
    doc.setTextColor(0)
    doc.text(order.customOrderId, PAGE_W - MARGIN, 20, { align: "right" })
  }
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(110)
  doc.text(
    `Erstellt: ${format(order.createdAt, "d. MMMM yyyy", { locale: de })}`,
    PAGE_W - MARGIN,
    26,
    { align: "right" }
  )

  let y = 38
  doc.setDrawColor(0)
  doc.setLineWidth(0.6)
  doc.line(MARGIN, y, PAGE_W - MARGIN, y)
  y += 9

  // ── Kunde / Termin ───────────────────────────────────────────────
  const col2X = MARGIN + CONTENT_W / 2 + 5
  doc.setFontSize(8)
  doc.setTextColor(130)
  doc.setFont("helvetica", "bold")
  doc.text("KUNDE", MARGIN, y)
  doc.text("TERMIN & AUFTRAGSDATEN", col2X, y)
  y += 5.5
  doc.setFontSize(10.5)
  doc.setTextColor(20)

  let yLeft = y
  doc.setFont("helvetica", "bold")
  doc.text(customer?.name ?? "Unbekannt", MARGIN, yLeft)
  yLeft += LINE
  doc.setFont("helvetica", "normal")
  if (customer?.address) {
    const lines = doc.splitTextToSize(customer.address, CONTENT_W / 2 - 10)
    doc.text(lines, MARGIN, yLeft)
    yLeft += lines.length * LINE
  }
  if (customer?.phone) {
    doc.text(`Tel: ${customer.phone}`, MARGIN, yLeft)
    yLeft += LINE
  }
  if (customer?.createdAt) {
    doc.setTextColor(110)
    doc.setFontSize(9)
    doc.text(
      `Kunde seit ${format(customer.createdAt, "MMMM yyyy", { locale: de })}`,
      MARGIN,
      yLeft
    )
    doc.setFontSize(10.5)
    doc.setTextColor(20)
    yLeft += LINE
  }

  let yRight = y
  doc.setFont("helvetica", "bold")
  doc.text(format(order.date, "EEEE, d. MMMM yyyy", { locale: de }), col2X, yRight)
  yRight += LINE
  doc.setFont("helvetica", "normal")
  const timeRange = formatTimeRange(order.time, order.endTime)
  if (timeRange) {
    doc.text(`Uhrzeit: ${timeRange} Uhr`, col2X, yRight)
    yRight += LINE
  }
  if (employee) {
    doc.text(`Mitarbeiter: ${employee.name}`, col2X, yRight)
    yRight += LINE
  }
  if (order.gewerk) {
    doc.text(`Gewerk: ${order.gewerk}`, col2X, yRight)
    yRight += LINE
  }
  doc.text(`Bereich: ${order.category}`, col2X, yRight)
  yRight += LINE
  doc.text(`Status: ${ORDER_STATUS_LABELS[order.status]}`, col2X, yRight)
  yRight += LINE

  y = Math.max(yLeft, yRight) + 7

  // ── Beschreibung ─────────────────────────────────────────────────
  doc.setFontSize(8)
  doc.setTextColor(130)
  doc.setFont("helvetica", "bold")
  doc.text("AUFTRAGSBESCHREIBUNG", MARGIN, y)
  y += 4
  doc.setFontSize(10.5)
  doc.setTextColor(20)
  doc.setFont("helvetica", "normal")
  const descLines = doc.splitTextToSize(order.description, CONTENT_W - 8)
  const boxH = Math.max(26, descLines.length * LINE + 9)
  doc.setDrawColor(180)
  doc.setLineWidth(0.3)
  doc.roundedRect(MARGIN, y, CONTENT_W, boxH, 1.5, 1.5)
  doc.text(descLines, MARGIN + 4, y + 7)
  y += boxH + 7

  // ── Kundennotizen ────────────────────────────────────────────────
  if (customer?.notes) {
    doc.setFontSize(8)
    doc.setTextColor(130)
    doc.setFont("helvetica", "bold")
    doc.text("HINWEISE ZUM KUNDEN", MARGIN, y)
    y += 5
    doc.setFontSize(10.5)
    doc.setTextColor(20)
    doc.setFont("helvetica", "normal")
    const noteLines = doc.splitTextToSize(customer.notes, CONTENT_W)
    doc.text(noteLines, MARGIN, y)
    y += noteLines.length * LINE + 5
  }

  // ── Ausführung / Arbeitsnachweis (vom Mitarbeiter auszufüllen) ──
  doc.setFontSize(8)
  doc.setTextColor(130)
  doc.setFont("helvetica", "bold")
  doc.text("AUSFÜHRUNG (VOM MITARBEITER AUSZUFÜLLEN)", MARGIN, y)
  y += 6
  doc.setFontSize(10)
  doc.setTextColor(20)
  doc.setFont("helvetica", "normal")
  doc.setDrawColor(150)
  doc.setLineWidth(0.25)

  // Zeile 1: ausgeführt am / Arbeitszeit
  doc.text("Ausgeführt am:", MARGIN, y)
  doc.line(MARGIN + 27, y + 1, MARGIN + 75, y + 1)
  doc.text("Arbeitszeit von:", MARGIN + 82, y)
  doc.line(MARGIN + 110, y + 1, MARGIN + 130, y + 1)
  doc.text("bis:", MARGIN + 134, y)
  doc.line(MARGIN + 141, y + 1, MARGIN + 161, y + 1)
  y += 9

  // Materialzeilen
  doc.text("Verwendetes Material:", MARGIN, y)
  y += 6
  for (let i = 0; i < 3; i++) {
    doc.line(MARGIN, y, PAGE_W - MARGIN, y)
    y += 7
  }

  // ── Unterschriften (fix unten) ───────────────────────────────────
  const sigY = 252
  const sigW = (CONTENT_W - 20) / 2
  doc.setDrawColor(0)
  doc.setLineWidth(0.4)
  doc.line(MARGIN, sigY, MARGIN + sigW, sigY)
  doc.line(PAGE_W - MARGIN - sigW, sigY, PAGE_W - MARGIN, sigY)
  doc.setFontSize(8)
  doc.setTextColor(110)
  doc.text("Datum, Unterschrift Kunde", MARGIN, sigY + 4.5)
  doc.text("Datum, Unterschrift Mitarbeiter", PAGE_W - MARGIN - sigW, sigY + 4.5)

  // ── Fußzeile ─────────────────────────────────────────────────────
  doc.setDrawColor(200)
  doc.setLineWidth(0.2)
  doc.line(MARGIN, 278, PAGE_W - MARGIN, 278)
  doc.setFontSize(7.5)
  doc.setTextColor(140)
  doc.text(
    `${COMPANY.name} · Inhaber: ${COMPANY.owner} · ${COMPANY.street}, ${COMPANY.city}`,
    PAGE_W / 2,
    283,
    { align: "center" }
  )
  doc.text(
    `Tel: ${COMPANY.phone} · E-Mail: ${COMPANY.email} · Erstellt am ${format(new Date(), "d. MMMM yyyy, HH:mm", { locale: de })} Uhr`,
    PAGE_W / 2,
    287,
    { align: "center" }
  )

  const idPart = order.customOrderId ? `-${order.customOrderId}` : ""
  doc.save(`Auftrag${idPart}.pdf`)
}
