"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { OrderForm } from "@/components/order-form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useStore } from "@/lib/store"
import { GEWERKE, categoryFromGewerk, type Gewerk, type Customer } from "@/lib/types"
import { toast } from "sonner"
import { Spinner } from "@/components/ui/spinner"

interface CustomerFormProps {
  initialPhone?: string
  customer?: Customer
  onSuccess?: () => void
}

export function CustomerForm({ initialPhone = "", customer, onSuccess }: CustomerFormProps) {
  const [name, setName] = useState(customer?.name || "")
  const [phone, setPhone] = useState(customer?.phone || initialPhone)
  const [address, setAddress] = useState(customer?.address || "")
  const [notes, setNotes] = useState(customer?.notes || "")
  const [gewerk, setGewerk] = useState<Gewerk | "">(customer?.gewerk || "")
  const [isLoading, setIsLoading] = useState(false)
  const [showOrderForm, setShowOrderForm] = useState(false)
  const [createdCustomerId, setCreatedCustomerId] = useState<string | null>(null)

  const addCustomer = useStore((state) => state.addCustomer)
  const updateCustomer = useStore((state) => state.updateCustomer)

  const handleCustomerSave = async () => {
    if (!name.trim()) {
      toast.error("Bitte Namen eingeben")
      return null
    }
    if (!gewerk) {
      toast.error("Bitte Gewerk auswählen")
      return null
    }

    setIsLoading(true)
    const category = categoryFromGewerk(gewerk)

    try {
      if (customer) {
        await updateCustomer(customer.id, { name, phone, address, notes, category, gewerk })
        toast.success("Kunde aktualisiert")
        return customer
      }

      const createdCustomer = await addCustomer({ name, phone, address, notes, category, gewerk })
      toast.success("Kunde erstellt")
      return createdCustomer
    } catch {
      toast.error("Fehler beim Speichern")
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const savedCustomer = await handleCustomerSave()
    if (savedCustomer) {
      onSuccess?.()
    }
  }

  const handleAddOrder = async () => {
    const savedCustomer = await handleCustomerSave()
    if (savedCustomer && !customer) {
      setCreatedCustomerId(savedCustomer.id)
      setShowOrderForm(true)
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Kundenname"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Telefonnummer</Label>
        <Input
          id="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="0171 1234567"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Adresse</Label>
        <Input
          id="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Straße, PLZ Ort"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notizen</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Zusätzliche Informationen..."
          rows={3}
        />
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

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Spinner className="mr-2" />}
          {customer ? "Speichern" : "Kunde erstellen"}
        </Button>

        {!customer && (
          <Button type="button" variant="outline" className="w-full" onClick={handleAddOrder} disabled={isLoading}>
            {isLoading && <Spinner className="mr-2" />}
            Auftrag hinzufügen
          </Button>
        )}
      </form>

      {!customer && showOrderForm && createdCustomerId && (
        <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
          <div>
            <p className="font-medium">Neuer Auftrag</p>
            <p className="text-sm text-muted-foreground">
              Der Kunde ist bereits voreingestellt. Ergänzen Sie die restlichen Daten und erstellen Sie den Auftrag.
            </p>
          </div>
          <OrderForm preselectedCustomerId={createdCustomerId} />
        </div>
      )}
    </div>
  )
}
