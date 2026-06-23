import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type Rule = { enabled: boolean; start: string; end: string };

export default function AvailabilityPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: rules = [] } = useQuery({
    queryKey: ["availability-rules", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("availability_rules").select("*").eq("professional_id", user!.id)).data ?? [],
  });

  const { data: blocks = [] } = useQuery({
    queryKey: ["blocked-dates", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("blocked_dates").select("*").eq("professional_id", user!.id).order("start_date")).data ?? [],
  });

  const [state, setState] = useState<Record<number, Rule>>({});

  useEffect(() => {
    const next: Record<number, Rule> = {};
    for (let i = 0; i < 7; i++) {
      const r = rules.find((x) => x.day_of_week === i);
      next[i] = r
        ? { enabled: r.enabled, start: r.start_time.slice(0, 5), end: r.end_time.slice(0, 5) }
        : { enabled: i >= 1 && i <= 5, start: "09:00", end: "17:00" };
    }
    setState(next);
  }, [rules]);

  const save = async () => {
    if (!user) return;
    const rows = Object.entries(state).map(([d, v]) => ({
      professional_id: user.id,
      day_of_week: Number(d),
      start_time: v.start,
      end_time: v.end,
      enabled: v.enabled,
    }));
    const { error } = await supabase.from("availability_rules").upsert(rows, { onConflict: "professional_id,day_of_week" });
    if (error) return toast.error(error.message);
    toast.success("Availability updated");
    qc.invalidateQueries({ queryKey: ["availability-rules"] });
  };

  const addBlock = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const fd = new FormData(e.currentTarget);
    const start = String(fd.get("from"));
    const end = String(fd.get("to") || start);
    const reason = String(fd.get("reason") ?? "");
    const { error } = await supabase.from("blocked_dates").insert({ professional_id: user.id, start_date: start, end_date: end, reason });
    if (error) return toast.error(error.message);
    toast.success("Date block added");
    (e.target as HTMLFormElement).reset();
    qc.invalidateQueries({ queryKey: ["blocked-dates"] });
  };

  const delBlock = async (id: string) => {
    await supabase.from("blocked_dates").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["blocked-dates"] });
  };

  return (
    <DashboardShell title="Availability" subtitle="Set your working hours and block off time you're unavailable.">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] lg:col-span-2">
          <h2 className="text-lg font-semibold">Weekly hours</h2>
          <p className="text-sm text-muted-foreground">Recurring availability across the week.</p>
          <div className="mt-5 space-y-3">
            {days.map((d, i) => {
              const v = state[i] ?? { enabled: false, start: "09:00", end: "17:00" };
              return (
                <div key={d} className="grid grid-cols-[140px_auto_1fr] items-center gap-3 rounded-xl border border-border p-3">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      className="accent-primary"
                      checked={v.enabled}
                      onChange={(e) => setState({ ...state, [i]: { ...v, enabled: e.target.checked } })}
                    />
                    {d}
                  </label>
                  <div className="text-muted-foreground">{v.enabled ? "Available" : "Unavailable"}</div>
                  {v.enabled && (
                    <div className="flex items-center gap-2 justify-self-end">
                      <Input type="time" value={v.start} onChange={(e) => setState({ ...state, [i]: { ...v, start: e.target.value } })} className="w-28" />
                      <span className="text-muted-foreground">–</span>
                      <Input type="time" value={v.end} onChange={(e) => setState({ ...state, [i]: { ...v, end: e.target.value } })} className="w-28" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <Button className="mt-5 gradient-primary" onClick={save}>Save changes</Button>
        </div>

        <div className="space-y-6">
          <form onSubmit={addBlock} className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
            <h3 className="font-semibold">Block dates</h3>
            <p className="text-sm text-muted-foreground">Add a vacation or one-off block.</p>
            <div className="mt-3 space-y-2">
              <div><Label className="text-xs">From</Label><Input name="from" required type="date" /></div>
              <div><Label className="text-xs">To</Label><Input name="to" type="date" /></div>
              <div><Label className="text-xs">Reason</Label><Input name="reason" placeholder="Vacation" /></div>
              <Button type="submit" variant="outline" className="w-full">Add block</Button>
            </div>
          </form>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
            <h3 className="font-semibold">Your blocks</h3>
            <div className="mt-3 space-y-2 text-sm">
              {blocks.length === 0 && <p className="text-muted-foreground">No blocks scheduled.</p>}
              {blocks.map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                  <div>
                    <p className="font-medium">{b.start_date}{b.end_date !== b.start_date ? ` → ${b.end_date}` : ""}</p>
                    {b.reason && <p className="text-xs text-muted-foreground">{b.reason}</p>}
                  </div>
                  <button className="text-xs text-destructive hover:underline" onClick={() => delBlock(b.id)}>Remove</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
