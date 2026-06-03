import Image from "next/image";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlowOrb } from "@/components/ui/GlowOrb";
import { Badge } from "@/components/ui/Badge";
import { MOCK_BOOTHS } from "@/lib/dev/leaderboard-mock";

export const metadata = { title: "Booths" };

export default function BoothsDirectoryPage() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <header className="relative mb-8">
        <GlowOrb color="green" className="-top-10 -left-6 h-40 w-40" />
        <p className="text-xs uppercase tracking-[0.2em] text-wit-red">
          Explore
        </p>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight">
          <span className="text-gradient">Booth</span>{" "}
          <span className="text-wit-white">Directory</span>
        </h1>
        <p className="text-wit-muted mt-2">
          Visit every booth, collect a stamp, and climb the leaderboard.
        </p>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {MOCK_BOOTHS.map((b) => (
          <GlassCard key={b.rank} className="overflow-hidden grad-border">
            <div className="relative h-40">
              <Image
                src={b.imageUrl}
                alt={b.name}
                fill
                sizes="(max-width: 1024px) 50vw, 33vw"
                className="object-cover"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-wit-black via-wit-black/30 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                <div>
                  <Badge tone="info">{b.category}</Badge>
                  <p className="mt-1.5 font-bold text-wit-white text-lg drop-shadow">
                    {b.name}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-xs text-wit-muted uppercase tracking-wider">
                Visitors
              </span>
              <span className="text-xl font-bold text-wit-red tabular-nums">
                {b.visitors}
              </span>
            </div>
          </GlassCard>
        ))}
      </div>
    </section>
  );
}
