"use client"

import { useState, useMemo } from "react"
import { Plus, Search, Phone, MapPin, StickyNote, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
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
import type { Customer } from "@/lib/types"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { toast } from "sonner"

export default function KundenPage() {
  const customers = useStore((state) => state.customers)
  const orders = useStore((state) => state.orders)
  const deleteCustomer = useStore((state) => state.deleteCustomer)
  
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

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
            <Card key={customer.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base font-semibold truncate">
                    {customer.name}
                  </CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8 shrink-0">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
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
                  {customer.category}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2">
                {customer.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="size-4 shrink-0" />
                    <span className="truncate">{customer.phone}</span>
                  </div>
                )}
                {customer.address && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="size-4 shrink-0" />
                    <span className="truncate">{customer.address}</span>
                  </div>
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
