import { GlassCard } from "@/components/ui/GlassCard";
import { Avatar } from "@/components/ui/Avatar";
import type { MockParticipant } from "@/lib/dev/leaderboard-mock";

const RANK_STYLE = {
  1: { ring: "glow-red", badge: "bg-wit-red text-wit-onred", order: "md:order-2 md:-translate-y-4" },
  2: { ring: "glow-red", badge: "bg-wit-red text-wit-onred", order: "md:order-1" },
  3: { ring: "", badge: "bg-wit-red text-wit-onred", order: "md:order-3" },
} as const;

/**
 * Top-3 podium. Rank 1 is centered and lifted with a lime glow; 2 and 3 flank
 * it. Each tile is a glass card with a gradient-initials avatar.
 */
export function Podium({ top3 }: { top3: MockParticipant[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
      {top3.map((p) => {
        const style = RANK_STYLE[p.rank as 1 | 2 | 3] ?? RANK_STYLE[3];
        return (
          <GlassCard
            key={p.rank}
            strong
            gradientBorder={p.rank === 1}
            className={`relative p-6 flex flex-col items-center text-center ${style.order} ${style.ring}`}
          >
            <span
              className={`absolute -top-3 left-1/2 -translate-x-1/2 h-7 w-7 rounded-full grid place-items-center text-xs font-bold ${style.badge}`}
            >
              {p.rank}
            </span>
            <Avatar name={p.name} size={p.rank === 1 ? 72 : 56} />
            <p className="mt-3 font-bold text-wit-white">{p.maskedName}</p>
            <p className="text-xs text-wit-muted mt-0.5">
              {p.city} · {p.chapter}
            </p>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-3xl font-bold text-gradient tabular-nums">
                {p.stamps}
              </span>
              <span className="text-sm text-wit-muted">/ {p.total}</span>
            </div>
            <p className="text-[11px] text-wit-muted mt-1">
              Last {p.lastCollected} WIB
            </p>
          </GlassCard>
        );
      })}
    </div>
  );
}
