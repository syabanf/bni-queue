/**
 * Supabase generated-types placeholder. Once a project is linked, regenerate:
 *
 *   pnpm dlx supabase gen types typescript --project-id <id> --schema public \
 *     > types/database.ts
 *
 * Until that runs, the placeholder uses a permissive shape so supabase-js's
 * `.from(...)` / `.rpc(...)` calls compile without contortions. Query authors
 * still get type safety by typing the returned data at the call site
 * (e.g. `data as BoothSummary`).
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface ParticipantScanProjection {
  participant_id: string;
  display_name: string;
  city_name: string;
  chapter_name: string;
  current_stamp_count: number;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyTable = {
  Row: Record<string, any>;
  Insert: Record<string, any>;
  Update: Record<string, any>;
  Relationships: [];
};
/* eslint-enable @typescript-eslint/no-explicit-any */

export interface Database {
  public: {
    Tables: {
      users: AnyTable;
      cities: AnyTable;
      chapters: AnyTable;
      booths: AnyTable;
      booth_assignments: AnyTable;
      participants: AnyTable;
      stamps: AnyTable;
      scan_attempts: AnyTable;
      raffle_settings: AnyTable;
      raffle_entries: AnyTable;
      audit_logs: AnyTable;
      display_settings: AnyTable;
      leaderboard_dirty: AnyTable;
    };
    Views: {
      leaderboard_participants: AnyTable;
      city_summary: AnyTable;
      chapter_summary: AnyTable;
      booth_summary: AnyTable;
      participant_summary: AnyTable;
    };
    Functions: {
      lookup_participant_for_scan: {
        Args: { p_qr_token: string; p_qr_version: number };
        Returns: ParticipantScanProjection | null;
      };
      lookup_participant_for_scan_by_code: {
        Args: { p_participant_code: string };
        Returns: ParticipantScanProjection | null;
      };
      refresh_leaderboard_if_dirty: {
        Args: Record<string, never>;
        Returns: void;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
