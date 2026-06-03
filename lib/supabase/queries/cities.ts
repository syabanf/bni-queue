import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isMockMode } from "@/lib/data/mode";
import { MOCK_CITIES, type CityRow } from "@/lib/dev/admin-mock";

export async function listCities(): Promise<CityRow[]> {
  if (await isMockMode()) return MOCK_CITIES;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("city_summary")
    .select("id, name, status, chapter_count, participant_count")
    .order("name");
  if (error) {
    console.error("listCities failed", error);
    return [];
  }
  return (data ?? []).map((c: Record<string, unknown>) => ({
    id: c.id as string,
    name: c.name as string,
    status: c.status as CityRow["status"],
    chapterCount: Number(c.chapter_count ?? 0),
    participantCount: Number(c.participant_count ?? 0),
  }));
}

/** Lightweight list for selects (id + name of active cities). */
export async function listActiveCityOptions(): Promise<
  Array<{ id: string; name: string }>
> {
  if (await isMockMode())
    return MOCK_CITIES.filter((c) => c.status === "active").map((c) => ({
      id: c.id,
      name: c.name,
    }));

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("cities")
    .select("id, name")
    .eq("status", "active")
    .order("name");
  return (data ?? []) as Array<{ id: string; name: string }>;
}
