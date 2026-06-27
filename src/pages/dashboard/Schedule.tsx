import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, CalendarDays, Trash2, Repeat, Pencil } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

type Entry = {
  id: string;
  professional_id: string;
  title: string;
  notes: string | null;
  event_date: string;
  start_time: string;
  end_time: string;
  repeats: string;
  repeat_until: string | null;
  blocks_availability: boolean;
};

const REPEATS = [
  { value: "none", label: "Does not repeat" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly (same day)" },
  { value: "monthly", label: "Monthly" },
];

export default function SchedulePage() {
  const { user, isProfessional } = useAuth();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Entry | null>(null);
  const [open, setOpen] = useState(false);

  const { data: entries = [] } = useQuery({
    queryKey: ["schedule-entries", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("schedule_entries")
        .select("*")
        .eq("professional_id", user!.id)
        .or(`event_date.gte.${today},repeats.neq.none`)
        .order("event_date", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Entry[];
    },
  });

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const fd = new FormData(e.currentTarget);
    const payload = {
      professional_id: user.id,
      title: String(fd.get("title") || "").trim(),
      notes: String(fd.get("notes") || "") || null,
      event_date: String(fd.get("event_date")),
      start_time: String(fd.get("start_time")),
      end_time: String(fd.get("end_time")),
      repeats: String(fd.get("repeats") || "none"),
      repeat_until: (fd.get("repeat_until") && String(fd.get("repeat_until"))) || null,
      blocks_availability: fd.get("blocks_availability") === "on",
    };
    if (!payload.title) return toast.error("Title is required");

    const op = editing
      ? supabase.from("schedule_entries").update(payload).eq("id", editing.id)
      : supabase.from("schedule_entries").insert(payload);
    const { error } = await op;
    if (error) return toast.error(error.message);
    toast.success(editing ? "Entry updated" : "Entry added");
    setOpen(false);
    setEditing(null);
    qc.invalidateQueries({ queryKey: ["schedule-entries"] });
  };

  const del = async (id: string) => {
    const { error } = await supabase.from("schedule_entries").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removed");
    qc.invalidateQueries({ queryKey: ["schedule-entries"] });
  };

  if (!isProfessional) {
    return (
      <DashboardShell title="My schedule">
        <p className="text-sm text-muted-foreground">Schedule is only available for professional accounts.</p>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="My schedule" subtitle="Log diary entries, mark yourself unavailable, and set repeating commitments.">
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{entries.length} active {entries.length === 1 ? "entry" : "entries"}</p>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button className="gradient-primary"><Plus className="mr-1 h-4 w-4" /> New entry</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editing ? "Edit entry" : "New schedule entry"}</DialogTitle></DialogHeader>
            <form onSubmit={onSubmit} className="grid gap-3">
              <div>
                <Label className="text-xs">Title</Label>
                <Input name="title" required defaultValue={editing?.title ?? ""} placeholder="Client meeting, gym, family time…" />
              </div>
              <div>
                <Label className="text-xs">Notes</Label>
                <Textarea name="notes" rows={3} defaultValue={editing?.notes ?? ""} placeholder="Any details about this engagement" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">Date</Label>
                  <Input name="event_date" required type="date" defaultValue={editing?.event_date ?? new Date().toISOString().slice(0,10)} />
                </div>
                <div>
                  <Label className="text-xs">Start</Label>
                  <Input name="start_time" required type="time" defaultValue={editing?.start_time?.slice(0,5) ?? "09:00"} />
                </div>
                <div>
                  <Label className="text-xs">End</Label>
                  <Input name="end_time" required type="time" defaultValue={editing?.end_time?.slice(0,5) ?? "10:00"} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Repeats</Label>
                  <select name="repeats" defaultValue={editing?.repeats ?? "none"} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    {REPEATS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <div>
                  <Label className="text-xs">Repeat until (optional)</Label>
                  <Input name="repeat_until" type="date" defaultValue={editing?.repeat_until ?? ""} />
                </div>
              </div>
              <label className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium">Mark me unavailable</p>
                  <p className="text-xs text-muted-foreground">Show this time as busy on your public profile.</p>
                </div>
                <Switch name="blocks_availability" defaultChecked={editing?.blocks_availability ?? true} />
              </label>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => { setOpen(false); setEditing(null); }}>Cancel</Button>
                <Button type="submit" className="gradient-primary">{editing ? "Save changes" : "Add entry"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3">
        {entries.length === 0 && (
          <div className="grid place-items-center rounded-2xl border border-dashed border-border py-14 text-sm text-muted-foreground">
            <CalendarDays className="mb-2 h-8 w-8" />
            No entries yet. Add a diary entry to mark yourself busy or schedule a recurring event.
          </div>
        )}
        {entries.map((e) => (
          <div key={e.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
            <div className={`grid h-12 w-12 place-items-center rounded-xl ${e.blocks_availability ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
              <CalendarDays className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate font-semibold">{e.title}</p>
                {e.repeats !== "none" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                    <Repeat className="h-3 w-3" /> {e.repeats}
                  </span>
                )}
                {e.blocks_availability && (
                  <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">Unavailable</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {e.event_date} · {e.start_time?.slice(0,5)}–{e.end_time?.slice(0,5)}
                {e.repeat_until ? ` · until ${e.repeat_until}` : ""}
              </p>
              {e.notes && <p className="mt-1 text-sm">{e.notes}</p>}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => { setEditing(e); setOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
              <Button size="sm" variant="outline" className="text-destructive" onClick={() => del(e.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}
