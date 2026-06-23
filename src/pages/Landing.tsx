import { Link } from "react-router-dom";
import { Search, Calendar, Shield, Sparkles, Users, ArrowRight, CheckCircle2, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiteNav, SiteFooter } from "@/components/site-nav";
import { ProfessionalCard } from "@/components/professional-card";
import { api } from "@/services/supabaseQueries";
import heroImage from "@/assets/landing-hero.jpg";

export default function Landing() {
  const { data: featured = [] } = useQuery({ queryKey: ["featured-pros"], queryFn: api.featuredPros });
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: api.categories });

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-32 left-1/2 h-[480px] w-[900px] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute top-40 right-0 h-[300px] w-[500px] rounded-full bg-primary-glow/20 blur-3xl" />
        </div>
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-2 lg:py-28">
          <div className="flex flex-col justify-center">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Trusted professionals, real-time availability
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Book Trusted <span className="text-gradient">Professionals</span> for Any Event, Service, or Engagement
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              Discover availability, request bookings, and manage professional engagements effortlessly — all from one beautifully simple platform.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="gradient-primary shadow-[var(--shadow-elegant)]">
                <Link to="/search"><Search className="mr-2 h-4 w-4" /> Find Professionals</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/auth?tab=signup">Become a Professional <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              {["Verified pros", "Real-time availability", "Instant booking"].map((t) => (
                <div key={t} className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-success" /> {t}</div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 -z-10 rounded-3xl gradient-primary opacity-20 blur-2xl" />
            <img src={heroImage} width={1280} height={896} alt="Diverse professionals" className="aspect-[4/3] w-full rounded-3xl object-cover shadow-[var(--shadow-elegant)] ring-1 ring-border" />
            <div className="glass absolute -bottom-6 -left-6 hidden rounded-2xl p-4 shadow-[var(--shadow-elegant)] sm:block">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-success/15 text-success"><Calendar className="h-5 w-5" /></div>
                <div>
                  <p className="text-sm font-semibold">{featured.length} pros</p>
                  <p className="text-xs text-muted-foreground">ready to book</p>
                </div>
              </div>
            </div>
            <div className="glass absolute -top-6 -right-6 hidden rounded-2xl p-4 shadow-[var(--shadow-elegant)] sm:block">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 fill-warning text-warning" />
                <p className="text-sm font-semibold">Verified profiles</p>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">across every category</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-card/40">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <div className="glass flex flex-col gap-2 rounded-2xl p-3 shadow-[var(--shadow-soft)] sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search by name, profession or skill…" className="h-12 border-0 bg-transparent pl-10 shadow-none focus-visible:ring-0" />
            </div>
            <div className="hidden h-12 w-px bg-border sm:block" />
            <Input placeholder="Location" className="h-12 border-0 bg-transparent shadow-none focus-visible:ring-0 sm:max-w-[180px]" />
            <Button asChild size="lg" className="gradient-primary">
              <Link to="/search">Search</Link>
            </Button>
          </div>
        </div>
      </section>

      <section id="categories" className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Browse by category</h2>
            <p className="mt-2 text-muted-foreground">Professionals across every industry, ready when you are.</p>
          </div>
          <Link to="/search" className="hidden text-sm font-medium text-primary hover:underline sm:inline">See all →</Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((c) => (
            <Link key={c.id} to="/search" className="group rounded-2xl border border-border bg-card p-5 text-center transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow-soft)]">
              <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:gradient-primary group-hover:text-primary-foreground">
                <Users className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium">{c.name}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-card/30 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Featured professionals</h2>
              <p className="mt-2 text-muted-foreground">Top-rated and ready to book this week.</p>
            </div>
            <Link to="/search" className="hidden text-sm font-medium text-primary hover:underline sm:inline">View all →</Link>
          </div>
          {featured.length === 0 ? (
            <div className="grid place-items-center rounded-2xl border border-dashed border-border py-16 text-center text-muted-foreground">
              No professionals yet — be the first to <Link to="/auth?tab=signup" className="ml-1 text-primary hover:underline">create a profile</Link>.
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((p) => <ProfessionalCard key={p.id} p={p} />)}
            </div>
          )}
        </div>
      </section>

      <section id="how" className="mx-auto max-w-7xl px-6 py-20">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">How BOOKD works</h2>
          <p className="mt-2 text-muted-foreground">Three steps from search to confirmed booking.</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            { icon: Search, title: "Discover", desc: "Search verified professionals by skill, category, location and live availability." },
            { icon: Calendar, title: "Request", desc: "Pick a slot from their real-time calendar and submit a booking request in seconds." },
            { icon: Shield, title: "Confirmed", desc: "Receive instant confirmation, reminders and everything you need on the day." },
          ].map((s, i) => (
            <div key={s.title} className="relative rounded-2xl border border-border bg-card p-7 shadow-[var(--shadow-soft)]">
              <div className="absolute -top-4 left-7 grid h-9 w-9 place-items-center rounded-xl gradient-primary text-sm font-bold text-primary-foreground shadow-[var(--shadow-elegant)]">{i + 1}</div>
              <s.icon className="mt-3 h-7 w-7 text-primary" />
              <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="relative overflow-hidden rounded-3xl gradient-navy p-10 text-center shadow-[var(--shadow-elegant)] sm:p-16">
          <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-primary-glow/30 blur-3xl" />
          <h2 className="relative text-3xl font-bold tracking-tight text-navy-foreground sm:text-4xl">Ready to grow your bookings?</h2>
          <p className="relative mx-auto mt-3 max-w-xl text-navy-foreground/80">Join thousands of professionals who use BOOKD to fill their calendar with quality engagements.</p>
          <div className="relative mt-7 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" variant="secondary">
              <Link to="/auth?tab=signup">Create your free profile</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white">
              <Link to="/search">Explore professionals</Link>
            </Button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
