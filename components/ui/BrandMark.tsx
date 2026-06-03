import { cn } from "@/lib/utils/cn";

interface BrandMarkProps {
  className?: string;
  withWordmark?: boolean;
}

/**
 * Compact BNI NatCon × WIT brand lockup: a glowing cyan→lime hex glyph plus an
 * optional wordmark. Used in headers and the login screens.
 */
export function BrandMark({ className, withWordmark = true }: BrandMarkProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="relative inline-flex">
        <svg width="34" height="34" viewBox="0 0 40 40" aria-hidden>
          <defs>
            <linearGradient id="bm-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ff5862" />
              <stop offset="100%" stopColor="#c81e28" />
            </linearGradient>
          </defs>
          <path
            d="M20 2.5 35.2 11v18L20 37.5 4.8 29V11z"
            fill="none"
            stroke="url(#bm-grad)"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <circle cx="20" cy="20" r="5.5" fill="url(#bm-grad)" />
        </svg>
        <span className="absolute inset-0 -z-10 blur-md opacity-70 bg-wit-red/40 rounded-full" />
      </span>
      {withWordmark ? (
        <span className="leading-tight">
          <span className="block text-sm font-bold tracking-tight text-wit-white">
            BNI NatCon
          </span>
          <span className="block text-[10px] uppercase tracking-[0.2em] text-wit-muted">
            Digital Passport
          </span>
        </span>
      ) : null}
    </div>
  );
}
