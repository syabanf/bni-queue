import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { MANAGEMENT_OR_ADMIN_ROLES, isAdmin } from "@/lib/auth/rbac";
import { listParticipants } from "@/lib/supabase/queries/participants";
import { listActiveCityOptions } from "@/lib/supabase/queries/cities";
import { listChapterOptions } from "@/lib/supabase/queries/chapters";
import { PageHeader } from "@/components/admin/PageHeader";
import { SummaryCards } from "@/components/admin/SummaryCards";
import { ParticipantsManager } from "@/components/admin/ParticipantsManager";
import { Button } from "@/components/ui/Button";

export const metadata = { title: "Participants · Admin" };
export const dynamic = "force-dynamic";

export default async function ParticipantsPage() {
  const session = await requireRole(MANAGEMENT_OR_ADMIN_ROLES);
  const [rows, cityOptions, chapterOptions] = await Promise.all([
    listParticipants(),
    listActiveCityOptions(),
    listChapterOptions(),
  ]);

  return (
    <section className="px-4 py-6 md:px-8 md:py-8">
      <PageHeader
        eyebrow="Master data"
        titleAccent="Participant"
        title="Directory"
        description="Create, edit, and remove participants, or bulk-import from Excel/CSV. PII is admin-only; the public leaderboard masks names."
        actions={
          <div className="flex gap-2">
            <Link href="/admin/participants/print">
              <Button variant="secondary">Print QR badges</Button>
            </Link>
            {isAdmin(session.role) ? (
              <Link href="/admin/participants/import">
                <Button variant="secondary">Import</Button>
              </Link>
            ) : null}
          </div>
        }
      />
      <SummaryCards
        items={[
          { label: "Total", value: rows.length, accent: "red" },
          { label: "Checked-in", value: rows.filter((p) => p.checkinStatus === "checked_in").length },
          { label: "Qualified", value: rows.filter((p) => p.raffleStatus === "qualified").length },
          { label: "Stamps collected", value: rows.reduce((n, p) => n + p.stampCount, 0) },
        ]}
      />
      <ParticipantsManager
        rows={rows}
        cityOptions={cityOptions}
        chapterOptions={chapterOptions}
        readOnly={!isAdmin(session.role)}
      />
    </section>
  );
}
