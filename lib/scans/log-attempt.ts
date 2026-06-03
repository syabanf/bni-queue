import "server-only";
import { type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type ScanOutcome =
  | "success"
  | "duplicate"
  | "invalid_qr"
  | "invalid_participant"
  | "invalid_booth"
  | "unauthorized_pic";

export type ScanSource = "camera" | "manual_input" | "admin_correction";

export interface LogAttemptInput {
  outcome: ScanOutcome;
  participant_id: string | null;
  booth_id: string;
  scanned_by: string;
  scan_source: ScanSource;
  stamp_id?: string | null;
  raw_token_hash?: string | null;
  client_request_id: string;
  user_agent?: string | null;
  ip_address?: string | null;
}

/**
 * Insert into scan_attempts. Idempotent: the unique index on
 * (scanned_by, client_request_id) means a retry with the same client_request_id
 * is silently swallowed.
 */
export async function logScanAttempt(
  supabase: SupabaseClient<Database>,
  input: LogAttemptInput,
): Promise<void> {
  // We intentionally do not throw on duplicate insert — the unique constraint
  // is the idempotency primitive. PostgREST returns 23505 on conflict; ignore.
  const { error } = await supabase.from("scan_attempts").insert(input);
  if (error && error.code !== "23505") {
    // Log but don't surface to client — the scan itself may have succeeded.
    console.error("logScanAttempt failed", error);
  }
}
