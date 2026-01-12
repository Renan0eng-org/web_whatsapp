"use client"

import * as React from "react"

import { NavMain } from "@/components/nav-main"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useAuth } from "@/hooks/use-auth"
import { data } from "@/lib/nav"
import { NavUser } from "./nav-user"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // const [sideItems, setSideItems] = React.useState<Menu>({ navMain: [], flow: [] })
  const { user } = useAuth()

  const filteredMenu = React.useMemo(() => {
    if (!user?.nivel_acesso?.menus) {
      return { navMain: [], flow: [] };
    }

    const userPermissions = new Set(
      user.nivel_acesso.menus
        .filter(permission => permission.visualizar)
        .map(permission => permission.slug)
    );

    const filterRecursive = (items: any[]) => {
      return items.reduce((acc, item) => {
        const isPublic = !item.nivel_acesso;
        const hasPermission = userPermissions.has(item.nivel_acesso);

        if (isPublic || hasPermission) {
          const newItem = { ...item };

          if (item.items) {
            newItem.items = filterRecursive(item.items);
          }

          acc.push(newItem);
        }

        return acc;
      }, []);
    };

    return {
      navMain: filterRecursive(data.navMain),
      flow: filterRecursive(data.flow),
    };
  }, [user]);

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/admin">
                <div className="flex aspect-square size-14 items-center justify-center rounded-lg  text-text">
                  <img src="/logo.webp" alt="Logo" className="h-14 w-14" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Meu APP</span>
                  {
                    user?.nivel_acesso.nome ? (
                      <span className="truncate text-xs">{user?.nivel_acesso.nome}</span>
                    ) :
                      (
                        <div className="animate-pulse h-4 w-24 rounded-sm bg-white" />
                      )
                  }
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {filteredMenu.flow.length > 0 && <NavMain items={filteredMenu.flow} title="Fluxos" />}
        {filteredMenu.navMain.length > 0 && <NavMain items={filteredMenu.navMain} title="Menu" />}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}

