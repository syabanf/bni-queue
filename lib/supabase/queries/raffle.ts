import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isMockMode } from "@/lib/data/mode";
import { maskParticipantName } from "@/lib/utils/masking";
import {
  MOCK_RAFFLE_SETTINGS,
  MOCK_RAFFLE_STATS,
  MOCK_WINNERS,
  type RaffleSettings,
  type RaffleWinner,
} from "@/lib/dev/ops-mock";

export async function getRaffleSettings(): Promise<RaffleSettings> {
  if (await isMockMode()) return MOCK_RAFFLE_SETTINGS;

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("raffle_settings")
    .select("min_stamps, full_passport_bonus_entries, is_locked")
    .limit(1)
    .maybeSingle();
  const row = data as
    | { min_stamps: number; full_passport_bonus_entries: number; is_locked: boolean }
    | null;
  return {
    minStamps: row?.min_stamps ?? 8,
    fullPassportBonus: row?.full_passport_bonus_entries ?? 0,
    excludeCommittee: false,
    isLocked: row?.is_locked ?? false,
  };
}

export async function getRaffleStats(): Promise<typeof MOCK_RAFFLE_STATS> {
  if (await isMockMode()) return MOCK_RAFFLE_STATS;

  const supabase = await createSupabaseServerClient();
  const settings = await getRaffleSettings();
  const [{ count: eligible }, { count: entries }] = await Promise.all([
    supabase
      .from("participant_summary")
      .select("id", { count: "exact", head: true })
      .gte("stamp_count", settings.minStamps),
    supabase
      .from("raffle_entries")
      .select("id", { count: "exact", head: true }),
  ]);
  return {
    eligible: eligible ?? 0,
    fullPassport: 0,
    entries: entries ?? 0,
  };
}

export async function listWinners(): Promise<RaffleWinner[]> {
  if (await isMockMode()) return MOCK_WINNERS;

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("raffle_entries")
    .select("winner_order, prize_label, participants(name, chapter_id)")
    .not("winner_order", "is", null)
    .order("winner_order");

  type Row = {
    winner_order: number;
    prize_label: string | null;
    participants: { name: string } | null;
  };
  return ((data ?? []) as unknown as Row[]).map((r) => ({
    order: r.winner_order,
    name: r.participants?.name ?? "—",
    maskedName: maskParticipantName(r.participants?.name ?? "—"),
    chapter: "—",
    prize: r.prize_label ?? "Prize",
  }));
}
