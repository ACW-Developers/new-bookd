import { Link } from "react-router-dom";
import { Calendar, CheckCircle2, Clock, TrendingUp, MapPin, ArrowUpRight, Search as SearchIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { ProfessionalCard } from "@/components/professional-card";
import { CategoriesCarousel } from "@/components/categories-carousel";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/services/supabaseQueries";
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";

export default function DashboardHome() {
  const { user, profile, isProfessional } = useAuth();
  const { data: featuredPros = [] } = useQuery({
    queryKey: ["dash-featured-pros"],
    enabled: !!user && !isProfessional,
    queryFn: api.featuredPros,
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ["my-bookings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const col = isProfessional ? "professional_id" : "client_id";
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq(col, user!.id)
        .order("event_date", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ["my-notifications", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("notifications").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(5)).data ?? [],
  });

  const today = new Date().toISOString().slice(0, 10);
  const in7 = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const upcoming = bookings.filter((b) => b.event_date >= today && (b.status === "approved" || b.status === "pending"));
  const todayList = bookings.filter((b) => b.event_date === today && b.status === "approved");
  const pending = bookings.filter((b) => b.status === "pending").length;
  const completed = bookings.filter((b) => b.status === "completed").length;
  const upcoming7 = bookings.filter((b) => b.event_date >= today && b.event_date <= in7 && b.status === "approved").length;

  const kpis = [
    { label: "Total Bookings", value: bookings.length, change: "all time", icon: Calendar, tint: "text-primary bg-primary/10" },
    { label: "Upcoming (7d)", value: upcoming7, change: "Next 7 days", icon: Clock, tint: "text-warning bg-warning/10" },
    { label: "Pending Requests", value: pending, change: pending ? "Action needed" : "All caught up", icon: TrendingUp, tint: "text-navy bg-navy/10" },
    { label: "Completed", value: completed, change: "All time", icon: CheckCircle2, tint: "text-success bg-success/10" },
  ];

  const chart = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    const iso = d.toISOString().slice(0, 10);
    return {
      day: d.toLocaleDateString("en-US", { weekday: "short" }),
      bookings: bookings.filter((b) => b.created_at?.slice(0, 10) === iso).length,
    };
  });

  return (
    <DashboardShell title={`Welcome back, ${profile?.full_name?.split(" ")[0] ?? "there"}`} subtitle="Here's what's happening with your bookings today.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{k.label}</p>
                <p className="mt-1 text-3xl font-bold tracking-tight">{k.value}</p>
              </div>
              <div className={`grid h-10 w-10 place-items-center rounded-xl ${k.tint}`}><k.icon className="h-5 w-5" /></div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{k.change}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Weekly booking activity</h2>
              <p className="text-sm text-muted-foreground">New requests in the last 7 days</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer>
              <LineChart data={chart}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="oklch(0.55 0.22 263)" />
                    <stop offset="100%" stopColor="oklch(0.72 0.15 255)" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.015 255)" />
                <XAxis dataKey="day" stroke="oklch(0.50 0.04 257)" fontSize={12} />
                <YAxis allowDecimals={false} stroke="oklch(0.50 0.04 257)" fontSize={12} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid oklch(0.92 0.015 255)" }} />
                <Line type="monotone" dataKey="bookings" stroke="url(#g1)" strokeWidth={3} dot={{ r: 4, fill: "oklch(0.55 0.22 263)" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
          <h2 className="text-lg font-semibold">Today's schedule</h2>
          <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
          <div className="mt-4 space-y-3">
            {todayList.length === 0 && <p className="text-sm text-muted-foreground">No events today.</p>}
            {todayList.map((b) => (
              <div key={b.id} className="rounded-xl border border-primary/15 bg-primary/5 p-4">
                <p className="font-semibold">{b.event_name}</p>
                <p className="text-sm text-muted-foreground">{b.client_name}</p>
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {b.start_time.slice(0, 5)}–{b.end_time.slice(0, 5)}</span>
                  {b.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {b.location}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Upcoming events</h2>
            <Button asChild variant="ghost" size="sm"><Link to="/dashboard/bookings">View all <ArrowUpRight className="ml-1 h-3 w-3" /></Link></Button>
          </div>
          <div className="divide-y divide-border">
            {upcoming.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No upcoming events.</p>}
            {upcoming.slice(0, 5).map((b) => (
              <div key={b.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{b.event_name}</p>
                  <p className="truncate text-sm text-muted-foreground">{b.client_name} · {b.event_date} · {b.start_time.slice(0, 5)}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                  b.status === "approved" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                }`}>{b.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
          <h2 className="text-lg font-semibold">Recent activity</h2>
          <div className="mt-4 space-y-3">
            {notifications.length === 0 && <p className="text-sm text-muted-foreground">No notifications yet.</p>}
            {notifications.map((n) => (
              <div key={n.id} className="flex gap-3 rounded-xl p-2 hover:bg-muted/50">
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${!n.read ? "bg-primary" : "bg-border"}`} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{n.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{n.body}</p>
                  <p className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {!isProfessional && (
        <>
          <section className="mt-10">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Browse by category</h2>
                <p className="text-sm text-muted-foreground">Pick a category to find the right professional.</p>
              </div>
            </div>
            <CategoriesCarousel />
          </section>

          <section className="mt-10">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Featured professionals</h2>
                <p className="text-sm text-muted-foreground">Top-rated and ready to book.</p>
              </div>
              <Button asChild variant="ghost" size="sm"><Link to="/search"><SearchIcon className="mr-1 h-3.5 w-3.5" /> See all</Link></Button>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featuredPros.map((p) => <ProfessionalCard key={p.id} p={p} />)}
              {featuredPros.length === 0 && (
                <div className="col-span-full grid place-items-center rounded-2xl border border-dashed border-border py-10 text-sm text-muted-foreground">No professionals available yet.</div>
              )}
            </div>
          </section>
        </>
      )}
    </DashboardShell>
  );
}
