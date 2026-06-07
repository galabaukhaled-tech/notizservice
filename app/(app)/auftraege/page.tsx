"use client"

import { useState, useMemo } from "react"
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Clock, CheckCircle2, Circle, Calendar, User } from "lucide-react"
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
import type { Order, OrderStatus } from "@/lib/types"
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
  }
}

export default function AuftraegePage() {
  const customers = useStore((state) => state.customers)
  const employees = useStore((state) => state.employees)
  const orders = useStore((state) => state.orders)
  const updateOrder = useStore((state) => state.updateOrder)
  const deleteOrder = useStore((state) => state.deleteOrder)
  
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [deletingOrder, setDeletingOrder] = useState<Order | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        const customer = customers.find((c) => c.id === order.customerId)
        const matchesSearch =
          order.description.toLowerCase().includes(search.toLowerCase()) ||
          customer?.name.toLowerCase().includes(search.toLowerCase())
        
        const matchesStatus =
          statusFilter === "all" || order.status === statusFilter
        
        const matchesCategory =
          categoryFilter === "all" || order.category === categoryFilter
        
        return matchesSearch && matchesStatus && matchesCategory
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [orders, customers, search, statusFilter, categoryFilter])

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

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    updateOrder(orderId, { status: newStatus })
    toast.success(`Status geändert zu "${newStatus === "offen" ? "Offen" : newStatus === "in-bearbeitung" ? "In Bearbeitung" : "Erledigt"}"`)
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

      {/* Order List */}
      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              {search || statusFilter !== "all" || categoryFilter !== "all"
                ? "Keine Aufträge gefunden"
                : "Noch keine Aufträge vorhanden"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const isOverdue = isPast(startOfDay(order.date)) && order.status !== "erledigt"
            
            return (
              <Card
                key={order.id}
                className={`hover:shadow-md transition-shadow ${
                  isOverdue ? "border-destructive/50" : ""
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div
                      className="size-3 rounded-full mt-1.5 shrink-0"
                      style={{ backgroundColor: getEmployeeColor(order.employeeId) }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">{order.description}</p>
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
                      </div>
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
