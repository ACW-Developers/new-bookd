import { Link } from "react-router-dom";
import { MapPin, Star, Calendar } from "lucide-react";
import type { Profile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/currency";
import { UserAvatar } from "@/components/user-avatar";

export function ProfessionalCard({ p }: { p: Profile }) {
  return (
    <div className="group relative flex flex-col rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-elegant)]">
      <div className="flex items-start gap-4">
        <UserAvatar
          src={p.avatar_url}
          name={p.full_name}
          seed={p.id}
          className="h-16 w-16 shrink-0 rounded-xl text-lg ring-2 ring-primary/10"
        />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-foreground">{p.full_name}</h3>
          <p className="text-sm text-muted-foreground">{p.profession ?? "Professional"}</p>
          {p.location && (
            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" /> {p.location}
            </div>
          )}
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
          <Calendar className="h-3 w-3" /> Open for bookings
        </span>
        <span className="inline-flex items-center gap-1 text-sm font-medium">
          <Star className="h-4 w-4 fill-warning text-warning" />
          {Number(p.rating ?? 0).toFixed(1)} <span className="text-muted-foreground">({p.reviews_count})</span>
        </span>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
        <div>
          <p className="text-xs text-muted-foreground">From</p>
          <p className="font-semibold text-navy">
            {formatPrice(p.hourly_rate)}
            <span className="text-xs font-normal text-muted-foreground">/hr</span>
          </p>
        </div>
        <Button asChild size="sm">
          <Link to={`/professionals/${p.id}`}>View Profile</Link>
        </Button>
      </div>
    </div>
  );
}
