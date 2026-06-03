import { requireRole } from "@/lib/auth/session";
import { MANAGEMENT_OR_ADMIN_ROLES, isAdmin } from "@/lib/auth/rbac";
import { listBooths } from "@/lib/supabase/queries/booths";
import { PageHeader } from "@/components/admin/PageHeader";
import { SummaryCards } from "@/components/admin/SummaryCards";
import { BoothsManager } from "@/components/admin/BoothsManager";

export const metadata = { title: "Booths · Admin" };
export const dynamic = "force-dynamic";

export default async function BoothsPage() {
  const session = await requireRole(MANAGEMENT_OR_ADMIN_ROLES);
  const rows = await listBooths();

  return (
    <section className="px-4 py-6 md:px-8 md:py-8">
      <PageHeader
        eyebrow="Master data"
        titleAccent="Booth"
        title="Management"
        description="Booths are scan targets. Assign PICs from the Users page; each PIC can only scan for their assigned booths."
      />
      <SummaryCards
        items={[
          { label: "Total booths", value: rows.length, accent: "red" },
          { label: "Active", value: rows.filter((b) => b.status === "active").length },
          { label: "Total visitors", value: rows.reduce((n, b) => n + b.visitorCount, 0) },
          { label: "Unassigned", value: rows.filter((b) => !b.picName).length },
        ]}
      />
      <BoothsManager rows={rows} readOnly={!isAdmin(session.role)} />
    </section>
  );
}
