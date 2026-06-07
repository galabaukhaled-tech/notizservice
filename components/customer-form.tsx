"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useStore } from "@/lib/store"
import type { Category, Customer } from "@/lib/types"
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
  const [category, setCategory] = useState<Category>(customer?.category || "OM Haustechnik")
  const [isLoading, setIsLoading] = useState(false)

  const addCustomer = useStore((state) => state.addCustomer)
  const updateCustomer = useStore((state) => state.updateCustomer)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      toast.error("Bitte Namen eingeben")
      return
    }

    setIsLoading(true)

    try {
      if (customer) {
        await updateCustomer(customer.id, { name, phone, address, notes, category })
        toast.success("Kunde aktualisiert")
      } else {
        await addCustomer({ name, phone, address, notes, category })
        toast.success("Kunde erstellt")
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
        <Label>Kategorie</Label>
        <RadioGroup
          value={category}
          onValueChange={(value) => setCategory(value as Category)}
          className="flex flex-col gap-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="OM Haustechnik" id="haustechnik" />
            <Label htmlFor="haustechnik" className="font-normal cursor-pointer">
              OM Haustechnik
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="OMO Gartenservice" id="gartenservice" />
            <Label htmlFor="gartenservice" className="font-normal cursor-pointer">
              OMO Gartenservice
            </Label>
          </div>
        </RadioGroup>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading && <Spinner className="mr-2" />}
        {customer ? "Speichern" : "Kunde erstellen"}
      </Button>
    </form>
  )
}
