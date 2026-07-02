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
  createdAt: Date
}

export interface LiveEvent {
  id: string
  type: "order-created" | "order-updated" | "customer-created"
  message: string
  timestamp: Date
}
