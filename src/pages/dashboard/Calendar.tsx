import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export default function CalendarPage() {
  const { user, isProfessional } = useAuth();
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const startISO = new Date(year, month, 1).toISOString().slice(0, 10);
  const endISO = new Date(year, month + 1, 0).toISOString().slice(0, 10);

  const { data: bookings = [] } = useQuery({
    queryKey: ["calendar", user?.id, startISO, endISO],
    enabled: !!user,
    queryFn: async () => {
      const col = isProfessional ? "professional_id" : "client_id";
      const { data } = await supabase.from("bookings").select("*").eq(col, user!.id).gte("event_date", startISO).lte("event_date", endISO);
      return data ?? [];
    },
  });

  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: 42 }, (_, i) => {
    const dayNum = i - firstDow + 1;
    return dayNum >= 1 && dayNum <= daysInMonth ? dayNum : null;
  });

  const bookingsByDay = new Map<number, typeof bookings>();
  for (const b of bookings) {
    const d = Number(b.event_date.slice(8, 10));
    bookingsByDay.set(d, [...(bookingsByDay.get(d) ?? []), b]);
  }

  const monthLabel = cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <DashboardShell title="Calendar" subtitle="Manage your schedule and view bookings at a glance.">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button size="icon" variant="outline" onClick={() => setCursor(new Date(year, month - 1, 1))}><ChevronLeft className="h-4 w-4" /></Button>
            <h2 className="text-xl font-semibold">{monthLabel}</h2>
            <Button size="icon" variant="outline" onClick={() => setCursor(new Date(year, month + 1, 1))}><ChevronRight className="h-4 w-4" /></Button>
          </div>
          <Button size="sm" variant="outline" onClick={() => setCursor(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}>Today</Button>
        </div>

        <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-border bg-border text-sm">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="bg-muted px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{d}</div>
          ))}
          {cells.map((d, i) => {
            const evs = d ? bookingsByDay.get(d) ?? [] : [];
            return (
              <div key={i} className="min-h-[110px] bg-card p-2">
                <p className={`text-xs font-semibold ${d ? "text-foreground" : "text-muted-foreground/40"}`}>{d ?? ""}</p>
                <div className="mt-1 space-y-1">
                  {evs.map((e) => (
                    <div key={e.id} className={`truncate rounded-md px-2 py-1 text-[11px] font-medium ${
                      e.status === "approved" ? "bg-success/10 text-success" :
                      e.status === "pending" ? "bg-warning/10 text-warning" :
                      e.status === "completed" ? "bg-primary/10 text-primary" :
                      "bg-destructive/10 text-destructive"
                    }`}>{e.start_time.slice(0, 5)} {e.event_name}</div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-warning/30" /> Pending</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-success/30" /> Approved</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-primary/30" /> Completed</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-destructive/30" /> Cancelled</span>
        </div>
      </div>
    </DashboardShell>
  );
}
