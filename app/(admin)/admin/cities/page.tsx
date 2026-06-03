import { requireRole } from "@/lib/auth/session";
import { MANAGEMENT_OR_ADMIN_ROLES, isAdmin } from "@/lib/auth/rbac";
import { listCities } from "@/lib/supabase/queries/cities";
import { PageHeader } from "@/components/admin/PageHeader";
import { SummaryCards } from "@/components/admin/SummaryCards";
import { CitiesManager } from "@/components/admin/CitiesManager";

export const metadata = { title: "Cities · Admin" };
export const dynamic = "force-dynamic";

export default async function CitiesPage() {
  const session = await requireRole(MANAGEMENT_OR_ADMIN_ROLES);
  const rows = await listCities();

  return (
    <section className="px-4 py-6 md:px-8 md:py-8">
      <PageHeader
        eyebrow="Master data"
        titleAccent="City"
        title="Management"
        description="Cities host one or more BNI chapters. Deactivate a city to hide it from new assignments without losing history."
      />
      <SummaryCards
        items={[
          { label: "Total cities", value: rows.length, accent: "red" },
          { label: "Active", value: rows.filter((c) => c.status === "active").length },
          { label: "Chapters", value: rows.reduce((n, c) => n + c.chapterCount, 0) },
          { label: "Participants", value: rows.reduce((n, c) => n + c.participantCount, 0) },
        ]}
      />
      <CitiesManager rows={rows} readOnly={!isAdmin(session.role)} />
    </section>
  );
}
