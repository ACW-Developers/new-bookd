import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type Cat = { id: string; name: string; slug: string; image_url: string | null };

export function CategoriesCarousel() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canL, setCanL] = useState(false);
  const [canR, setCanR] = useState(true);

  const { data: cats = [] } = useQuery({
    queryKey: ["categories-cards"],
    queryFn: async () => {
      const [{ data: categories }, { data: pros }] = await Promise.all([
        supabase.from("categories").select("id,name,slug,image_url").order("name"),
        supabase.from("profiles").select("category").eq("is_professional", true),
      ]);
      const counts = new Map<string, number>();
      for (const p of pros ?? []) {
        const k = (p as any).category?.toLowerCase().trim();
        if (k) counts.set(k, (counts.get(k) ?? 0) + 1);
      }
      return (categories ?? []).map((c) => ({
        ...(c as Cat),
        count: counts.get(c.name.toLowerCase()) ?? 0,
      }));
    },
  });

  const update = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanL(el.scrollLeft > 4);
    setCanR(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };
  useEffect(() => {
    update();
    const el = scrollerRef.current;
    el?.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => { el?.removeEventListener("scroll", update); window.removeEventListener("resize", update); };
  }, [cats.length]);

  const scroll = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.min(el.clientWidth * 0.85, 720), behavior: "smooth" });
  };

  if (cats.length === 0) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => scroll(-1)}
        disabled={!canL}
        aria-label="Scroll left"
        className="absolute left-0 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 rounded-full border border-border bg-card p-2 shadow-[var(--shadow-elegant)] transition disabled:opacity-30 sm:flex"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => scroll(1)}
        disabled={!canR}
        aria-label="Scroll right"
        className="absolute right-0 top-1/2 z-10 hidden -translate-y-1/2 translate-x-1/2 rounded-full border border-border bg-card p-2 shadow-[var(--shadow-elegant)] transition disabled:opacity-30 sm:flex"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {cats.map((c) => (
          <Link
            key={c.id}
            to={`/search?cat=${encodeURIComponent(c.name)}`}
            className="group relative w-56 shrink-0 snap-start overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)] transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-elegant)]"
          >
            <div className="relative h-32 w-full overflow-hidden">
              {c.image_url ? (
                <img
                  src={c.image_url}
                  alt={c.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <div className="h-full w-full gradient-primary" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>
            <div className="p-4">
              <p className="truncate font-semibold">{c.name}</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3 w-3" /> {c.count} professional{c.count === 1 ? "" : "s"}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
