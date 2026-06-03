import "server-only";

/**
 * Mock data used when BNI_DEV_AUTH=true so dev sessions can render full pages
 * without a real database. Keep the shapes aligned with the real query
 * functions in lib/supabase/queries/*.
 */

export const DEV_BOOTH_ID = "00000000-0000-4000-8000-000000000001";

export const DEV_BOOTH = {
  id: DEV_BOOTH_ID,
  code: "DEV-A01",
  name: "Sponsor Booth A (Dev)",
  category: "Sponsor",
  location: "Main Hall · Aisle 1",
  imageUrl: "https://picsum.photos/seed/bni-booth-a/640/360",
} as const;

export const DEV_BOOTH_DAILY_STATS = {
  totalToday: 128,
  duplicateToday: 3,
  // Set lastScanAt to ~3 min ago at runtime so the formatted time looks alive.
  lastScanAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
};

export const DEV_RECENT_SCANS = [
  {
    id: "dev-scan-1",
    attempted_at: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
    outcome: "success",
    participant_id: "00000000-0000-4000-8000-000000000a01",
    scan_source: "camera",
    display_label: "F. Syaban",
  },
  {
    id: "dev-scan-2",
    attempted_at: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    outcome: "success",
    participant_id: "00000000-0000-4000-8000-000000000a02",
    scan_source: "camera",
    display_label: "A. Putra",
  },
  {
    id: "dev-scan-3",
    attempted_at: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
    outcome: "duplicate",
    participant_id: "00000000-0000-4000-8000-000000000a03",
    scan_source: "manual_input",
    display_label: "S. Lestari",
  },
];

export const DEV_USERS = {
  super_admin: {
    userId: "00000000-0000-4000-8000-00000000aaaa",
    email: "admin@bni.id",
    name: "Demo Super Admin",
  },
  event_admin: {
    userId: "00000000-0000-4000-8000-00000000bbbb",
    email: "events@bni.id",
    name: "Demo Event Admin",
  },
  management_viewer: {
    userId: "00000000-0000-4000-8000-00000000cccc",
    email: "viewer@bni.id",
    name: "Demo Viewer",
  },
  booth_pic: {
    userId: "00000000-0000-4000-8000-00000000dddd",
    email: "pic@bni.id",
    name: "Demo Booth PIC",
  },
  display_operator: {
    userId: "00000000-0000-4000-8000-00000000eeee",
    email: "display@bni.id",
    name: "Demo Display Operator",
  },
} as const;
