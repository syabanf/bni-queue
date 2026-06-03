/**
 * Wire format for scan API responses. Mirrors the WIT.ID scanner state machine
 * shown in the spec (success / duplicate / invalid) and adds explicit error
 * states for failure modes the spec lumps together.
 */

export interface ParticipantProjection {
  participant_id: string;
  display_name: string;
  city_name: string;
  chapter_name: string;
  current_stamp_count: number;
}

export type ScanResponse =
  | {
      status: "success";
      participant: ParticipantProjection;
      stamp_id: string;
      stamp_count: number;
      scanned_at: string;
    }
  | {
      status: "duplicate";
      participant: ParticipantProjection;
      previous_scan_at: string | null;
    }
  | {
      status: "invalid";
      reason:
        | "malformed_qr"
        | "bad_signature"
        | "bad_version"
        | "unknown_participant"
        | "inactive_participant";
    }
  | {
      status: "unauthorized_pic";
      message: string;
    }
  | {
      status: "rate_limited";
      retry_after_ms: number;
    }
  | {
      status: "server_error";
      message: string;
    };
