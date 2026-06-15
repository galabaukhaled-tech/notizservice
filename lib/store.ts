"use client"

import { create } from "zustand"
import type { Customer, Employee, Order, LiveEvent } from "./types"

interface StoreState {
  customers: Customer[]
  employees: Employee[]
  orders: Order[]
  liveEvents: LiveEvent[]
  initialized: boolean

  // Bootstrap
  loadData: () => Promise<void>

  // Customer actions
  addCustomer: (customer: Omit<Customer, "id" | "createdAt">) => Promise<Customer>
  updateCustomer: (id: string, customer: Partial<Customer>) => Promise<void>
  deleteCustomer: (id: string) => Promise<void>
  searchCustomerByPhone: (phone: string) => Customer | undefined

  // Employee actions
  addEmployee: (employee: Omit<Employee, "id">) => Promise<void>
  updateEmployee: (id: string, employee: Partial<Employee>) => Promise<void>
  deleteEmployee: (id: string) => Promise<void>

  // Order actions
  addOrder: (order: Omit<Order, "id" | "createdAt">) => Promise<void>
  updateOrder: (id: string, order: Partial<Order>) => Promise<void>
  deleteOrder: (id: string) => Promise<void>

  // Live events
  addLiveEvent: (event: Omit<LiveEvent, "id" | "timestamp">) => void
  clearLiveEvents: () => void
}

async function apiFetch(url: string, options?: RequestInit): Promise<unknown> {
  const res = await fetch(url, options)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { error?: string }).error ?? `Fehler ${res.status}`)
  }
  return res.json()
}

function parseDate(value: unknown): Date {
  if (value instanceof Date) return value
  const d = new Date(value as string)
  if (isNaN(d.getTime())) throw new Error(`Ungültiges Datum: ${value}`)
  return d
}

function parseCustomer(raw: Record<string, unknown>): Customer {
  return {
    id: raw.id as string,
    name: raw.name as string,
    phone: raw.phone as string,
    address: raw.address as string,
    notes: raw.notes as string,
    category: raw.category as Customer["category"],
    createdAt: parseDate(raw.createdAt),
  }
}

function parseOrder(raw: Record<string, unknown>): Order {
  return {
    id: raw.id as string,
    customOrderId: (raw.customOrderId as string) ?? "",
    customerId: raw.customerId as string,
    description: raw.description as string,
    date: parseDate(raw.date),
    time: (raw.time as string) ?? "",
    employeeId: raw.employeeId as string,
    category: raw.category as Order["category"],
    status: raw.status as Order["status"],
    createdAt: parseDate(raw.createdAt),
  }
}

export const useStore = create<StoreState>((set, get) => ({
  customers: [],
  employees: [],
  orders: [],
  liveEvents: [],
  initialized: false,

  loadData: async () => {
    const [customersRaw, employeesRaw, ordersRaw] = await Promise.all([
      apiFetch("/api/customers"),
      apiFetch("/api/employees"),
      apiFetch("/api/orders"),
    ]) as [Record<string, unknown>[], Record<string, unknown>[], Record<string, unknown>[]]

    set({
      customers: customersRaw.map(parseCustomer),
      employees: employeesRaw as unknown as Employee[],
      orders: ordersRaw.map(parseOrder),
      initialized: true,
    })
  },

  addCustomer: async (customer) => {
    const raw = await apiFetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(customer),
    }) as Record<string, unknown>
    const newCustomer = parseCustomer(raw)
    set((state) => ({ customers: [...state.customers, newCustomer] }))
    get().addLiveEvent({
      type: "customer-created",
      message: `Neuer Kunde "${newCustomer.name}" erstellt`,
    })
    return newCustomer
  },

  updateCustomer: async (id, customer) => {
    const raw = await apiFetch(`/api/customers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(customer),
    }) as Record<string, unknown>
    const updated = parseCustomer(raw)
    set((state) => ({
      customers: state.customers.map((c) => (c.id === id ? updated : c)),
    }))
  },

  deleteCustomer: async (id) => {
    await apiFetch(`/api/customers/${id}`, { method: "DELETE" })
    set((state) => ({
      customers: state.customers.filter((c) => c.id !== id),
    }))
  },

  searchCustomerByPhone: (phone) => {
    const normalized = phone.replace(/\s/g, "")
    return get().customers.find((c) =>
      c.phone.replace(/\s/g, "").includes(normalized)
    )
  },

  addEmployee: async (employee) => {
    const newEmployee = await apiFetch("/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(employee),
    }) as Employee
    set((state) => ({ employees: [...state.employees, newEmployee] }))
  },

  updateEmployee: async (id, employee) => {
    const updated = await apiFetch(`/api/employees/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(employee),
    }) as Employee
    set((state) => ({
      employees: state.employees.map((e) => (e.id === id ? updated : e)),
    }))
  },

  deleteEmployee: async (id) => {
    await apiFetch(`/api/employees/${id}`, { method: "DELETE" })
    set((state) => ({
      employees: state.employees.filter((e) => e.id !== id),
    }))
  },

  addOrder: async (order) => {
    const raw = await apiFetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order),
    }) as Record<string, unknown>
    const newOrder = parseOrder(raw)
    set((state) => ({ orders: [...state.orders, newOrder] }))
    get().addLiveEvent({
      type: "order-created",
      message: `Neuer Auftrag erstellt`,
    })
  },

  updateOrder: async (id, order) => {
    const raw = await apiFetch(`/api/orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order),
    }) as Record<string, unknown>
    const updated = parseOrder(raw)
    set((state) => ({
      orders: state.orders.map((o) => (o.id === id ? updated : o)),
    }))
    if (order.status) {
      get().addLiveEvent({
        type: "order-updated",
        message: `Auftragsstatus geändert zu "${order.status}"`,
      })
    }
  },

  deleteOrder: async (id) => {
    await apiFetch(`/api/orders/${id}`, { method: "DELETE" })
    set((state) => ({
      orders: state.orders.filter((o) => o.id !== id),
    }))
  },

  addLiveEvent: (event) => {
    const newEvent: LiveEvent = {
      ...event,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    }
    set((state) => ({
      liveEvents: [newEvent, ...state.liveEvents].slice(0, 10),
    }))
  },

  clearLiveEvents: () => {
    set({ liveEvents: [] })
  },
}))
