"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useStore } from "@/lib/store"
import {
  GEWERKE,
  ORDER_PHASES,
  ORDER_PRIORITIES,
  PRIORITY_META,
  categoryFromGewerk,
  type Gewerk,
  type OrderStatus,
  type OrderPriority,
  type OrderPhase,
  type Order,
} from "@/lib/types"
import { toast } from "sonner"
import { Spinner } from "@/components/ui/spinner"
import { format } from "date-fns"
import { copyOrderToClipboard } from "@/lib/utils"

interface OrderFormProps {
  preselectedCustomerId?: string
  order?: Order
  onSuccess?: () => void
}

export function OrderForm({ preselectedCustomerId, order, onSuccess }: OrderFormProps) {
  const customers = useStore((state) => state.customers)
  const employees = useStore((state) => state.employees)
  const addOrder = useStore((state) => state.addOrder)
  const updateOrder = useStore((state) => state.updateOrder)

  const [customerId, setCustomerId] = useState(order?.customerId || preselectedCustomerId || "")
  const [description, setDescription] = useState(order?.description || "")
  const [date, setDate] = useState(order?.date ? format(order.date, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"))
  const [time, setTime] = useState(order?.time || "")
  const [endTime, setEndTime] = useState(order?.endTime || "")
  const [employeeId, setEmployeeId] = useState(order?.employeeId || "")
  const [gewerk, setGewerk] = useState<Gewerk | "">(order?.gewerk || "")
  const [status, setStatus] = useState<OrderStatus>(order?.status || "offen")
  const [priority, setPriority] = useState<OrderPriority>(order?.priority || "normal")
  const [phase, setPhase] = useState<OrderPhase | "">(order?.phase || "")
  const [value, setValue] = useState(order?.value ? String(order.value) : "")
  const [followUpDate, setFollowUpDate] = useState(order?.followUpDate || "")
  const [isLoading, setIsLoading] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [customerSearchQuery, setCustomerSearchQuery] = useState("")

  const selectedCustomer = useMemo(
    () => customers.find((customer) => customer.id === customerId) ?? null,
    [customers, customerId]
  )

  const filteredCustomers = useMemo(
    () =>
      customers.filter((customer) =>
        customer.name.toLowerCase().includes(customerSearchQuery.toLowerCase())
      ),
    [customers, customerSearchQuery]
  )

  useEffect(() => {
    if (!order && !gewerk && selectedCustomer?.gewerk) {
      setGewerk(selectedCustomer.gewerk)
    }
  }, [order, selectedCustomer, gewerk])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!customerId) {
      toast.error("Bitte Kunde auswählen")
      return
    }
    if (!description.trim()) {
      toast.error("Bitte Beschreibung eingeben")
      return
    }
    if (!employeeId) {
      toast.error("Bitte Mitarbeiter auswählen")
      return
    }
    if (!gewerk) {
      toast.error("Bitte Gewerk auswählen")
      return
    }
    if (endTime && time && endTime <= time) {
      toast.error("Bis-Uhrzeit muss nach der Von-Uhrzeit liegen")
      return
    }

    const payload = {
      customerId,
      description: description.trim(),
      date: new Date(date),
      time,
      endTime,
      employeeId,
      category: categoryFromGewerk(gewerk),
      gewerk,
      status,
      priority,
      phase,
      value: value ? parseFloat(value.replace(",", ".")) || 0 : 0,
      followUpDate,
    }

    setIsLoading(true)

    try {
      if (order) {
        await updateOrder(order.id, payload)
        toast.success("Auftrag aktualisiert")
      } else {
        const createdOrder = await addOrder(payload)
        const customer = customers.find((item) => item.id === customerId)
        const employee = employees.find((item) => item.id === employeeId)
        const copied = await copyOrderToClipboard({ order: createdOrder, customer, employee })
        toast.success(copied ? "Auftrag erstellt und Daten in die Zwischenablage kopiert" : "Auftrag erstellt")
      }
      onSuccess?.()
    } catch {
      toast.error("Fehler beim Speichern")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="customOrderId">Auftrags-ID</Label>
        <Input
          id="customOrderId"
          value={order?.customOrderId || "Wird automatisch vergeben"}
          readOnly
          disabled
          className="font-mono text-muted-foreground"
        />
      </div>

      <div className="space-y-2">
        <Label>Kunde *</Label>
        <Select value={customerId} onValueChange={setCustomerId}>
          <SelectTrigger>
            <SelectValue placeholder="Kunde auswählen" />
          </SelectTrigger>
          <SelectContent>
            {customers.map((customer) => (
              <SelectItem key={customer.id} value={customer.id}>
                {customer.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" className="w-full">
              Kunde suchen
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Kunde suchen</DialogTitle>
              <DialogDescription>
                Suche einen vorhandenen Kunden und wähle ihn für den Auftrag aus.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Kundenname eingeben..."
                value={customerSearchQuery}
                onChange={(e) => setCustomerSearchQuery(e.target.value)}
              />
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => (
                    <Button
                      key={customer.id}
                      type="button"
                      variant="secondary"
                      className="w-full justify-start"
                      onClick={() => {
                        setCustomerId(customer.id)
                        setIsSearchOpen(false)
                        setCustomerSearchQuery("")
                      }}
                    >
                      {customer.name}
                    </Button>
                  ))
                ) : (
                  <div className="rounded-md border border-border bg-muted p-3 text-sm text-muted-foreground">
                    Kein Kunde gefunden.
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Beschreibung *</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Auftragsbeschreibung..."
          rows={3}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">Datum</Label>
        <Input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="time">Von</Label>
          <Input
            id="time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endTime">Bis <span className="text-muted-foreground font-normal">(optional)</span></Label>
          <Input
            id="endTime"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Mitarbeiter *</Label>
        <Select value={employeeId} onValueChange={setEmployeeId}>
          <SelectTrigger>
            <SelectValue placeholder="Auswählen" />
          </SelectTrigger>
          <SelectContent>
            {employees.map((employee) => (
              <SelectItem key={employee.id} value={employee.id}>
                <div className="flex items-center gap-2">
                  <div
                    className="size-3 rounded-full"
                    style={{ backgroundColor: employee.color }}
                  />
                  {employee.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Gewerk *</Label>
        <Select value={gewerk} onValueChange={(value) => setGewerk(value as Gewerk)}>
          <SelectTrigger>
            <SelectValue placeholder="Gewerk auswählen" />
          </SelectTrigger>
          <SelectContent>
            {GEWERKE.map((g) => (
              <SelectItem key={g} value={g}>
                {g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Priorität</Label>
          <Select value={priority} onValueChange={(v) => setPriority(v as OrderPriority)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ORDER_PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full" style={{ backgroundColor: PRIORITY_META[p].color }} />
                    {PRIORITY_META[p].label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="value">Auftragswert € <span className="text-muted-foreground font-normal">(optional)</span></Label>
          <Input
            id="value"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="z.B. 1200"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Pipeline-Phase <span className="text-muted-foreground font-normal">(Angebotsstatus)</span></Label>
        <Select value={phase || "none"} onValueChange={(v) => setPhase(v === "none" ? "" : (v as OrderPhase))}>
          <SelectTrigger>
            <SelectValue placeholder="Keine" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Keine</SelectItem>
            {ORDER_PHASES.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="followUpDate">Wiedervorlage / Rückruf am <span className="text-muted-foreground font-normal">(optional)</span></Label>
        <Input
          id="followUpDate"
          type="date"
          value={followUpDate}
          onChange={(e) => setFollowUpDate(e.target.value)}
        />
      </div>

      {order && (
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={(value) => setStatus(value as OrderStatus)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="offen">Offen</SelectItem>
              <SelectItem value="in-bearbeitung">In Bearbeitung</SelectItem>
              <SelectItem value="erledigt">Erledigt</SelectItem>
              <SelectItem value="storniert">Storniert</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading && <Spinner className="mr-2" />}
        {order ? "Speichern" : "Auftrag erstellen"}
      </Button>
    </form>
  )
}
