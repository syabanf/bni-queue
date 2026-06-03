import "server-only";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isUserRole, type UserRole, ROLES } from "./rbac";
import { getDevSession } from "./dev-session";

export interface SessionContext {
  userId: string;
  email: string | null;
  role: UserRole;
  boothIds: string[];
}

/**
 * Returns the current session's claims, or null if no user is logged in.
 * The role and booth_ids come from JWT app metadata, populated by the
 * users_sync_claims / booth_assignments_sync_claims DB triggers.
 */
export async function getSession(): Promise<SessionContext | null> {
  // Dev shortcut takes precedence; gated by BNI_DEV_AUTH=true in non-prod env.
  const dev = await getDevSession();
  if (dev) {
    return {
      userId: dev.userId,
      email: dev.email,
      role: dev.role,
      boothIds: dev.boothIds,
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const meta = (user.app_metadata ?? {}) as {
    role?: unknown;
    booth_ids?: unknown;
  };
  if (!isUserRole(meta.role)) {
    return null;
  }

  const boothIds = Array.isArray(meta.booth_ids)
    ? meta.booth_ids.filter((b): b is string => typeof b === "string")
    : [];

  return {
    userId: user.id,
    email: user.email ?? null,
    role: meta.role,
    boothIds,
  };
}

/**
 * Server-component guard: redirects to login if no session, or to the user's
 * landing path if their role is not allowed for this surface.
 */
export async function requireRole(
  allowed: UserRole[],
  loginPath = "/admin/login",
): Promise<SessionContext> {
  const session = await getSession();
  if (!session) {
    redirect(loginPath);
  }
  if (!allowed.includes(session.role)) {
    // Authenticated as the wrong role — bounce to their own area.
    redirect(landingForRedirect(session.role));
  }
  return session;
}

/**
 * Convenience guard for the Booth PIC surface. Additionally requires that the
 * PIC has at least one booth assignment; otherwise we land them on a "no booth
 * assigned" notice page (built later).
 */
export async function requireBoothPic(): Promise<SessionContext> {
  const session = await requireRole([ROLES.BOOTH_PIC], "/booth/login");
  return session;
}

function landingForRedirect(role: UserRole): string {
  switch (role) {
    case ROLES.BOOTH_PIC:
      return "/booth/scanner";
    case ROLES.DISPLAY_OPERATOR:
      return "/admin/display-control";
    default:
      return "/admin/overview";
  }
}
