import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isMockMode } from "@/lib/data/mode";
import { MOCK_AUDIT, type AuditRow } from "@/lib/dev/ops-mock";

export async function listAuditLogs(limit = 100): Promise<AuditRow[]> {
  if (await isMockMode()) return MOCK_AUDIT;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, created_at, action, module, users(email)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("listAuditLogs failed", error);
    return [];
  }
  type Row = {
    id: string;
    created_at: string;
    action: string;
    module: string;
    users: { email: string } | null;
  };
  return ((data ?? []) as unknown as Row[]).map((r) => ({
    id: r.id,
    time: r.created_at,
    user: r.users?.email ?? "system",
    action: r.action,
    module: r.module,
  }));
}
