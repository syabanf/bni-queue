import { requireRole } from "@/lib/auth/session";
import { ADMIN_ROLES } from "@/lib/auth/rbac";
import {
  getRaffleSettings,
  getRaffleStats,
  listWinners,
} from "@/lib/supabase/queries/raffle";
import { PageHeader } from "@/components/admin/PageHeader";
import { RaffleManager } from "@/components/admin/RaffleManager";

export const metadata = { title: "Raffle · Admin" };
export const dynamic = "force-dynamic";

export default async function RafflePage() {
  await requireRole(ADMIN_ROLES);
  const [settings, stats, winners] = await Promise.all([
    getRaffleSettings(),
    getRaffleStats(),
    listWinners(),
  ]);

  return (
    <section className="px-4 py-6 md:px-8 md:py-8">
      <PageHeader
        eyebrow="Engagement"
        titleAccent="Raffle"
        title="Management"
        description="Set eligibility, generate the entry pool, draw winners across prize tiers, then lock the result."
      />
      <RaffleManager settings={settings} stats={stats} winners={winners} />
    </section>
  );
}
