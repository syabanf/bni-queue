import { requireBoothPic } from "@/lib/auth/session";
import {
  getBoothById,
  getRecentScansForBooth,
} from "@/lib/supabase/queries/booth";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatJakartaTime, WIB_LABEL } from "@/lib/utils/time";

export const metadata = { title: "Scan History · Booth" };
export const dynamic = "force-dynamic";

const TONE: Record<string, BadgeTone> = {
  success: "success",
  duplicate: "duplicate",
  invalid_qr: "invalid",
  invalid_participant: "invalid",
};

export default async function ScanHistoryPage() {
  const session = await requireBoothPic();
  const boothId = session.boothIds[0];
  if (!boothId) {
    return (
      <div className="px-6 py-12 max-w-md mx-auto text-center">
        <h1 className="text-xl font-bold text-wit-white">No booth assigned</h1>
      </div>
    );
  }

  const [booth, scans] = await Promise.all([
    getBoothById(boothId),
    getRecentScansForBooth(boothId, 100),
  ]);

  return (
    <section className="px-4 py-6 max-w-2xl mx-auto">
      <p className="text-[10px] uppercase tracking-[0.2em] text-wit-red">
        {booth?.name ?? "Booth"}
      </p>
      <h1 className="text-xl font-bold text-wit-white mt-0.5">Scan History</h1>
      <p className="text-sm text-wit-muted mt-1 mb-4">
        Every scan at this booth, including duplicates and invalid attempts.
      </p>

      {scans.length === 0 ? (
        <EmptyState title="No scans yet" />
      ) : (
        <GlassCard className="divide-y divide-wit-border">
          {scans.map((s) => (
            <div key={s.id} className="flex items-center gap-3 px-4 py-3 text-sm">
              <span className="font-mono text-wit-muted w-20 shrink-0">
                {formatJakartaTime(s.attempted_at)} {WIB_LABEL}
              </span>
              <span className="flex-1 text-wit-white truncate">
                {s.display_label}
              </span>
              <Badge tone={TONE[s.outcome] ?? "neutral"}>
                {s.outcome.replace("_", " ")}
              </Badge>
            </div>
          ))}
        </GlassCard>
      )}
    </section>
  );
}
