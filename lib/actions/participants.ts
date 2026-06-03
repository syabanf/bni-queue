"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { ADMIN_ROLES } from "@/lib/auth/rbac";
import { isMockMode } from "@/lib/data/mode";
import { signNewQrToken } from "@/lib/qr/token";
import { writeAuditLog } from "@/lib/audit/log";
import { ok, fail, demoBlocked, type ActionResult } from "./result";

const ParticipantSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(160),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  email: z.string().trim().email().optional().or(z.literal("")),
  city_id: z.string().uuid(),
  chapter_id: z.string().uuid(),
  code: z.string().trim().max(64).optional().or(z.literal("")),
});

function parse(formData: FormData) {
  return ParticipantSchema.safeParse({
    id: (formData.get("id") as string) || undefined,
    name: formData.get("name"),
    phone: (formData.get("phone") as string) ?? "",
    email: (formData.get("email") as string) ?? "",
    city_id: formData.get("city_id"),
    chapter_id: formData.get("chapter_id"),
    code: (formData.get("code") as string) ?? "",
  });
}

export async function upsertParticipant(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireRole(ADMIN_ROLES);
  const parsed = parse(formData);
  if (!parsed.success) {
    return fail("Check the fields: name, city, chapter (email must be valid).");
  }
  if (await isMockMode()) return demoBlocked();

  const supabase = await createSupabaseServerClient();
  const { id, name, phone, email, city_id, chapter_id, code } = parsed.data;

  if (id) {
    const values = {
      name,
      phone: phone || null,
      email: email || null,
      city_id,
      chapter_id,
    };
    const { error } = await supabase
      .from("participants")
      .update(values)
      .eq("id", id);
    if (error) return fail(error.message);
    await writeAuditLog({
      userId: session.userId,
      action: "participant.update",
      module: "participants",
      referenceId: id,
      newValue: values,
    });
    revalidatePath("/admin/participants");
    revalidatePath("/admin/overview");
    return ok("Participant updated.");
  }

  // Create: generate a signed QR token + a code if none supplied.
  const { token } = signNewQrToken(1);
  const finalCode =
    code || `BNI-NATCON-${String(Date.now()).slice(-6)}`;
  const values = {
    code: finalCode,
    name,
    phone: phone || null,
    email: email || null,
    city_id,
    chapter_id,
    qr_token: token,
    qr_version: 1,
  };
  const { data, error } = await supabase
    .from("participants")
    .insert(values)
    .select("id")
    .single();
  if (error) return fail(error.message);
  await writeAuditLog({
    userId: session.userId,
    action: "participant.create",
    module: "participants",
    referenceId: (data as { id: string }).id,
    newValue: { code: finalCode, name },
  });
  revalidatePath("/admin/participants");
  revalidatePath("/admin/overview");
  return ok("Participant created.");
}

export async function deleteParticipant(id: string): Promise<ActionResult> {
  const session = await requireRole(ADMIN_ROLES);
  if (await isMockMode()) return demoBlocked();

  const supabase = await createSupabaseServerClient();
  // Soft delete (spec §12.14) — preserves stamp history.
  const { error } = await supabase
    .from("participants")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return fail(error.message);

  await writeAuditLog({
    userId: session.userId,
    action: "participant.delete",
    module: "participants",
    referenceId: id,
  });
  revalidatePath("/admin/participants");
  revalidatePath("/admin/overview");
  return ok("Participant removed.");
}
