"use client"

import { useEffect, useState } from "react"
import { Bell, X } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useStore } from "@/lib/store"
import { formatDistanceToNow } from "date-fns"
import { de } from "date-fns/locale"
import { cn } from "@/lib/utils"

export function LiveEvents() {
  const liveEvents = useStore((state) => state.liveEvents)
  const clearLiveEvents = useStore((state) => state.clearLiveEvents)
  const [isOpen, setIsOpen] = useState(false)
  const [hasNew, setHasNew] = useState(false)

  useEffect(() => {
    if (liveEvents.length > 0) {
      setHasNew(true)
    }
  }, [liveEvents])

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          setIsOpen(!isOpen)
          setHasNew(false)
        }}
        className="relative"
      >
        <Bell className="size-5" />
        {hasNew && liveEvents.length > 0 && (
          <span className="absolute top-1 right-1 size-2 rounded-full bg-accent animate-pulse" />
        )}
      </Button>

      {isOpen && (
        <Card className="absolute right-0 top-full mt-2 w-80 p-4 z-50 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Live Updates</h3>
            {liveEvents.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearLiveEvents}>
                <X className="size-4" />
              </Button>
            )}
          </div>

          {liveEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Keine neuen Ereignisse
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {liveEvents.map((event) => (
                <div
                  key={event.id}
                  className={cn(
                    "p-2 rounded-lg text-sm",
                    event.type === "order-created" && "bg-accent/10",
                    event.type === "order-updated" && "bg-primary/10",
                    event.type === "customer-created" && "bg-secondary"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      {event.type === "order-created" && "Auftrag"}
                      {event.type === "order-updated" && "Update"}
                      {event.type === "customer-created" && "Kunde"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(event.timestamp, {
                        addSuffix: true,
                        locale: de,
                      })}
                    </span>
                  </div>
                  <p className="text-foreground">{event.message}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
