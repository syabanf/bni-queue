/**
 * Runtime configuration surface. Read env once, in one place, with clear names.
 * We deliberately do NOT hard-throw on missing Supabase vars at import time so
 * the app can run in "mock" mode for demos; instead `supabaseConfigured()`
 * (lib/data/mode) gates the live path and the deployment README documents what
 * must be set for production.
 */

export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  isProduction: process.env.NODE_ENV === "production",
} as const;

/** Absolute URL helper for route handlers doing redirects. */
export function absoluteUrl(path: string): string {
  const base = env.siteUrl.replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
