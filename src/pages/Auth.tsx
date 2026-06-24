import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Mail, Lock, User, Phone, ArrowLeft, Briefcase, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/logo";
import authHero from "@/assets/auth-hero.jpg";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export default function Auth() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { session, roles, isAdmin } = useAuth();
  const initialTab = params.get("tab") === "signup" ? "signup" : "signin";
  const [tab, setTab] = useState<"signin" | "signup">(initialTab);
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [profession, setProfession] = useState("");
  const [category, setCategory] = useState("");
  const [isPro, setIsPro] = useState(true);

  const redirectFor = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const userRoles = (data ?? []).map((r) => r.role as string);
    if (userRoles.includes("admin")) navigate("/admin", { replace: true });
    else navigate("/dashboard", { replace: true });
  };

  useEffect(() => {
    if (session?.user) {
      if (isAdmin) navigate("/admin", { replace: true });
      else if (roles.length > 0) navigate("/dashboard", { replace: true });
    }
  }, [session, roles, isAdmin, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (tab === "signin") {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
        if (data.user) await redirectFor(data.user.id);
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { full_name: fullName, phone, profession, category, is_professional: isPro },
          },
        });
        if (error) throw error;
        toast.success("Account created — you're in!");
        if (data.user) await redirectFor(data.user.id);
      }
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <img src={authHero} alt="Professional" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-tr from-navy/30 via-primary/40 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-between p-12 text-white">
          <Logo className="[&_span]:text-white" />
          <div className="max-w-md">
            <h1 className="text-4xl font-bold leading-tight">Connect with Trusted Professionals</h1>
            <p className="mt-3 text-white/85">
              Discover availability, request bookings, and manage engagements, all from one beautifully simple platform.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center bg-background p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="rounded-3xl border-2 border-primary/40 bg-card p-8 shadow-[var(--shadow-elegant)]">
            <div className="flex flex-col items-center text-center">
              <div className="grid h-14 w-14 place-items-center rounded-2xl gradient-primary text-2xl font-bold text-primary-foreground shadow-[var(--shadow-glow)]">B</div>
              <h2 className="mt-3 text-2xl font-bold tracking-tight">
                <Logo className="[&_span]:text-white" />
              </h2>
              <p className="text-sm mt-1 text-muted-foreground">Professional Booking Platform</p>
            </div>

            <div className="mt-6 grid grid-cols-2 rounded-xl bg-muted p-1">
              {(["signin", "signup"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`rounded-lg py-2 text-sm font-medium transition-all ${
                    tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t === "signin" ? "Sign In" : "Sign Up"}
                </button>
              ))}
            </div>

            <form className="mt-6 space-y-4" onSubmit={onSubmit}>
              {tab === "signup" && (
                <>
                  <FieldI label="Full name" icon={User}>
                    <Input required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
                  </FieldI>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <FieldI label="Phone" icon={Phone}>
                        <Input
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="0700 000 000"
                        />
                      </FieldI>
                    </div>

                    <div className="flex-1">
                      <FieldI label="Profession" icon={Briefcase}>
                        <Input
                          value={profession}
                          onChange={(e) => setProfession(e.target.value)}
                          placeholder="E.g., Consultant…"
                        />
                      </FieldI>
                    </div>
                  </div>
                  <FieldI label="Category" icon={Briefcase}>
                    <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Photography, Coaching, Legal…" />
                  </FieldI>
                  <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <input type="checkbox" className="accent-primary" checked={isPro} onChange={(e) => setIsPro(e.target.checked)} />
                    I'm offering services as a professional
                  </label>
                </>
              )}
              <FieldI label="Email" icon={Mail}>
                <Input required type="email" className="border-2 border-primary/30 pr-9" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
              </FieldI>
              <FieldI label="Password" icon={Lock}>
                <div className="relative">
                  <Input
                    required
                    minLength={6}
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="border-2 border-primary/30 pr-9"
                  />
                  <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground">
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FieldI>

              <Button type="submit" disabled={busy} className="w-full gradient-primary" size="lg">
                {busy ? "Please wait…" : tab === "signin" ? "Sign In" : "Create account"}
              </Button>
            </form>

            <Link to="/" className="mt-5 flex items-center justify-center gap-1.5 text-sm font-medium text-primary hover:underline">
              <ArrowLeft className="h-4 w-4" /> Back to home
            </Link>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              © 2026 BOOKD · <a className="text-primary hover:underline" href="#">Terms</a> · <a className="text-primary hover:underline" href="#">Privacy</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FieldI({ label, icon: Icon, children }: { label: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 block text-sm font-medium">{label}</Label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <div className="[&_input]:pl-9 [&_input]:bg-muted/40">{children}</div>
      </div>
    </div>
  );
}
