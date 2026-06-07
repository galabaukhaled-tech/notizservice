"use client"

import { useState, useMemo } from "react"
import { ChevronLeft, ChevronRight, Clock, CheckCircle2, Circle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useStore } from "@/lib/store"
import { OrderForm } from "@/components/order-form"
import type { Order, OrderStatus } from "@/lib/types"
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns"
import { de } from "date-fns/locale"
import { cn } from "@/lib/utils"

function StatusIcon({ status }: { status: OrderStatus }) {
  switch (status) {
    case "offen":
      return <Circle className="size-3 text-status-open" />
    case "in-bearbeitung":
      return <Clock className="size-3 text-status-progress" />
    case "erledigt":
      return <CheckCircle2 className="size-3 text-status-done" />
  }
}

export default function KalenderPage() {
  const customers = useStore((state) => state.customers)
  const employees = useStore((state) => state.employees)
  const orders = useStore((state) => state.orders)
  
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [viewMode, setViewMode] = useState<"month" | "week">("month")

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days: Date[] = []
    let day = calendarStart
    while (day <= calendarEnd) {
      days.push(day)
      day = addDays(day, 1)
    }
    return days
  }, [calendarStart, calendarEnd])

  // Week view
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  const weekDays = useMemo(() => {
    const days: Date[] = []
    for (let i = 0; i < 7; i++) {
      days.push(addDays(weekStart, i))
    }
    return days
  }, [weekStart])

  const getOrdersForDate = (date: Date) => {
    return orders
      .filter((order) => isSameDay(order.date, date))
      .sort((a, b) => {
        if (a.time && b.time) return a.time.localeCompare(b.time)
        if (a.time) return -1
        if (b.time) return 1
        return 0
      })
  }

  const getCustomerName = (customerId: string) => {
    return customers.find((c) => c.id === customerId)?.name || "Unbekannt"
  }

  const getEmployeeName = (employeeId: string) => {
    return employees.find((e) => e.id === employeeId)?.name || "Unbekannt"
  }

  const getEmployeeColor = (employeeId: string) => {
    return employees.find((e) => e.id === employeeId)?.color || "#888"
  }

  const selectedDateOrders = selectedDate ? getOrdersForDate(selectedDate) : []

  const navigatePrev = () => {
    if (viewMode === "month") {
      setCurrentDate(subMonths(currentDate, 1))
    } else {
      setCurrentDate(addDays(currentDate, -7))
    }
  }

  const navigateNext = () => {
    if (viewMode === "month") {
      setCurrentDate(addMonths(currentDate, 1))
    } else {
      setCurrentDate(addDays(currentDate, 7))
    }
  }

  const goToToday = () => {
    setCurrentDate(new Date())
    setSelectedDate(new Date())
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kalender</h1>
          <p className="text-muted-foreground">
            {viewMode === "month"
              ? format(currentDate, "MMMM yyyy", { locale: de })
              : `KW ${format(weekStart, "w")} - ${format(weekStart, "d. MMM", { locale: de })} bis ${format(addDays(weekStart, 6), "d. MMM yyyy", { locale: de })}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Heute
          </Button>
          <div className="flex border rounded-lg overflow-hidden">
            <Button
              variant={viewMode === "week" ? "default" : "ghost"}
              size="sm"
              className="rounded-none"
              onClick={() => setViewMode("week")}
            >
              Woche
            </Button>
            <Button
              variant={viewMode === "month" ? "default" : "ghost"}
              size="sm"
              className="rounded-none"
              onClick={() => setViewMode("month")}
            >
              Monat
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={navigatePrev}>
          <ChevronLeft className="size-5" />
        </Button>
        <h2 className="text-lg font-semibold">
          {viewMode === "month"
            ? format(currentDate, "MMMM yyyy", { locale: de })
            : `${format(weekStart, "d. MMM", { locale: de })} - ${format(addDays(weekStart, 6), "d. MMM", { locale: de })}`}
        </h2>
        <Button variant="ghost" size="icon" onClick={navigateNext}>
          <ChevronRight className="size-5" />
        </Button>
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-6">
        {/* Calendar Grid */}
        <Card>
          <CardContent className="p-4">
            {viewMode === "month" ? (
              <>
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 mb-2">
                  {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((day) => (
                    <div
                      key={day}
                      className="text-center text-sm font-medium text-muted-foreground py-2"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, index) => {
                    const dayOrders = getOrdersForDate(day)
                    const isCurrentMonth = isSameMonth(day, currentDate)
                    const isSelected = selectedDate && isSameDay(day, selectedDate)
                    const isTodayDate = isToday(day)

                    return (
                      <button
                        key={index}
                        onClick={() => setSelectedDate(day)}
                        className={cn(
                          "min-h-[70px] p-1 rounded-lg transition-colors text-left flex flex-col gap-0.5",
                          !isCurrentMonth && "opacity-30",
                          isSelected && "bg-primary text-primary-foreground",
                          !isSelected && isTodayDate && "bg-accent/20 border border-accent",
                          !isSelected && !isTodayDate && "hover:bg-secondary"
                        )}
                      >
                        <span
                          className={cn(
                            "text-sm font-medium leading-none mb-1",
                            isSelected && "text-primary-foreground"
                          )}
                        >
                          {format(day, "d")}
                        </span>
                        {dayOrders.slice(0, 2).map((order) => {
                          const color = getEmployeeColor(order.employeeId)
                          return (
                            <div
                              key={order.id}
                              className="w-full rounded text-[10px] px-1 py-0.5 truncate leading-tight"
                              style={{
                                backgroundColor: isSelected ? "rgba(255,255,255,0.2)" : `${color}25`,
                                borderLeft: `2px solid ${color}`,
                                color: isSelected ? "inherit" : color,
                              }}
                            >
                              {order.time && <span className="font-semibold mr-0.5">{order.time}</span>}
                              <span className={cn(!order.time && "font-medium")}>{order.description}</span>
                            </div>
                          )
                        })}
                        {dayOrders.length > 2 && (
                          <span className={cn(
                            "text-[10px] pl-1",
                            isSelected ? "text-primary-foreground/70" : "text-muted-foreground"
                          )}>
                            +{dayOrders.length - 2} weitere
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </>
            ) : (
              <>
                {/* Week View */}
                <div className="grid grid-cols-7 gap-2">
                  {weekDays.map((day, index) => {
                    const dayOrders = getOrdersForDate(day)
                    const isSelected = selectedDate && isSameDay(day, selectedDate)
                    const isTodayDate = isToday(day)

                    return (
                      <div key={index} className="flex flex-col">
                        <button
                          onClick={() => setSelectedDate(day)}
                          className={cn(
                            "text-center p-2 rounded-lg transition-colors mb-2",
                            isSelected && "bg-primary text-primary-foreground",
                            !isSelected && isTodayDate && "bg-accent/20 border border-accent",
                            !isSelected && !isTodayDate && "hover:bg-secondary"
                          )}
                        >
                          <div className="text-xs text-muted-foreground">
                            {format(day, "EEE", { locale: de })}
                          </div>
                          <div className="text-lg font-semibold">{format(day, "d")}</div>
                        </button>
                        <div className="space-y-1 min-h-[100px]">
                          {dayOrders.map((order) => {
                            const color = getEmployeeColor(order.employeeId)
                            return (
                              <button
                                key={order.id}
                                onClick={() => setSelectedOrder(order)}
                                className="w-full text-left p-2 rounded-md text-xs transition-all hover:scale-[1.02] hover:shadow-sm"
                                style={{
                                  backgroundColor: `${color}20`,
                                  borderLeft: `3px solid ${color}`,
                                }}
                              >
                                {order.time && (
                                  <p className="font-semibold tabular-nums">{order.time}</p>
                                )}
                                <p className="font-medium truncate">{order.description}</p>
                                <p className="text-muted-foreground truncate">
                                  {getCustomerName(order.customerId)}
                                </p>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Selected Date Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {selectedDate
                ? format(selectedDate, "EEEE, d. MMMM", { locale: de })
                : "Datum auswählen"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedDate ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Klicken Sie auf einen Tag im Kalender
              </p>
            ) : selectedDateOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Keine Termine an diesem Tag
              </p>
            ) : (
              <div className="space-y-3">
                {selectedDateOrders.map((order) => {
                  const color = getEmployeeColor(order.employeeId)
                  return (
                    <button
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className="w-full text-left p-3 rounded-lg border transition-all hover:shadow-sm"
                      style={{
                        backgroundColor: `${color}15`,
                        borderColor: `${color}40`,
                      }}
                    >
                      <div className="flex items-start gap-2">
                        <div
                          className="size-2 rounded-full mt-1.5 shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <div className="flex-1 min-w-0">
                          {order.time && (
                            <p className="text-xs font-semibold tabular-nums text-primary mb-0.5">{order.time} Uhr</p>
                          )}
                          <p className="font-medium text-sm truncate">{order.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {getCustomerName(order.customerId)}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <StatusIcon status={order.status} />
                            <Badge
                              variant="outline"
                              className={
                                order.category === "OM Haustechnik"
                                  ? "text-primary border-primary/30"
                                  : "text-accent border-accent/30"
                              }
                            >
                              {order.category === "OM Haustechnik" ? "HT" : "GS"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Employee Legend */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <span className="text-sm font-medium text-muted-foreground">Mitarbeiter:</span>
            {employees.map((employee) => (
              <div
                key={employee.id}
                className="flex items-center gap-2 px-2 py-1 rounded-md"
                style={{ backgroundColor: `${employee.color}20` }}
              >
                <div
                  className="size-3 rounded-full"
                  style={{ backgroundColor: employee.color }}
                />
                <span className="text-sm">{employee.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Auftrag bearbeiten</DialogTitle>
            <DialogDescription>
              Bearbeiten Sie die Auftragsdetails.
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <OrderForm
              order={selectedOrder}
              onSuccess={() => setSelectedOrder(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
