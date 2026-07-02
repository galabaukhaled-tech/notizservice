"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Plus, Users, ClipboardList, Calendar, ArrowRight, Clock, CheckCircle2, Circle, XCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useStore } from "@/lib/store"
import { ORDER_STATUS_LABELS, type Order, type OrderStatus } from "@/lib/types"
import { CustomerForm } from "@/components/customer-form"
import { OrderForm } from "@/components/order-form"
import { formatTimeRange } from "@/lib/utils"
import { format, isToday, isTomorrow, startOfDay } from "date-fns"
import { de } from "date-fns/locale"

function sortByTime<T extends { time: string }>(a: T, b: T): number {
  if (a.time && b.time) return a.time.localeCompare(b.time)
  if (a.time) return -1
  if (b.time) return 1
  return 0
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "offen":
      return <Circle className="size-4 text-status-open" />
    case "in-bearbeitung":
      return <Clock className="size-4 text-status-progress" />
    case "erledigt":
      return <CheckCircle2 className="size-4 text-status-done" />
    case "storniert":
      return <XCircle className="size-4 text-status-cancelled" />
    default:
      return null
  }
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    offen: "bg-status-open/10 text-status-open border-status-open/30",
    "in-bearbeitung": "bg-status-progress/10 text-status-progress border-status-progress/30",
    erledigt: "bg-status-done/10 text-status-done border-status-done/30",
    storniert: "bg-status-cancelled/10 text-status-cancelled border-status-cancelled/30",
  }

  return (
    <Badge variant="outline" className={variants[status]}>
      {ORDER_STATUS_LABELS[status as OrderStatus]}
    </Badge>
  )
}

export default function DashboardPage() {
  const customers = useStore((state) => state.customers)
  const orders = useStore((state) => state.orders)
  const employees = useStore((state) => state.employees)

  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false)
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const todayOrders = useMemo(() => {
    return orders.filter((order) => isToday(order.date)).sort(sortByTime)
  }, [orders])

  const upcomingOrders = useMemo(() => {
    const today = startOfDay(new Date())
    return orders
      .filter((order) => order.date >= today && order.status !== "erledigt" && order.status !== "storniert")
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 5)
  }, [orders])

  const recentCustomers = useMemo(() => {
    return [...customers]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5)
  }, [customers])

  const stats = useMemo(() => ({
    totalCustomers: customers.length,
    totalOrders: orders.length,
    openOrders: orders.filter((o) => o.status === "offen").length,
    todayAppointments: todayOrders.length,
  }), [customers, orders, todayOrders])

  const getCustomerName = (customerId: string) => {
    return customers.find((c) => c.id === customerId)?.name || "Unbekannt"
  }

  const getEmployeeName = (employeeId: string) => {
    return employees.find((e) => e.id === employeeId)?.name || "Unbekannt"
  }

  const getEmployeeColor = (employeeId: string) => {
    return employees.find((e) => e.id === employeeId)?.color || "#888"
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-balance">Dashboard</h1>
          <p className="text-muted-foreground">
            {format(new Date(), "EEEE, d. MMMM yyyy", { locale: de })}
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isNewCustomerOpen} onOpenChange={setIsNewCustomerOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="size-4 mr-1" />
                Neuer Kunde
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Neuer Kunde</DialogTitle>
                <DialogDescription>
                  Erfassen Sie die Kontaktdaten des neuen Kunden.
                </DialogDescription>
              </DialogHeader>
              <CustomerForm onSuccess={() => setIsNewCustomerOpen(false)} />
            </DialogContent>
          </Dialog>
          <Dialog open={isNewOrderOpen} onOpenChange={setIsNewOrderOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="size-4 mr-1" />
                Neuer Auftrag
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Neuer Auftrag</DialogTitle>
                <DialogDescription>
                  Erstellen Sie einen neuen Auftrag mit allen relevanten Details.
                </DialogDescription>
              </DialogHeader>
              <OrderForm onSuccess={() => setIsNewOrderOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Kunden", value: stats.totalCustomers, icon: Users, tint: "bg-primary/10 text-primary" },
          { label: "Aufträge", value: stats.totalOrders, icon: ClipboardList, tint: "bg-primary/10 text-primary" },
          { label: "Offen", value: stats.openOrders, icon: Circle, tint: "bg-status-open/10 text-status-open", accent: true },
          { label: "Heute", value: stats.todayAppointments, icon: Calendar, tint: "bg-accent/10 text-accent" },
        ].map(({ label, value, icon: Icon, tint, accent }) => (
          <Card key={label} className="transition-all hover:shadow-md hover:-translate-y-0.5">
            <CardContent className="flex items-center gap-4">
              <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${tint}`}>
                <Icon className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                <p className={`text-2xl font-semibold tabular-nums tracking-tight ${accent ? "text-status-open" : ""}`}>
                  {value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Today's Appointments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Heute</CardTitle>
            <Link href="/kalender">
              <Button variant="ghost" size="sm">
                Kalender
                <ArrowRight className="size-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {todayOrders.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">
                Keine Termine heute
              </p>
            ) : (
              <div className="space-y-3">
                {todayOrders.map((order) => {
                  const timeRange = formatTimeRange(order.time, order.endTime)
                  return (
                    <button
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className="w-full text-left flex items-start gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                    >
                      {timeRange ? (
                        <span className="text-xs font-semibold tabular-nums text-primary mt-0.5 w-20 shrink-0">
                          {timeRange}
                        </span>
                      ) : (
                        <div
                          className="size-2 rounded-full mt-2 shrink-0"
                          style={{ backgroundColor: getEmployeeColor(order.employeeId) }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{order.description}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {getCustomerName(order.customerId)} • {getEmployeeName(order.employeeId)}
                          {order.gewerk && ` • ${order.gewerk}`}
                        </p>
                      </div>
                      <StatusBadge status={order.status} />
                    </button>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Anstehende Aufträge</CardTitle>
            <Link href="/auftraege">
              <Button variant="ghost" size="sm">
                Alle
                <ArrowRight className="size-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {upcomingOrders.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">
                Keine anstehenden Aufträge
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingOrders.map((order) => (
                  <button
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className="w-full text-left flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary/30 transition-colors"
                  >
                    <StatusIcon status={order.status} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{order.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {getCustomerName(order.customerId)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-medium">
                        {isToday(order.date)
                          ? "Heute"
                          : isTomorrow(order.date)
                          ? "Morgen"
                          : format(order.date, "d. MMM", { locale: de })}
                        {formatTimeRange(order.time, order.endTime) && (
                          <span className="text-muted-foreground font-normal tabular-nums">
                            {" "}· {formatTimeRange(order.time, order.endTime)}
                          </span>
                        )}
                      </p>
                      <Badge
                        variant="outline"
                        className={
                          order.category === "OM Haustechnik"
                            ? "text-primary border-primary/30"
                            : "text-accent border-accent/30"
                        }
                      >
                        {order.category === "OM Haustechnik" ? "Haustechnik" : "Garten"}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Customers */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Neueste Kunden</CardTitle>
            <Link href="/kunden">
              <Button variant="ghost" size="sm">
                Alle Kunden
                <ArrowRight className="size-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className="p-3 rounded-lg border border-border hover:border-primary/30 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{customer.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{customer.phone}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        customer.category === "OM Haustechnik"
                          ? "text-primary border-primary/30 shrink-0"
                          : "text-accent border-accent/30 shrink-0"
                      }
                    >
                      {customer.category === "OM Haustechnik" ? "HT" : "GS"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Auftrag bearbeiten</DialogTitle>
            <DialogDescription>
              Bearbeiten Sie die Auftragsdetails.
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <OrderForm
              order={selectedOrder}
              onSuccess={() => setSelectedOrder(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
