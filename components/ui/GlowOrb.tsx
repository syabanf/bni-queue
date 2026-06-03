import { cn } from "@/lib/utils/cn";

interface GlowOrbProps {
  color?: "cyan" | "green" | "violet";
  className?: string;
}

// Keys retained for call-site compatibility; all map to the WIT red family
// for tonal variety (bright red / red / deep maroon).
const COLOR_MAP = {
  cyan: "rgba(255,88,98,0.55)",
  green: "rgba(245,51,61,0.55)",
  violet: "rgba(123,26,34,0.6)",
} as const;

/**
 * A single blurred, pulsing glow orb. Drop behind a heading or icon for a
 * focal accent. aria-hidden, non-interactive.
 */
export function GlowOrb({ color = "cyan", className }: GlowOrbProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute rounded-full blur-2xl animate-glow-pulse",
        className,
      )}
      style={{
        background: `radial-gradient(circle, ${COLOR_MAP[color]}, transparent 70%)`,
      }}
    />
  );
}
