"use client"

import { useMemo, useState } from "react"
import {
  ClipboardList,
  CheckCircle2,
  Circle,
  XCircle,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { useStore } from "@/lib/store"
import { GEWERKE, ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/types"
import {
  format,
  startOfMonth,
  subMonths,
  isSameMonth,
  isPast,
  startOfDay,
  getDay,
  subDays,
  subWeeks,
  eachDayOfInterval,
  eachWeekOfInterval,
  isSameDay,
  isSameWeek,
} from "date-fns"
import { de } from "date-fns/locale"

// Apple-Stocks-Farben
const APPLE = {
  green: "#32d74b",
  red: "#ff453a",
}

type RangeKey = "W" | "M" | "6M" | "J"

const RANGES: { key: RangeKey; label: string; compare: string; days: number }[] = [
  { key: "W", label: "1W", compare: "vs. Vorwoche", days: 7 },
  { key: "M", label: "1M", compare: "vs. Vormonat", days: 30 },
  { key: "6M", label: "6M", compare: "vs. vorherige 6 Monate", days: 182 },
  { key: "J", label: "1J", compare: "vs. Vorjahr", days: 365 },
]

const STATUS_COLORS: Record<OrderStatus, string> = {
  offen: "var(--status-open)",
  "in-bearbeitung": "var(--status-progress)",
  erledigt: "var(--status-done)",
  storniert: "var(--status-cancelled)",
}

const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]

const tooltipStyle = {
  backgroundColor: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
  fontSize: 12,
} as const

export default function StatistikPage() {
  const orders = useStore((state) => state.orders)
  const customers = useStore((state) => state.customers)
  const employees = useStore((state) => state.employees)
  const [range, setRange] = useState<RangeKey>("J")

  const stats = useMemo(() => {
    const total = orders.length
    const offen = orders.filter((o) => o.status === "offen").length
    const inBearbeitung = orders.filter((o) => o.status === "in-bearbeitung").length
    const erledigt = orders.filter((o) => o.status === "erledigt").length
    const storniert = orders.filter((o) => o.status === "storniert").length
    const ueberfaellig = orders.filter(
      (o) =>
        isPast(startOfDay(o.date)) &&
        o.status !== "erledigt" &&
        o.status !== "storniert"
    ).length
    const relevant = total - storniert
    const quote = relevant > 0 ? Math.round((erledigt / relevant) * 100) : 0
    return { total, offen, inBearbeitung, erledigt, storniert, ueberfaellig, quote }
  }, [orders])

  // Auftragsentwicklung, abhängig vom gewählten Zeitraum
  const chartData = useMemo(() => {
    const now = new Date()
    if (range === "W" || range === "M") {
      // Tagesauflösung
      const days = range === "W" ? 7 : 30
      return eachDayOfInterval({ start: subDays(now, days - 1), end: now }).map((day) => ({
        label: range === "W" ? format(day, "EEE", { locale: de }) : format(day, "d.M.", { locale: de }),
        Aufträge: orders.filter((o) => isSameDay(o.date, day)).length,
      }))
    }
    if (range === "6M") {
      // Wochenauflösung
      return eachWeekOfInterval(
        { start: subWeeks(now, 25), end: now },
        { weekStartsOn: 1 }
      ).map((week) => ({
        label: format(week, "d.M.", { locale: de }),
        Aufträge: orders.filter((o) => isSameWeek(o.date, week, { weekStartsOn: 1 })).length,
      }))
    }
    // Jahr: Monatsauflösung
    return Array.from({ length: 12 }, (_, i) => {
      const month = startOfMonth(subMonths(now, 11 - i))
      return {
        label: format(month, "MMM", { locale: de }),
        Aufträge: orders.filter((o) => isSameMonth(o.date, month)).length,
      }
    })
  }, [orders, range])

  // Trend: aktueller Zeitraum vs. gleich langer Vorzeitraum
  const trend = useMemo(() => {
    const { days } = RANGES.find((r) => r.key === range)!
    const now = new Date()
    const currentStart = startOfDay(subDays(now, days - 1))
    const prevStart = startOfDay(subDays(now, days * 2 - 1))
    const current = orders.filter((o) => o.date >= currentStart && o.date <= now).length
    const previous = orders.filter((o) => o.date >= prevStart && o.date < currentStart).length
    const diff = previous > 0 ? Math.round(((current - previous) / previous) * 100) : null
    return { current, previous, diff }
  }, [orders, range])

  const chartAvg = useMemo(() => {
    if (chartData.length === 0) return 0
    return chartData.reduce((sum, d) => sum + d.Aufträge, 0) / chartData.length
  }, [chartData])

  // Linienfarbe wie in der Stocks-App: grün bei positivem, rot bei negativem Trend
  const lineColor = trend.diff !== null && trend.diff < 0 ? APPLE.red : APPLE.green

  // Status-Verteilung (für Donut)
  const statusData = useMemo(() => {
    return (Object.keys(ORDER_STATUS_LABELS) as OrderStatus[])
      .map((status) => ({
        status,
        name: ORDER_STATUS_LABELS[status],
        value: orders.filter((o) => o.status === status).length,
      }))
      .filter((entry) => entry.value > 0)
  }, [orders])

  // Top 5 Kunden nach Auftragsanzahl
  const topCustomers = useMemo(() => {
    return customers
      .map((customer) => ({
        name: customer.name,
        Aufträge: orders.filter((o) => o.customerId === customer.id).length,
      }))
      .filter((entry) => entry.Aufträge > 0)
      .sort((a, b) => b.Aufträge - a.Aufträge)
      .slice(0, 5)
  }, [orders, customers])

  // Auslastung nach Wochentag
  const weekdayData = useMemo(() => {
    return WEEKDAYS.map((label, index) => ({
      label,
      // getDay: 0 = Sonntag -> Index 6, 1 = Montag -> Index 0
      Aufträge: orders.filter((o) => (getDay(o.date) + 6) % 7 === index).length,
    }))
  }, [orders])

  const gewerkData = useMemo(() => {
    return GEWERKE.map((gewerk) => ({
      name: gewerk,
      Aufträge: orders.filter((o) => o.gewerk === gewerk).length,
    })).filter((entry) => entry.Aufträge > 0)
  }, [orders])

  const employeeData = useMemo(() => {
    return employees
      .map((employee) => ({
        name: employee.name,
        color: employee.color,
        Aufträge: orders.filter((o) => o.employeeId === employee.id).length,
      }))
      .sort((a, b) => b.Aufträge - a.Aufträge)
  }, [orders, employees])

  const kpis = [
    { label: "Aufträge gesamt", value: stats.total, icon: ClipboardList, tint: "bg-primary/10 text-primary" },
    { label: "Offen", value: stats.offen, icon: Circle, tint: "bg-status-open/10 text-status-open" },
    { label: "Erledigt", value: stats.erledigt, icon: CheckCircle2, tint: "bg-status-done/10 text-status-done" },
    { label: "Storniert", value: stats.storniert, icon: XCircle, tint: "bg-status-cancelled/10 text-status-cancelled" },
    { label: "Überfällig", value: stats.ueberfaellig, icon: AlertTriangle, tint: "bg-destructive/10 text-destructive" },
    { label: "Erledigungsquote", value: `${stats.quote}%`, icon: TrendingUp, tint: "bg-accent/10 text-accent" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Statistik</h1>
        <p className="text-muted-foreground">Ihr Geschäft auf einen Blick</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
        {kpis.map(({ label, value, icon: Icon, tint }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-3 px-4">
              <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${tint}`}>
                <Icon className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground truncate">{label}</p>
                <p className="text-xl font-semibold tabular-nums tracking-tight">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Auftragsentwicklung im Apple-Stocks-Stil */}
      <Card className="border-0 bg-[#0d0d0f] text-zinc-100 overflow-hidden">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base text-zinc-100">Auftragsentwicklung</CardTitle>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-semibold tabular-nums" style={{ color: lineColor }}>
                {trend.current}
              </span>
              <span className="text-xs text-zinc-400">
                Aufträge · {RANGES.find((r) => r.key === range)!.compare}
              </span>
              {trend.diff !== null && (
                <span className="flex items-center gap-0.5 text-xs font-medium tabular-nums" style={{ color: lineColor }}>
                  {trend.diff >= 0 ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                  {trend.diff >= 0 ? "+" : ""}{trend.diff}%
                </span>
              )}
            </div>
          </div>
          {/* Zeitraum-Auswahl wie in der Stocks-App */}
          <div className="flex items-center gap-1">
            {RANGES.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setRange(key)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                  range === key
                    ? "bg-zinc-700/70 text-white"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData} margin={{ top: 8, right: 0, bottom: 0, left: 8 }}>
              <defs>
                <linearGradient id="stocksFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={lineColor} stopOpacity={0.45} />
                  <stop offset="100%" stopColor={lineColor} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={true} horizontal={true} strokeDasharray="0" />
              <XAxis
                dataKey="label"
                stroke="#a1a1aa"
                fontSize={13}
                tickLine={false}
                axisLine={false}
                minTickGap={32}
              />
              <YAxis
                orientation="right"
                allowDecimals={false}
                stroke="#a1a1aa"
                fontSize={13}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <Tooltip
                cursor={{ stroke: "rgba(255,255,255,0.3)", strokeDasharray: "3 3" }}
                contentStyle={{
                  backgroundColor: "#1c1c1e",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 10,
                  fontSize: 12,
                  color: "#f4f4f5",
                }}
              />
              {/* Gestrichelte Durchschnittslinie wie die Vortageslinie bei Stocks */}
              <ReferenceLine
                y={chartAvg}
                stroke="rgba(255,255,255,0.4)"
                strokeDasharray="4 4"
                strokeWidth={1}
              />
              <Area
                type="monotone"
                dataKey="Aufträge"
                stroke={lineColor}
                strokeWidth={2.5}
                fill="url(#stocksFill)"
                dot={false}
                activeDot={{ r: 4, fill: lineColor, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Status-Verteilung */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status-Verteilung</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">Noch keine Aufträge vorhanden</p>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <ResponsiveContainer width="100%" height={220} className="max-w-[240px]">
                  <PieChart>
                    <Pie
                      data={statusData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      strokeWidth={0}
                    >
                      {statusData.map((entry) => (
                        <Cell key={entry.status} fill={STATUS_COLORS[entry.status]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 w-full sm:w-auto">
                  {statusData.map((entry) => (
                    <div key={entry.status} className="flex items-center gap-2 text-sm">
                      <span
                        className="size-3 rounded-full shrink-0"
                        style={{ backgroundColor: STATUS_COLORS[entry.status] }}
                      />
                      <span className="text-muted-foreground flex-1">{entry.name}</span>
                      <span className="font-semibold tabular-nums">{entry.value}</span>
                      <span className="text-xs text-muted-foreground tabular-nums w-11 text-right">
                        {stats.total > 0 ? Math.round((entry.value / stats.total) * 100) : 0}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top 5 Kunden */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top 5 Kunden</CardTitle>
          </CardHeader>
          <CardContent>
            {topCustomers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">Noch keine Aufträge vorhanden</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topCustomers} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} width={120} />
                  <Tooltip cursor={{ fill: "var(--muted)" }} contentStyle={tooltipStyle} />
                  <Bar dataKey="Aufträge" fill="var(--accent)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Aufträge pro Mitarbeiter */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aufträge pro Mitarbeiter</CardTitle>
          </CardHeader>
          <CardContent>
            {employeeData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">Keine Mitarbeiter vorhanden</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={employeeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} width={32} />
                  <Tooltip cursor={{ fill: "var(--muted)" }} contentStyle={tooltipStyle} />
                  <Bar dataKey="Aufträge" radius={[4, 4, 0, 0]}>
                    {employeeData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Auslastung nach Wochentag */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Auslastung nach Wochentag</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={weekdayData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} width={32} />
                <Tooltip cursor={{ fill: "var(--muted)" }} contentStyle={tooltipStyle} />
                <Bar dataKey="Aufträge" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Aufträge pro Gewerk */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Aufträge pro Gewerk</CardTitle>
          </CardHeader>
          <CardContent>
            {gewerkData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">
                Noch keine Aufträge mit Gewerk vorhanden
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(220, gewerkData.length * 44)}>
                <BarChart data={gewerkData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="var(--muted-foreground)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    width={210}
                  />
                  <Tooltip cursor={{ fill: "var(--muted)" }} contentStyle={tooltipStyle} />
                  <Bar dataKey="Aufträge" fill="var(--primary)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
