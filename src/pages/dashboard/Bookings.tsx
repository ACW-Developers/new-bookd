import { useState } from "react";
import { Check, X, Clock, MapPin, AlertCircle, CheckCheck } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import type { BookingStatus } from "@/lib/types";

const tabs: BookingStatus[] = ["pending", "approved", "completed", "cancelled"];

export default function BookingsPage() {
  const { user, isProfessional } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<BookingStatus>("pending");

  const { data: bookings = [] } = useQuery({
    queryKey: ["bookings-all", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const col = isProfessional ? "professional_id" : "client_id";
      const { data, error } = await supabase.from("bookings").select("*").eq(col, user!.id).order("event_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 30_000,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: BookingStatus }) => {
      const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["bookings-all"] });
      qc.invalidateQueries({ queryKey: ["my-bookings"] });
      qc.invalidateQueries({ queryKey: ["calendar"] });
      qc.invalidateQueries({ queryKey: ["unread-count"] });
      const msg =
        v.status === "approved"
          ? "Approved — you're marked unavailable for that slot."
          : v.status === "completed"
            ? "Marked complete — your availability is restored."
            : `Booking ${v.status}`;
      toast.success(msg);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const list = bookings.filter((b) => b.status === tab);
  const pendingCount = bookings.filter((b) => b.status === "pending").length;

  return (
    <DashboardShell title="Bookings" subtitle="Review and manage all your booking requests.">
      {isProfessional && pendingCount > 0 && tab !== "pending" && (
        <button
          onClick={() => setTab("pending")}
          className="mb-4 flex w-full items-center gap-3 rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3 text-left text-sm font-medium text-warning-foreground transition hover:bg-warning/20"
        >
          <AlertCircle className="h-5 w-5 text-warning" />
          <span className="flex-1">You have <strong>{pendingCount}</strong> pending booking{pendingCount > 1 ? "s" : ""} awaiting your response.</span>
          <span className="rounded-full bg-warning px-2 py-0.5 text-xs font-bold text-warning-foreground">Review</span>
        </button>
      )}

      <div className="mb-5 flex gap-1 rounded-xl border border-border bg-card p-1 shadow-[var(--shadow-soft)]">
        {tabs.map((t) => {
          const count = bookings.filter((b) => b.status === t).length;
          const isPending = t === "pending" && count > 0;
          return (
            <button key={t} onClick={() => setTab(t)} className={`relative flex-1 rounded-lg px-3 py-2 text-sm font-medium capitalize transition ${tab === t ? "gradient-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {t} <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs ${tab === t ? "bg-white/20" : isPending ? "bg-warning text-warning-foreground" : "bg-muted"}`}>{count}</span>
              {isPending && tab !== t && <span className="absolute right-1 top-1 h-2 w-2 animate-pulse rounded-full bg-warning" />}
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        {list.length === 0 && (
          <div className="grid place-items-center rounded-2xl border border-dashed border-border py-16 text-muted-foreground">No {tab} bookings.</div>
        )}
        {list.map((b) => (
          <div key={b.id} className={`grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 rounded-2xl border bg-card p-5 shadow-[var(--shadow-soft)] sm:flex sm:items-center sm:justify-between ${b.status === "pending" ? "border-warning/40 ring-1 ring-warning/20" : "border-border"}`}>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-base font-semibold">{b.event_name}</p>
                {b.status === "pending" && <span className="rounded-full bg-warning/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-warning">New</span>}
                {b.status === "approved" && <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-destructive">Unavailable</span>}
              </div>
              <p className="truncate text-sm text-muted-foreground">{b.client_name}{b.company ? ` · ${b.company}` : ""}</p>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {b.event_date} · {b.start_time.slice(0, 5)}–{b.end_time.slice(0, 5)}</span>
                {b.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {b.location}</span>}
              </div>
              {b.description && <p className="mt-2 text-sm text-muted-foreground">"{b.description}"</p>}
            </div>
            <div className="flex shrink-0 gap-2">
              {b.status === "pending" && isProfessional ? (
                <>
                  <Button size="sm" className="bg-success hover:bg-success/90" onClick={() => updateStatus.mutate({ id: b.id, status: "approved" })}>
                    <Check className="mr-1 h-3.5 w-3.5" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: b.id, status: "declined" })}>
                    <X className="mr-1 h-3.5 w-3.5" /> Decline
                  </Button>
                </>
              ) : b.status === "approved" && isProfessional ? (
                <>
                  <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={() => updateStatus.mutate({ id: b.id, status: "completed" })}>
                    <CheckCheck className="mr-1 h-3.5 w-3.5" /> Mark complete
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: b.id, status: "cancelled" })}>
                    Cancel
                  </Button>
                </>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}
