import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isMockMode } from "@/lib/data/mode";
import { MOCK_ADMIN_BOOTHS, type BoothRow } from "@/lib/dev/admin-mock";

export async function listBooths(): Promise<BoothRow[]> {
  if (await isMockMode()) return MOCK_ADMIN_BOOTHS;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("booth_summary")
    .select(
      "id, code, name, category, location, status, pic_name, visitor_count, last_scan_at",
    )
    .order("code");
  if (error) {
    console.error("listBooths failed", error);
    return [];
  }
  return (data ?? []).map((b: Record<string, unknown>) => ({
    id: b.id as string,
    code: b.code as string,
    name: b.name as string,
    category: (b.category as string | null) ?? null,
    location: (b.location as string | null) ?? null,
    status: b.status as BoothRow["status"],
    picName: (b.pic_name as string | null) ?? null,
    visitorCount: Number(b.visitor_count ?? 0),
    lastScanAt: (b.last_scan_at as string | null) ?? null,
  }));
}
