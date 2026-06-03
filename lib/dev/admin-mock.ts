/**
 * Mock master-data for the admin surfaces in demo mode. Display-only; no
 * `server-only` so it can seed both query fns and any client preview. Cross
 * references are by id so the join shapes match the live queries.
 */

export interface CityRow {
  id: string;
  name: string;
  status: "active" | "inactive";
  chapterCount: number;
  participantCount: number;
}

export interface ChapterRow {
  id: string;
  name: string;
  city_id: string;
  cityName: string;
  status: "active" | "inactive";
  participantCount: number;
}

export interface BoothRow {
  id: string;
  code: string;
  name: string;
  category: string | null;
  location: string | null;
  status: "active" | "inactive";
  picName: string | null;
  visitorCount: number;
  lastScanAt: string | null;
}

export interface ParticipantRow {
  id: string;
  code: string;
  name: string;
  phone: string | null;
  email: string | null;
  cityId: string;
  cityName: string;
  chapterId: string;
  chapterName: string;
  stampCount: number;
  totalBooths: number;
  checkinStatus: "not_checked_in" | "checked_in" | "no_show";
  raffleStatus: "qualified" | "not_yet";
}

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  role:
    | "super_admin"
    | "event_admin"
    | "booth_pic"
    | "management_viewer"
    | "display_operator";
  status: "active" | "inactive";
  boothNames: string[];
}

export const MOCK_CITIES: CityRow[] = [
  { id: "c-bandung", name: "Bandung", status: "active", chapterCount: 8, participantCount: 320 },
  { id: "c-jakarta", name: "Jakarta", status: "active", chapterCount: 15, participantCount: 500 },
  { id: "c-surabaya", name: "Surabaya", status: "active", chapterCount: 6, participantCount: 210 },
  { id: "c-medan", name: "Medan", status: "inactive", chapterCount: 3, participantCount: 64 },
];

export const MOCK_CHAPTERS: ChapterRow[] = [
  { id: "ch-bdg-a", name: "BNI Bandung A", city_id: "c-bandung", cityName: "Bandung", status: "active", participantCount: 120 },
  { id: "ch-bdg-b", name: "BNI Bandung B", city_id: "c-bandung", cityName: "Bandung", status: "active", participantCount: 96 },
  { id: "ch-jkt-s", name: "BNI Jakarta Selatan", city_id: "c-jakarta", cityName: "Jakarta", status: "active", participantCount: 150 },
  { id: "ch-jkt-p", name: "BNI Jakarta Pusat", city_id: "c-jakarta", cityName: "Jakarta", status: "active", participantCount: 134 },
  { id: "ch-sby-1", name: "BNI Surabaya 1", city_id: "c-surabaya", cityName: "Surabaya", status: "active", participantCount: 95 },
  { id: "ch-sby-2", name: "BNI Surabaya 2", city_id: "c-surabaya", cityName: "Surabaya", status: "active", participantCount: 88 },
];

export const MOCK_ADMIN_BOOTHS: BoothRow[] = [
  { id: "b-a01", code: "B-A01", name: "Sponsor Booth A", category: "Sponsor", location: "Main Hall · Aisle 1", status: "active", picName: "Rina", visitorCount: 410, lastScanAt: "2026-06-03T10:45:00+07:00" },
  { id: "b-b02", code: "B-B02", name: "Partner Booth B", category: "Partner", location: "Main Hall · Aisle 2", status: "active", picName: "Dimas", visitorCount: 390, lastScanAt: "2026-06-03T10:48:00+07:00" },
  { id: "b-c03", code: "B-C03", name: "Internal Booth C", category: "Internal", location: "Hall B", status: "active", picName: "Sari", visitorCount: 280, lastScanAt: "2026-06-03T10:30:00+07:00" },
  { id: "b-d04", code: "B-D04", name: "Innovation Lab", category: "Sponsor", location: "Hall B", status: "active", picName: null, visitorCount: 244, lastScanAt: "2026-06-03T10:12:00+07:00" },
];

export const MOCK_PARTICIPANTS: ParticipantRow[] = [
  { id: "p-001", code: "BNI-NATCON-000123", name: "Fahmi Syaban", phone: "0812xxxx0001", email: "fahmi@email.com", cityId: "c-bandung", cityName: "Bandung", chapterId: "ch-bdg-a", chapterName: "BNI Bandung A", stampCount: 12, totalBooths: 12, checkinStatus: "checked_in", raffleStatus: "qualified" },
  { id: "p-002", code: "BNI-NATCON-000124", name: "Andi Putra", phone: "0812xxxx0002", email: "andi@email.com", cityId: "c-jakarta", cityName: "Jakarta", chapterId: "ch-jkt-s", chapterName: "BNI Jakarta Selatan", stampCount: 12, totalBooths: 12, checkinStatus: "checked_in", raffleStatus: "qualified" },
  { id: "p-003", code: "BNI-NATCON-000125", name: "Sari Lestari", phone: "0812xxxx0003", email: "sari@email.com", cityId: "c-surabaya", cityName: "Surabaya", chapterId: "ch-sby-1", chapterName: "BNI Surabaya 1", stampCount: 11, totalBooths: 12, checkinStatus: "checked_in", raffleStatus: "qualified" },
  { id: "p-004", code: "BNI-NATCON-000126", name: "Budi Hartono", phone: "0812xxxx0004", email: "budi@email.com", cityId: "c-bandung", cityName: "Bandung", chapterId: "ch-bdg-b", chapterName: "BNI Bandung B", stampCount: 10, totalBooths: 12, checkinStatus: "checked_in", raffleStatus: "qualified" },
  { id: "p-005", code: "BNI-NATCON-000127", name: "Maya Anggraini", phone: "0812xxxx0005", email: "maya@email.com", cityId: "c-jakarta", cityName: "Jakarta", chapterId: "ch-jkt-p", chapterName: "BNI Jakarta Pusat", stampCount: 7, totalBooths: 12, checkinStatus: "checked_in", raffleStatus: "not_yet" },
  { id: "p-006", code: "BNI-NATCON-000128", name: "Rizky Pratama", phone: "0812xxxx0006", email: "rizky@email.com", cityId: "c-surabaya", cityName: "Surabaya", chapterId: "ch-sby-2", chapterName: "BNI Surabaya 2", stampCount: 4, totalBooths: 12, checkinStatus: "checked_in", raffleStatus: "not_yet" },
  { id: "p-007", code: "BNI-NATCON-000129", name: "Dewi Kartika", phone: "0812xxxx0007", email: "dewi@email.com", cityId: "c-bandung", cityName: "Bandung", chapterId: "ch-bdg-a", chapterName: "BNI Bandung A", stampCount: 2, totalBooths: 12, checkinStatus: "not_checked_in", raffleStatus: "not_yet" },
];

export const MOCK_ADMIN_USERS: AdminUserRow[] = [
  { id: "u-super", name: "Demo Super Admin", email: "admin@bni.id", role: "super_admin", status: "active", boothNames: [] },
  { id: "u-event", name: "Demo Event Admin", email: "events@bni.id", role: "event_admin", status: "active", boothNames: [] },
  { id: "u-view", name: "Demo Viewer", email: "viewer@bni.id", role: "management_viewer", status: "active", boothNames: [] },
  { id: "u-pic1", name: "Rina", email: "rina@bni.id", role: "booth_pic", status: "active", boothNames: ["Sponsor Booth A"] },
  { id: "u-pic2", name: "Dimas", email: "dimas@bni.id", role: "booth_pic", status: "active", boothNames: ["Partner Booth B"] },
  { id: "u-disp", name: "Demo Display Operator", email: "display@bni.id", role: "display_operator", status: "active", boothNames: [] },
];
