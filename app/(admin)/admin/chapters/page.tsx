import { requireRole } from "@/lib/auth/session";
import { MANAGEMENT_OR_ADMIN_ROLES, isAdmin } from "@/lib/auth/rbac";
import { listChapters } from "@/lib/supabase/queries/chapters";
import { listActiveCityOptions } from "@/lib/supabase/queries/cities";
import { PageHeader } from "@/components/admin/PageHeader";
import { SummaryCards } from "@/components/admin/SummaryCards";
import { ChaptersManager } from "@/components/admin/ChaptersManager";

export const metadata = { title: "Chapters · Admin" };
export const dynamic = "force-dynamic";

export default async function ChaptersPage() {
  const session = await requireRole(MANAGEMENT_OR_ADMIN_ROLES);
  const [rows, cityOptions] = await Promise.all([
    listChapters(),
    listActiveCityOptions(),
  ]);

  return (
    <section className="px-4 py-6 md:px-8 md:py-8">
      <PageHeader
        eyebrow="Master data"
        titleAccent="Chapter"
        title="Management"
        description="Every chapter belongs to a city. Participants are imported against a chapter."
      />
      <SummaryCards
        items={[
          { label: "Total chapters", value: rows.length, accent: "red" },
          { label: "Active", value: rows.filter((c) => c.status === "active").length },
          { label: "Cities covered", value: new Set(rows.map((c) => c.cityName)).size },
          { label: "Participants", value: rows.reduce((n, c) => n + c.participantCount, 0) },
        ]}
      />
      <ChaptersManager
        rows={rows}
        cityOptions={cityOptions}
        readOnly={!isAdmin(session.role)}
      />
    </section>
  );
}
