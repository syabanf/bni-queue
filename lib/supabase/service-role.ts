import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Admin Supabase client using the service_role key. Bypasses RLS.
 *
 * ⚠️ SERVER ONLY — never import from Client Components. The `server-only`
 * import enforces this at build time. ESLint rule (see .eslintrc) additionally
 * restricts imports to `app/api/**` and `lib/supabase/queries/**`.
 *
 * Use for:
 *  - Public leaderboard reads (mask at API boundary before returning).
 *  - Raffle draws (need deterministic, unfiltered access to eligible pool).
 *  - Participant import (creating auth users + rows in a single operation).
 *  - JWT-claims propagation triggers (admin only).
 *
 * Never use for routine logged-in user actions — use the cookie-bound
 * `createSupabaseServerClient` so RLS provides defence-in-depth.
 */
export function createSupabaseServiceRoleClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Service-role client unavailable.",
    );
  }
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}
