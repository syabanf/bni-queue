import { GlassCard } from "@/components/ui/GlassCard";
import { GlowOrb } from "@/components/ui/GlowOrb";
import { getRaffleSettings, getRaffleStats } from "@/lib/supabase/queries/raffle";

export const metadata = { title: "Raffle Status" };
export const dynamic = "force-dynamic";

export default async function RaffleStatusPage() {
  const [settings, stats] = await Promise.all([
    getRaffleSettings(),
    getRaffleStats(),
  ]);

  return (
    <section className="mx-auto max-w-3xl px-6 py-12">
      <header className="relative mb-8 text-center">
        <GlowOrb color="violet" className="-top-12 left-1/2 h-44 w-44 -translate-x-1/2" />
        <p className="text-xs uppercase tracking-[0.2em] text-wit-red">
          Lucky draw
        </p>
        <h1 className="mt-2 text-4xl md:text-5xl font-extrabold tracking-tight">
          <span className="text-gradient">Raffle</span>{" "}
          <span className="text-wit-white">Qualification</span>
        </h1>
        <p className="text-wit-muted mt-2">
          Collect at least{" "}
          <span className="text-wit-red font-bold">{settings.minStamps}</span>{" "}
          stamps to enter the draw.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat label="Min stamps" value={settings.minStamps} accent="green" />
        <Stat label="Qualified" value={stats.eligible} accent="cyan" />
        <Stat label="Full passport" value={stats.fullPassport} accent="violet" />
      </div>

      <GlassCard className="mt-6 p-6 text-center" gradientBorder>
        <p className="text-sm text-wit-muted">
          Winners are drawn live on the main stage and shown on the LED display.
          Keep collecting stamps until the draw closes!
        </p>
      </GlassCard>
    </section>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: "cyan" | "green" | "violet";
}) {
  const color = {
    cyan: "text-wit-red",
    green: "text-wit-red",
    violet: "text-wit-red",
  }[accent];
  return (
    <GlassCard className="p-5 text-center">
      <p className="text-[11px] uppercase tracking-wider text-wit-muted">{label}</p>
      <p className={`mt-1 text-3xl font-bold tabular-nums ${color}`}>
        {value.toLocaleString()}
      </p>
    </GlassCard>
  );
}
