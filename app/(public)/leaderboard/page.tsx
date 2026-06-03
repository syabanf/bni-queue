import Image from "next/image";
import { GlassCard } from "@/components/ui/GlassCard";
import { Avatar } from "@/components/ui/Avatar";
import { GlowOrb } from "@/components/ui/GlowOrb";
import { StatStrip } from "@/components/leaderboard/StatStrip";
import { Podium } from "@/components/leaderboard/Podium";
import {
  MOCK_LEADERBOARD,
  MOCK_BOOTHS,
  MOCK_EVENT_STATS,
} from "@/lib/dev/leaderboard-mock";

export const metadata = { title: "Live Leaderboard" };

export default function LeaderboardPage() {
  const top3 = MOCK_LEADERBOARD.slice(0, 3);
  const rest = MOCK_LEADERBOARD.slice(3);
  const s = MOCK_EVENT_STATS;

  return (
    <section className="mx-auto max-w-6xl px-6 py-10 space-y-10">
      {/* Hero */}
      <header className="relative">
        <GlowOrb color="cyan" className="-top-10 -left-6 h-40 w-40" />
        <p className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-wit-red">
          <span className="inline-block h-2 w-2 rounded-full bg-wit-red animate-glow-pulse" />
          Live now
        </p>
        <h1 className="mt-2 text-4xl md:text-5xl font-extrabold tracking-tight">
          <span className="text-gradient">Stamp</span>{" "}
          <span className="text-wit-white">Leaderboard</span>
        </h1>
        <p className="text-wit-muted mt-2 max-w-xl">
          Real-time standings across every booth at BNI National Conference.
          Updates the moment a stamp lands.
        </p>
      </header>

      {/* Event stat strip */}
      <StatStrip
        stats={[
          { label: "Participants", value: s.participants.toLocaleString(), accent: "cyan" },
          { label: "Stamps collected", value: s.totalStamps.toLocaleString(), accent: "green" },
          { label: "Raffle qualified", value: s.qualified.toLocaleString(), accent: "violet" },
          { label: "Active booths", value: String(s.activeBooths) },
        ]}
      />

      {/* Podium */}
      <div>
        <h2 className="text-sm uppercase tracking-wider text-wit-muted mb-5">
          Top performers
        </h2>
        <Podium top3={top3} />
      </div>

      {/* Ranked list */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="text-sm uppercase tracking-wider text-wit-muted mb-3">
            Full ranking
          </h2>
          <GlassCard className="divide-y divide-white/5 overflow-hidden">
            {rest.map((p) => (
              <div
                key={p.rank}
                className="flex items-center gap-4 px-4 py-3 hover:bg-white/5 transition-colors"
              >
                <span className="w-6 text-center text-sm font-bold text-wit-muted tabular-nums">
                  {p.rank}
                </span>
                <Avatar name={p.name} size={38} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-wit-white truncate">
                    {p.maskedName}
                  </p>
                  <p className="text-xs text-wit-muted truncate">
                    {p.city} · {p.chapter}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-wit-red tabular-nums">
                    {p.stamps}
                  </span>
                  <span className="text-xs text-wit-muted">/{p.total}</span>
                </div>
              </div>
            ))}
          </GlassCard>
        </div>

        {/* Booth popularity with imagery */}
        <div>
          <h2 className="text-sm uppercase tracking-wider text-wit-muted mb-3">
            Most visited booths
          </h2>
          <div className="space-y-3">
            {MOCK_BOOTHS.map((b) => (
              <GlassCard
                key={b.rank}
                className="relative overflow-hidden flex items-center gap-3 p-2 pr-4"
              >
                <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg">
                  <Image
                    src={b.imageUrl}
                    alt={b.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-wit-black/70 to-transparent" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-wit-white text-sm truncate">
                    {b.name}
                  </p>
                  <p className="text-[11px] uppercase tracking-wider text-wit-red">
                    {b.category}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-wit-white tabular-nums">
                    {b.visitors}
                  </p>
                  <p className="text-[10px] text-wit-muted">visitors</p>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
