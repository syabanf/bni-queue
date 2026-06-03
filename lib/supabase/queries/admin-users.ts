import "server-only";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role:
    | "super_admin"
    | "event_admin"
    | "booth_pic"
    | "management_viewer"
    | "display_operator";
  boothIds: string[];
}

export interface CreateUserOutcome {
  ok: boolean;
  error?: string;
  userId?: string;
}

/**
 * Provision a staff account: creates the Supabase Auth user (email confirmed),
 * the public.users profile row, and any booth assignments. Uses the
 * service-role client (admin API) — hence it lives in the query layer where the
 * lint rule permits the import.
 *
 * The DB triggers (users_sync_claims / booth_assignments_sync_claims) mirror
 * role + booth_ids into JWT app_metadata automatically.
 */
export async function createStaffUser(
  input: CreateUserInput,
): Promise<CreateUserOutcome> {
  const admin = createSupabaseServiceRoleClient();

  const { data: created, error: authError } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: { name: input.name },
  });
  if (authError || !created.user) {
    return { ok: false, error: authError?.message ?? "Auth create failed." };
  }
  const userId = created.user.id;

  const { error: profileError } = await admin.from("users").insert({
    id: userId,
    name: input.name,
    email: input.email,
    role: input.role,
  } as never);
  if (profileError) {
    // Roll back the auth user so we don't orphan it.
    await admin.auth.admin.deleteUser(userId);
    return { ok: false, error: profileError.message };
  }

  if (input.role === "booth_pic" && input.boothIds.length > 0) {
    const rows = input.boothIds.map((boothId, i) => ({
      booth_id: boothId,
      user_id: userId,
      is_primary: i === 0,
    }));
    const { error: assignError } = await admin
      .from("booth_assignments")
      .insert(rows as never);
    if (assignError) return { ok: false, error: assignError.message, userId };
  }

  return { ok: true, userId };
}

export interface UpdateUserInput {
  id: string;
  name: string;
  role: CreateUserInput["role"];
  status: "active" | "inactive";
  boothIds: string[];
}

/**
 * Update a staff account's name/role/status and (for PICs) booth assignments.
 * Role + booth changes re-sync JWT claims via the DB triggers, but the user
 * must sign in again for the new claims to take effect.
 */
export async function updateStaffUser(
  input: UpdateUserInput,
): Promise<CreateUserOutcome> {
  const admin = createSupabaseServiceRoleClient();

  const { error } = await admin
    .from("users")
    .update({
      name: input.name,
      role: input.role,
      status: input.status,
    } as never)
    .eq("id", input.id);
  if (error) return { ok: false, error: error.message };

  // Reset booth assignments to the supplied set (PIC only).
  await admin.from("booth_assignments").delete().eq("user_id", input.id);
  if (input.role === "booth_pic" && input.boothIds.length > 0) {
    const rows = input.boothIds.map((boothId, i) => ({
      booth_id: boothId,
      user_id: input.id,
      is_primary: i === 0,
    }));
    const { error: assignError } = await admin
      .from("booth_assignments")
      .insert(rows as never);
    if (assignError) return { ok: false, error: assignError.message };
  }

  return { ok: true, userId: input.id };
}

/** Soft-delete a staff account (profile row) and revoke booth assignments. */
export async function deleteStaffUser(id: string): Promise<CreateUserOutcome> {
  const admin = createSupabaseServiceRoleClient();
  await admin.from("booth_assignments").delete().eq("user_id", id);
  const { error } = await admin
    .from("users")
    .update({
      status: "inactive",
      deleted_at: new Date().toISOString(),
    } as never)
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true, userId: id };
}
