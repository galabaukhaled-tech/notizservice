"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Users, ClipboardList, LayoutDashboard, Calendar, UserCog, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { useStore } from "@/lib/store"
import { ORDER_STATUS_LABELS } from "@/lib/types"

const pages = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Kunden", href: "/kunden", icon: Users },
  { title: "Aufträge", href: "/auftraege", icon: ClipboardList },
  { title: "Kalender", href: "/kalender", icon: Calendar },
  { title: "Mitarbeiter", href: "/mitarbeiter", icon: UserCog },
  { title: "Statistik", href: "/statistik", icon: BarChart3 },
]

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const customers = useStore((state) => state.customers)
  const orders = useStore((state) => state.orders)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const go = (href: string) => {
    setOpen(false)
    router.push(href)
  }

  const getCustomerName = (customerId: string) =>
    customers.find((c) => c.id === customerId)?.name || "Unbekannt"

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2 text-muted-foreground shrink-0 sm:min-w-[180px] justify-start"
        aria-label="Suchen"
      >
        <Search className="size-4" />
        <span className="hidden sm:inline flex-1 text-left text-sm font-normal">Suchen...</span>
        <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          ⌘K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen} title="Suche" description="Kunden, Aufträge und Seiten durchsuchen">
        <CommandInput placeholder="Kunden, Aufträge, Auftrags-IDs suchen..." />
        <CommandList>
          <CommandEmpty>Keine Ergebnisse gefunden.</CommandEmpty>

          <CommandGroup heading="Kunden">
            {customers.map((customer) => (
              <CommandItem
                key={customer.id}
                value={`kunde ${customer.name} ${customer.phone} ${customer.address}`}
                onSelect={() => go(`/kunden?q=${encodeURIComponent(customer.name)}`)}
              >
                <Users className="mr-2 size-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="truncate">{customer.name}</p>
                  {customer.phone && (
                    <p className="text-xs text-muted-foreground truncate">{customer.phone}</p>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Aufträge">
            {orders.map((order) => (
              <CommandItem
                key={order.id}
                value={`auftrag ${order.customOrderId} ${order.description} ${getCustomerName(order.customerId)}`}
                onSelect={() =>
                  go(`/auftraege?q=${encodeURIComponent(order.customOrderId || order.description)}`)
                }
              >
                <ClipboardList className="mr-2 size-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="truncate">
                    {order.customOrderId && (
                      <span className="font-mono text-xs mr-2">{order.customOrderId}</span>
                    )}
                    {order.description}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {getCustomerName(order.customerId)} · {ORDER_STATUS_LABELS[order.status]}
                  </p>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Seiten">
            {pages.map((page) => (
              <CommandItem key={page.href} value={`seite ${page.title}`} onSelect={() => go(page.href)}>
                <page.icon className="mr-2 size-4 text-muted-foreground" />
                {page.title}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
