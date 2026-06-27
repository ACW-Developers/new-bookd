import { Link } from "react-router-dom";
import { useState } from "react";
import { Search as SearchIcon, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "@/components/dashboard-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ProfessionalCard } from "@/components/professional-card";
import { CategoriesCarousel } from "@/components/categories-carousel";
import { api } from "@/services/supabaseQueries";

export default function Discover() {
  const [q, setQ] = useState("");
  const { data: pros = [] } = useQuery({ queryKey: ["all-pros"], queryFn: api.allPros });

  const filtered = pros.filter((p) => {
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    return (
      p.full_name?.toLowerCase().includes(s) ||
      p.profession?.toLowerCase().includes(s) ||
      p.category?.toLowerCase().includes(s) ||
      p.location?.toLowerCase().includes(s)
    );
  });

  return (
    <DashboardShell title="Discover professionals" subtitle="Browse, filter, and book the right person for your project.">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} className="h-11 pl-9" placeholder="Search by name, profession, category, or location" />
        </div>
      </div>

      <section className="mt-8">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-lg font-bold tracking-tight">Browse categories</h2>
          <Button asChild variant="ghost" size="sm"><Link to="/search">All categories <ArrowRight className="ml-1 h-3 w-3" /></Link></Button>
        </div>
        <CategoriesCarousel />
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-bold tracking-tight">{q ? `Results (${filtered.length})` : "All professionals"}</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => <ProfessionalCard key={p.id} p={p} />)}
          {filtered.length === 0 && (
            <div className="col-span-full grid place-items-center rounded-2xl border border-dashed border-border py-10 text-sm text-muted-foreground">
              No professionals match your search.
            </div>
          )}
        </div>
      </section>
    </DashboardShell>
  );
}
