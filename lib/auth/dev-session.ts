import "server-only";
import { cookies } from "next/headers";
import type { UserRole } from "./rbac";

/**
 * Dev-only session shortcut. Lets you click through the app before a real
 * Supabase project is wired up. Active only when NODE_ENV !== "production"
 * AND BNI_DEV_AUTH=true. The flag is opt-in even in dev so it never ships
 * silently.
 *
 * Stored as a single JSON cookie; not signed (it's a local dev convenience,
 * not a security boundary).
 */

const COOKIE_NAME = "bni_dev_session";
const MAX_AGE_SECONDS = 8 * 60 * 60;

export interface DevSession {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  boothIds: string[];
}

export function devAuthEnabled(): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.BNI_DEV_AUTH === "true"
  );
}

export async function getDevSession(): Promise<DevSession | null> {
  if (!devAuthEnabled()) return null;
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as DevSession;
    if (!parsed.userId || !parsed.role) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function setDevSession(session: DevSession): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, JSON.stringify(session), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: false,
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearDevSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
