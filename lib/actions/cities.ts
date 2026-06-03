"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { ADMIN_ROLES } from "@/lib/auth/rbac";
import { isMockMode } from "@/lib/data/mode";
import { writeAuditLog } from "@/lib/audit/log";
import { ok, fail, demoBlocked, type ActionResult } from "./result";

const CitySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(100),
  status: z.enum(["active", "inactive"]).default("active"),
});

export async function upsertCity(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireRole(ADMIN_ROLES);

  const parsed = CitySchema.safeParse({
    id: (formData.get("id") as string) || undefined,
    name: formData.get("name"),
    status: (formData.get("status") as string) || "active",
  });
  if (!parsed.success) return fail("Enter a valid city name (2+ characters).");

  if (await isMockMode()) return demoBlocked();

  const supabase = await createSupabaseServerClient();
  const { id, ...values } = parsed.data;

  if (id) {
    const { error } = await supabase.from("cities").update(values).eq("id", id);
    if (error) return fail(error.message);
    await writeAuditLog({
      userId: session.userId,
      action: "city.update",
      module: "cities",
      referenceId: id,
      newValue: values,
    });
  } else {
    const { data, error } = await supabase
      .from("cities")
      .insert(values)
      .select("id")
      .single();
    if (error) return fail(error.message);
    await writeAuditLog({
      userId: session.userId,
      action: "city.create",
      module: "cities",
      referenceId: (data as { id: string }).id,
      newValue: values,
    });
  }

  revalidatePath("/admin/cities");
  return ok(id ? "City updated." : "City created.");
}

export async function toggleCityStatus(
  id: string,
  status: "active" | "inactive",
): Promise<ActionResult> {
  const session = await requireRole(ADMIN_ROLES);
  if (await isMockMode()) return demoBlocked();

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("cities").update({ status }).eq("id", id);
  if (error) return fail(error.message);
  await writeAuditLog({
    userId: session.userId,
    action: "city.status",
    module: "cities",
    referenceId: id,
    newValue: { status },
  });
  revalidatePath("/admin/cities");
  return ok();
}

export async function deleteCity(id: string): Promise<ActionResult> {
  const session = await requireRole(ADMIN_ROLES);
  if (await isMockMode()) return demoBlocked();

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("cities")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return fail(error.message);
  await writeAuditLog({
    userId: session.userId,
    action: "city.delete",
    module: "cities",
    referenceId: id,
  });
  revalidatePath("/admin/cities");
  return ok("City removed.");
}
