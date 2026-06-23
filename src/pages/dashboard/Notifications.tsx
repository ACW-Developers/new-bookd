import { Bell, CheckCircle2, X, Clock } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardShell } from "@/components/dashboard-shell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";

const iconMap = {
  new: { icon: Bell, color: "text-primary bg-primary/10" },
  approved: { icon: CheckCircle2, color: "text-success bg-success/10" },
  cancelled: { icon: X, color: "text-destructive bg-destructive/10" },
  reminder: { icon: Clock, color: "text-warning bg-warning/10" },
} as const;

export default function NotificationsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: items = [] } = useQuery({
    queryKey: ["notifications-all", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("notifications").select("*").eq("user_id", user!.id).order("created_at", { ascending: false })).data ?? [],
  });

  useEffect(() => {
    if (!user) return;
    supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false).then(() => {
      qc.invalidateQueries({ queryKey: ["unread-count"] });
    });
  }, [user, qc]);

  return (
    <DashboardShell title="Notifications" subtitle="Booking updates, reminders and platform alerts.">
      <div className="space-y-2">
        {items.length === 0 && (
          <div className="grid place-items-center rounded-2xl border border-dashed border-border py-16 text-muted-foreground">You have no notifications yet.</div>
        )}
        {items.map((n) => {
          const cfg = iconMap[n.type as keyof typeof iconMap] ?? iconMap.new;
          return (
            <div key={n.id} className={`flex gap-4 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] ${!n.read ? "border-l-4 border-l-primary" : ""}`}>
              <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${cfg.color}`}>
                <cfg.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{n.title}</p>
                {n.body && <p className="text-sm text-muted-foreground">{n.body}</p>}
                <p className="mt-1 text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString()}</p>
              </div>
            </div>
          );
        })}
      </div>
    </DashboardShell>
  );
}
