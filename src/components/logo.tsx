import { Link } from "react-router-dom";
import logoAsset from "@/assets/bookd.png";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`flex items-center gap-2 ${className}`}>
      <img src={logoAsset} alt="BOOKD" className="h-9 w-auto" />
    </Link>
  );
}
