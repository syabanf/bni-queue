import Image from "next/image";
import { requireBoothPic } from "@/lib/auth/session";
import {
  getBoothById,
  getBoothDailyStats,
} from "@/lib/supabase/queries/booth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isMockMode } from "@/lib/data/mode";
import { DEV_USERS } from "@/lib/dev/mock-data";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlowOrb } from "@/components/ui/GlowOrb";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProfileToggles } from "@/components/booth/ProfileToggles";
import { formatJakartaTime, WIB_LABEL } from "@/lib/utils/time";

export const metadata = { title: "Profile · Booth" };
export const dynamic = "force-dynamic";

export default async function BoothProfilePage() {
  const session = await requireBoothPic();
  const boothId = session.boothIds[0];

  const [name, booth, stats] = await Promise.all([
    fetchPicName(session.userId),
    boothId ? getBoothById(boothId) : Promise.resolve(null),
    boothId ? getBoothDailyStats(boothId) : Promise.resolve(null),
  ]);

  const displayName = name ?? session.email?.split("@")[0] ?? "Booth PIC";
  const banner = booth
    ? `https://picsum.photos/seed/booth-${booth.code}/720/240`
    : null;

  return (
    <section className="px-4 py-6 max-w-2xl mx-auto space-y-5">
      {/* Identity hero */}
      <div className="relative">
        <GlowOrb color="cyan" className="-top-6 -left-2 h-28 w-28" />
        <GlassCard strong gradientBorder className="p-6">
          <div className="flex items-center gap-4">
            <Avatar name={displayName} size={64} />
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-wit-white truncate">
                {displayName}
              </h1>
              <p className="text-sm text-wit-muted truncate">
                {session.email}
              </p>
              <span className="mt-1.5 inline-block">
                <Badge tone="info">Booth PIC</Badge>
              </span>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Assigned booth */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-wit-red mb-2">
          Assigned booth
        </p>
        {booth ? (
          <GlassCard className="overflow-hidden">
            {banner ? (
              <div className="relative h-28">
                <Image
                  src={banner}
                  alt={booth.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 640px"
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-wit-black via-wit-black/40 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                  <div>
                    {booth.category ? (
                      <Badge tone="info">{booth.category}</Badge>
                    ) : null}
                    <p className="mt-1 text-lg font-bold text-wit-white drop-shadow">
                      {booth.name}
                    </p>
                  </div>
                  <span className="text-xs text-wit-muted">{booth.code}</span>
                </div>
              </div>
            ) : null}
            <div className="px-4 py-3 flex items-center justify-between text-sm">
              <span className="text-wit-muted">
                {booth.location ?? "Location not set"}
              </span>
              <span className="text-wit-muted">
                {session.boothIds.length} booth
                {session.boothIds.length === 1 ? "" : "s"} assigned
              </span>
            </div>
            {stats ? (
              <div className="grid grid-cols-3 gap-px bg-white/5 border-t border-white/10">
                <StatCell label="Visitors" value={stats.totalToday} accent />
                <StatCell label="Duplicates" value={stats.duplicateToday} />
                <StatCell
                  label="Last scan"
                  value={
                    stats.lastScanAt
                      ? `${formatJakartaTime(stats.lastScanAt)} ${WIB_LABEL}`
                      : "—"
                  }
                  small
                />
              </div>
            ) : null}
          </GlassCard>
        ) : (
          <GlassCard className="p-5">
            <p className="text-sm text-wit-muted">
              No booth assigned yet. Ask the event admin to assign you in{" "}
              <span className="text-wit-red">Admin → Booths</span>.
            </p>
          </GlassCard>
        )}
      </div>

      {/* Scanner feedback */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-wit-muted mb-2">
          Scanner feedback
        </p>
        <ProfileToggles />
      </div>

      <form action="/booth/logout" method="post">
        <Button type="submit" variant="danger" className="w-full">
          Sign out
        </Button>
      </form>
    </section>
  );
}

function StatCell({
  label,
  value,
  accent,
  small,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
  small?: boolean;
}) {
  return (
    <div className="bg-wit-charcoal px-3 py-3 text-center">
      <p className="text-[10px] uppercase tracking-wider text-wit-muted">
        {label}
      </p>
      <p
        className={`mt-0.5 font-bold tabular-nums ${
          accent ? "text-wit-red" : "text-wit-white"
        } ${small ? "text-sm" : "text-xl"}`}
      >
        {value}
      </p>
    </div>
  );
}

async function fetchPicName(userId: string): Promise<string | null> {
  if (await isMockMode()) return DEV_USERS.booth_pic.name;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("users")
    .select("name")
    .eq("id", userId)
    .maybeSingle();
  return (data as { name: string } | null)?.name ?? null;
}
