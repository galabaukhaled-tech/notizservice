"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useStore } from "@/lib/store"
import type { Category, OrderStatus, Order } from "@/lib/types"
import { toast } from "sonner"
import { Spinner } from "@/components/ui/spinner"
import { format } from "date-fns"

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
  const [employeeId, setEmployeeId] = useState(order?.employeeId || "")
  const [category, setCategory] = useState<Category>(order?.category || "OM Haustechnik")
  const [status, setStatus] = useState<OrderStatus>(order?.status || "offen")
  const [isLoading, setIsLoading] = useState(false)

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

    setIsLoading(true)

    try {
      if (order) {
        await updateOrder(order.id, {
          customerId,
          description,
          date: new Date(date),
          time,
          employeeId,
          category,
          status,
        })
        toast.success("Auftrag aktualisiert")
      } else {
        await addOrder({
          customerId,
          description,
          date: new Date(date),
          time,
          employeeId,
          category,
          status,
        })
        toast.success("Auftrag erstellt")
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Datum</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="time">Uhrzeit</Label>
          <Input
            id="time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
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
        <Label>Kategorie</Label>
        <RadioGroup
          value={category}
          onValueChange={(value) => setCategory(value as Category)}
          className="flex flex-col gap-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="OM Haustechnik" id="order-haustechnik" />
            <Label htmlFor="order-haustechnik" className="font-normal cursor-pointer">
              OM Haustechnik
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="OMO Gartenservice" id="order-gartenservice" />
            <Label htmlFor="order-gartenservice" className="font-normal cursor-pointer">
              OMO Gartenservice
            </Label>
          </div>
        </RadioGroup>
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
