import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

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
