/**
 * Public-facing demo content for the leaderboard, booths, and raffle surfaces
 * before the real DB is wired. No `server-only` guard — it's display-only demo
 * data with zero secrets, safe to render anywhere. Replace with live queries in
 * Week 5.
 */

import { maskParticipantName } from "@/lib/utils/masking";

export interface MockParticipant {
  rank: number;
  name: string;
  maskedName: string;
  city: string;
  chapter: string;
  stamps: number;
  total: number;
  lastCollected: string; // "10:42"
}

const RAW: Array<Omit<MockParticipant, "maskedName" | "rank">> = [
  { name: "Fahmi Syaban", city: "Bandung", chapter: "BNI Bandung A", stamps: 12, total: 12, lastCollected: "10:42" },
  { name: "Andi Putra", city: "Jakarta", chapter: "BNI Jakarta Selatan", stamps: 12, total: 12, lastCollected: "10:55" },
  { name: "Sari Lestari", city: "Surabaya", chapter: "BNI Surabaya 1", stamps: 11, total: 12, lastCollected: "11:03" },
  { name: "Budi Hartono", city: "Bandung", chapter: "BNI Bandung B", stamps: 10, total: 12, lastCollected: "10:21" },
  { name: "Maya Anggraini", city: "Jakarta", chapter: "BNI Jakarta Pusat", stamps: 10, total: 12, lastCollected: "10:38" },
  { name: "Rizky Pratama", city: "Surabaya", chapter: "BNI Surabaya 2", stamps: 9, total: 12, lastCollected: "11:12" },
  { name: "Dewi Kartika", city: "Bandung", chapter: "BNI Bandung A", stamps: 9, total: 12, lastCollected: "10:49" },
  { name: "Hendra Wijaya", city: "Jakarta", chapter: "BNI Jakarta Selatan", stamps: 8, total: 12, lastCollected: "11:20" },
];

export const MOCK_LEADERBOARD: MockParticipant[] = RAW.map((p, i) => ({
  ...p,
  rank: i + 1,
  maskedName: maskParticipantName(p.name),
}));

export interface MockBooth {
  rank: number;
  name: string;
  category: string;
  visitors: number;
  imageUrl: string;
}

export const MOCK_BOOTHS: MockBooth[] = [
  { rank: 1, name: "Sponsor Booth A", category: "Sponsor", visitors: 410, imageUrl: "https://picsum.photos/seed/bni-booth-a/480/300" },
  { rank: 2, name: "Partner Booth B", category: "Partner", visitors: 390, imageUrl: "https://picsum.photos/seed/bni-booth-b/480/300" },
  { rank: 3, name: "Internal Booth C", category: "Internal", visitors: 280, imageUrl: "https://picsum.photos/seed/bni-booth-c/480/300" },
  { rank: 4, name: "Innovation Lab", category: "Sponsor", visitors: 244, imageUrl: "https://picsum.photos/seed/bni-booth-d/480/300" },
];

export const MOCK_EVENT_STATS = {
  participants: 3000,
  checkedIn: 2650,
  totalStamps: 18420,
  qualified: 1200,
  fullPassport: 420,
  activeBooths: 24,
};

export const MOCK_CHAPTERS = [
  { rank: 1, chapter: "BNI Bandung A", city: "Bandung", totalStamp: 850, members: 120, avg: 7.1 },
  { rank: 2, chapter: "BNI Jakarta Selatan", city: "Jakarta", totalStamp: 790, members: 150, avg: 5.2 },
  { rank: 3, chapter: "BNI Surabaya 1", city: "Surabaya", totalStamp: 650, members: 95, avg: 6.8 },
];
