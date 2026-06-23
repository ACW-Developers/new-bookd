import { Link, useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, Calendar, ListChecks, Clock, Bell, User, BarChart3, Settings, LogOut, Search, ShieldCheck } from "lucide-react";
import { Logo } from "./logo";
import { Input } from "./ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const baseItems: { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/calendar", label: "Calendar", icon: Calendar },
  { to: "/dashboard/bookings", label: "Bookings", icon: ListChecks },
  { to: "/dashboard/availability", label: "Availability", icon: Clock },
  { to: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { to: "/dashboard/profile", label: "Profile", icon: User },
  { to: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function DashboardShell({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle?: string }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { profile, user, isAdmin, signOut } = useAuth();

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
  });

  const items = isAdmin ? [...baseItems, { to: "/admin", label: "Admin", icon: ShieldCheck }] : baseItems;

  const onLogout = async () => {
    await signOut();
    navigate("/");
  };

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
                  <it.icon className="h-4 w-4" /> {it.label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-sidebar-border p-3">
            <button onClick={onLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-sidebar-accent">
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/85 px-4 backdrop-blur-xl sm:px-8">
            <div className="lg:hidden"><Logo /></div>
            <div className="relative hidden flex-1 max-w-md sm:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search bookings, clients, events…" className="h-10 border-0 bg-muted pl-9 shadow-none focus-visible:ring-1" />
            </div>
            <div className="ml-auto flex items-center gap-3">
              <Link to="/dashboard/notifications" className="relative rounded-full border border-border bg-card p-2 hover:bg-accent">
                <Bell className="h-4 w-4" />
                {unread > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />}
              </Link>
              <div className="flex items-center gap-2">
                <img
                  src={profile?.avatar_url ?? `https://i.pravatar.cc/100?u=${user?.id ?? "me"}`}
                  alt={profile?.full_name ?? "Me"}
                  className="h-9 w-9 rounded-full object-cover ring-2 ring-primary/20"
                />
                <div className="hidden text-sm sm:block">
                  <p className="font-medium leading-tight">{profile?.full_name ?? user?.email}</p>
                  <p className="text-xs text-muted-foreground">{isAdmin ? "Admin" : profile?.is_professional ? "Professional" : "Client"}</p>
                </div>
              </div>
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
