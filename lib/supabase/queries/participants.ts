import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isMockMode } from "@/lib/data/mode";
import { MOCK_PARTICIPANTS, type ParticipantRow } from "@/lib/dev/admin-mock";

export interface ParticipantFilter {
  search?: string;
  cityId?: string;
  chapterId?: string;
  raffle?: "qualified" | "not_yet";
}

const TOTAL_BOOTHS = 12;

export async function listParticipants(
  filter: ParticipantFilter = {},
): Promise<ParticipantRow[]> {
  if (await isMockMode()) {
    return MOCK_PARTICIPANTS.filter((p) => {
      if (
        filter.search &&
        !`${p.name} ${p.code} ${p.email ?? ""}`
          .toLowerCase()
          .includes(filter.search.toLowerCase())
      )
        return false;
      if (filter.raffle && p.raffleStatus !== filter.raffle) return false;
      return true;
    });
  }

  const supabase = await createSupabaseServerClient();
  let q = supabase
    .from("participant_summary")
    .select(
      "id, code, name, phone, email, city_id, chapter_id, city_name, chapter_name, checkin_status, stamp_count, raffle_qualified",
    )
    .order("stamp_count", { ascending: false })
    .limit(500);

  if (filter.cityId) q = q.eq("city_id", filter.cityId);
  if (filter.chapterId) q = q.eq("chapter_id", filter.chapterId);
  if (filter.raffle === "qualified") q = q.eq("raffle_qualified", true);
  if (filter.raffle === "not_yet") q = q.eq("raffle_qualified", false);
  if (filter.search)
    q = q.or(
      `name.ilike.%${filter.search}%,code.ilike.%${filter.search}%,email.ilike.%${filter.search}%`,
    );

  const { data, error } = await q;
  if (error) {
    console.error("listParticipants failed", error);
    return [];
  }
  return (data ?? []).map((p: Record<string, unknown>) => ({
    id: p.id as string,
    code: p.code as string,
    name: p.name as string,
    phone: (p.phone as string | null) ?? null,
    email: (p.email as string | null) ?? null,
    cityId: p.city_id as string,
    cityName: p.city_name as string,
    chapterId: p.chapter_id as string,
    chapterName: p.chapter_name as string,
    stampCount: Number(p.stamp_count ?? 0),
    totalBooths: TOTAL_BOOTHS,
    checkinStatus: p.checkin_status as ParticipantRow["checkinStatus"],
    raffleStatus: p.raffle_qualified ? "qualified" : "not_yet",
  }));
}

export async function getParticipant(
  id: string,
): Promise<ParticipantRow | null> {
  if (await isMockMode())
    return MOCK_PARTICIPANTS.find((p) => p.id === id) ?? null;

  const rows = await listParticipants();
  return rows.find((p) => p.id === id) ?? null;
}
