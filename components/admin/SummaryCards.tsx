import { GlassCard } from "@/components/ui/GlassCard";

export interface SummaryItem {
  label: string;
  value: string | number;
  accent?: "red" | "white" | "muted";
}

const ACCENT = {
  red: "text-wit-red",
  white: "text-wit-white",
  muted: "text-wit-muted",
} as const;

/**
 * Compact stat strip rendered above admin tables. 2 cols on mobile, up to 4 on
 * desktop. Keeps every management page visually consistent.
 */
export function SummaryCards({ items }: { items: SummaryItem[] }) {
  return (
    <div className="mb-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map((s) => (
        <GlassCard key={s.label} className="p-4">
          <p className="text-[11px] uppercase tracking-wider text-wit-muted">
            {s.label}
          </p>
          <p
            className={`mt-1 text-2xl font-bold tabular-nums ${
              ACCENT[s.accent ?? "white"]
            }`}
          >
            {typeof s.value === "number" ? s.value.toLocaleString() : s.value}
          </p>
        </GlassCard>
      ))}
    </div>
  );
}
