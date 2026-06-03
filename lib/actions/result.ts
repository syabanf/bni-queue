/**
 * Shared Server Action result shape + helpers for the admin mutation flows.
 */

export interface ActionResult {
  ok: boolean;
  message?: string;
}

export const ok = (message?: string): ActionResult => ({ ok: true, message });
export const fail = (message: string): ActionResult => ({ ok: false, message });

/** Returned by mutations while running on mock data. */
export const DEMO_NOTICE =
  "Demo mode — connect Supabase to persist changes.";
export const demoBlocked = (): ActionResult => ({
  ok: false,
  message: DEMO_NOTICE,
});
