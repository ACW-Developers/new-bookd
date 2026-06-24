import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Users, Briefcase, Calendar, BarChart3, ShieldCheck, Activity, Trash2, Search } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line } from "recharts";
import { toast } from "sonner";
import { UserAvatar } from "@/components/user-avatar";

type AdminTab = "overview" | "users" | "activity" | "bookings";

export default function Admin() {
  const { loading, isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<AdminTab>("overview");

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

  if (!isAdmin) return null;

  const pros = profiles.filter((p) => p.is_professional);
  const now = new Date();
  const mtdISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const mtdCount = bookings.filter((b) => b.created_at >= mtdISO).length;

  const kpis = [
    { label: "Total Users", value: profiles.length, icon: Users, tint: "text-primary bg-primary/10" },
    { label: "Professionals", value: pros.length, icon: Briefcase, tint: "text-navy bg-navy/10" },
    { label: "Bookings (MTD)", value: mtdCount, icon: Calendar, tint: "text-success bg-success/10" },
    { label: "Total Bookings", value: bookings.length, icon: BarChart3, tint: "text-warning bg-warning/10" },
  ];

  const trend = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return { m: d.toLocaleDateString("en-US", { month: "short" }), v: bookings.filter((b) => b.created_at.startsWith(ym)).length };
  });

  const signupTrend = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const day = d.toISOString().slice(0, 10);
    return { d: d.toLocaleDateString("en-US", { day: "2-digit", month: "short" }), v: profiles.filter((p) => p.created_at.startsWith(day)).length };
  });

  const TabBtn = ({ id, icon: I, children }: { id: AdminTab; icon: any; children: React.ReactNode }) => (
    <button
      onClick={() => setTab(id)}
      className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${tab === id ? "gradient-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
    >
      <I className="h-4 w-4" /> {children}
    </button>
  );

  return (
    <DashboardShell title="Admin Panel" subtitle="BOOKD platform overview, users & activity.">
      <div className="mb-5 flex flex-wrap gap-1 rounded-xl border border-border bg-card p-1 shadow-[var(--shadow-soft)]">
        <TabBtn id="overview" icon={BarChart3}>Overview</TabBtn>
        <TabBtn id="users" icon={Users}>Users</TabBtn>
        <TabBtn id="activity" icon={Activity}>Activity Logs</TabBtn>
        <TabBtn id="bookings" icon={Calendar}>Bookings</TabBtn>
      </div>

      {tab === "overview" && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map((k) => (
              <div key={k.label} className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{k.label}</p>
                    <p className="mt-1 text-3xl font-bold tracking-tight">{k.value.toLocaleString()}</p>
                  </div>
                  <div className={`grid h-10 w-10 place-items-center rounded-xl ${k.tint}`}><k.icon className="h-5 w-5" /></div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] lg:col-span-2">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><BarChart3 className="h-5 w-5 text-primary" /> Booking trends · 6 mo</h2>
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
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><Users className="h-5 w-5 text-primary" /> Signups · 14d</h2>
              <div className="h-64">
                <ResponsiveContainer>
                  <LineChart data={signupTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.015 255)" />
                    <XAxis dataKey="d" stroke="oklch(0.50 0.04 257)" fontSize={10} />
                    <YAxis allowDecimals={false} stroke="oklch(0.50 0.04 257)" fontSize={12} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid oklch(0.92 0.015 255)" }} />
                    <Line type="monotone" dataKey="v" stroke="oklch(0.55 0.22 263)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><ShieldCheck className="h-5 w-5 text-primary" /> Recent professionals</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {pros.slice(0, 6).map((p) => (
                <div key={p.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                  <UserAvatar src={p.avatar_url} name={p.full_name} seed={p.id} className="h-10 w-10 rounded-xl text-xs" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.full_name}</p>
                    <p className="truncate text-xs text-muted-foreground">{p.profession ?? "—"}</p>
                  </div>
                  <Button asChild size="sm" variant="outline"><a href={`/professionals/${p.id}`}>View</a></Button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {tab === "users" && <UsersTab meId={user?.id} />}
      {tab === "activity" && <ActivityTab />}
      {tab === "bookings" && <BookingsTab />}
    </DashboardShell>
  );
}

/* ---------- USERS ---------- */
function UsersTab({ meId }: { meId?: string }) {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const { data: users = [] } = useQuery({
    queryKey: ["admin-users-with-roles", q],
    queryFn: async () => {
      const profQ = supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (q.trim()) profQ.or(`full_name.ilike.%${q.trim()}%,email.ilike.%${q.trim()}%`);
      const [{ data: ps }, { data: rs }] = await Promise.all([profQ, supabase.from("user_roles").select("*")]);
      const byUser = new Map<string, string[]>();
      for (const r of rs ?? []) byUser.set(r.user_id, [...(byUser.get(r.user_id) ?? []), r.role]);
      return (ps ?? []).map((p) => ({ ...p, roles: byUser.get(p.id) ?? [] }));
    },
  });

  const toggleRole = useMutation({
    mutationFn: async ({ userId, role, has }: { userId: string; role: "admin" | "professional" | "client"; has: boolean }) => {
      if (has) {
        const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users-with-roles"] }); toast.success("Role updated"); },
    onError: (e: any) => toast.error(e.message),
  });

  const removeUser = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("profiles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users-with-roles"] }); toast.success("Profile removed"); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Users ({users.length})</h2>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="pl-9" />
        </div>
      </div>
      <div className="divide-y divide-border">
        {users.map((u) => {
          const isMe = u.id === meId;
          const isAdmin = u.roles.includes("admin");
          const isPro = u.roles.includes("professional");
          return (
            <div key={u.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 py-3">
              <UserAvatar src={u.avatar_url} name={u.full_name} seed={u.id} className="h-10 w-10 rounded-xl text-xs" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{u.full_name} {isMe && <span className="text-xs text-muted-foreground">(you)</span>}</p>
                <p className="truncate text-xs text-muted-foreground">{u.email} · {u.roles.join(", ") || "no roles"}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant={isAdmin ? "default" : "outline"} disabled={isMe} onClick={() => toggleRole.mutate({ userId: u.id, role: "admin", has: isAdmin })}>{isAdmin ? "Admin ✓" : "Make admin"}</Button>
                <Button size="sm" variant={isPro ? "default" : "outline"} onClick={() => toggleRole.mutate({ userId: u.id, role: "professional", has: isPro })}>{isPro ? "Pro ✓" : "Make pro"}</Button>
                <Button size="sm" variant="outline" className="text-destructive" disabled={isMe} onClick={() => { if (confirm(`Delete ${u.full_name}? Their bookings & profile will be removed.`)) removeUser.mutate(u.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          );
        })}
        {users.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No users.</p>}
      </div>
    </div>
  );
}

/* ---------- ACTIVITY LOGS (paginated) ---------- */
function ActivityTab() {
  const PAGE = 20;
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-activity", page, filter],
    queryFn: async () => {
      let q = supabase.from("activity_logs").select("*", { count: "exact" }).order("created_at", { ascending: false }).range(page * PAGE, page * PAGE + PAGE - 1);
      if (filter.trim()) q = q.ilike("action", `%${filter.trim()}%`);
      const { data, count } = await q;
      return { rows: data ?? [], count: count ?? 0 };
    },
  });

  const rows = data?.rows ?? [];
  const count = data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(count / PAGE));

  const colorFor = (action: string) => {
    if (action.startsWith("booking.")) return "bg-primary/10 text-primary";
    if (action.startsWith("user.")) return "bg-success/10 text-success";
    if (action.startsWith("profile.")) return "bg-warning/10 text-warning";
    return "bg-muted text-foreground";
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Activity log ({count})</h2>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={filter} onChange={(e) => { setPage(0); setFilter(e.target.value); }} placeholder="Filter by action…" className="pl-9" />
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-2">When</th>
              <th className="px-4 py-2">Actor</th>
              <th className="px-4 py-2">Action</th>
              <th className="px-4 py-2">Entity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">Loading…</td></tr>}
            {!isLoading && rows.length === 0 && <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">No activity matched.</td></tr>}
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-2 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                <td className="px-4 py-2">{r.actor_name ?? "—"}</td>
                <td className="px-4 py-2"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colorFor(r.action)}`}>{r.action}</span></td>
                <td className="px-4 py-2 text-xs text-muted-foreground">{r.entity_type ?? "—"} {r.entity_id ? `· ${String(r.entity_id).slice(0, 8)}` : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex items-center justify-between text-sm">
        <p className="text-muted-foreground">Page {page + 1} of {totalPages}</p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>Previous</Button>
          <Button size="sm" variant="outline" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      </div>
    </div>
  );
}

/* ---------- BOOKINGS (admin oversight) ---------- */
function BookingsTab() {
  const { data: bookings = [] } = useQuery({
    queryKey: ["admin-bookings-tab"],
    queryFn: async () => (await supabase.from("bookings").select("*").order("created_at", { ascending: false }).limit(100)).data ?? [],
  });
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
      <h2 className="mb-4 text-lg font-semibold">All bookings ({bookings.length})</h2>
      <div className="divide-y divide-border">
        {bookings.map((b) => (
          <div key={b.id} className="flex items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{b.event_name}</p>
              <p className="truncate text-xs text-muted-foreground">{b.client_name} · {b.event_date} · {b.start_time.slice(0, 5)}</p>
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
  );
}
