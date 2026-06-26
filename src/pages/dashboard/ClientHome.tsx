import { Link } from "react-router-dom";
import { Calendar, CheckCircle2, Clock, ListChecks, ArrowRight, Search as SearchIcon, MessageSquare } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProfessionalCard } from "@/components/professional-card";
import { CategoriesCarousel } from "@/components/categories-carousel";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/services/supabaseQueries";

export default function ClientHome() {
  const { user, profile } = useAuth();

  const { data: bookings = [] } = useQuery({
    queryKey: ["client-bookings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("bookings")
        .select("*")
        .eq("client_id", user!.id)
        .order("event_date", { ascending: true });
      return data ?? [];
    },
  });

  const { data: pros = [] } = useQuery({ queryKey: ["dash-featured-pros"], queryFn: api.featuredPros });

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = bookings.filter((b) => b.event_date >= today && (b.status === "approved" || b.status === "pending"));
  const pending = bookings.filter((b) => b.status === "pending").length;
  const approved = bookings.filter((b) => b.status === "approved" && b.event_date >= today).length;
  const completed = bookings.filter((b) => b.status === "completed").length;

  const kpis = [
    { label: "Upcoming", value: approved, icon: Calendar, tint: "text-primary bg-primary/10" },
    { label: "Pending approval", value: pending, icon: Clock, tint: "text-warning bg-warning/10" },
    { label: "Total bookings", value: bookings.length, icon: ListChecks, tint: "text-navy bg-navy/10" },
    { label: "Completed", value: completed, icon: CheckCircle2, tint: "text-success bg-success/10" },
  ];

  return (
    <DashboardShell title={`Hi ${profile?.full_name?.split(" ")[0] ?? "there"}, who are you booking today?`} subtitle="Find vetted professionals, request bookings, and chat to lock in the details.">
      <div className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/15 via-card to-card p-6 shadow-[var(--shadow-soft)]">
        <div className="grid items-end gap-4 sm:grid-cols-[1fr_auto]">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Find your next professional</h2>
            <p className="text-sm text-muted-foreground">Search by name, skill, category or location.</p>
            <form action="/dashboard/discover" className="mt-4 flex max-w-xl gap-2">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input name="q" className="h-11 pl-9 bg-card" placeholder="e.g. wedding photographer in Nairobi" />
              </div>
              <Button asChild className="gradient-primary"><Link to="/dashboard/discover">Browse</Link></Button>
            </form>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{k.label}</p>
                <p className="mt-1 text-3xl font-bold tracking-tight">{k.value}</p>
              </div>
              <div className={`grid h-10 w-10 place-items-center rounded-xl ${k.tint}`}><k.icon className="h-5 w-5" /></div>
            </div>
          </div>
        ))}
      </div>

      <section className="mt-8">
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
          <Button asChild variant="ghost" size="sm"><Link to="/dashboard/discover">See all <ArrowRight className="ml-1 h-3 w-3" /></Link></Button>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {pros.map((p) => <ProfessionalCard key={p.id} p={p} />)}
          {pros.length === 0 && (
            <div className="col-span-full grid place-items-center rounded-2xl border border-dashed border-border py-10 text-sm text-muted-foreground">
              No professionals available yet.
            </div>
          )}
        </div>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Your upcoming bookings</h2>
            <Button asChild variant="ghost" size="sm"><Link to="/dashboard/bookings">View all <ArrowRight className="ml-1 h-3 w-3" /></Link></Button>
          </div>
          <div className="divide-y divide-border">
            {upcoming.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No upcoming bookings — find someone and book them!</p>}
            {upcoming.slice(0, 5).map((b) => (
              <div key={b.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{b.event_name}</p>
                  <p className="truncate text-sm text-muted-foreground">{b.event_date} · {b.start_time?.slice(0,5)}{b.location ? ` · ${b.location}` : ""}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${b.status === "approved" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>{b.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
          <h2 className="text-lg font-semibold">Quick links</h2>
          <div className="mt-4 grid gap-2">
            <Button asChild variant="outline" className="justify-start"><Link to="/dashboard/discover"><SearchIcon className="mr-2 h-4 w-4" /> Discover professionals</Link></Button>
            <Button asChild variant="outline" className="justify-start"><Link to="/dashboard/messages"><MessageSquare className="mr-2 h-4 w-4" /> Open messages</Link></Button>
            <Button asChild variant="outline" className="justify-start"><Link to="/dashboard/bookings"><ListChecks className="mr-2 h-4 w-4" /> My bookings</Link></Button>
          </div>
        </div>
      </section>
    </DashboardShell>
  );
}
