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
  Wrench,
  Flower2,
} from "lucide-react"
import { cn } from "@/lib/utils"
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
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="OM Haustechnik UG Logo"
            width={48}
            height={48}
            className="shrink-0"
          />
          <div className="flex flex-col">
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
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <div className="flex items-center gap-2 text-muted-foreground cursor-default">
                    <Wrench className="size-4 text-primary" />
                    <span>OM Haustechnik</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <div className="flex items-center gap-2 text-muted-foreground cursor-default">
                    <Flower2 className="size-4 text-accent" />
                    <span>OMO Gartenservice</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
