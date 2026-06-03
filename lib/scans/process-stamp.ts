import "server-only";
import { type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { logScanAttempt, type ScanSource } from "./log-attempt";
import type { ParticipantProjection, ScanResponse } from "./types";

interface ProcessStampInput {
  participant: ParticipantProjection;
  booth_id: string;
  scanned_by: string;
  scan_source: ScanSource;
  client_request_id: string;
  raw_token_hash?: string | null;
}

/**
 * Attempts to insert a stamp. Catches the UNIQUE violation as the duplicate
 * signal. The DB enforces atomicity; we never pre-check existence (TOCTOU).
 *
 * Always writes a scan_attempts row with the outcome.
 */
export async function processStamp(
  supabase: SupabaseClient<Database>,
  input: ProcessStampInput,
): Promise<ScanResponse> {
  const baseAttempt = {
    booth_id: input.booth_id,
    scanned_by: input.scanned_by,
    scan_source: input.scan_source,
    client_request_id: input.client_request_id,
    raw_token_hash: input.raw_token_hash ?? null,
    participant_id: input.participant.participant_id,
  };

  const { data: stamp, error } = await supabase
    .from("stamps")
    .insert({
      participant_id: input.participant.participant_id,
      booth_id: input.booth_id,
      scanned_by: input.scanned_by,
      scan_source: input.scan_source,
    })
    .select("id, scanned_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      // Duplicate — fetch the prior stamp's timestamp for display.
      const { data: prior } = await supabase
        .from("stamps")
        .select("scanned_at")
        .eq("participant_id", input.participant.participant_id)
        .eq("booth_id", input.booth_id)
        .is("voided_at", null)
        .maybeSingle();

      await logScanAttempt(supabase, {
        ...baseAttempt,
        outcome: "duplicate",
        stamp_id: null,
      });

      return {
        status: "duplicate",
        participant: input.participant,
        previous_scan_at:
          (prior as { scanned_at: string } | null)?.scanned_at ?? null,
      };
    }

    // Real DB error — surface as 500 from the caller; log attempt as failure.
    console.error("stamp insert failed", error);
    return {
      status: "server_error",
      message: "Database error while writing stamp.",
    };
  }

  const stampRow = stamp as { id: string; scanned_at: string };

  await logScanAttempt(supabase, {
    ...baseAttempt,
    outcome: "success",
    stamp_id: stampRow.id,
  });

  return {
    status: "success",
    participant: input.participant,
    stamp_id: stampRow.id,
    stamp_count: input.participant.current_stamp_count + 1,
    scanned_at: stampRow.scanned_at,
  };
}
