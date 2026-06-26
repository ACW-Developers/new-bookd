import { Link } from "react-router-dom";
import { Search, MapPin, Calendar, Shield, Sparkles, Users, ArrowRight, CheckCircle2, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiteNav, SiteFooter } from "@/components/site-nav";
import { ProfessionalCard } from "@/components/professional-card";
import { CategoriesCarousel } from "@/components/categories-carousel";
import { api } from "@/services/supabaseQueries";
import heroImage from "@/assets/book3.png";

export default function Landing() {
  const { data: featured = [] } = useQuery({ queryKey: ["featured-pros"], queryFn: api.featuredPros });

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
            <h1 className="mt-5 text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Book Trusted <span className="text-primary">Professionals</span> for Any Event, Service, or Engagement
            </h1>
            <p className="mt-5 max-w-xl text-lg text-black">
              Discover availability, request bookings, and manage professional engagements effortlessly - all from one beautifully simple platform.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-primary shadow-[var(--shadow-elegant)]">
                <Link to="/search"><Search className="mr-2 h-4 w-4" /> Find Professionals</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/auth?tab=signup">Become a Professional <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 -z-10 rounded-3xl bg-primary opacity-20 blur-2xl" />
            <img src={heroImage} width={1280} height={896} alt="Diverse professionals" className="aspect-[4/3] w-full rounded-3xl object-cover " />
          </div>
        </div>
      </section>

      <section id="categories" className="mx-auto max-w-7xl px-6">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Browse by category</h2>
            <p className="mt-2 text-black">Professionals across every industry, ready when you are.</p>
          </div>
          <Link to="/search" className="hidden text-sm font-medium text-primary hover:underline sm:inline">See all →</Link>
        </div>
        <CategoriesCarousel />
      </section>

      <section className="bg-card/40">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <div className="glass flex flex-col gap-2 rounded-2xl p-3 shadow-[var(--shadow-soft)] sm:flex-row">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black" />
              <Input
                placeholder="Search by name, profession or skill…"
                className="h-12 border-0 bg-transparent pl-10 shadow-none focus-visible:ring-0"
              />
            </div>

            <div className="hidden h-12 w-px bg-border sm:block" />

            {/* Location Input */}
            <div className="relative sm:max-w-[180px] w-full">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black" />
              <Input
                placeholder="Location"
                className="h-12 border-0 bg-transparent pl-10 shadow-none focus-visible:ring-0"
              />
            </div>

            <Button asChild size="lg" className="bg-primary">
              <Link to="/search">Search</Link>
            </Button>

          </div>
        </div>
      </section>

      <section className="bg-card/30 py-10">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Featured professionals</h2>
              <p className="mt-2 text-black">Top-rated and ready to book this week.</p>
            </div>
            <Link to="/search" className="hidden text-sm font-medium text-primary hover:underline sm:inline">View all →</Link>
          </div>
          {featured.length === 0 ? (
            <div className="grid place-items-center rounded-2xl border border-dashed border-border py-16 text-center text-black">
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
          <p className="mt-2 text-black">Three steps from search to confirmed booking.</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            { icon: Search, title: "Discover", desc: "Search verified professionals by skill, category, location and live availability." },
            { icon: Calendar, title: "Request", desc: "Pick a slot from their real-time calendar and submit a booking request in seconds." },
            { icon: Shield, title: "Confirmed", desc: "Receive instant confirmation, reminders and everything you need on the day." },
          ].map((s, i) => (
            <div key={s.title} className="relative rounded-2xl border border-border bg-card p-7 shadow-[var(--shadow-soft)]">
              <div className="absolute -top-4 left-7 grid h-9 w-9 place-items-center rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-[var(--shadow-elegant)]">{i + 1}</div>
              <s.icon className="mt-3 h-7 w-7 text-primary" />
              <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
              <p className="mt-1.5 text-sm text-black">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
