/**
 * Role constants and helpers. The Postgres enum is the source of truth (see
 * supabase/migrations/0001_initial_schema.sql). When that enum changes, mirror
 * here.
 */

export const ROLES = {
  SUPER_ADMIN: "super_admin",
  EVENT_ADMIN: "event_admin",
  BOOTH_PIC: "booth_pic",
  MANAGEMENT_VIEWER: "management_viewer",
  DISPLAY_OPERATOR: "display_operator",
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

export const ADMIN_ROLES: UserRole[] = [ROLES.SUPER_ADMIN, ROLES.EVENT_ADMIN];
export const MANAGEMENT_OR_ADMIN_ROLES: UserRole[] = [
  ROLES.SUPER_ADMIN,
  ROLES.EVENT_ADMIN,
  ROLES.MANAGEMENT_VIEWER,
];

export function isUserRole(value: unknown): value is UserRole {
  return (
    typeof value === "string" &&
    Object.values(ROLES).includes(value as UserRole)
  );
}

export function isAdmin(role: UserRole | null | undefined): boolean {
  return !!role && (ADMIN_ROLES as string[]).includes(role);
}

export function isManagementOrAdmin(role: UserRole | null | undefined): boolean {
  return !!role && (MANAGEMENT_OR_ADMIN_ROLES as string[]).includes(role);
}

export function landingPathFor(role: UserRole): string {
  switch (role) {
    case ROLES.BOOTH_PIC:
      return "/booth/scanner";
    case ROLES.DISPLAY_OPERATOR:
      return "/admin/display-control";
    case ROLES.MANAGEMENT_VIEWER:
    case ROLES.EVENT_ADMIN:
    case ROLES.SUPER_ADMIN:
      return "/admin/overview";
  }
}
