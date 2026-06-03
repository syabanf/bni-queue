import { requireBoothPic } from "@/lib/auth/session";
import {
  getBoothById,
  getRecentScansForBooth,
} from "@/lib/supabase/queries/booth";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatJakartaTime, WIB_LABEL } from "@/lib/utils/time";

export const metadata = { title: "My Visitors · Booth" };
export const dynamic = "force-dynamic";

export default async function MyVisitorsPage() {
  const session = await requireBoothPic();
  const boothId = session.boothIds[0];
  if (!boothId) return <NoBooth />;

  const [booth, scans] = await Promise.all([
    getBoothById(boothId),
    getRecentScansForBooth(boothId, 100),
  ]);
  const visitors = scans.filter((s) => s.outcome === "success");

  return (
    <section className="px-4 py-6 max-w-2xl mx-auto">
      <p className="text-[10px] uppercase tracking-[0.2em] text-wit-red">
        {booth?.name ?? "Booth"}
      </p>
      <h1 className="text-xl font-bold text-wit-white mt-0.5">My Visitors</h1>
      <p className="text-sm text-wit-muted mt-1 mb-4">
        {visitors.length} participant(s) stamped at this booth.
      </p>

      {visitors.length === 0 ? (
        <EmptyState title="No visitors yet" description="Stamps you collect appear here." />
      ) : (
        <GlassCard className="divide-y divide-white/5">
          {visitors.map((v) => (
            <div key={v.id} className="flex items-center gap-3 px-4 py-3 text-sm">
              <span className="font-mono text-wit-muted w-20 shrink-0">
                {formatJakartaTime(v.attempted_at)} {WIB_LABEL}
              </span>
              <span className="flex-1 text-wit-white truncate">
                {v.display_label}
              </span>
              <Badge tone={v.scan_source === "manual_input" ? "info" : "neutral"}>
                {v.scan_source === "manual_input" ? "Manual" : "Camera"}
              </Badge>
            </div>
          ))}
        </GlassCard>
      )}
    </section>
  );
}

function NoBooth() {
  return (
    <div className="px-6 py-12 max-w-md mx-auto text-center">
      <h1 className="text-xl font-bold text-wit-white">No booth assigned</h1>
      <p className="text-wit-muted mt-3 text-sm">
        Ask the event admin to assign you a booth.
      </p>
    </div>
  );
}
