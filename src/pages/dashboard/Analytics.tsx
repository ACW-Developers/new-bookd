import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "@/components/dashboard-shell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";

const colors = ["oklch(0.55 0.22 263)", "oklch(0.72 0.15 255)", "oklch(0.65 0.17 152)", "oklch(0.78 0.16 70)", "oklch(0.62 0.22 25)"];

export default function AnalyticsPage() {
  const { user, isProfessional, profile } = useAuth();

  const { data: bookings = [] } = useQuery({
    queryKey: ["analytics-bookings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const col = isProfessional ? "professional_id" : "client_id";
      const { data } = await supabase.from("bookings").select("*").eq(col, user!.id);
      return data ?? [];
    },
  });

  const monthly = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const inMonth = bookings.filter((b) => b.event_date.startsWith(ym));
    const rate = Number(profile?.hourly_rate ?? 0);
    const hours = inMonth.reduce((s, b) => {
      const [sh, sm] = b.start_time.split(":").map(Number);
      const [eh, em] = b.end_time.split(":").map(Number);
      return s + Math.max(0, eh + em / 60 - sh - sm / 60);
    }, 0);
    return {
      m: d.toLocaleDateString("en-US", { month: "short" }),
      bookings: inMonth.length,
      revenue: Math.round(hours * rate),
    };
  });

  const statusBuckets = ["pending", "approved", "completed", "cancelled", "declined"] as const;
  const sources = statusBuckets
    .map((s) => ({ name: s, value: bookings.filter((b) => b.status === s).length }))
    .filter((s) => s.value > 0);

  const thisMonth = monthly[monthly.length - 1];
  const decided = bookings.filter((b) => b.status !== "pending").length || 1;
  const acceptance = Math.round((bookings.filter((b) => b.status === "approved" || b.status === "completed").length / decided) * 100);

  return (
    <DashboardShell title="Analytics" subtitle="Track performance, revenue and booking trends.">
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { l: "Bookings this month", v: thisMonth?.bookings ?? 0 },
          { l: "Revenue this month", v: `Ksh ${(thisMonth?.revenue ?? 0).toLocaleString()}` },
          { l: "Total bookings", v: bookings.length },
          { l: "Acceptance rate", v: `${acceptance}%` },
        ].map((s) => (
          <div key={s.l} className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
            <p className="text-sm text-muted-foreground">{s.l}</p>
            <p className="mt-1 text-2xl font-bold">{s.v}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] lg:col-span-2">
          <h2 className="text-lg font-semibold">Bookings & revenue (last 6 months)</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer>
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.015 255)" />
                <XAxis dataKey="m" stroke="oklch(0.50 0.04 257)" fontSize={12} />
                <YAxis stroke="oklch(0.50 0.04 257)" fontSize={12} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid oklch(0.92 0.015 255)" }} />
                <Bar dataKey="bookings" fill="oklch(0.55 0.22 263)" radius={[8, 8, 0, 0]} />
                <Bar dataKey="revenue" fill="oklch(0.72 0.15 255)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
          <h2 className="text-lg font-semibold">Bookings by status</h2>
          <div className="mt-4 h-72">
            {sources.length === 0 ? (
              <div className="grid h-full place-items-center text-sm text-muted-foreground">No data yet</div>
            ) : (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={sources} dataKey="value" innerRadius={50} outerRadius={90} paddingAngle={3}>
                    {sources.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">Revenue estimated from booked hours × your hourly rate.</p>
    </DashboardShell>
  );
}
