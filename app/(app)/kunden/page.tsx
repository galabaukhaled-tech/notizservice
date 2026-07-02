"use client"

import { useState, useMemo, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Plus, Search, Phone, MapPin, StickyNote, MoreHorizontal, Pencil, Trash2, Clock, CheckCircle2, Circle, XCircle, Calendar } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { useStore } from "@/lib/store"
import { CustomerForm } from "@/components/customer-form"
import { OrderForm } from "@/components/order-form"
import { ORDER_STATUS_SORT, type Customer, type Order, type OrderStatus } from "@/lib/types"
import { formatTimeRange, mapsUrl, whatsappUrl } from "@/lib/utils"
import { format } from "date-fns"
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

function KundenInner() {
  const customers = useStore((state) => state.customers)
  const orders = useStore((state) => state.orders)
  const employees = useStore((state) => state.employees)
  const deleteCustomer = useStore((state) => state.deleteCustomer)

  const searchParams = useSearchParams()
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  // Suchbegriff aus globaler Suche (?q=...) übernehmen
  useEffect(() => {
    const q = searchParams.get("q")
    if (q) setSearch(q)
  }, [searchParams])
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null)
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const getEmployeeName = (employeeId: string) =>
    employees.find((e) => e.id === employeeId)?.name || "Unbekannt"

  // Auftragshistorie des ausgewählten Kunden, offen zuerst, dann nach Datum.
  const viewingOrders = useMemo(() => {
    if (!viewingCustomer) return []
    return orders
      .filter((o) => o.customerId === viewingCustomer.id)
      .sort((a, b) => {
        const statusDiff = ORDER_STATUS_SORT[a.status] - ORDER_STATUS_SORT[b.status]
        if (statusDiff !== 0) return statusDiff
        return a.date.getTime() - b.date.getTime()
      })
  }, [orders, viewingCustomer])

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const matchesSearch =
        customer.name.toLowerCase().includes(search.toLowerCase()) ||
        customer.phone.includes(search) ||
        customer.address.toLowerCase().includes(search.toLowerCase())
      
      const matchesCategory =
        categoryFilter === "all" || customer.category === categoryFilter
      
      return matchesSearch && matchesCategory
    })
  }, [customers, search, categoryFilter])

  const getOrderCount = (customerId: string) => {
    return orders.filter((order) => order.customerId === customerId).length
  }

  const handleDelete = () => {
    if (deletingCustomer) {
      deleteCustomer(deletingCustomer.id)
      toast.success("Kunde gelöscht")
      setDeletingCustomer(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kunden</h1>
          <p className="text-muted-foreground">
            {customers.length} Kunden insgesamt
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
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
            <CustomerForm onSuccess={() => setIsCreateOpen(false)} />
          </DialogContent>
        </Dialog>
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
      </div>

      {/* Customer List */}
      {filteredCustomers.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              {search || categoryFilter !== "all"
                ? "Keine Kunden gefunden"
                : "Noch keine Kunden vorhanden"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((customer) => (
            <Card
              key={customer.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setViewingCustomer(customer)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base font-semibold truncate">
                    {customer.name}
                  </CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="size-8 shrink-0">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuItem onClick={() => setEditingCustomer(customer)}>
                        <Pencil className="size-4 mr-2" />
                        Bearbeiten
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeletingCustomer(customer)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="size-4 mr-2" />
                        Löschen
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <Badge
                  variant="outline"
                  className={
                    customer.category === "OM Haustechnik"
                      ? "text-primary border-primary/30 w-fit"
                      : "text-accent border-accent/30 w-fit"
                  }
                >
                  {customer.gewerk || customer.category}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2">
                {customer.phone && (
                  <a
                    href={whatsappUrl(customer.phone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary hover:underline"
                  >
                    <Phone className="size-4 shrink-0" />
                    <span className="truncate">{customer.phone}</span>
                  </a>
                )}
                {customer.address && (
                  <a
                    href={mapsUrl(customer.address)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary hover:underline"
                  >
                    <MapPin className="size-4 shrink-0" />
                    <span className="truncate">{customer.address}</span>
                  </a>
                )}
                {customer.notes && (
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <StickyNote className="size-4 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{customer.notes}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-xs text-muted-foreground">
                    {getOrderCount(customer.id)} Aufträge
                  </span>
                  <span className="text-xs text-muted-foreground">
                    seit {format(customer.createdAt, "MMM yyyy", { locale: de })}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Customer History Dialog */}
      <Dialog open={!!viewingCustomer} onOpenChange={(open) => !open && setViewingCustomer(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Auftragshistorie: {viewingCustomer?.name}</DialogTitle>
            <DialogDescription>
              {viewingOrders.length} {viewingOrders.length === 1 ? "Auftrag" : "Aufträge"} insgesamt
            </DialogDescription>
          </DialogHeader>
          {viewingOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Für diesen Kunden gibt es noch keine Aufträge.
            </p>
          ) : (
            <div className="space-y-2">
              {viewingOrders.map((order) => {
                const timeRange = formatTimeRange(order.time, order.endTime)
                return (
                  <button
                    key={order.id}
                    onClick={() => setEditingOrder(order)}
                    className="w-full text-left flex items-start gap-3 p-3 rounded-lg border hover:border-primary/30 hover:shadow-sm transition-all"
                  >
                    <StatusIcon status={order.status} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`font-medium text-sm truncate ${order.status === "storniert" ? "line-through text-muted-foreground" : ""}`}>
                          {order.description}
                        </p>
                        {order.customOrderId && (
                          <span className="text-xs font-mono text-muted-foreground shrink-0">
                            {order.customOrderId}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {getEmployeeName(order.employeeId)}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3" />
                          {format(order.date, "d. MMM yyyy", { locale: de })}
                          {timeRange && <span className="tabular-nums">· {timeRange}</span>}
                        </span>
                        {order.gewerk && (
                          <Badge variant="secondary" className="font-normal">
                            {order.gewerk}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Order Edit Dialog */}
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

      {/* Edit Dialog */}
      <Dialog open={!!editingCustomer} onOpenChange={(open) => !open && setEditingCustomer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kunde bearbeiten</DialogTitle>
            <DialogDescription>
              Bearbeiten Sie die Kundendaten.
            </DialogDescription>
          </DialogHeader>
          {editingCustomer && (
            <CustomerForm
              customer={editingCustomer}
              onSuccess={() => setEditingCustomer(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingCustomer} onOpenChange={(open) => !open && setDeletingCustomer(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kunde löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie den Kunden &quot;{deletingCustomer?.name}&quot; wirklich löschen?
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

export default function KundenPage() {
  return (
    <Suspense fallback={null}>
      <KundenInner />
    </Suspense>
  )
}
