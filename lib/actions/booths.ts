"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { ADMIN_ROLES } from "@/lib/auth/rbac";
import { isMockMode } from "@/lib/data/mode";
import { writeAuditLog } from "@/lib/audit/log";
import { ok, fail, demoBlocked, type ActionResult } from "./result";

const BoothSchema = z.object({
  id: z.string().uuid().optional(),
  code: z.string().trim().min(2).max(40),
  name: z.string().trim().min(2).max(120),
  category: z.string().trim().max(60).optional().or(z.literal("")),
  location: z.string().trim().max(120).optional().or(z.literal("")),
  status: z.enum(["active", "inactive"]).default("active"),
});

export async function upsertBooth(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireRole(ADMIN_ROLES);

  const parsed = BoothSchema.safeParse({
    id: (formData.get("id") as string) || undefined,
    code: formData.get("code"),
    name: formData.get("name"),
    category: (formData.get("category") as string) ?? "",
    location: (formData.get("location") as string) ?? "",
    status: (formData.get("status") as string) || "active",
  });
  if (!parsed.success) return fail("Enter a booth code and name.");

  if (await isMockMode()) return demoBlocked();

  const supabase = await createSupabaseServerClient();
  const { id, ...raw } = parsed.data;
  const values = {
    ...raw,
    category: raw.category || null,
    location: raw.location || null,
  };

  if (id) {
    const { error } = await supabase.from("booths").update(values).eq("id", id);
    if (error) return fail(error.message);
    await writeAuditLog({
      userId: session.userId,
      action: "booth.update",
      module: "booths",
      referenceId: id,
      newValue: values,
    });
  } else {
    const { data, error } = await supabase
      .from("booths")
      .insert(values)
      .select("id")
      .single();
    if (error) return fail(error.message);
    await writeAuditLog({
      userId: session.userId,
      action: "booth.create",
      module: "booths",
      referenceId: (data as { id: string }).id,
      newValue: values,
    });
  }

  revalidatePath("/admin/booths");
  return ok(id ? "Booth updated." : "Booth created.");
}

export async function toggleBoothStatus(
  id: string,
  status: "active" | "inactive",
): Promise<ActionResult> {
  const session = await requireRole(ADMIN_ROLES);
  if (await isMockMode()) return demoBlocked();

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("booths").update({ status }).eq("id", id);
  if (error) return fail(error.message);
  await writeAuditLog({
    userId: session.userId,
    action: "booth.status",
    module: "booths",
    referenceId: id,
    newValue: { status },
  });
  revalidatePath("/admin/booths");
  return ok();
}

export async function deleteBooth(id: string): Promise<ActionResult> {
  const session = await requireRole(ADMIN_ROLES);
  if (await isMockMode()) return demoBlocked();

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("booths")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return fail(error.message);
  await writeAuditLog({
    userId: session.userId,
    action: "booth.delete",
    module: "booths",
    referenceId: id,
  });
  revalidatePath("/admin/booths");
  return ok("Booth removed.");
}
