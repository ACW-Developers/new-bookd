import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "./logo";
import { useAuth } from "@/hooks/use-auth";

export function SiteNav() {
  const { session, profile, user } = useAuth();
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-8 md:flex">
          <Link to="/search" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Find Professionals</Link>
          <a href="/#categories" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Categories</a>
          <a href="/#how" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">How it works</a>
        </nav>
        <div className="flex items-center gap-2">
          {session ? (
            <Button asChild size="sm" className="gap-2">
              <Link to="/dashboard">
                <img
                  src={profile?.avatar_url ?? `https://i.pravatar.cc/60?u=${user?.id}`}
                  alt=""
                  className="h-5 w-5 rounded-full object-cover"
                />
                Dashboard
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/auth">Log in</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/auth?tab=signup">Become a Professional</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card/30">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              Book trusted professionals for any event, service, or engagement.
            </p>
          </div>
          {[
            { h: "Platform", links: ["Find Professionals", "Become a Pro", "Categories", "Pricing"] },
            { h: "Company", links: ["About", "Careers", "Press", "Contact"] },
            { h: "Legal", links: ["Privacy", "Terms", "Security", "Cookies"] },
          ].map((c) => (
            <div key={c.h}>
              <h4 className="text-sm font-semibold text-foreground">{c.h}</h4>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {c.links.map((l) => <li key={l}><a href="#" className="hover:text-foreground">{l}</a></li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-2 border-t border-border pt-6 text-sm text-muted-foreground sm:flex-row">
          <p>© 2026 BOOKD. All rights reserved.</p>
          <p>Crafted with care for professionals worldwide.</p>
        </div>
      </div>
    </footer>
  );
}
