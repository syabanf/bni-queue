"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { ADMIN_ROLES } from "@/lib/auth/rbac";
import { isMockMode } from "@/lib/data/mode";
import {
  createStaffUser,
  updateStaffUser,
  deleteStaffUser,
} from "@/lib/supabase/queries/admin-users";
import { writeAuditLog } from "@/lib/audit/log";
import { ok, fail, demoBlocked, type ActionResult } from "./result";

const ROLE_ENUM = z.enum([
  "super_admin",
  "event_admin",
  "booth_pic",
  "management_viewer",
  "display_operator",
]);

const UserSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  password: z.string().min(8).max(72),
  role: ROLE_ENUM,
  boothIds: z.array(z.string().uuid()).default([]),
});

export async function createUserAction(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireRole(ADMIN_ROLES);

  const parsed = UserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
    boothIds: formData.getAll("boothIds").filter(Boolean),
  });
  if (!parsed.success) {
    return fail("Check the fields: name, valid email, 8+ char password, role.");
  }

  if (await isMockMode()) return demoBlocked();

  const result = await createStaffUser(parsed.data);
  if (!result.ok) return fail(result.error ?? "Could not create user.");

  await writeAuditLog({
    userId: session.userId,
    action: "user.create",
    module: "users",
    referenceId: result.userId,
    newValue: { email: parsed.data.email, role: parsed.data.role },
  });

  revalidatePath("/admin/users");
  return ok("User created.");
}

const UpdateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(2).max(120),
  role: ROLE_ENUM,
  status: z.enum(["active", "inactive"]),
  boothIds: z.array(z.string().uuid()).default([]),
});

export async function updateUserAction(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireRole(ADMIN_ROLES);

  const parsed = UpdateSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    role: formData.get("role"),
    status: formData.get("status"),
    boothIds: formData.getAll("boothIds").filter(Boolean),
  });
  if (!parsed.success) return fail("Check the fields: name and role.");
  if (await isMockMode()) return demoBlocked();

  const result = await updateStaffUser(parsed.data);
  if (!result.ok) return fail(result.error ?? "Could not update user.");

  await writeAuditLog({
    userId: session.userId,
    action: "user.update",
    module: "users",
    referenceId: parsed.data.id,
    newValue: { role: parsed.data.role, status: parsed.data.status },
  });
  revalidatePath("/admin/users");
  return ok("User updated.");
}

export async function deleteUserAction(id: string): Promise<ActionResult> {
  const session = await requireRole(ADMIN_ROLES);
  if (session.userId === id) {
    return fail("You can't remove your own account while signed in.");
  }
  if (await isMockMode()) return demoBlocked();

  const result = await deleteStaffUser(id);
  if (!result.ok) return fail(result.error ?? "Could not remove user.");

  await writeAuditLog({
    userId: session.userId,
    action: "user.delete",
    module: "users",
    referenceId: id,
  });
  revalidatePath("/admin/users");
  return ok("User removed.");
}
