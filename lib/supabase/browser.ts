"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

let cached: ReturnType<typeof createBrowserClient<Database>> | undefined;

/**
 * Singleton browser Supabase client for Client Components. Subject to RLS as
 * the logged-in user. Realtime subscriptions for admin/PIC live activity go
 * through this client.
 */
export function getSupabaseBrowserClient() {
  if (!cached) {
    cached = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }
  return cached;
}
