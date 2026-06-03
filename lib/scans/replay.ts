import "server-only";
import { type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export interface ReplayedAttempt {
  outcome: string;
  attempted_at: string;
}

/**
 * Idempotency check. If a prior attempt exists with the same
 * (scanned_by, client_request_id), the client is retrying and we should NOT
 * insert a second time. We return the prior outcome so the client can ignore
 * the retry — it already rendered the first response.
 */
export async function findPriorAttempt(
  supabase: SupabaseClient<Database>,
  scannedBy: string,
  clientRequestId: string,
): Promise<ReplayedAttempt | null> {
  const { data, error } = await supabase
    .from("scan_attempts")
    .select("outcome, attempted_at")
    .eq("scanned_by", scannedBy)
    .eq("client_request_id", clientRequestId)
    .maybeSingle();

  if (error || !data) return null;
  return data as ReplayedAttempt;
}
