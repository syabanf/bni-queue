import { requireRole } from "@/lib/auth/session";
import { MANAGEMENT_OR_ADMIN_ROLES } from "@/lib/auth/rbac";
import { getRaffleSettings } from "@/lib/supabase/queries/raffle";
import { isMockMode, supabaseConfigured } from "@/lib/data/mode";
import { PageHeader } from "@/components/admin/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";

export const metadata = { title: "Settings · Admin" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await requireRole(MANAGEMENT_OR_ADMIN_ROLES);
  const [raffle, mock] = await Promise.all([getRaffleSettings(), isMockMode()]);
  const configured = supabaseConfigured();

  return (
    <section className="px-4 py-6 md:px-8 md:py-8 max-w-3xl">
      <PageHeader
        eyebrow="System"
        titleAccent="Settings"
        title="& Status"
        description="Event configuration and deployment readiness."
      />

      <div className="space-y-6">
        <GlassCard className="p-6">
          <h2 className="font-bold text-wit-white">Data backend</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <Row label="Supabase configured">
              <Badge tone={configured ? "success" : "duplicate"}>
                {configured ? "Yes" : "Not yet"}
              </Badge>
            </Row>
            <Row label="Current data source">
              <Badge tone={mock ? "info" : "success"}>
                {mock ? "Demo (mock)" : "Live Supabase"}
              </Badge>
            </Row>
            <Row label="Your role">
              <span className="uppercase tracking-wider text-wit-red">
                {session.role.replace("_", " ")}
              </span>
            </Row>
          </dl>
          {mock ? (
            <p className="mt-4 text-xs text-wit-muted">
              Running on demo data. Set real Supabase credentials in{" "}
              <code className="text-wit-red">.env.local</code> and disable{" "}
              <code className="text-wit-red">BNI_DEV_AUTH</code> to go live.
              See the deployment section of the README.
            </p>
          ) : null}
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="font-bold text-wit-white">Raffle</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <Row label="Minimum stamps to qualify">
              <span className="text-wit-white font-semibold">{raffle.minStamps}</span>
            </Row>
            <Row label="Full-passport bonus entries">
              <span className="text-wit-white font-semibold">{raffle.fullPassportBonus}</span>
            </Row>
            <Row label="Status">
              <Badge tone={raffle.isLocked ? "invalid" : "success"}>
                {raffle.isLocked ? "Locked" : "Open"}
              </Badge>
            </Row>
          </dl>
          <p className="mt-4 text-xs text-wit-muted">
            Edit these on the <span className="text-wit-red">Raffle</span> page.
          </p>
        </GlassCard>
      </div>
    </section>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-wit-muted">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
