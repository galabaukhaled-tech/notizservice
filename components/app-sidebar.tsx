"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Calendar,
  UserCog,
  BarChart3,
  Wrench,
  Flower2,
  Building2,
  Home,
  Flame,
  Zap,
  Droplets,
  Siren,
  Bug,
  Handshake,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { GEWERKE, type Gewerk } from "@/lib/types"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const navigationItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Kunden",
    href: "/kunden",
    icon: Users,
  },
  {
    title: "Aufträge",
    href: "/auftraege",
    icon: ClipboardList,
  },
  {
    title: "Kalender",
    href: "/kalender",
    icon: Calendar,
  },
  {
    title: "Mitarbeiter",
    href: "/mitarbeiter",
    icon: UserCog,
  },
  {
    title: "Statistik",
    href: "/statistik",
    icon: BarChart3,
  },
]

const gewerkIcons: Record<Gewerk, LucideIcon> = {
  "OM Haustechnik": Wrench,
  "OMO Gartenservice": Flower2,
  "Gebäudedienstleistungen": Building2,
  "Hausmeisterservice": Home,
  "Heizungsservice": Flame,
  "Elektrotechnik": Zap,
  "Rohr-, Abfluss- & Kanalreinigung": Droplets,
  "Notdienst & Soforthilfe": Siren,
  "Kammerjäger": Bug,
  "Handwerksvermittlung": Handshake,
}

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-3 py-3">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-1.5 py-1 transition-colors hover:bg-sidebar-accent"
        >
          <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-sidebar-border bg-background shadow-sm">
            <Image
              src="/logo.png"
              alt="OM Haustechnik UG Logo"
              width={40}
              height={40}
              className="size-full object-contain p-1"
            />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-semibold text-sm tracking-tight">OM-Notiz</span>
            <span className="text-xs text-muted-foreground">Handwerksbetrieb</span>
          </div>
        </Link>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    className={cn(
                      "transition-colors",
                      pathname === item.href && "bg-sidebar-accent text-sidebar-accent-foreground"
                    )}
                  >
                    <Link href={item.href}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Bereiche</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {GEWERKE.map((gewerk) => {
                const Icon = gewerkIcons[gewerk]
                return (
                  <SidebarMenuItem key={gewerk}>
                    <SidebarMenuButton asChild>
                      <div className="flex items-center gap-2 text-muted-foreground cursor-default">
                        <Icon className="size-4" />
                        <span>{gewerk}</span>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
