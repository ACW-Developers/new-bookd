import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "./logo";
import { useAuth } from "@/hooks/use-auth";
import { LogIn, UserPlus } from "lucide-react";
import { UserMenu } from "@/components/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteNav() {
  const { session } = useAuth();
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
          <ThemeToggle />
          {session ? (
            <>
              <Button asChild size="sm" variant="outline">
                <Link to="/dashboard">Dashboard</Link>
              </Button>
              <UserMenu />
            </>
          ) : (
            <>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="hidden border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground sm:inline-flex"
              >
                <Link to="/auth" className="flex items-center gap-2">
                  <LogIn className="w-4 h-4" /> Log in
                </Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/auth?tab=signup" className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4" /> Register
                </Link>
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
