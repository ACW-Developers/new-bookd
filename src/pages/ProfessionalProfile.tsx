import { Link, useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { MapPin, Star, Calendar, Mail, Phone, ArrowLeft, CheckCircle2, Briefcase, Clock, MessageSquare, Repeat } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { SiteNav, SiteFooter } from "@/components/site-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { api } from "@/services/supabaseQueries";
import { toast } from "sonner";
import { formatPrice } from "@/lib/currency";
import type { Profile } from "@/lib/types";
import { UserAvatar } from "@/components/user-avatar";
import { useAuth } from "@/hooks/use-auth";

export default function ProfessionalProfile() {
  const { id = "" } = useParams<{ id: string }>();

  const { data: p, isLoading } = useQuery({
    queryKey: ["pro", id],
    queryFn: () => api.professional(id),
    enabled: !!id,
  });

  const { data: rules = [] } = useQuery({
    queryKey: ["pro-rules", id],
    queryFn: () => api.proRules(id),
    enabled: !!id,
  });

  const { data: busy = [] } = useQuery({
    queryKey: ["pro-busy", id],
    queryFn: () => api.proBusySlots(id),
    enabled: !!id,
  });

  const { data: schedule = [] } = useQuery({
    queryKey: ["pro-schedule", id],
    queryFn: () => api.proSchedule(id),
    enabled: !!id,
  });

  // Expand schedule entries (incl. repeating) into busy slots for next 30 days
  const scheduleBusy = useMemo(() => {
    const out: { event_date: string; start_time: string; end_time: string; status: string; label: string }[] = [];
    const today = new Date(); today.setHours(0,0,0,0);
    const horizon = new Date(today); horizon.setDate(horizon.getDate() + 30);
    for (const s of schedule as any[]) {
      if (!s.blocks_availability) continue;
      const base = new Date(s.event_date + "T00:00:00");
      const until = s.repeat_until ? new Date(s.repeat_until + "T00:00:00") : horizon;
      const end = until < horizon ? until : horizon;
      const push = (d: Date) => {
        if (d < today) return;
        out.push({
          event_date: d.toISOString().slice(0, 10),
          start_time: s.start_time,
          end_time: s.end_time,
          status: "schedule",
          label: s.title || "Unavailable",
        });
      };
      if (s.repeats === "none") {
        push(base);
      } else if (s.repeats === "daily") {
        for (let d = new Date(Math.max(+base, +today)); d <= end; d.setDate(d.getDate() + 1)) push(new Date(d));
      } else if (s.repeats === "weekly") {
        for (let d = new Date(Math.max(+base, +today)); d <= end; d.setDate(d.getDate() + 7)) push(new Date(d));
      } else if (s.repeats === "monthly") {
        for (let d = new Date(Math.max(+base, +today)); d <= end; d.setMonth(d.getMonth() + 1)) push(new Date(d));
      }
    }
    return out;
  }, [schedule]);

  const allBusy = useMemo(() => {
    const bookingBusy = (busy as any[]).map((b) => ({ ...b, label: b.status === "approved" ? "Booked" : "Pending booking" }));
    return [...bookingBusy, ...scheduleBusy].sort((a, b) =>
      a.event_date === b.event_date ? a.start_time.localeCompare(b.start_time) : a.event_date.localeCompare(b.event_date),
    );
  }, [busy, scheduleBusy]);

  if (isLoading) return <div className="grid min-h-screen place-items-center text-black">Loading…</div>;
  if (!p) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="text-center">
          <p className="text-black">Professional not found.</p>
          <Button asChild className="mt-4"><Link to="/search">Browse professionals</Link></Button>
        </div>
      </div>
    );
  }

  const enabledDays = new Set(rules.filter((r) => r.enabled).map((r) => r.day_of_week));

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="mx-auto max-w-6xl px-6 py-8">
        <Link to="/search" className="inline-flex items-center gap-1.5 text-sm text-black hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to search
        </Link>

        <div className="mt-6 overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)]">
          <div className="h-32 bg-primary" />
          <div className="px-6 pb-6 sm:px-8 sm:pb-8">
            <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end">
              <UserAvatar src={p.avatar_url} name={p.full_name} seed={p.id} className="h-24 w-24 rounded-2xl text-2xl ring-4 ring-card shadow-[var(--shadow-elegant)]" />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl lg:text-white font-bold tracking-tight">{p.full_name}</h1>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium text-success"><CheckCircle2 className="h-3 w-3" /> Verified</span>
                </div>
                <p className="text-black ">{p.profession ?? "Professional"}{p.category ? ` · ${p.category}` : ""}</p>
                <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-black">
                  {p.location && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {p.location}</span>}
                  <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-warning text-warning" /> {Number(p.rating).toFixed(1)} ({p.reviews_count} reviews)</span>
                  {p.experience_years && <span className="flex items-center gap-1"><Briefcase className="h-4 w-4" /> {p.experience_years} years</span>}
                </div>
              </div>
              <BookingDialog pro={p} busy={busy} />
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <section className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
              <h2 className="text-lg font-semibold">About</h2>
              <p className="mt-2 text-black">{p.bio ?? "No bio provided yet."}</p>
              {(p.skills ?? []).length > 0 && (
                <div className="mt-5">
                  <h3 className="text-sm font-semibold">Skills</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(p.skills ?? []).map((s) => <span key={s} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{s}</span>)}
                  </div>
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><Calendar className="h-5 w-5 text-primary" /> Weekly availability</h2>
              <div className="grid grid-cols-7 gap-2 text-center text-sm">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => {
                  const rule = rules.find((r) => r.day_of_week === i);
                  const ok = enabledDays.has(i);
                  return (
                    <div key={d} className={`rounded-xl border p-3 ${ok ? "border-success/30 bg-success/5" : "border-border bg-muted/30 text-black"}`}>
                      <p className="text-xs font-medium">{d}</p>
                      {ok && rule ? (
                        <p className="mt-1 text-[11px] text-success">{rule.start_time.slice(0, 5)}–{rule.end_time.slice(0, 5)}</p>
                      ) : (
                        <p className="mt-1 text-[11px]">Off</p>
                      )}
                    </div>
                  );
                })}
              </div>
              {rules.length === 0 && (
                <p className="mt-4 text-sm text-black">This professional hasn't set availability yet - send a request and they'll confirm a time.</p>
              )}
            </section>

            <section className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><Clock className="h-5 w-5 text-primary" /> Currently unavailable</h2>
              {busy.length === 0 ? (
                <p className="text-sm text-black">No upcoming engagements - fully open for new bookings.</p>
              ) : (
                <ul className="space-y-2">
                  {busy.map((b, i) => (
                    <li key={i} className="flex items-center justify-between rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm">
                      <span className="font-medium">{new Date(b.event_date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</span>
                      <span className="text-black">{b.start_time.slice(0,5)}–{b.end_time.slice(0,5)}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${b.status === "approved" ? "bg-destructive/15 text-destructive" : "bg-warning/15 text-warning"}`}>
                        {b.status === "approved" ? "Booked" : "Pending"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
              <p className="text-xs uppercase tracking-wide text-black">Starting from</p>
              <p className="mt-1 text-3xl font-bold text-navy">{formatPrice(p.hourly_rate)}<span className="text-base font-normal text-black">/hr</span></p>
              <BookingDialog pro={p} busy={busy} className="mt-4 w-full" />
              <Button asChild variant="outline" className="mt-2 w-full">
                <Link to={`/dashboard/messages?partner=${p.id}`}><MessageSquare className="mr-2 h-4 w-4" /> Start chat</Link>
              </Button>
              <p className="mt-3 text-center text-xs text-black">Usually responds within 2 hours</p>
            </section>


            <section className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
              <h3 className="text-sm font-semibold">Contact</h3>
              <div className="mt-3 space-y-2 text-sm">
                {p.email && <a className="flex items-center gap-2 text-black hover:text-foreground" href={`mailto:${p.email}`}><Mail className="h-4 w-4" /> {p.email}</a>}
                {p.phone && <a className="flex items-center gap-2 text-black hover:text-foreground" href={`tel:${p.phone}`}><Phone className="h-4 w-4" /> {p.phone}</a>}
              </div>
            </section>
          </aside>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}

type BusySlot = { event_date: string; start_time: string; end_time: string; status: string };

function BookingDialog({ pro, className, busy: busySlots = [] }: { pro: Profile; className?: string; busy?: BusySlot[] }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const conflicts = (date: string, start: string, end: string) =>
    busySlots.some((b) => b.event_date === date && start < b.end_time && end > b.start_time);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const date = String(fd.get("date"));
    const start = String(fd.get("start"));
    const end = String(fd.get("end"));
    if (conflicts(date, start, end)) {
      toast.error("That time conflicts with another booking. Please pick a different slot.");
      return;
    }
    setBusy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("bookings").insert({
        professional_id: pro.id,
        client_id: user?.id ?? null,
        client_name: String(fd.get("name")),
        client_email: String(fd.get("email")),
        client_phone: String(fd.get("phone") ?? ""),
        company: String(fd.get("company") ?? ""),
        event_name: String(fd.get("event_name")),
        event_type: String(fd.get("event_type") ?? ""),
        event_date: date,
        start_time: start,
        end_time: end,
        location: String(fd.get("location") ?? ""),
        description: String(fd.get("description") ?? ""),
        status: "pending",
      });
      if (error) throw error;
      await supabase.from("notifications").insert({
        user_id: pro.id,
        type: "new",
        title: "New booking request",
        body: `${fd.get("name")} requested ${fd.get("event_name")} on ${date}.`,
        link: "/dashboard/bookings",
      });
      setOpen(false);
      toast.success("Booking request sent!", {
        action: { label: "Start chat", onClick: () => navigate(`/dashboard/messages?partner=${pro.id}`) },
      });
      (e.target as HTMLFormElement).reset();
    } catch (err: any) {
      toast.error(err.message ?? "Could not send request");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className={`bg-primary ${className ?? ""}`}>Request Booking</Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Request a booking with {pro.full_name}</DialogTitle></DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Full name"><Input name="name" required placeholder="Jane Cooper" /></Field>
            <Field label="Company"><Input name="company" placeholder="Acme Inc." /></Field>
            <Field label="Email"><Input name="email" required type="email" placeholder="you@company.com" /></Field>
            <Field label="Phone"><Input name="phone" placeholder="+1 555 0100" /></Field>
            <Field label="Event name"><Input name="event_name" required placeholder="Annual Conference" /></Field>
            <Field label="Event type"><Input name="event_type" placeholder="Keynote, training, photoshoot…" /></Field>
            <Field label="Date"><Input name="date" required type="date" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Start"><Input name="start" required type="time" /></Field>
              <Field label="End"><Input name="end" required type="time" /></Field>
            </div>
          </div>
          <Field label="Location"><Input name="location" placeholder="Venue or address" /></Field>
          <Field label="Description & requirements"><Textarea name="description" rows={4} placeholder="Tell the professional about your event…" /></Field>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={busy} className="gradient-primary">{busy ? "Sending…" : "Send request"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 block text-xs font-medium">{label}</Label>
      {children}
    </div>
  );
}
