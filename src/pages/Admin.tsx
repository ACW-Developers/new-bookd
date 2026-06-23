import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Users, Briefcase, Calendar, DollarSign, ShieldCheck, BarChart3 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { toast } from "sonner";

export default function Admin() {
  const { loading, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!isAdmin) {
      toast.error("Admins only");
      navigate("/dashboard");
    }
  }, [loading, isAdmin, navigate]);

  const { data: profiles = [] } = useQuery({
    queryKey: ["admin-profiles"],
    enabled: isAdmin,
    queryFn: async () => (await supabase.from("profiles").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const { data: bookings = [] } = useQuery({
    queryKey: ["admin-bookings"],
    enabled: isAdmin,
    queryFn: async () => (await supabase.from("bookings").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["admin-cats"],
    enabled: isAdmin,
    queryFn: async () => (await supabase.from("categories").select("*").order("name")).data ?? [],
  });

  if (!isAdmin) return null;

  const pros = profiles.filter((p) => p.is_professional);
  const now = new Date();
  const mtdISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const mtdCount = bookings.filter((b) => b.created_at >= mtdISO).length;

  const kpis = [
    { label: "Total Users", value: profiles.length.toLocaleString(), icon: Users, tint: "text-primary bg-primary/10" },
    { label: "Active Professionals", value: pros.length.toLocaleString(), icon: Briefcase, tint: "text-navy bg-navy/10" },
    { label: "Bookings (MTD)", value: mtdCount.toLocaleString(), icon: Calendar, tint: "text-success bg-success/10" },
    { label: "Total Bookings", value: bookings.length.toLocaleString(), icon: DollarSign, tint: "text-warning bg-warning/10" },
  ];

  const trend = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return { m: d.toLocaleDateString("en-US", { month: "short" }), v: bookings.filter((b) => b.created_at.startsWith(ym)).length };
  });

  return (
    <DashboardShell title="Admin Panel" subtitle="BOOKD platform overview & moderation.">
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
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold"><BarChart3 className="h-5 w-5 text-primary" /> Booking trends</h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.015 255)" />
                <XAxis dataKey="m" stroke="oklch(0.50 0.04 257)" fontSize={12} />
                <YAxis allowDecimals={false} stroke="oklch(0.50 0.04 257)" fontSize={12} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid oklch(0.92 0.015 255)" }} />
                <Bar dataKey="v" fill="oklch(0.55 0.22 263)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
          <h2 className="flex items-center gap-2 text-lg font-semibold"><ShieldCheck className="h-5 w-5 text-primary" /> Recent professionals</h2>
          <div className="mt-4 space-y-3">
            {pros.slice(0, 5).map((p) => (
              <div key={p.id} className="flex items-center gap-3">
                <img src={p.avatar_url ?? `https://i.pravatar.cc/100?u=${p.id}`} alt={p.full_name} className="h-10 w-10 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.full_name}</p>
                  <p className="truncate text-xs text-muted-foreground">{p.profession ?? "—"}</p>
                </div>
                <Button asChild size="sm" variant="outline">
                  <a href={`/professionals/${p.id}`}>View</a>
                </Button>
              </div>
            ))}
            {pros.length === 0 && <p className="text-sm text-muted-foreground">No professionals yet.</p>}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
          <h2 className="mb-4 text-lg font-semibold">Recent bookings</h2>
          <div className="divide-y divide-border">
            {bookings.slice(0, 6).map((b) => (
              <div key={b.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{b.event_name}</p>
                  <p className="truncate text-xs text-muted-foreground">{b.client_name} · {b.event_date}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                  b.status === "approved" ? "bg-success/10 text-success" :
                  b.status === "pending" ? "bg-warning/10 text-warning" :
                  b.status === "completed" ? "bg-primary/10 text-primary" :
                  "bg-destructive/10 text-destructive"
                }`}>{b.status}</span>
              </div>
            ))}
            {bookings.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No bookings yet.</p>}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
          <h2 className="mb-4 text-lg font-semibold">Categories</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <span key={c.id} className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">{c.name}</span>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
