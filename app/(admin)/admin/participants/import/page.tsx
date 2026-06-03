import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { ADMIN_ROLES } from "@/lib/auth/rbac";
import { PageHeader } from "@/components/admin/PageHeader";
import { ImportClient } from "@/components/admin/ImportClient";

export const metadata = { title: "Import Participants · Admin" };
export const dynamic = "force-dynamic";

export default async function ImportParticipantsPage() {
  await requireRole(ADMIN_ROLES);

  return (
    <section className="px-4 py-6 md:px-8 md:py-8">
      <PageHeader
        eyebrow="Master data"
        titleAccent="Import"
        title="Participants"
        description="Bulk-load participants from Excel or CSV. Each gets a signed QR token generated automatically."
        actions={
          <Link
            href="/admin/participants"
            className="text-sm text-wit-muted hover:text-wit-red transition-colors self-center"
          >
            ← Back to directory
          </Link>
        }
      />
      <ImportClient />
    </section>
  );
}
