"use client"

import { useState, useCallback } from "react"
import { Phone, Search, UserPlus, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useStore } from "@/lib/store"
import type { Customer } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { CustomerForm } from "@/components/customer-form"
import { OrderForm } from "@/components/order-form"

export function QuickCapture() {
  const [phone, setPhone] = useState("")
  const [foundCustomer, setFoundCustomer] = useState<Customer | null>(null)
  const [showNewCustomer, setShowNewCustomer] = useState(false)
  const [showNewOrder, setShowNewOrder] = useState(false)
  const searchCustomerByPhone = useStore((state) => state.searchCustomerByPhone)

  const handleSearch = useCallback(() => {
    if (phone.length >= 3) {
      const customer = searchCustomerByPhone(phone)
      setFoundCustomer(customer || null)
    } else {
      setFoundCustomer(null)
    }
  }, [phone, searchCustomerByPhone])

  const handlePhoneChange = (value: string) => {
    setPhone(value)
    if (value.length >= 3) {
      const customer = searchCustomerByPhone(value)
      setFoundCustomer(customer || null)
    } else {
      setFoundCustomer(null)
    }
  }

  return (
    <Card className="p-4 bg-card border-border">
      <div className="flex items-center gap-2 mb-3">
        <Phone className="size-4 text-primary" />
        <span className="font-medium text-sm">Schnell-Erfassung</span>
        <Badge variant="secondary" className="text-xs">Anruf</Badge>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Telefonnummer eingeben..."
            value={phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-9"
          />
        </div>
        
        {foundCustomer ? (
          <div className="flex items-center gap-2">
            <div className="flex flex-col">
              <span className="text-sm font-medium">{foundCustomer.name}</span>
              <Badge 
                variant="outline" 
                className={foundCustomer.category === "OM Haustechnik" 
                  ? "text-primary border-primary/30" 
                  : "text-accent border-accent/30"
                }
              >
                {foundCustomer.category}
              </Badge>
            </div>
            <Dialog open={showNewOrder} onOpenChange={setShowNewOrder}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="size-4 mr-1" />
                  Auftrag
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Neuer Auftrag</DialogTitle>
                  <DialogDescription>
                    Erstellen Sie einen neuen Auftrag für diesen Kunden.
                  </DialogDescription>
                </DialogHeader>
                <OrderForm 
                  preselectedCustomerId={foundCustomer.id} 
                  onSuccess={() => {
                    setShowNewOrder(false)
                    setPhone("")
                    setFoundCustomer(null)
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        ) : phone.length >= 3 ? (
          <Dialog open={showNewCustomer} onOpenChange={setShowNewCustomer}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <UserPlus className="size-4 mr-1" />
                Neuer Kunde
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Neuer Kunde</DialogTitle>
                <DialogDescription>
                  Erfassen Sie die Kontaktdaten des neuen Kunden.
                </DialogDescription>
              </DialogHeader>
              <CustomerForm 
                initialPhone={phone}
                onSuccess={() => {
                  setShowNewCustomer(false)
                  setPhone("")
                }}
              />
            </DialogContent>
          </Dialog>
        ) : null}
      </div>
      
      {phone.length > 0 && phone.length < 3 && (
        <p className="text-xs text-muted-foreground mt-2">
          Mindestens 3 Zeichen eingeben...
        </p>
      )}
    </Card>
  )
}
