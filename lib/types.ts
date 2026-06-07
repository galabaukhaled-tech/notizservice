export type Category = "OM Haustechnik" | "OMO Gartenservice"

export type OrderStatus = "offen" | "in-bearbeitung" | "erledigt"

export interface Customer {
  id: string
  name: string
  phone: string
  address: string
  notes: string
  category: Category
  createdAt: Date
}

export interface Employee {
  id: string
  name: string
  color: string
}

export interface Order {
  id: string
  customerId: string
  description: string
  date: Date
  time: string
  employeeId: string
  category: Category
  status: OrderStatus
  createdAt: Date
}

export interface LiveEvent {
  id: string
  type: "order-created" | "order-updated" | "customer-created"
  message: string
  timestamp: Date
}
