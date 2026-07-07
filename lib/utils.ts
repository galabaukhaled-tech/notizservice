import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { ORDER_STATUS_LABELS, type Customer, type Employee, type Order } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Google-Maps-Link für eine Adresse. */
export function mapsUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.trim())}`
}

/**
 * WhatsApp-Link (wa.me) für eine Telefonnummer.
 * Deutsche Nummern werden zu internationaler Form normalisiert (0171… -> 49171…).
 */
export function whatsappUrl(phone: string): string {
  let digits = phone.replace(/[^\d+]/g, "")
  if (digits.startsWith("+")) {
    digits = digits.slice(1)
  } else if (digits.startsWith("00")) {
    digits = digits.slice(2)
  } else if (digits.startsWith("0")) {
    digits = "49" + digits.slice(1)
  }
  return `https://wa.me/${digits}`
}

/** Stadt aus einer Adresse im Format "Straße, PLZ Ort" extrahieren. */
export function cityFromAddress(address: string): string {
  if (!address.trim()) return ""
  const lastPart = address.split(",").pop()!.trim()
  // "12345 Musterstadt" -> "Musterstadt"; sonst den Teil unverändert lassen.
  return lastPart.replace(/^\d{4,5}\s+/, "").trim()
}

/** Uhrzeit-Bereich formatieren, z.B. "09:00–11:00" oder nur "09:00". */
export function formatTimeRange(time: string, endTime: string): string {
  if (time && endTime) return `${time}–${endTime}`
  return time || endTime || ""
}

export async function copyOrderToClipboard({
  order,
  customer,
  employee,
}: {
  order: Pick<Order, "customOrderId" | "description" | "date" | "time" | "endTime" | "category" | "gewerk" | "status">
  customer?: Pick<Customer, "name" | "phone" | "address"> | null
  employee?: Pick<Employee, "name"> | null
}) {
  const statusLabel = ORDER_STATUS_LABELS[order.status]
  const dateLabel = format(order.date, "d. MMM yyyy", { locale: de })
  const range = formatTimeRange(order.time, order.endTime)
  const timeLabel = range ? ` um ${range} Uhr` : ""

  const lines: string[] = []
  if (order.customOrderId) lines.push(`Auftrags-ID: ${order.customOrderId}`)
  lines.push("──────────────────────")
  if (customer) {
    lines.push(`Kunde: ${customer.name}`)
    if (customer.phone) lines.push(`Telefon: ${customer.phone}`)
    if (customer.address) lines.push(`Adresse: ${customer.address}`)
  }
  lines.push("──────────────────────")
  lines.push(`Beschreibung: ${order.description}`)
  lines.push(`Datum: ${dateLabel}${timeLabel}`)
  if (employee) lines.push(`Mitarbeiter: ${employee.name}`)
  lines.push(`Kategorie: ${order.category}`)
  if (order.gewerk) lines.push(`Gewerk: ${order.gewerk}`)
  lines.push(`Status: ${statusLabel}`)

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(lines.join("\n"))
    return true
  }

  return false
}
