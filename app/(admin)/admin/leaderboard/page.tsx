import { requireRole } from "@/lib/auth/session";
import { MANAGEMENT_OR_ADMIN_ROLES } from "@/lib/auth/rbac";
import { listParticipants } from "@/lib/supabase/queries/participants";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import type { ParticipantRow } from "@/lib/dev/admin-mock";

export const metadata = { title: "Leaderboard · Admin" };
export const dynamic = "force-dynamic";

type RankedRow = ParticipantRow & { rank: number };

export default async function AdminLeaderboardPage() {
  await requireRole(MANAGEMENT_OR_ADMIN_ROLES);
  const ranked: RankedRow[] = [...(await listParticipants())]
    .sort((a, b) => b.stampCount - a.stampCount)
    .map((r, i) => ({ ...r, rank: i + 1 }));

  const columns: Column<RankedRow>[] = [
    {
      key: "rank",
      header: "#",
      render: (r) => <span className="text-wit-muted tabular-nums">{r.rank}</span>,
    },
    {
      key: "name",
      header: "Participant (unmasked)",
      render: (p) => (
        <div className="flex items-center gap-3">
          <Avatar name={p.name} size={32} />
          <div>
            <p className="font-medium">{p.name}</p>
            <p className="text-xs text-wit-muted">{p.code}</p>
          </div>
        </div>
      ),
    },
    { key: "chapter", header: "Chapter", render: (p) => <span className="text-wit-muted">{p.chapterName}</span> },
    {
      key: "stamps",
      header: "Stamps",
      align: "right",
      render: (p) => (
        <span className="font-bold text-wit-red tabular-nums">
          {p.stampCount}/{p.totalBooths}
        </span>
      ),
    },
    {
      key: "raffle",
      header: "Raffle",
      render: (p) => (
        <Badge tone={p.raffleStatus === "qualified" ? "qualified" : "neutral"}>
          {p.raffleStatus === "qualified" ? "Qualified" : "Not yet"}
        </Badge>
      ),
    },
  ];

  return (
    <section className="px-4 py-6 md:px-8 md:py-8">
      <PageHeader
        eyebrow="Engagement"
        titleAccent="Leaderboard"
        title="(Admin view)"
        description="Full unmasked standings for staff. The public leaderboard masks participant names."
      />
      <DataTable columns={columns} rows={ranked} rowKey={(r) => r.id} />
    </section>
  );
}
