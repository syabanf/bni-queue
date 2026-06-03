"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  setDevSession,
  clearDevSession,
  devAuthEnabled,
} from "./dev-session";
import { ROLES, landingPathFor, type UserRole } from "./rbac";
import { DEV_USERS, DEV_BOOTH_ID } from "@/lib/dev/mock-data";

/**
 * Sign in as a dev role. Bypasses Supabase entirely; used to click through
 * the app before a real DB is wired. Refuses to run unless BNI_DEV_AUTH=true.
 */
export async function devSignInAs(role: UserRole) {
  if (!devAuthEnabled()) {
    redirect("/leaderboard");
  }

  const profile = DEV_USERS[role];
  const boothIds = role === ROLES.BOOTH_PIC ? [DEV_BOOTH_ID] : [];

  await setDevSession({
    userId: profile.userId,
    email: profile.email,
    name: profile.name,
    role,
    boothIds,
  });

  revalidatePath("/", "layout");
  redirect(landingPathFor(role));
}

export async function devSignOut() {
  await clearDevSession();
  revalidatePath("/", "layout");
  redirect("/leaderboard");
}
