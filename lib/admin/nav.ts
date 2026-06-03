/** Admin navigation, grouped into categories. Shared by the desktop sidebar
 *  and the mobile drawer so the two never drift. */
export interface NavItem {
  href: string;
  label: string;
}
export interface NavGroup {
  /** Section heading; null for the top (un-grouped) items. */
  title: string | null;
  items: NavItem[];
}

export const ADMIN_NAV_GROUPS: NavGroup[] = [
  {
    title: null,
    items: [{ href: "/admin/overview", label: "Overview" }],
  },
  {
    title: "Master Data",
    items: [
      { href: "/admin/participants", label: "Participants" },
      { href: "/admin/cities", label: "Cities" },
      { href: "/admin/chapters", label: "Chapters" },
      { href: "/admin/booths", label: "Booths" },
    ],
  },
  {
    title: "Operations",
    items: [
      { href: "/admin/stamps", label: "Stamps" },
      { href: "/admin/leaderboard", label: "Leaderboard" },
      { href: "/admin/raffle", label: "Raffle" },
      { href: "/admin/display-control", label: "Display Control" },
    ],
  },
  {
    title: "System",
    items: [
      { href: "/admin/reports", label: "Reports" },
      { href: "/admin/users", label: "Users" },
      { href: "/admin/settings", label: "Settings" },
    ],
  },
];

/** Flat list (kept for any consumer that just needs the items). */
export const ADMIN_NAV: NavItem[] = ADMIN_NAV_GROUPS.flatMap((g) => g.items);
