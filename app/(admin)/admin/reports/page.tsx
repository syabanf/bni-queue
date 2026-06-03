import { requireRole } from "@/lib/auth/session";
import { MANAGEMENT_OR_ADMIN_ROLES } from "@/lib/auth/rbac";
import { listAuditLogs } from "@/lib/supabase/queries/audit";
import { REPORT_LABELS, type ReportType } from "@/lib/reports/datasets";
import { PageHeader } from "@/components/admin/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatJakartaDateTime } from "@/lib/utils/time";

export const metadata = { title: "Reports · Admin" };
export const dynamic = "force-dynamic";

const REPORT_ORDER: ReportType[] = [
  "participants",
  "booths",
  "chapters",
  "cities",
  "raffle",
  "winners",
  "audit-log",
];

export default async function ReportsPage() {
  await requireRole(MANAGEMENT_OR_ADMIN_ROLES);
  const audit = await listAuditLogs(15);

  return (
    <section className="px-4 py-6 md:px-8 md:py-8">
      <PageHeader
        eyebrow="Reports"
        titleAccent="Export"
        title="Center"
        description="Download post-event reports as Excel or CSV. All exports respect the same masking and access rules as the dashboard."
      />

      <div className="grid sm:grid-cols-2 gap-4">
        {REPORT_ORDER.map((type) => (
          <GlassCard key={type} className="p-5 flex items-center justify-between">
            <div>
              <p className="font-semibold text-wit-white">{REPORT_LABELS[type]}</p>
              <p className="text-xs text-wit-muted mt-0.5">Excel or CSV</p>
            </div>
            <div className="flex gap-2">
              <a href={`/api/reports/${type}/export?format=xlsx`}>
                <Button size="sm">XLSX</Button>
              </a>
              <a href={`/api/reports/${type}/export?format=csv`}>
                <Button size="sm" variant="secondary">CSV</Button>
              </a>
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="text-sm uppercase tracking-wider text-wit-muted mb-3">
          Recent activity (audit log)
        </h2>
        <GlassCard className="divide-y divide-wit-border">
          {audit.map((a) => (
            <div key={a.id} className="flex items-center gap-4 px-4 py-2.5 text-sm">
              <span className="font-mono text-wit-muted w-36 shrink-0">
                {formatJakartaDateTime(a.time)}
              </span>
              <Badge tone="info">{a.module}</Badge>
              <span className="text-wit-white flex-1">{a.action}</span>
              <span className="text-wit-muted truncate max-w-[12rem]">{a.user}</span>
            </div>
          ))}
        </GlassCard>
      </div>
    </section>
  );
}
