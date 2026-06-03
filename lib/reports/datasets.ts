import "server-only";
import { listCities } from "@/lib/supabase/queries/cities";
import { listChapters } from "@/lib/supabase/queries/chapters";
import { listBooths } from "@/lib/supabase/queries/booths";
import { listParticipants } from "@/lib/supabase/queries/participants";
import { listWinners } from "@/lib/supabase/queries/raffle";
import { listScanMonitor } from "@/lib/supabase/queries/monitoring";
import { listAuditLogs } from "@/lib/supabase/queries/audit";
import { formatJakartaDateTime } from "@/lib/utils/time";

export type ReportType =
  | "participants"
  | "booths"
  | "chapters"
  | "cities"
  | "raffle"
  | "winners"
  | "audit-log";

export interface ReportDataset {
  filename: string;
  sheet: string;
  columns: string[];
  rows: (string | number)[][];
}

export const REPORT_LABELS: Record<ReportType, string> = {
  participants: "Participant Stamp Report",
  booths: "Booth Visitor Report",
  chapters: "Chapter Engagement Report",
  cities: "City Engagement Report",
  raffle: "Raffle Eligible List",
  winners: "Winner List",
  "audit-log": "Audit Log",
};

export function isReportType(v: string): v is ReportType {
  return v in REPORT_LABELS;
}

export async function buildReportDataset(
  type: ReportType,
): Promise<ReportDataset> {
  switch (type) {
    case "cities": {
      const rows = await listCities();
      return {
        filename: "cities",
        sheet: "Cities",
        columns: ["City", "Status", "Chapters", "Participants"],
        rows: rows.map((c) => [c.name, c.status, c.chapterCount, c.participantCount]),
      };
    }
    case "chapters": {
      const rows = await listChapters();
      return {
        filename: "chapters",
        sheet: "Chapters",
        columns: ["Chapter", "City", "Status", "Participants"],
        rows: rows.map((c) => [c.name, c.cityName, c.status, c.participantCount]),
      };
    }
    case "booths": {
      const rows = await listBooths();
      return {
        filename: "booths",
        sheet: "Booths",
        columns: ["Code", "Booth", "Category", "PIC", "Visitors", "Status"],
        rows: rows.map((b) => [
          b.code,
          b.name,
          b.category ?? "",
          b.picName ?? "",
          b.visitorCount,
          b.status,
        ]),
      };
    }
    case "participants": {
      const rows = await listParticipants();
      return {
        filename: "participants",
        sheet: "Participants",
        columns: ["Code", "Name", "City", "Chapter", "Stamps", "Raffle"],
        rows: rows.map((p) => [
          p.code,
          p.name,
          p.cityName,
          p.chapterName,
          p.stampCount,
          p.raffleStatus,
        ]),
      };
    }
    case "raffle": {
      const rows = (await listParticipants()).filter(
        (p) => p.raffleStatus === "qualified",
      );
      return {
        filename: "raffle-eligible",
        sheet: "Eligible",
        columns: ["Code", "Name", "City", "Chapter", "Stamps"],
        rows: rows.map((p) => [
          p.code,
          p.name,
          p.cityName,
          p.chapterName,
          p.stampCount,
        ]),
      };
    }
    case "winners": {
      const rows = await listWinners();
      return {
        filename: "winners",
        sheet: "Winners",
        columns: ["Order", "Winner", "Chapter", "Prize"],
        rows: rows.map((w) => [w.order, w.name, w.chapter, w.prize]),
      };
    }
    case "audit-log": {
      const rows = await listAuditLogs(1000);
      return {
        filename: "audit-log",
        sheet: "Audit",
        columns: ["Time", "User", "Action", "Module"],
        rows: rows.map((a) => [
          formatJakartaDateTime(a.time),
          a.user,
          a.action,
          a.module,
        ]),
      };
    }
  }
}

// scan_monitor isn't a report export per the spec list, but expose for parity.
export { listScanMonitor };
