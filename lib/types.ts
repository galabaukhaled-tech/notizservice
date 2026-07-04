export type Category = "OM Haustechnik" | "OMO Gartenservice"

export const GEWERKE = [
  "OM Haustechnik",
  "OMO Gartenservice",
  "Gebäudedienstleistungen",
  "Hausmeisterservice",
  "Heizungsservice",
  "Elektrotechnik",
  "Rohr-, Abfluss- & Kanalreinigung",
  "Notdienst & Soforthilfe",
  "Kammerjäger",
  "Handwerksvermittlung",
] as const

export type Gewerk = (typeof GEWERKE)[number]

/** Kategorie (Marke) aus einem Gewerk ableiten – Garten ist OMO, alles andere OM. */
export function categoryFromGewerk(gewerk: Gewerk | ""): Category {
  return gewerk === "OMO Gartenservice" ? "OMO Gartenservice" : "OM Haustechnik"
}

export type OrderStatus = "offen" | "in-bearbeitung" | "erledigt" | "storniert"

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  offen: "Offen",
  "in-bearbeitung": "In Bearbeitung",
  erledigt: "Erledigt",
  storniert: "Storniert",
}

/** Sortier-Reihenfolge: offen zuerst, storniert zuletzt. */
export const ORDER_STATUS_SORT: Record<OrderStatus, number> = {
  offen: 0,
  "in-bearbeitung": 1,
  erledigt: 2,
  storniert: 3,
}

// ── Priorität / Dringlichkeit ────────────────────────────────────────
export const ORDER_PRIORITIES = ["normal", "wichtig", "sofort"] as const
export type OrderPriority = (typeof ORDER_PRIORITIES)[number]

export const PRIORITY_META: Record<
  OrderPriority,
  { label: string; color: string; dot: string }
> = {
  normal: { label: "Normal", color: "#22c55e", dot: "🟢" },
  wichtig: { label: "Wichtig", color: "#f59e0b", dot: "🟡" },
  sofort: { label: "Sofort", color: "#ef4444", dot: "🔴" },
}

/** Sortier-Reihenfolge: Sofort zuerst. */
export const PRIORITY_SORT: Record<OrderPriority, number> = {
  sofort: 0,
  wichtig: 1,
  normal: 2,
}

// ── Vertriebs-Pipeline (Angebotsstatus) ──────────────────────────────
export const ORDER_PHASES = [
  "Anfrage",
  "Besichtigung geplant",
  "Angebot erstellt",
  "Kunde überlegt",
  "Auftrag erhalten",
  "Rechnung offen",
  "Erledigt",
] as const
export type OrderPhase = (typeof ORDER_PHASES)[number]

/** Phasen, die als "gewonnener Auftrag" zählen (Anfrage → Auftrag). */
export const WON_PHASES: OrderPhase[] = ["Auftrag erhalten", "Rechnung offen", "Erledigt"]

export interface Customer {
  id: string
  name: string
  phone: string
  address: string
  notes: string
  category: Category
  gewerk: Gewerk | ""
  createdAt: Date
}

export interface Employee {
  id: string
  name: string
  color: string
}

export interface Order {
  id: string
  customOrderId: string
  customerId: string
  description: string
  date: Date
  time: string
  endTime: string
  employeeId: string
  category: Category
  gewerk: Gewerk | ""
  status: OrderStatus
  priority: OrderPriority
  phase: OrderPhase | ""
  value: number
  followUpDate: string
  createdAt: Date
}

export interface LiveEvent {
  id: string
  type: "order-created" | "order-updated" | "customer-created"
  message: string
  timestamp: Date
}
