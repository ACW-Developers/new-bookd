import { useEffect, useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { CURRENCY_SYMBOL } from "@/lib/currency";
import { UserAvatar } from "@/components/user-avatar";

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    full_name: "", profession: "", category: "", location: "", email: "",
    phone: "", bio: "", skills: "", portfolio_url: "", hourly_rate: "", experience_years: "",
    is_professional: false, avatar_url: "",
  });

  useEffect(() => {
    if (!profile) return;
    setForm({
      full_name: profile.full_name ?? "",
      profession: profile.profession ?? "",
      category: profile.category ?? "",
      location: profile.location ?? "",
      email: profile.email ?? "",
      phone: profile.phone ?? "",
      bio: profile.bio ?? "",
      skills: (profile.skills ?? []).join(", "),
      portfolio_url: profile.portfolio_url ?? "",
      hourly_rate: profile.hourly_rate?.toString() ?? "",
      experience_years: profile.experience_years?.toString() ?? "",
      is_professional: profile.is_professional,
      avatar_url: profile.avatar_url ?? "",
    });
  }, [profile]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("profiles").update({
      full_name: form.full_name,
      profession: form.profession || null,
      category: form.category || null,
      location: form.location || null,
      email: form.email || null,
      phone: form.phone || null,
      bio: form.bio || null,
      skills: form.skills ? form.skills.split(",").map((s) => s.trim()).filter(Boolean) : [],
      portfolio_url: form.portfolio_url || null,
      hourly_rate: form.hourly_rate ? Number(form.hourly_rate) : null,
      experience_years: form.experience_years ? Number(form.experience_years) : null,
      is_professional: form.is_professional,
      avatar_url: form.avatar_url || null,
    }).eq("id", user.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Profile saved");
    refreshProfile();
  };

  const set = (k: keyof typeof form, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const onPickFile = () => fileInputRef.current?.click();

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) return toast.error("Please pick an image file");
    if (file.size > 5 * 1024 * 1024) return toast.error("Image must be under 5 MB");
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data: signed, error: signErr } = await supabase.storage.from("avatars").createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
      if (signErr) throw signErr;
      const url = signed.signedUrl;
      const { error: updErr } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
      if (updErr) throw updErr;
      set("avatar_url", url);
      refreshProfile();
      toast.success("Profile photo updated");
    } catch (err: any) {
      toast.error(err.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <DashboardShell title="Profile" subtitle="Your public presence on BOOKD.">
      <form className="grid gap-6 lg:grid-cols-3" onSubmit={onSubmit}>
        <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-[var(--shadow-soft)]">
          <button type="button" onClick={onPickFile} disabled={uploading} className="group relative mx-auto block h-28 w-28">
            <UserAvatar
              src={form.avatar_url}
              name={form.full_name || user?.email}
              seed={user?.id}
              className="h-full w-full rounded-2xl text-3xl ring-4 ring-primary/20"
            />
            <span className="absolute inset-0 grid place-items-center rounded-2xl bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100">
              {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
            </span>
            <span className="absolute -bottom-2 -right-2 rounded-full bg-card p-2 shadow-[var(--shadow-elegant)]">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            </span>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
          <h3 className="mt-4 font-semibold">{form.full_name || "Your name"}</h3>
          <p className="text-sm text-muted-foreground">{form.profession || "Profession"}</p>
          <Button type="button" variant="outline" size="sm" onClick={onPickFile} disabled={uploading} className="mt-4 w-full">
            {uploading ? "Uploading…" : "Change photo"}
          </Button>
          <label className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <input type="checkbox" className="accent-primary" checked={form.is_professional} onChange={(e) => set("is_professional", e.target.checked)} />
            Show me as a professional
          </label>
        </div>

        <div className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name"><Input required value={form.full_name} onChange={(e) => set("full_name", e.target.value)} /></Field>
            <Field label="Profession"><Input value={form.profession} onChange={(e) => set("profession", e.target.value)} /></Field>
            <Field label="Category"><Input value={form.category} onChange={(e) => set("category", e.target.value)} /></Field>
            <Field label="Location"><Input value={form.location} onChange={(e) => set("location", e.target.value)} /></Field>
            <Field label="Email"><Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></Field>
            <Field label="Phone"><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
            <Field label={`Hourly rate (${CURRENCY_SYMBOL})`}><Input type="number" value={form.hourly_rate} onChange={(e) => set("hourly_rate", e.target.value)} /></Field>
            <Field label="Years of experience"><Input type="number" value={form.experience_years} onChange={(e) => set("experience_years", e.target.value)} /></Field>
          </div>
          <Field label="Bio"><Textarea rows={4} value={form.bio} onChange={(e) => set("bio", e.target.value)} /></Field>
          <Field label="Skills (comma separated)"><Input value={form.skills} onChange={(e) => set("skills", e.target.value)} /></Field>
          <Field label="Portfolio URL"><Input value={form.portfolio_url} onChange={(e) => set("portfolio_url", e.target.value)} /></Field>
          <div className="flex justify-end gap-2">
            <Button type="submit" disabled={busy} className="gradient-primary">{busy ? "Saving…" : "Save changes"}</Button>
          </div>
        </div>
      </form>
    </DashboardShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><Label className="mb-1.5 block text-xs font-medium">{label}</Label>{children}</div>;
}
