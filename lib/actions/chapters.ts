"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { ADMIN_ROLES } from "@/lib/auth/rbac";
import { isMockMode } from "@/lib/data/mode";
import { writeAuditLog } from "@/lib/audit/log";
import { ok, fail, demoBlocked, type ActionResult } from "./result";

const ChapterSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(120),
  city_id: z.string().uuid(),
  status: z.enum(["active", "inactive"]).default("active"),
});

export async function upsertChapter(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireRole(ADMIN_ROLES);

  const parsed = ChapterSchema.safeParse({
    id: (formData.get("id") as string) || undefined,
    name: formData.get("name"),
    city_id: formData.get("city_id"),
    status: (formData.get("status") as string) || "active",
  });
  if (!parsed.success) return fail("Pick a city and enter a chapter name.");

  if (await isMockMode()) return demoBlocked();

  const supabase = await createSupabaseServerClient();
  const { id, ...values } = parsed.data;

  if (id) {
    const { error } = await supabase
      .from("chapters")
      .update(values)
      .eq("id", id);
    if (error) return fail(error.message);
    await writeAuditLog({
      userId: session.userId,
      action: "chapter.update",
      module: "chapters",
      referenceId: id,
      newValue: values,
    });
  } else {
    const { data, error } = await supabase
      .from("chapters")
      .insert(values)
      .select("id")
      .single();
    if (error) return fail(error.message);
    await writeAuditLog({
      userId: session.userId,
      action: "chapter.create",
      module: "chapters",
      referenceId: (data as { id: string }).id,
      newValue: values,
    });
  }

  revalidatePath("/admin/chapters");
  return ok(id ? "Chapter updated." : "Chapter created.");
}

export async function toggleChapterStatus(
  id: string,
  status: "active" | "inactive",
): Promise<ActionResult> {
  const session = await requireRole(ADMIN_ROLES);
  if (await isMockMode()) return demoBlocked();

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("chapters")
    .update({ status })
    .eq("id", id);
  if (error) return fail(error.message);
  await writeAuditLog({
    userId: session.userId,
    action: "chapter.status",
    module: "chapters",
    referenceId: id,
    newValue: { status },
  });
  revalidatePath("/admin/chapters");
  return ok();
}

export async function deleteChapter(id: string): Promise<ActionResult> {
  const session = await requireRole(ADMIN_ROLES);
  if (await isMockMode()) return demoBlocked();

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("chapters")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return fail(error.message);
  await writeAuditLog({
    userId: session.userId,
    action: "chapter.delete",
    module: "chapters",
    referenceId: id,
  });
  revalidatePath("/admin/chapters");
  return ok("Chapter removed.");
}
