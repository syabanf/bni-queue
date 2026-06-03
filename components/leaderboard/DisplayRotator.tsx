"use client";

import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { BrandMark } from "@/components/ui/BrandMark";
import type { MockParticipant, MockBooth } from "@/lib/dev/leaderboard-mock";

interface DisplayData {
  participants: MockParticipant[];
  booths: MockBooth[];
  stats: { participants: number; totalStamps: number; qualified: number };
}

const SLIDES = ["overall", "booths", "raffle"] as const;
type Slide = (typeof SLIDES)[number];
const SLIDE_MS = 12_000;

/**
 * Fullscreen LED display. Auto-rotates between slides. Uses a timer for
 * rotation and re-fetches data periodically so a long-running screen stays
 * fresh even without realtime. High-contrast, oversized type for projection.
 */
export function DisplayRotator({ data }: { data: DisplayData }) {
  const [index, setIndex] = useState(0);
  const slide: Slide = SLIDES[index % SLIDES.length]!;

  useEffect(() => {
    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % SLIDES.length),
      SLIDE_MS,
    );
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden bg-wit-black text-wit-white">
      {/* aurora */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(60% 60% at 20% 20%, rgba(245,51,61,0.28), transparent 60%), radial-gradient(60% 60% at 80% 80%, rgba(123,26,34,0.4), transparent 60%)",
        }}
      />
      <div className="relative h-full flex flex-col p-10">
        <header className="flex items-center justify-between">
          <BrandMark />
          <div className="flex items-center gap-2 text-lg text-wit-red">
            <span className="inline-block h-3 w-3 rounded-full bg-wit-red animate-glow-pulse" />
            LIVE
          </div>
        </header>

        <div className="flex-1 flex flex-col justify-center">
          {slide === "overall" ? <OverallSlide rows={data.participants} /> : null}
          {slide === "booths" ? <BoothSlide rows={data.booths} /> : null}
          {slide === "raffle" ? <RaffleSlide stats={data.stats} /> : null}
        </div>

        <footer className="flex items-center justify-between text-wit-muted">
          <div className="flex gap-2">
            {SLIDES.map((s, i) => (
              <span
                key={s}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-8 bg-wit-red" : "w-3 bg-white/20"
                }`}
              />
            ))}
          </div>
          <span className="text-sm">
            Powered by <span className="text-gradient font-semibold">WIT.ID</span>
          </span>
        </footer>
      </div>
    </div>
  );
}

function SlideTitle({ accent, rest }: { accent: string; rest: string }) {
  return (
    <h2 className="mb-8 text-5xl font-extrabold tracking-tight">
      <span className="text-gradient">{accent}</span>{" "}
      <span className="text-wit-white">{rest}</span>
    </h2>
  );
}

function OverallSlide({ rows }: { rows: MockParticipant[] }) {
  return (
    <div className="animate-rise">
      <SlideTitle accent="Top" rest="Performers" />
      <div className="space-y-3">
        {rows.slice(0, 5).map((p) => (
          <div
            key={p.rank}
            className="glass-panel rounded-2xl flex items-center gap-6 px-8 py-5"
          >
            <span className="text-4xl font-extrabold text-wit-red tabular-nums w-12">
              {p.rank}
            </span>
            <Avatar name={p.name} size={56} />
            <div className="flex-1">
              <p className="text-2xl font-bold">{p.maskedName}</p>
              <p className="text-lg text-wit-muted">
                {p.city} · {p.chapter}
              </p>
            </div>
            <span className="text-4xl font-extrabold text-wit-red tabular-nums">
              {p.stamps}
              <span className="text-xl text-wit-muted">/{p.total}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BoothSlide({ rows }: { rows: MockBooth[] }) {
  return (
    <div className="animate-rise">
      <SlideTitle accent="Most" rest="Visited Booths" />
      <div className="grid grid-cols-2 gap-5">
        {rows.slice(0, 4).map((b) => (
          <div
            key={b.rank}
            className="glass-panel rounded-2xl flex items-center justify-between px-8 py-6"
          >
            <div>
              <p className="text-3xl font-bold">{b.name}</p>
              <p className="text-lg uppercase tracking-wider text-wit-red">
                {b.category}
              </p>
            </div>
            <span className="text-5xl font-extrabold text-wit-red tabular-nums">
              {b.visitors}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RaffleSlide({
  stats,
}: {
  stats: { participants: number; totalStamps: number; qualified: number };
}) {
  return (
    <div className="animate-rise text-center">
      <SlideTitle accent="Raffle" rest="Qualification" />
      <div className="flex justify-center gap-10">
        <Big label="Participants" value={stats.participants} />
        <Big label="Stamps collected" value={stats.totalStamps} />
        <Big label="Qualified" value={stats.qualified} />
      </div>
    </div>
  );
}

function Big({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-7xl font-extrabold text-gradient tabular-nums">
        {value.toLocaleString()}
      </p>
      <p className="mt-2 text-xl uppercase tracking-wider text-wit-muted">
        {label}
      </p>
    </div>
  );
}
