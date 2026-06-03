import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/**
 * Cookie-bound Supabase client for Server Components, Route Handlers, and
 * Server Actions. Subject to RLS as the logged-in user.
 *
 * Do NOT import this from Client Components — use `lib/supabase/browser` there.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component — Next.js disallows mutating
            // cookies there. Safe to ignore: the middleware refresh path
            // owns cookie writes.
          }
        },
      },
    },
  );
}
