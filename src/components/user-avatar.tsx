import { cn } from "@/lib/utils";

function initialsOf(name?: string | null) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const a = parts[0]?.[0] ?? "";
  const b = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (a + b).toUpperCase() || name[0].toUpperCase();
}

// Deterministic accent based on the user id / name so initials don't all look identical
function hueFor(seed?: string | null) {
  const s = seed ?? "x";
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 360;
}

type Props = {
  src?: string | null;
  name?: string | null;
  seed?: string | null;
  className?: string;
  ringClass?: string;
};

/** Universal avatar: shows uploaded image when present, otherwise the user's initials.
 *  Used everywhere a user image appears so initials stay until they set a real photo. */
export function UserAvatar({ src, name, seed, className, ringClass }: Props) {
  const initials = initialsOf(name);
  const hue = hueFor(seed ?? name);
  if (src) {
    return (
      <img
        src={src}
        alt={name ?? "User"}
        className={cn("object-cover", className, ringClass)}
      />
    );
  }
  return (
    <span
      aria-label={name ?? "User"}
      className={cn(
        "inline-flex items-center justify-center font-semibold text-white select-none",
        className,
        ringClass,
      )}
      style={{
        background: `linear-gradient(135deg, oklch(0.60 0.18 ${hue}) 0%, oklch(0.45 0.18 ${(hue + 40) % 360}) 100%)`,
      }}
    >
      {initials}
    </span>
  );
}
