"use client"

import { useState, useMemo, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Clock, CheckCircle2, Circle, XCircle, Calendar, User, Copy, FileDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useStore } from "@/lib/store"
import { OrderForm } from "@/components/order-form"
import { GEWERKE, ORDER_STATUS_LABELS, ORDER_STATUS_SORT, PRIORITY_META, PRIORITY_SORT, type Order, type OrderStatus } from "@/lib/types"
import { mapsUrl, whatsappUrl, formatTimeRange } from "@/lib/utils"
import { MapPin, Phone } from "lucide-react"
import { downloadOrderPdf } from "@/lib/order-pdf"
import { format, isToday, isTomorrow, isPast, startOfDay } from "date-fns"
import { de } from "date-fns/locale"
import { toast } from "sonner"

function StatusIcon({ status }: { status: OrderStatus }) {
  switch (status) {
    case "offen":
      return <Circle className="size-4 text-status-open" />
    case "in-bearbeitung":
      return <Clock className="size-4 text-status-progress" />
    case "erledigt":
      return <CheckCircle2 className="size-4 text-status-done" />
    case "storniert":
      return <XCircle className="size-4 text-status-cancelled" />
  }
}

function AuftraegeInner() {
  const customers = useStore((state) => state.customers)
  const employees = useStore((state) => state.employees)
  const orders = useStore((state) => state.orders)
  const updateOrder = useStore((state) => state.updateOrder)
  const deleteOrder = useStore((state) => state.deleteOrder)
  
  const searchParams = useSearchParams()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [gewerkFilter, setGewerkFilter] = useState<string>("all")

  // Suchbegriff aus globaler Suche (?q=...) übernehmen
  useEffect(() => {
    const q = searchParams.get("q")
    if (q) setSearch(q)
  }, [searchParams])
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [deletingOrder, setDeletingOrder] = useState<Order | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const handleDownloadPdf = async (order: Order) => {
    try {
      await downloadOrderPdf(
        order,
        customers.find((c) => c.id === order.customerId),
        employees.find((e) => e.id === order.employeeId)
      )
      toast.success("PDF heruntergeladen")
    } catch {
      toast.error("PDF konnte nicht erstellt werden")
    }
  }

  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        const customer = customers.find((c) => c.id === order.customerId)
        const matchesSearch =
          order.description.toLowerCase().includes(search.toLowerCase()) ||
          order.customOrderId.toLowerCase().includes(search.toLowerCase()) ||
          customer?.name.toLowerCase().includes(search.toLowerCase())
        
        const matchesStatus =
          statusFilter === "all" || order.status === statusFilter
        
        const matchesCategory =
          categoryFilter === "all" || order.category === categoryFilter

        const matchesGewerk =
          gewerkFilter === "all" || order.gewerk === gewerkFilter

        return matchesSearch && matchesStatus && matchesCategory && matchesGewerk
      })
      .sort((a, b) => {
        // Status (offen zuerst), dann Priorität (sofort zuerst), dann Datum.
        const statusDiff = ORDER_STATUS_SORT[a.status] - ORDER_STATUS_SORT[b.status]
        if (statusDiff !== 0) return statusDiff
        const prioDiff = PRIORITY_SORT[a.priority] - PRIORITY_SORT[b.priority]
        if (prioDiff !== 0) return prioDiff
        return a.date.getTime() - b.date.getTime()
      })
  }, [orders, customers, search, statusFilter, categoryFilter, gewerkFilter])

  const getCustomerName = (customerId: string) => {
    return customers.find((c) => c.id === customerId)?.name || "Unbekannt"
  }

  const getEmployeeName = (employeeId: string) => {
    return employees.find((e) => e.id === employeeId)?.name || "Unbekannt"
  }

  const getEmployeeColor = (employeeId: string) => {
    return employees.find((e) => e.id === employeeId)?.color || "#888"
  }

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return "Heute"
    if (isTomorrow(date)) return "Morgen"
    if (isPast(startOfDay(date))) return "Überfällig"
    return format(date, "d. MMM yyyy", { locale: de })
  }

  const handleCopy = (order: Order) => {
    const customer = customers.find((c) => c.id === order.customerId)
    const employee = employees.find((e) => e.id === order.employeeId)
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

    navigator.clipboard.writeText(lines.join("\n"))
    toast.success("Auftrag kopiert")
  }

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    updateOrder(orderId, { status: newStatus })
    toast.success(`Status geändert zu "${ORDER_STATUS_LABELS[newStatus]}"`)
  }

  const handleDelete = () => {
    if (deletingOrder) {
      deleteOrder(deletingOrder.id)
      toast.success("Auftrag gelöscht")
      setDeletingOrder(null)
    }
  }

  const statusCounts = useMemo(() => ({
    offen: orders.filter((o) => o.status === "offen").length,
    "in-bearbeitung": orders.filter((o) => o.status === "in-bearbeitung").length,
    erledigt: orders.filter((o) => o.status === "erledigt").length,
    storniert: orders.filter((o) => o.status === "storniert").length,
  }), [orders])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Aufträge</h1>
          <p className="text-muted-foreground">
            {orders.length} Aufträge insgesamt
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
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
            <OrderForm onSuccess={() => setIsCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Status Summary */}
      <div className="flex gap-4 overflow-x-auto pb-2">
        <button
          onClick={() => setStatusFilter("all")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
            statusFilter === "all"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card border-border hover:border-primary/30"
          }`}
        >
          <span className="font-medium text-sm">Alle</span>
          <Badge variant="secondary" className="ml-1">{orders.length}</Badge>
        </button>
        <button
          onClick={() => setStatusFilter("offen")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
            statusFilter === "offen"
              ? "bg-status-open text-white border-status-open"
              : "bg-card border-border hover:border-status-open/50"
          }`}
        >
          <Circle className="size-4" />
          <span className="font-medium text-sm">Offen</span>
          <Badge variant="secondary" className="ml-1">{statusCounts.offen}</Badge>
        </button>
        <button
          onClick={() => setStatusFilter("in-bearbeitung")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
            statusFilter === "in-bearbeitung"
              ? "bg-status-progress text-white border-status-progress"
              : "bg-card border-border hover:border-status-progress/50"
          }`}
        >
          <Clock className="size-4" />
          <span className="font-medium text-sm whitespace-nowrap">In Bearbeitung</span>
          <Badge variant="secondary" className="ml-1">{statusCounts["in-bearbeitung"]}</Badge>
        </button>
        <button
          onClick={() => setStatusFilter("erledigt")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
            statusFilter === "erledigt"
              ? "bg-status-done text-white border-status-done"
              : "bg-card border-border hover:border-status-done/50"
          }`}
        >
          <CheckCircle2 className="size-4" />
          <span className="font-medium text-sm">Erledigt</span>
          <Badge variant="secondary" className="ml-1">{statusCounts.erledigt}</Badge>
        </button>
        <button
          onClick={() => setStatusFilter("storniert")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
            statusFilter === "storniert"
              ? "bg-status-cancelled text-white border-status-cancelled"
              : "bg-card border-border hover:border-status-cancelled/50"
          }`}
        >
          <XCircle className="size-4" />
          <span className="font-medium text-sm">Storniert</span>
          <Badge variant="secondary" className="ml-1">{statusCounts.storniert}</Badge>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={categoryFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setCategoryFilter("all")}
          >
            Alle
          </Button>
          <Button
            variant={categoryFilter === "OM Haustechnik" ? "default" : "outline"}
            size="sm"
            onClick={() => setCategoryFilter("OM Haustechnik")}
          >
            Haustechnik
          </Button>
          <Button
            variant={categoryFilter === "OMO Gartenservice" ? "default" : "outline"}
            size="sm"
            onClick={() => setCategoryFilter("OMO Gartenservice")}
          >
            Garten
          </Button>
        </div>
        <Select value={gewerkFilter} onValueChange={setGewerkFilter}>
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue placeholder="Alle Gewerke" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Gewerke</SelectItem>
            {GEWERKE.map((g) => (
              <SelectItem key={g} value={g}>
                {g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Order List */}
      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              {search || statusFilter !== "all" || categoryFilter !== "all" || gewerkFilter !== "all"
                ? "Keine Aufträge gefunden"
                : "Noch keine Aufträge vorhanden"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const isOverdue = isPast(startOfDay(order.date)) && order.status !== "erledigt" && order.status !== "storniert"
            const customer = customers.find((c) => c.id === order.customerId)
            const timeRange = formatTimeRange(order.time, order.endTime)

            return (
              <Card
                key={order.id}
                className={`hover:shadow-md transition-shadow overflow-hidden ${
                  isOverdue ? "border-destructive/50" : ""
                }`}
                style={
                  order.priority !== "normal"
                    ? { borderLeft: `3px solid ${PRIORITY_META[order.priority].color}` }
                    : undefined
                }
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div
                      className="size-3 rounded-full mt-1.5 shrink-0"
                      style={{ backgroundColor: getEmployeeColor(order.employeeId) }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium">{order.description}</p>
                            {order.customOrderId && (
                              <span className="text-xs font-mono text-muted-foreground border border-border rounded px-1.5 py-0.5 shrink-0">
                                {order.customOrderId}
                              </span>
                            )}
                            {order.priority !== "normal" && (
                              <span
                                className="inline-flex items-center gap-1 text-xs font-medium rounded px-1.5 py-0.5 shrink-0"
                                style={{
                                  color: PRIORITY_META[order.priority].color,
                                  backgroundColor: `${PRIORITY_META[order.priority].color}1a`,
                                }}
                              >
                                {PRIORITY_META[order.priority].label}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {getCustomerName(order.customerId)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Select
                            value={order.status}
                            onValueChange={(value) => handleStatusChange(order.id, value as OrderStatus)}
                          >
                            <SelectTrigger className="w-[160px] h-8">
                              <div className="flex items-center gap-2">
                                <StatusIcon status={order.status} />
                                <SelectValue />
                              </div>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="offen">
                                <div className="flex items-center gap-2">
                                  <Circle className="size-4 text-status-open" />
                                  Offen
                                </div>
                              </SelectItem>
                              <SelectItem value="in-bearbeitung">
                                <div className="flex items-center gap-2">
                                  <Clock className="size-4 text-status-progress" />
                                  In Bearbeitung
                                </div>
                              </SelectItem>
                              <SelectItem value="erledigt">
                                <div className="flex items-center gap-2">
                                  <CheckCircle2 className="size-4 text-status-done" />
                                  Erledigt
                                </div>
                              </SelectItem>
                              <SelectItem value="storniert">
                                <div className="flex items-center gap-2">
                                  <XCircle className="size-4 text-status-cancelled" />
                                  Storniert
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-8">
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setEditingOrder(order)}>
                                <Pencil className="size-4 mr-2" />
                                Bearbeiten
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleCopy(order)}>
                                <Copy className="size-4 mr-2" />
                                Kopieren
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDownloadPdf(order)}>
                                <FileDown className="size-4 mr-2" />
                                Als PDF herunterladen
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeletingOrder(order)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="size-4 mr-2" />
                                Löschen
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-2">
                        <div className={`flex items-center gap-1 text-xs ${isOverdue ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                          <Calendar className="size-3" />
                          {getDateLabel(order.date)}
                          {timeRange && <span className="tabular-nums">· {timeRange}</span>}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <User className="size-3" />
                          {getEmployeeName(order.employeeId)}
                        </div>
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
                        {order.gewerk && (
                          <Badge variant="secondary" className="font-normal">
                            {order.gewerk}
                          </Badge>
                        )}
                        {order.phase && (
                          <Badge variant="outline" className="font-normal text-muted-foreground">
                            {order.phase}
                          </Badge>
                        )}
                        {order.value > 0 && (
                          <span className="text-xs font-medium tabular-nums text-muted-foreground">
                            {new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(order.value)}
                          </span>
                        )}
                      </div>
                      {(customer?.address || customer?.phone) && (
                        <div className="flex flex-wrap items-center gap-3 mt-2">
                          {customer.address && (
                            <a
                              href={mapsUrl(customer.address)}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary hover:underline"
                            >
                              <MapPin className="size-3 shrink-0" />
                              {customer.address}
                            </a>
                          )}
                          {customer.phone && (
                            <a
                              href={whatsappUrl(customer.phone)}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary hover:underline"
                            >
                              <Phone className="size-3 shrink-0" />
                              {customer.phone}
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingOrder} onOpenChange={(open) => !open && setEditingOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Auftrag bearbeiten</DialogTitle>
            <DialogDescription>
              Bearbeiten Sie die Auftragsdetails.
            </DialogDescription>
          </DialogHeader>
          {editingOrder && (
            <OrderForm
              order={editingOrder}
              onSuccess={() => setEditingOrder(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingOrder} onOpenChange={(open) => !open && setDeletingOrder(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Auftrag löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie diesen Auftrag wirklich löschen?
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default function AuftraegePage() {
  return (
    <Suspense fallback={null}>
      <AuftraegeInner />
    </Suspense>
  )
}
