import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDevSession } from "@/lib/auth/dev-session";
import {
  DEV_BOOTH,
  DEV_BOOTH_DAILY_STATS,
  DEV_BOOTH_ID,
  DEV_RECENT_SCANS,
} from "@/lib/dev/mock-data";

export interface BoothSummary {
  id: string;
  code: string;
  name: string;
  category: string | null;
  location: string | null;
}

/**
 * Read a single booth by id. RLS scopes the result; PICs can read any booth
 * (master data is broadly readable to authenticated users), they just can't
 * scan for the wrong one.
 */
export async function getBoothById(id: string): Promise<BoothSummary | null> {
  // Dev shortcut: when a BNI_DEV_AUTH session is active, return the mock booth
  // so the scanner page can render end-to-end without a database.
  const dev = await getDevSession();
  if (dev && id === DEV_BOOTH_ID) {
    return { ...DEV_BOOTH };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("booths")
    .select("id, code, name, category, location")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return data as unknown as BoothSummary;
}

export interface BoothDailyStats {
  totalToday: number;
  duplicateToday: number;
  lastScanAt: string | null;
}

/**
 * Today's stats for a booth — used by the scanner stats panel. Reads from
 * scan_attempts (covers both success and duplicate). All times in Asia/Jakarta.
 */
export async function getBoothDailyStats(
  boothId: string,
): Promise<BoothDailyStats> {
  const dev = await getDevSession();
  if (dev && boothId === DEV_BOOTH_ID) {
    return { ...DEV_BOOTH_DAILY_STATS };
  }

  const supabase = await createSupabaseServerClient();

  // Jakarta day boundary: today at 00:00 WIB → today at 00:00 UTC+7.
  const now = new Date();
  const wibOffsetMs = 7 * 60 * 60 * 1000;
  const wibNow = new Date(now.getTime() + wibOffsetMs);
  wibNow.setUTCHours(0, 0, 0, 0);
  const dayStartUtc = new Date(wibNow.getTime() - wibOffsetMs).toISOString();

  const { data } = await supabase
    .from("scan_attempts")
    .select("outcome, attempted_at")
    .eq("booth_id", boothId)
    .gte("attempted_at", dayStartUtc)
    .order("attempted_at", { ascending: false })
    .limit(2000);

  type Row = { outcome: string; attempted_at: string };
  const rows = (data ?? []) as unknown as Row[];
  return {
    totalToday: rows.filter((r) => r.outcome === "success").length,
    duplicateToday: rows.filter((r) => r.outcome === "duplicate").length,
    lastScanAt: rows[0]?.attempted_at ?? null,
  };
}

export interface RecentScanRow {
  id: string;
  attempted_at: string;
  outcome: string;
  participant_id: string | null;
  scan_source: string;
  display_label: string;
}

export async function getRecentScansForBooth(
  boothId: string,
  limit = 15,
): Promise<RecentScanRow[]> {
  const dev = await getDevSession();
  if (dev && boothId === DEV_BOOTH_ID) {
    return DEV_RECENT_SCANS.slice(0, limit);
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("scan_attempts")
    .select("id, attempted_at, outcome, participant_id, scan_source")
    .eq("booth_id", boothId)
    .order("attempted_at", { ascending: false })
    .limit(limit);

  type Row = {
    id: string;
    attempted_at: string;
    outcome: string;
    participant_id: string | null;
    scan_source: string;
  };
  return ((data ?? []) as unknown as Row[]).map((r) => ({
    ...r,
    display_label: r.participant_id?.slice(0, 8) ?? "—",
  }));
}
