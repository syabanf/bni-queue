import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isMockMode } from "@/lib/data/mode";
import { MOCK_ADMIN_USERS, type AdminUserRow } from "@/lib/dev/admin-mock";

export async function listUsers(): Promise<AdminUserRow[]> {
  if (await isMockMode()) return MOCK_ADMIN_USERS;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, name, email, role, status")
    .is("deleted_at", null)
    .order("role")
    .order("name");
  if (error) {
    console.error("listUsers failed", error);
    return [];
  }

  // Booth names for PICs via booth_assignments.
  const { data: assignments } = await supabase
    .from("booth_assignments")
    .select("user_id, booths(name)");
  const boothsByUser = new Map<string, string[]>();
  for (const a of (assignments ?? []) as unknown as Array<{
    user_id: string;
    booths: { name: string } | { name: string }[] | null;
  }>) {
    const b = Array.isArray(a.booths) ? a.booths[0] : a.booths;
    if (!b) continue;
    const arr = boothsByUser.get(a.user_id) ?? [];
    arr.push(b.name);
    boothsByUser.set(a.user_id, arr);
  }

  return (data ?? []).map((u: Record<string, unknown>) => ({
    id: u.id as string,
    name: u.name as string,
    email: u.email as string,
    role: u.role as AdminUserRow["role"],
    status: u.status as AdminUserRow["status"],
    boothNames: boothsByUser.get(u.id as string) ?? [],
  }));
}
