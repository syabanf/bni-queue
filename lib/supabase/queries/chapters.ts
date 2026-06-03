import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isMockMode } from "@/lib/data/mode";
import { MOCK_CHAPTERS, type ChapterRow } from "@/lib/dev/admin-mock";

export async function listChapters(): Promise<ChapterRow[]> {
  if (await isMockMode()) return MOCK_CHAPTERS;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("chapter_summary")
    .select("id, name, city_id, city_name, status, participant_count")
    .order("city_name")
    .order("name");
  if (error) {
    console.error("listChapters failed", error);
    return [];
  }
  return (data ?? []).map((c: Record<string, unknown>) => ({
    id: c.id as string,
    name: c.name as string,
    city_id: c.city_id as string,
    cityName: c.city_name as string,
    status: c.status as ChapterRow["status"],
    participantCount: Number(c.participant_count ?? 0),
  }));
}

/** Lightweight {id, name, city_id} options for active chapters (form selects). */
export async function listChapterOptions(): Promise<
  Array<{ id: string; name: string; city_id: string }>
> {
  const rows = await listChapters();
  return rows
    .filter((c) => c.status === "active")
    .map((c) => ({ id: c.id, name: c.name, city_id: c.city_id }));
}
