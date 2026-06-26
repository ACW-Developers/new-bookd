import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Calendar, ListChecks, Clock, Bell, User, BarChart3, Settings, Search, ShieldCheck, MessageSquare, CalendarDays, Compass } from "lucide-react";
import { Logo } from "./logo";
import { Input } from "./ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserMenu } from "@/components/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";

const proItems: { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/calendar", label: "Calendar", icon: Calendar },
  { to: "/dashboard/bookings", label: "Bookings", icon: ListChecks },
  { to: "/dashboard/availability", label: "Availability", icon: Clock },
  { to: "/dashboard/schedule", label: "Schedule", icon: CalendarDays },
  { to: "/dashboard/messages", label: "Messages", icon: MessageSquare },
  { to: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { to: "/dashboard/profile", label: "Profile", icon: User },
  { to: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
];

const clientItems: { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }[] = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/discover", label: "Discover", icon: Compass },
  { to: "/dashboard/bookings", label: "My Bookings", icon: ListChecks },
  { to: "/dashboard/messages", label: "Messages", icon: MessageSquare },
  { to: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { to: "/dashboard/profile", label: "Profile", icon: User },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function DashboardShell({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle?: string }) {
  const { pathname } = useLocation();
  const { user, isAdmin, isProfessional } = useAuth();
  const baseItems = isProfessional ? proItems : clientItems;

  const { data: unread = 0 } = useQuery({
    queryKey: ["unread-count", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("read", false);
      return count ?? 0;
    },
    refetchInterval: 30_000,
  });

  const { data: unreadMsgs = 0 } = useQuery({
    queryKey: ["unread-msgs", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("recipient_id", user!.id)
        .eq("read", false);
      return count ?? 0;
    },
    refetchInterval: 20_000,
  });

  const itemsWithBadges = baseItems.map((it) => ({
    ...it,
    badge: it.to === "/dashboard/messages" ? unreadMsgs : it.to === "/dashboard/notifications" ? unread : 0,
  }));
  const items = isAdmin ? [...itemsWithBadges, { to: "/admin", label: "Admin", icon: ShieldCheck, badge: 0 }] : itemsWithBadges;

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="flex">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
          <div className="px-5 py-5"><Logo /></div>
          <nav className="flex-1 space-y-1 px-3">
            {items.map((it) => {
              const active = it.exact ? pathname === it.to : pathname === it.to || pathname.startsWith(it.to + "/");
              return (
                <Link
                  key={it.to}
                  to={it.to}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                    active ? "gradient-primary text-primary-foreground shadow-[var(--shadow-soft)]" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }`}
                >
                  <it.icon className="h-4 w-4" /> <span className="flex-1">{it.label}</span>
                  {it.badge > 0 && (
                    <span className={`grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[10px] font-bold ${active ? "bg-white/25 text-white" : "bg-primary text-primary-foreground"}`}>
                      {it.badge > 9 ? "9+" : it.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/85 px-4 backdrop-blur-xl sm:px-8">
            <div className="lg:hidden"><Logo /></div>
            <div className="relative hidden flex-1 max-w-md sm:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search bookings, clients, events…" className="h-10 border-0 bg-muted pl-9 shadow-none focus-visible:ring-1" />
            </div>
            <div className="ml-auto flex items-center gap-3">
              <ThemeToggle />
              <Link to="/dashboard/notifications" className="relative rounded-full border border-border bg-card p-2 hover:bg-accent" aria-label="Notifications">
                <Bell className="h-4 w-4" />
                {unread > 0 && (
                  <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
              <UserMenu />
            </div>
          </header>

          <main className="px-4 py-6 sm:px-8 sm:py-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
              {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
            </div>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
