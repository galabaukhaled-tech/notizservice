"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  Plus,
  Calendar,
  ArrowRight,
  Phone,
  Inbox,
  FileText,
  Euro,
  TrendingUp,
  Target,
  AlertTriangle,
  MapPin,
  HardHat,
} from "lucide-react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useStore } from "@/lib/store"
import { PRIORITY_META, WON_PHASES, type Order } from "@/lib/types"
import { CustomerForm } from "@/components/customer-form"
import { OrderForm } from "@/components/order-form"
import { WeatherWidget } from "@/components/weather-widget"
import { formatTimeRange, mapsUrl, whatsappUrl, cityFromAddress } from "@/lib/utils"
import {
  format,
  isToday,
  isPast,
  startOfDay,
  startOfMonth,
  subMonths,
  isSameMonth,
} from "date-fns"
import { de } from "date-fns/locale"

const eur = (n: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n)

function sortByTime<T extends { time: string }>(a: T, b: T): number {
  if (a.time && b.time) return a.time.localeCompare(b.time)
  if (a.time) return -1
  if (b.time) return 1
  return 0
}

export default function DashboardPage() {
  const customers = useStore((state) => state.customers)
  const orders = useStore((state) => state.orders)
  const employees = useStore((state) => state.employees)

  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false)
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const todayStr = format(new Date(), "yyyy-MM-dd")

  const getCustomer = (id: string) => customers.find((c) => c.id === id)
  const getCustomerName = (id: string) => getCustomer(id)?.name || "Unbekannt"
  const getEmployeeName = (id: string) => employees.find((e) => e.id === id)?.name || "Unbekannt"
  const getEmployeeColor = (id: string) => employees.find((e) => e.id === id)?.color || "#888"

  const isActive = (o: Order) => o.status !== "erledigt" && o.status !== "storniert"

  // ── Cockpit-Kennzahlen ─────────────────────────────────────────────
  const overdueOrders = useMemo(
    () => orders.filter((o) => isActive(o) && isPast(startOfDay(o.date)) && !isToday(o.date)),
    [orders]
  )

  const todayOrders = useMemo(
    () => orders.filter((o) => isActive(o) && isToday(o.date)).sort(sortByTime),
    [orders]
  )

  const callbacks = useMemo(
    () =>
      orders
        .filter((o) => isActive(o) && o.followUpDate && o.followUpDate <= todayStr)
        .sort((a, b) => a.followUpDate.localeCompare(b.followUpDate)),
    [orders, todayStr]
  )

  const newInquiries = useMemo(
    () => orders.filter((o) => o.phase === "Anfrage" && isToday(o.createdAt)),
    [orders]
  )

  const openOffers = useMemo(
    () => orders.filter((o) => o.phase === "Angebot erstellt" || o.phase === "Kunde überlegt"),
    [orders]
  )

  const openInvoices = useMemo(() => orders.filter((o) => o.phase === "Rechnung offen"), [orders])
  const openInvoiceSum = useMemo(() => openInvoices.reduce((sum, o) => sum + o.value, 0), [openInvoices])

  const successRate = useMemo(() => {
    const leads = orders.filter((o) => o.phase !== "")
    if (leads.length === 0) return null
    const won = leads.filter((o) => WON_PHASES.includes(o.phase as (typeof WON_PHASES)[number]))
    return Math.round((won.length / leads.length) * 100)
  }, [orders])

  const avgValue = useMemo(() => {
    const withValue = orders.filter((o) => o.value > 0)
    if (withValue.length === 0) return 0
    return withValue.reduce((sum, o) => sum + o.value, 0) / withValue.length
  }, [orders])

  // Auftragsentwicklung: letzte 6 Monate
  const trendData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const month = startOfMonth(subMonths(new Date(), 5 - i))
      return {
        label: format(month, "MMM", { locale: de }),
        Aufträge: orders.filter((o) => isSameMonth(o.date, month)).length,
      }
    })
  }, [orders])

  const kpis = [
    { label: "Heute fällig", value: todayOrders.length, icon: Calendar, tint: "bg-primary/10 text-primary", href: "/kalender" },
    { label: "Rückrufe heute", value: callbacks.length, icon: Phone, tint: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" },
    { label: "Neue Anfragen heute", value: newInquiries.length, icon: Inbox, tint: "bg-status-open/10 text-status-open" },
    { label: "Angebote offen", value: openOffers.length, icon: FileText, tint: "bg-status-progress/10 text-status-progress", href: "/auftraege" },
    { label: "Offene Rechnungen", value: openInvoices.length, sub: openInvoiceSum > 0 ? eur(openInvoiceSum) : undefined, icon: Euro, tint: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
    { label: "Ø Auftragswert", value: avgValue > 0 ? eur(avgValue) : "–", icon: TrendingUp, tint: "bg-accent/10 text-accent" },
    { label: "Erfolgsquote", value: successRate === null ? "–" : `${successRate}%`, icon: Target, tint: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-balance">Cockpit</h1>
          <p className="text-muted-foreground capitalize">
            {format(new Date(), "EEEE, d. MMMM yyyy", { locale: de })}
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isNewCustomerOpen} onOpenChange={setIsNewCustomerOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="size-4 mr-1" />
                Neuer Kunde
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Neuer Kunde</DialogTitle>
                <DialogDescription>Erfassen Sie die Kontaktdaten des neuen Kunden.</DialogDescription>
              </DialogHeader>
              <CustomerForm onSuccess={() => setIsNewCustomerOpen(false)} />
            </DialogContent>
          </Dialog>
          <Dialog open={isNewOrderOpen} onOpenChange={setIsNewOrderOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-semibold">
                <Plus className="size-5 mr-1" />
                Neuer Auftrag
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Neuer Auftrag</DialogTitle>
                <DialogDescription>Erstellen Sie einen neuen Auftrag mit allen relevanten Details.</DialogDescription>
              </DialogHeader>
              <OrderForm onSuccess={() => setIsNewOrderOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Überfällig-Warnung */}
      {overdueOrders.length > 0 && (
        <Link href="/auftraege" className="block">
          <div className="animate-alert-pulse flex items-center gap-4 rounded-xl border border-destructive/40 bg-destructive/10 p-4 transition-colors hover:bg-destructive/15">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-destructive text-white">
              <AlertTriangle className="size-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-2xl font-bold tabular-nums text-destructive leading-none">
                {overdueOrders.length} überfällige {overdueOrders.length === 1 ? "Aufgabe" : "Aufgaben"}
              </p>
              <p className="text-sm text-destructive/80 mt-1">Sofort bearbeiten – Termine liegen in der Vergangenheit</p>
            </div>
            <ArrowRight className="size-5 text-destructive shrink-0" />
          </div>
        </Link>
      )}

      {/* KPI-Kacheln */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
        {kpis.map(({ label, value, sub, icon: Icon, tint, href }) => {
          const inner = (
            <Card className="h-full transition-all hover:shadow-md hover:-translate-y-0.5">
              <CardContent className="flex items-center gap-3 px-4">
                <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${tint}`}>
                  <Icon className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground truncate">{label}</p>
                  <p className="text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
                  {sub && <p className="text-xs text-muted-foreground tabular-nums">{sub}</p>}
                </div>
              </CardContent>
            </Card>
          )
          return href ? (
            <Link key={label} href={href} className="block">
              {inner}
            </Link>
          ) : (
            <div key={label}>{inner}</div>
          )
        })}
      </div>

      {/* Rückrufe & Baustellen */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Heute zurückrufen */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Phone className="size-5 text-indigo-500" />
            <CardTitle className="text-lg">Heute zurückrufen</CardTitle>
          </CardHeader>
          <CardContent>
            {callbacks.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">Keine offenen Rückrufe 🎉</p>
            ) : (
              <div className="space-y-2">
                {callbacks.map((order) => {
                  const customer = getCustomer(order.customerId)
                  const isOverdueCall = order.followUpDate < todayStr
                  return (
                    <div
                      key={order.id}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:border-indigo-500/30 transition-colors"
                    >
                      <button onClick={() => setSelectedOrder(order)} className="flex-1 min-w-0 text-left">
                        <p className="font-medium text-sm truncate">{getCustomerName(order.customerId)}</p>
                        <p className="text-xs text-muted-foreground truncate">{order.description}</p>
                        {isOverdueCall && (
                          <span className="text-xs text-destructive font-medium">
                            seit {format(new Date(order.followUpDate), "d. MMM", { locale: de })}
                          </span>
                        )}
                      </button>
                      {customer?.phone && (
                        <div className="flex gap-1 shrink-0">
                          <a
                            href={`tel:${customer.phone.replace(/\s/g, "")}`}
                            className="flex size-9 items-center justify-center rounded-lg bg-secondary hover:bg-secondary/70 text-foreground"
                            aria-label="Anrufen"
                          >
                            <Phone className="size-4" />
                          </a>
                          <a
                            href={whatsappUrl(customer.phone)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25"
                            aria-label="WhatsApp"
                          >
                            <svg viewBox="0 0 24 24" className="size-4" fill="currentColor">
                              <path d="M17.5 14.4c-.3-.2-1.7-.9-2-1-.3-.1-.5-.1-.7.2-.2.3-.7 1-.9 1.1-.2.2-.3.2-.6.1-.3-.2-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.2-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2 0 1.3.9 2.5 1.1 2.7.1.2 1.8 2.8 4.4 3.9.6.3 1.1.4 1.5.5.6.2 1.2.2 1.6.1.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2 0-.1-.2-.2-.5-.3zM12 2a10 10 0 00-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1012 2z" />
                            </svg>
                          </a>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Baustellen heute (Orte + Karten-Links) */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <HardHat className="size-5 text-amber-500" />
            <CardTitle className="text-lg">Baustellen heute</CardTitle>
          </CardHeader>
          <CardContent>
            {todayOrders.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">Heute keine Einsätze geplant</p>
            ) : (
              <div className="space-y-2">
                {todayOrders.map((order) => {
                  const customer = getCustomer(order.customerId)
                  const city = customer ? cityFromAddress(customer.address) : ""
                  const timeRange = formatTimeRange(order.time, order.endTime)
                  return (
                    <div
                      key={order.id}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:border-primary/30 transition-colors"
                    >
                      <span
                        className="size-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: PRIORITY_META[order.priority].color }}
                        title={PRIORITY_META[order.priority].label}
                      />
                      <button onClick={() => setSelectedOrder(order)} className="flex-1 min-w-0 text-left">
                        <p className="font-medium text-sm truncate">
                          {timeRange && <span className="tabular-nums text-primary mr-1">{timeRange}</span>}
                          {order.description}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {getCustomerName(order.customerId)} · {getEmployeeName(order.employeeId)}
                        </p>
                      </button>
                      {customer?.address && (
                        <a
                          href={mapsUrl(customer.address)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 shrink-0 rounded-lg bg-secondary px-2.5 py-1.5 text-xs text-foreground hover:bg-secondary/70"
                        >
                          <MapPin className="size-3.5" />
                          {city || "Karte"}
                        </a>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Wetter & Auftragsentwicklung */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <WeatherWidget />
          <Card>
            <CardContent className="px-4">
              <p className="text-xs font-medium text-muted-foreground">Auftragsvolumen (Rechnungen offen)</p>
              <p className="text-2xl font-semibold tabular-nums tracking-tight text-rose-600 dark:text-rose-400">
                {eur(openInvoiceSum)}
              </p>
            </CardContent>
          </Card>
        </div>
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Auftragsentwicklung</CardTitle>
            <Link href="/statistik">
              <Button variant="ghost" size="sm">
                Statistik
                <ArrowRight className="size-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trendData} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
                <defs>
                  <linearGradient id="dashArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} width={32} />
                <Tooltip
                  cursor={{ stroke: "var(--border)" }}
                  contentStyle={{
                    backgroundColor: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius)",
                    fontSize: 12,
                  }}
                />
                <Area type="monotone" dataKey="Aufträge" stroke="var(--primary)" strokeWidth={2.5} fill="url(#dashArea)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Auftrag bearbeiten</DialogTitle>
            <DialogDescription>Bearbeiten Sie die Auftragsdetails.</DialogDescription>
          </DialogHeader>
          {selectedOrder && <OrderForm order={selectedOrder} onSuccess={() => setSelectedOrder(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}
