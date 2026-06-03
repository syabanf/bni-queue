import "server-only";
import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isMockMode } from "@/lib/data/mode";

export interface AuditEntry {
  userId: string;
  action: string; // e.g. "city.create", "stamp.void"
  module: string; // e.g. "cities", "stamps"
  referenceId?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
}

/**
 * Append an audit_logs row. Best-effort: never throws into the calling action
 * (a failed audit write shouldn't fail the user's operation, but we do log it
 * server-side). Skipped in mock mode.
 */
export async function writeAuditLog(entry: AuditEntry): Promise<void> {
  if (await isMockMode()) return;

  try {
    const hdrs = await headers();
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("audit_logs").insert({
      user_id: entry.userId,
      action: entry.action,
      module: entry.module,
      reference_id: entry.referenceId ?? null,
      old_value: (entry.oldValue ?? null) as never,
      new_value: (entry.newValue ?? null) as never,
      ip_address: hdrs.get("x-forwarded-for"),
      user_agent: hdrs.get("user-agent"),
    });
    if (error) console.error("writeAuditLog failed", error);
  } catch (err) {
    console.error("writeAuditLog threw", err);
  }
}
