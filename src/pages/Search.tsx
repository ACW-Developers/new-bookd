import { useMemo, useState } from "react";
import { Search, MapPin, Filter, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { SiteNav, SiteFooter } from "@/components/site-nav";
import { ProfessionalCard } from "@/components/professional-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/services/supabaseQueries";

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [loc, setLoc] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [minRating, setMinRating] = useState(0);

  const { data: pros = [], isLoading } = useQuery({ queryKey: ["all-pros"], queryFn: api.allPros });
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: api.categories });

  const results = useMemo(() => pros.filter((p) => {
    if (q && !`${p.full_name} ${p.profession ?? ""} ${(p.skills ?? []).join(" ")}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (loc && !(p.location ?? "").toLowerCase().includes(loc.toLowerCase())) return false;
    if (cat && p.category !== cat) return false;
    if (Number(p.rating ?? 0) < minRating) return false;
    return true;
  }), [pros, q, loc, cat, minRating]);

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="border-b border-border bg-card/40">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Find your professional</h1>
          <p className="mt-1 text-muted-foreground">{isLoading ? "Loading…" : `${results.length} professionals available`}</p>
          <div className="mt-6 glass flex flex-col gap-2 rounded-2xl p-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, profession, skill…" className="h-11 border-0 bg-transparent pl-10 shadow-none focus-visible:ring-0" />
            </div>
            <div className="hidden h-11 w-px bg-border sm:block" />
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={loc} onChange={(e) => setLoc(e.target.value)} placeholder="Location" className="h-11 border-0 bg-transparent pl-10 shadow-none focus-visible:ring-0 sm:w-56" />
            </div>
            <Button size="lg" className="gradient-primary">Search</Button>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Filter className="h-4 w-4" /> Category</h3>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setCat(null)} className={`rounded-full px-3 py-1 text-xs ${cat === null ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}>All</button>
              {categories.map((c) => (
                <button key={c.id} onClick={() => setCat(c.name)} className={`rounded-full px-3 py-1 text-xs ${cat === c.name ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}>{c.name}</button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
            <h3 className="mb-3 text-sm font-semibold">Minimum rating</h3>
            <div className="flex gap-1">
              {[0, 3, 4, 5].map((r) => (
                <button key={r} onClick={() => setMinRating(r)} className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs ${minRating === r ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground hover:bg-accent"}`}>
                  <Star className="h-3 w-3 fill-current" /> {r === 0 ? "Any" : `${r}+`}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div>
          {results.length === 0 ? (
            <div className="grid place-items-center rounded-2xl border border-dashed border-border py-24 text-center">
              <p className="text-muted-foreground">{isLoading ? "Loading…" : "No professionals match your filters."}</p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((p) => <ProfessionalCard key={p.id} p={p} />)}
            </div>
          )}
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
