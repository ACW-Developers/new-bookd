import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, X, Clock, MapPin, AlertCircle, CheckCheck, Calendar as CalIcon, User as UserIcon, Mail, MessageSquare } from "lucide-react";
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
  const navigate = useNavigate();
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
      const msg = v.status === "approved" ? "Approved — you're marked unavailable for that slot."
        : v.status === "completed" ? "Marked complete — your availability is restored."
        : `Booking ${v.status}`;
      toast.success(msg);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const list = bookings.filter((b) => b.status === tab);
  const pendingCount = bookings.filter((b) => b.status === "pending").length;

  const openChat = (b: any) => {
    const partnerId = isProfessional ? b.client_id : b.professional_id;
    if (!partnerId) { toast.error("Chat unavailable — counterpart is a guest."); return; }
    navigate(`/dashboard/messages?partner=${partnerId}`);
  };

  return (
    <DashboardShell title="Bookings" subtitle="Manage requests, confirmations and past engagements.">
      {isProfessional && pendingCount > 0 && tab !== "pending" && (
        <button onClick={() => setTab("pending")} className="mb-4 flex w-full items-center gap-3 rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3 text-left text-sm font-medium text-warning-foreground transition hover:bg-warning/20">
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

      <div className="space-y-4">
        {list.length === 0 && (
          <div className="grid place-items-center rounded-2xl border border-dashed border-border py-16 text-muted-foreground">No {tab} bookings.</div>
        )}
        {list.map((b) => {
          const counterpart = isProfessional ? (b.client_name ?? "Client") : "Professional";
          return (
            <div key={b.id} className={`rounded-2xl border bg-card p-5 shadow-[var(--shadow-soft)] ${b.status === "pending" ? "border-warning/40 ring-1 ring-warning/20" : "border-border"}`}>
              {/* Header row */}
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold tracking-tight">{b.event_name}</h3>
                    <StatusPill status={b.status} />
                    {b.event_type && <span className="rounded-md bg-navy/10 px-2 py-0.5 text-xs font-medium text-navy">{b.event_type}</span>}
                    {b.status === "approved" && <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-destructive">Unavailable</span>}
                  </div>
                  {b.description && <p className="mt-1 text-sm text-muted-foreground">{b.description}</p>}
                </div>
                <div className="flex shrink-0 gap-2">
                  {b.status === "pending" && isProfessional ? (
                    <>
                      <Button size="sm" variant="outline" className="border-destructive/40 text-destructive hover:bg-destructive/10" onClick={() => updateStatus.mutate({ id: b.id, status: "cancelled" })}>
                        <X className="mr-1 h-4 w-4" /> Decline
                      </Button>
                      <Button size="sm" className="bg-success text-white hover:bg-success/90" onClick={() => updateStatus.mutate({ id: b.id, status: "approved" })}>
                        <Check className="mr-1 h-4 w-4" /> Accept
                      </Button>
                    </>
                  ) : b.status === "approved" && isProfessional ? (
                    <>
                      <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: b.id, status: "cancelled" })}>Cancel</Button>
                      <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={() => updateStatus.mutate({ id: b.id, status: "completed" })}>
                        <CheckCheck className="mr-1 h-3.5 w-3.5" /> Mark complete
                      </Button>
                    </>
                  ) : null}
                  <Button size="sm" variant="outline" onClick={() => openChat(b)}>
                    <MessageSquare className="mr-1 h-4 w-4" /> Chat
                  </Button>
                </div>
              </div>

              {/* Info grid */}
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <InfoTile icon={CalIcon} label="Date" value={new Date(b.event_date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })} />
                <InfoTile icon={Clock} label="Time" value={`${b.start_time.slice(0,5)} – ${b.end_time.slice(0,5)}`} />
                <InfoTile icon={MapPin} label="Location" value={b.location || "—"} />
                <InfoTile icon={UserIcon} label="Client" value={counterpart} />
              </div>

              {b.client_email && (
                <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" />
                  <a href={`mailto:${b.client_email}`} className="hover:text-foreground">{b.client_email}</a>
                </p>
              )}
            </div>
          );
        })}
      </div>
    </DashboardShell>
  );
}

function StatusPill({ status }: { status: string }) {
  const cls =
    status === "approved" ? "bg-success/15 text-success" :
    status === "pending" ? "bg-warning/15 text-warning" :
    status === "completed" ? "bg-primary/15 text-primary" :
    "bg-destructive/15 text-destructive";
  return <span className={`rounded-md px-2 py-0.5 text-xs font-semibold capitalize ${cls}`}>{status}</span>;
}

function InfoTile({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5" /> {label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}
