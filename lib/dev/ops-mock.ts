/**
 * Demo data for operational surfaces: stamp monitoring, raffle, audit log.
 * Display-only, no secrets.
 */

export interface ScanMonitorRow {
  id: string;
  time: string; // ISO
  participant: string;
  city: string;
  chapter: string;
  booth: string;
  scannedBy: string;
  outcome: "success" | "duplicate" | "invalid_qr" | "invalid_participant";
  source: "camera" | "manual_input";
}

const now = Date.now();
const ago = (m: number) => new Date(now - m * 60_000).toISOString();

export const MOCK_SCAN_MONITOR: ScanMonitorRow[] = [
  { id: "s1", time: ago(1), participant: "Fahmi Syaban", city: "Bandung", chapter: "BNI Bandung A", booth: "Sponsor Booth A", scannedBy: "Rina", outcome: "success", source: "camera" },
  { id: "s2", time: ago(3), participant: "Andi Putra", city: "Jakarta", chapter: "BNI Jakarta Selatan", booth: "Partner Booth B", scannedBy: "Dimas", outcome: "success", source: "camera" },
  { id: "s3", time: ago(6), participant: "Sari Lestari", city: "Surabaya", chapter: "BNI Surabaya 1", booth: "Sponsor Booth A", scannedBy: "Rina", outcome: "duplicate", source: "camera" },
  { id: "s4", time: ago(8), participant: "—", city: "—", chapter: "—", booth: "Internal Booth C", scannedBy: "Sari", outcome: "invalid_qr", source: "camera" },
  { id: "s5", time: ago(11), participant: "Budi Hartono", city: "Bandung", chapter: "BNI Bandung B", booth: "Innovation Lab", scannedBy: "Rina", outcome: "success", source: "manual_input" },
  { id: "s6", time: ago(14), participant: "Maya Anggraini", city: "Jakarta", chapter: "BNI Jakarta Pusat", booth: "Partner Booth B", scannedBy: "Dimas", outcome: "success", source: "camera" },
];

export interface RaffleSettings {
  minStamps: number;
  fullPassportBonus: number;
  excludeCommittee: boolean;
  isLocked: boolean;
}

export const MOCK_RAFFLE_SETTINGS: RaffleSettings = {
  minStamps: 8,
  fullPassportBonus: 1,
  excludeCommittee: true,
  isLocked: false,
};

export interface RaffleWinner {
  order: number;
  name: string;
  maskedName: string;
  chapter: string;
  prize: string;
}

export const MOCK_RAFFLE_STATS = {
  eligible: 620,
  fullPassport: 210,
  entries: 830,
};

export const MOCK_WINNERS: RaffleWinner[] = [
  { order: 1, name: "Fahmi Syaban", maskedName: "F*** Syaban", chapter: "BNI Bandung A", prize: "Grand Prize" },
  { order: 2, name: "Maya Anggraini", maskedName: "M*** Anggraini", chapter: "BNI Jakarta Pusat", prize: "Runner-up" },
  { order: 3, name: "Rizky Pratama", maskedName: "R*** Pratama", chapter: "BNI Surabaya 2", prize: "Runner-up" },
];

export interface AuditRow {
  id: string;
  time: string;
  user: string;
  action: string;
  module: string;
}

export const MOCK_AUDIT: AuditRow[] = [
  { id: "a1", time: ago(2), user: "admin@bni.id", action: "stamp.void", module: "stamps" },
  { id: "a2", time: ago(20), user: "events@bni.id", action: "booth.create", module: "booths" },
  { id: "a3", time: ago(45), user: "admin@bni.id", action: "participant.import", module: "participants" },
  { id: "a4", time: ago(90), user: "events@bni.id", action: "raffle.settings", module: "raffle" },
  { id: "a5", time: ago(120), user: "admin@bni.id", action: "city.create", module: "cities" },
];
