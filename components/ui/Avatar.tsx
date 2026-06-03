import { cn } from "@/lib/utils/cn";

interface AvatarProps {
  /** Name used to derive initials + a deterministic gradient. */
  name: string;
  size?: number;
  className?: string;
}

// Deterministic hue pairs (cyan / lime / violet leaning) keyed off the name.
// WIT red-family gradient pairs (bright red → deep maroon variations).
const PALETTES: Array<[string, string]> = [
  ["#ff5862", "#c81e28"],
  ["#f5333d", "#7a1a22"],
  ["#ff7a82", "#c81e28"],
  ["#e02a34", "#5b1119"],
  ["#ff5862", "#7a1a22"],
];

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

/**
 * Local SVG gradient-initials avatar — no network, always renders, fits the
 * dark theme. Used for participants on the leaderboard.
 */
export function Avatar({ name, size = 44, className }: AvatarProps) {
  const [from, to] = PALETTES[hash(name) % PALETTES.length]!;
  const id = `av-${hash(name)}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 44 44"
      className={cn("shrink-0 rounded-full", className)}
      role="img"
      aria-label={name}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
      </defs>
      <rect width="44" height="44" rx="22" fill={`url(#${id})`} />
      <text
        x="22"
        y="22"
        dominantBaseline="central"
        textAnchor="middle"
        fontSize="16"
        fontWeight="700"
        fill="#ffffff"
        fontFamily="Inter, system-ui, sans-serif"
      >
        {initials(name)}
      </text>
    </svg>
  );
}
