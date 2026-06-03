import { requireRole } from "@/lib/auth/session";
import { MANAGEMENT_OR_ADMIN_ROLES, isAdmin } from "@/lib/auth/rbac";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlowOrb } from "@/components/ui/GlowOrb";
import { ParticipantsManager } from "@/components/admin/ParticipantsManager";
import { MOCK_EVENT_STATS } from "@/lib/dev/leaderboard-mock";
import { listParticipants } from "@/lib/supabase/queries/participants";
import { listActiveCityOptions } from "@/lib/supabase/queries/cities";
import { listChapterOptions } from "@/lib/supabase/queries/chapters";

export const metadata = { title: "Admin Overview" };
export const dynamic = "force-dynamic";

const FUNNEL = [
  { stage: "Registered", count: 3000 },
  { stage: "Checked-in", count: 2650 },
  { stage: "Collected 1+ stamp", count: 2100 },
  { stage: "Qualified for raffle", count: 1200 },
  { stage: "Full passport", count: 420 },
];

export default async function AdminOverviewPage() {
  const session = await requireRole(MANAGEMENT_OR_ADMIN_ROLES);
  const [participants, cityOptions, chapterOptions] = await Promise.all([
    listParticipants(),
    listActiveCityOptions(),
    listChapterOptions(),
  ]);
  const s = MOCK_EVENT_STATS;
  const max = FUNNEL[0]!.count;

  const metrics = [
    { label: "Registered", value: s.participants.toLocaleString(), sub: "from import" },
    { label: "Checked-in", value: s.checkedIn.toLocaleString(), sub: "88% of registered" },
    { label: "Total stamps", value: s.totalStamps.toLocaleString(), sub: "across all booths" },
    { label: "Qualified", value: s.qualified.toLocaleString(), sub: "≥ 8 stamps" },
    { label: "Full passport", value: s.fullPassport.toLocaleString(), sub: "all booths visited" },
    { label: "Active booths", value: String(s.activeBooths), sub: "receiving scans" },
  ];

  return (
    <section className="px-4 py-6 md:px-8 md:py-8">
      <header className="relative mb-8">
        <GlowOrb color="cyan" className="-top-8 -left-4 h-32 w-32" />
        <p className="text-xs uppercase tracking-[0.2em] text-wit-red">Overview</p>
        <h1 className="text-3xl font-extrabold tracking-tight mt-1">
          <span className="text-gradient">Event</span>{" "}
          <span className="text-wit-white">Control Center</span>
        </h1>
        <p className="text-sm text-wit-muted mt-2">
          Signed in as <span className="text-wit-white">{session.email}</span> ·{" "}
          <span className="uppercase tracking-wider text-wit-red">
            {session.role.replace("_", " ")}
          </span>
        </p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((m) => (
          <GlassCard key={m.label} className="p-5">
            <p className="text-[11px] uppercase tracking-wider text-wit-muted">
              {m.label}
            </p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-wit-white">
              {m.value}
            </p>
            <p className="text-xs text-wit-muted mt-1">{m.sub}</p>
          </GlassCard>
        ))}
      </div>

      <div className="mt-6">
        <h2 className="text-sm uppercase tracking-wider text-wit-muted mb-3">
          Completion funnel
        </h2>
        <GlassCard className="p-5 space-y-3">
          {FUNNEL.map((f) => {
            const pct = Math.round((f.count / max) * 100);
            return (
              <div key={f.stage}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-wit-white">{f.stage}</span>
                  <span className="text-wit-muted tabular-nums">
                    {f.count.toLocaleString()} · {pct}%
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-wit-graphite overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      background:
                        "linear-gradient(90deg, var(--color-wit-maroon), var(--color-wit-red))",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </GlassCard>
      </div>

      {/* Participants — full CRUD table right on the dashboard */}
      <div className="mt-8">
        <h2 className="text-sm uppercase tracking-wider text-wit-muted mb-3">
          Participants
        </h2>
        <ParticipantsManager
          rows={participants.slice(0, 6)}
          cityOptions={cityOptions}
          chapterOptions={chapterOptions}
          readOnly={!isAdmin(session.role)}
          compact
          viewAllHref="/admin/participants"
        />
      </div>
    </section>
  );
}
