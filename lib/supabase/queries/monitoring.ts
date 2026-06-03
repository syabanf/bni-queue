import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isMockMode } from "@/lib/data/mode";
import { MOCK_SCAN_MONITOR, type ScanMonitorRow } from "@/lib/dev/ops-mock";

export async function listScanMonitor(limit = 200): Promise<ScanMonitorRow[]> {
  if (await isMockMode()) return MOCK_SCAN_MONITOR;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("scan_attempts")
    .select(
      "id, attempted_at, outcome, scan_source, booths(name), participants(name, city_id, chapter_id), users(name)",
    )
    .order("attempted_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("listScanMonitor failed", error);
    return [];
  }

  type Embedded = {
    id: string;
    attempted_at: string;
    outcome: string;
    scan_source: string;
    booths: { name: string } | null;
    participants: { name: string } | null;
    users: { name: string } | null;
  };

  return (data ?? [] as unknown[]).map((r) => {
    const row = r as unknown as Embedded;
    return {
      id: row.id,
      time: row.attempted_at,
      participant: row.participants?.name ?? "—",
      city: "—",
      chapter: "—",
      booth: row.booths?.name ?? "—",
      scannedBy: row.users?.name ?? "—",
      outcome: row.outcome as ScanMonitorRow["outcome"],
      source: row.scan_source as ScanMonitorRow["source"],
    };
  });
}
