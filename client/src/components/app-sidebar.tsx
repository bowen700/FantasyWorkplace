import { Trophy, Settings, Award, Calendar, LayoutDashboard } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import type { Season } from "@shared/schema";

export function AppSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  const { data: activeSeason } = useQuery<Season>({
    queryKey: ["/api/seasons/active"],
    enabled: !!user,
  });

  const menuItems = [
    {
      title: "Matchup",
      url: "/",
      icon: Trophy,
      visible: true,
      primary: true,
    },
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
      visible: true,
      primary: true,
    },
    {
      title: "League",
      url: "/league",
      icon: Calendar,
      visible: true,
      primary: true,
    },
    {
      title: "Badges",
      url: "/badges",
      icon: Award,
      visible: true,
      primary: false,
    },
    {
      title: "Admin",
      url: "/admin",
      icon: Settings,
      visible: user?.role === "admin" || user?.role === "cio",
      primary: false,
    },
  ];

  return (
    <Sidebar>
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-2">
          <Trophy className="h-8 w-8 text-primary" />
          <div>
            <div className="font-display text-xl font-bold">Fantasy Workplace</div>
            {user && (
              <Badge variant="outline" className="mt-1 text-xs">
                {user.role === "admin" ? "Admin" : user.role === "cio" ? "CIO" : "Employee"}
              </Badge>
            )}
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems
                .filter((item) => item.visible)
                .map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={location === item.url}
                      data-testid={`nav-${item.title.toLowerCase()}`}
                      className={item.primary ? "" : "text-sm opacity-70"}
                    >
                      <Link href={item.url}>
                        <item.icon className={item.primary ? "h-4 w-4" : "h-3.5 w-3.5"} />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-6">
        {activeSeason && (
          <div className="text-sm text-muted-foreground">
            <div className="font-medium">{activeSeason.name}</div>
            <div className="text-xs">Week {activeSeason.currentWeek} of {activeSeason.regularSeasonWeeks + activeSeason.playoffWeeks}</div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
