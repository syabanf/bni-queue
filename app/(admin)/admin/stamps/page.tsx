import { requireRole } from "@/lib/auth/session";
import { MANAGEMENT_OR_ADMIN_ROLES } from "@/lib/auth/rbac";
import { listScanMonitor } from "@/lib/supabase/queries/monitoring";
import { PageHeader } from "@/components/admin/PageHeader";
import { SummaryCards } from "@/components/admin/SummaryCards";
import { MonitorTable } from "@/components/admin/MonitorTable";
import { Button } from "@/components/ui/Button";

export const metadata = { title: "Stamp Monitoring · Admin" };
export const dynamic = "force-dynamic";

export default async function StampsPage() {
  await requireRole(MANAGEMENT_OR_ADMIN_ROLES);
  const rows = await listScanMonitor();

  return (
    <section className="px-4 py-6 md:px-8 md:py-8">
      <PageHeader
        eyebrow="Operations"
        titleAccent="Stamp"
        title="Monitoring"
        description="Live feed of every scan — success, duplicate, and invalid attempts are all logged for audit."
        actions={
          <a href="/api/reports/audit-log/export">
            <Button variant="secondary">Export audit log</Button>
          </a>
        }
      />
      <SummaryCards
        items={[
          { label: "Total scans", value: rows.length, accent: "red" },
          { label: "Success", value: rows.filter((r) => r.outcome === "success").length },
          { label: "Duplicate", value: rows.filter((r) => r.outcome === "duplicate").length },
          {
            label: "Invalid",
            value: rows.filter(
              (r) => r.outcome === "invalid_qr" || r.outcome === "invalid_participant",
            ).length,
          },
        ]}
      />
      <MonitorTable rows={rows} />
    </section>
  );
}
