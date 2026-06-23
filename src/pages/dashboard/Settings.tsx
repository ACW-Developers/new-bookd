import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");

  const updatePassword = async () => {
    if (pw.length < 6) return toast.error("Password must be at least 6 characters");
    if (pw !== pw2) return toast.error("Passwords don't match");
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    setPw(""); setPw2("");
  };

  const onSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <DashboardShell title="Settings" subtitle="Account, notifications, calendar and security preferences.">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Account">
          <Row label="Email"><span className="text-sm text-muted-foreground">{user?.email}</span></Row>
          <Row label="User ID"><span className="font-mono text-xs text-muted-foreground">{user?.id.slice(0, 8)}…</span></Row>
          <Button variant="outline" onClick={onSignOut}>Sign out</Button>
        </Card>

        <Card title="Security">
          <div><Label className="text-xs">New password</Label><Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} /></div>
          <div><Label className="text-xs">Confirm new password</Label><Input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} /></div>
          <Button className="gradient-primary" onClick={updatePassword}>Update password</Button>
        </Card>

        <Card title="Notification preferences">
          {["Email me on new booking requests", "Email me when a booking is approved", "Send SMS reminders", "Push notifications on web"].map((label, i) => (
            <Row key={label} label={label}><Switch defaultChecked={i < 3} /></Row>
          ))}
        </Card>

        <Card title="Calendar preferences">
          <Row label="Week starts on">
            <select className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm"><option>Monday</option><option>Sunday</option></select>
          </Row>
          <Row label="Time format"><select className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm"><option>24-hour</option><option>12-hour</option></select></Row>
          <Row label="Show declined events"><Switch /></Row>
        </Card>
      </div>
    </DashboardShell>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </div>
  );
}
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"><span className="text-sm">{label}</span>{children}</div>;
}
