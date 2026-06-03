import { GlassCard } from "@/components/ui/GlassCard";

interface Stat {
  label: string;
  value: string;
  accent?: "cyan" | "green" | "violet";
}

const ACCENT = {
  cyan: "text-wit-red",
  green: "text-wit-red",
  violet: "text-wit-red",
} as const;

export function StatStrip({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((s) => (
        <GlassCard key={s.label} className="p-4">
          <p className="text-[11px] uppercase tracking-wider text-wit-muted">
            {s.label}
          </p>
          <p
            className={`mt-1 text-2xl md:text-3xl font-bold tabular-nums ${
              s.accent ? ACCENT[s.accent] : "text-wit-white"
            }`}
          >
            {s.value}
          </p>
        </GlassCard>
      ))}
    </div>
  );
}
