"use client"

import { useEffect, useState } from "react"
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { QuickCapture } from "@/components/quick-capture"
import { LiveEvents } from "@/components/live-events"
import { Toaster } from "@/components/ui/sonner"
import { useStore } from "@/lib/store"
import { toast } from "sonner"

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const loadData = useStore((state) => state.loadData)
  const initialized = useStore((state) => state.initialized)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    if (!initialized && !loadError) {
      loadData().catch(() => {
        setLoadError(true)
        toast.error("Daten konnten nicht geladen werden. Bitte Seite neu laden.")
      })
    }
  }, [initialized, loadError, loadData])

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-40 flex items-center gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-3">
          <SidebarTrigger className="-ml-1" />
          <div className="flex-1">
            <QuickCapture />
          </div>
          <LiveEvents />
        </header>
        <main className="flex-1 p-6">
          {children}
        </main>
      </SidebarInset>
      <Toaster position="bottom-right" richColors />
    </SidebarProvider>
  )
}
