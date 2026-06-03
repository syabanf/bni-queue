import { requireRole } from "@/lib/auth/session";
import { MANAGEMENT_OR_ADMIN_ROLES, isAdmin } from "@/lib/auth/rbac";
import { listUsers } from "@/lib/supabase/queries/users";
import { listBooths } from "@/lib/supabase/queries/booths";
import { PageHeader } from "@/components/admin/PageHeader";
import { SummaryCards } from "@/components/admin/SummaryCards";
import { UsersManager } from "@/components/admin/UsersManager";

export const metadata = { title: "Users · Admin" };
export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const session = await requireRole(MANAGEMENT_OR_ADMIN_ROLES);
  const [rows, booths] = await Promise.all([listUsers(), listBooths()]);
  const boothOptions = booths.map((b) => ({ id: b.id, name: b.name }));

  return (
    <section className="px-4 py-6 md:px-8 md:py-8">
      <PageHeader
        eyebrow="Access"
        titleAccent="User"
        title="Management"
        description="Staff accounts and roles. Booth PICs are scoped to their assigned booths; assignment changes require the PIC to sign in again."
      />
      <SummaryCards
        items={[
          { label: "Total users", value: rows.length, accent: "red" },
          {
            label: "Admins",
            value: rows.filter(
              (u) => u.role === "super_admin" || u.role === "event_admin",
            ).length,
          },
          { label: "Booth PICs", value: rows.filter((u) => u.role === "booth_pic").length },
          { label: "Active", value: rows.filter((u) => u.status === "active").length },
        ]}
      />
      <UsersManager
        rows={rows}
        boothOptions={boothOptions}
        readOnly={!isAdmin(session.role)}
      />
    </section>
  );
}
