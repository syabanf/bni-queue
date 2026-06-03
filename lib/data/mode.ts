import "server-only";
import { devAuthEnabled, getDevSession } from "@/lib/auth/dev-session";

/**
 * Central switch deciding whether a request reads/writes live Supabase or the
 * in-repo mock data. The app is "build now, wire Supabase later": every query
 * function calls `isMockMode()` and serves demo content when true.
 *
 * Mock mode is active when BOTH:
 *   - dev auth is enabled (BNI_DEV_AUTH=true, non-production), AND
 *   - the current request carries a dev session.
 *
 * In production with real Supabase + real auth, this is always false, so the
 * live query path runs. No code changes needed to go live.
 */
export async function isMockMode(): Promise<boolean> {
  if (!devAuthEnabled()) return false;
  const dev = await getDevSession();
  return dev !== null;
}

/** True when the Supabase env vars look real (not the placeholder defaults). */
export function supabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  return (
    url.startsWith("https://") &&
    !url.includes("placeholder") &&
    key.length > 20 &&
    key !== "placeholder"
  );
}
