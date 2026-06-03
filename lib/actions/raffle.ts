"use server";

import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { ADMIN_ROLES } from "@/lib/auth/rbac";
import { isMockMode } from "@/lib/data/mode";
import { writeAuditLog } from "@/lib/audit/log";
import { ok, fail, demoBlocked, type ActionResult } from "./result";

export async function saveRaffleSettings(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireRole(ADMIN_ROLES);
  const schema = z.object({
    minStamps: z.coerce.number().int().min(1).max(100),
    fullPassportBonus: z.coerce.number().int().min(0).max(10),
  });
  const parsed = schema.safeParse({
    minStamps: formData.get("minStamps"),
    fullPassportBonus: formData.get("fullPassportBonus"),
  });
  if (!parsed.success) return fail("Enter a valid minimum stamp count.");
  if (await isMockMode()) return demoBlocked();

  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase
    .from("raffle_settings")
    .select("id")
    .limit(1)
    .maybeSingle();

  const values = {
    min_stamps: parsed.data.minStamps,
    full_passport_bonus_entries: parsed.data.fullPassportBonus,
    updated_by: session.userId,
  };
  const { error } = existing
    ? await supabase
        .from("raffle_settings")
        .update(values)
        .eq("id", (existing as { id: string }).id)
    : await supabase.from("raffle_settings").insert(values);
  if (error) return fail(error.message);

  await writeAuditLog({
    userId: session.userId,
    action: "raffle.settings",
    module: "raffle",
    newValue: values,
  });
  revalidatePath("/admin/raffle");
  return ok("Raffle settings saved.");
}

export async function generateEligible(): Promise<ActionResult> {
  const session = await requireRole(ADMIN_ROLES);
  if (await isMockMode()) return demoBlocked();

  const supabase = await createSupabaseServerClient();
  const { data: s } = await supabase
    .from("raffle_settings")
    .select("min_stamps, is_locked")
    .limit(1)
    .maybeSingle();
  const settings = s as { min_stamps: number; is_locked: boolean } | null;
  if (settings?.is_locked) return fail("Raffle is locked. Unlock to regenerate.");
  const minStamps = settings?.min_stamps ?? 8;

  const { data: eligible, error: selErr } = await supabase
    .from("participant_summary")
    .select("id, stamp_count")
    .gte("stamp_count", minStamps);
  if (selErr) return fail(selErr.message);

  // Clear prior non-locked entries, then insert fresh.
  await supabase.from("raffle_entries").delete().neq("draw_status", "locked");

  const rows = (eligible ?? []).map(
    (p: { id: string; stamp_count: number }) => ({
      participant_id: p.id,
      eligibility_type: "standard",
      stamp_count: p.stamp_count,
      draw_status: "pending",
    }),
  );
  if (rows.length > 0) {
    for (let i = 0; i < rows.length; i += 500) {
      const { error } = await supabase
        .from("raffle_entries")
        .insert(rows.slice(i, i + 500) as never);
      if (error) return fail(error.message);
    }
  }

  await writeAuditLog({
    userId: session.userId,
    action: "raffle.generate",
    module: "raffle",
    newValue: { eligible: rows.length, minStamps },
  });
  revalidatePath("/admin/raffle");
  return ok(`Generated ${rows.length} eligible entries.`);
}

export async function drawWinners(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireRole(ADMIN_ROLES);
  const schema = z.object({
    count: z.coerce.number().int().min(1).max(50),
    prize: z.string().trim().min(1).max(60),
  });
  const parsed = schema.safeParse({
    count: formData.get("count"),
    prize: formData.get("prize"),
  });
  if (!parsed.success) return fail("Enter a winner count and prize label.");
  if (await isMockMode()) return demoBlocked();

  const supabase = await createSupabaseServerClient();
  const { data: pool, error } = await supabase
    .from("raffle_entries")
    .select("id")
    .eq("draw_status", "pending");
  if (error) return fail(error.message);

  const ids = (pool ?? []).map((r: { id: string }) => r.id);
  if (ids.length === 0) return fail("No eligible entries. Generate first.");

  // Cryptographically-random selection without replacement.
  const picked: string[] = [];
  const take = Math.min(parsed.data.count, ids.length);
  for (let i = 0; i < take; i++) {
    const j = randomInt(ids.length);
    picked.push(ids.splice(j, 1)[0]!);
  }

  // Determine current max winner_order to append.
  const { data: maxRow } = await supabase
    .from("raffle_entries")
    .select("winner_order")
    .not("winner_order", "is", null)
    .order("winner_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  let order = (maxRow as { winner_order: number } | null)?.winner_order ?? 0;

  for (const id of picked) {
    order += 1;
    await supabase
      .from("raffle_entries")
      .update({
        draw_status: "drawn",
        winner_order: order,
        prize_label: parsed.data.prize,
        drawn_at: new Date().toISOString(),
      })
      .eq("id", id);
  }

  await writeAuditLog({
    userId: session.userId,
    action: "raffle.draw",
    module: "raffle",
    newValue: { count: take, prize: parsed.data.prize, poolSize: ids.length + take },
  });
  revalidatePath("/admin/raffle");
  return ok(`Drew ${take} winner(s) for "${parsed.data.prize}".`);
}

export async function lockResults(): Promise<ActionResult> {
  const session = await requireRole(ADMIN_ROLES);
  if (await isMockMode()) return demoBlocked();

  const supabase = await createSupabaseServerClient();
  await supabase
    .from("raffle_entries")
    .update({ draw_status: "locked", locked_at: new Date().toISOString() })
    .eq("draw_status", "drawn");
  await supabase.from("raffle_settings").update({ is_locked: true }).neq("id", "");

  await writeAuditLog({
    userId: session.userId,
    action: "raffle.lock",
    module: "raffle",
  });
  revalidatePath("/admin/raffle");
  return ok("Results locked.");
}
