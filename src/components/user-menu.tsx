import { Link, useNavigate } from "react-router-dom";
import { LogOut, Settings, User as UserIcon, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { UserAvatar } from "@/components/user-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserMenu() {
  const navigate = useNavigate();
  const { user, profile, isAdmin, isProfessional, signOut } = useAuth();
  if (!user) return null;
  const onLogout = async () => {
    await signOut();
    navigate("/");
  };
  const name = profile?.full_name ?? user.email ?? "Me";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full border border-border bg-card py-1 pl-1 pr-3 transition-colors hover:bg-accent">
          <UserAvatar
            src={profile?.avatar_url}
            name={name}
            seed={user.id}
            className="h-7 w-7 rounded-full text-xs ring-2 ring-primary/20"
          />
          <span className="hidden text-left sm:block">
            <span className="block text-sm font-medium leading-tight">{name}</span>
            <span className="block text-[11px] text-muted-foreground">
              {isAdmin ? "Admin" : isProfessional ? "Professional" : "Client"}
            </span>
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/dashboard/profile"><UserIcon className="mr-2 h-4 w-4" /> Profile</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/dashboard/settings"><Settings className="mr-2 h-4 w-4" /> Settings</Link>
        </DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem asChild>
            <Link to="/admin"><ShieldCheck className="mr-2 h-4 w-4" /> Admin panel</Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout} className="text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" /> Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
