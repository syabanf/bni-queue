"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ROLES, landingPathFor } from "./rbac";

export interface SignInResult {
  ok: boolean;
  error?: string;
}

export async function signInWithPassword(
  _prevState: SignInResult | undefined,
  formData: FormData,
): Promise<SignInResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const expectedSurface = String(formData.get("surface") ?? ""); // "booth" | "admin"

  if (!email || !password) {
    return { ok: false, error: "Email and password are required." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return { ok: false, error: error?.message ?? "Sign-in failed." };
  }

  const role = (data.user.app_metadata?.role ?? "") as string;

  if (expectedSurface === "booth" && role !== ROLES.BOOTH_PIC) {
    await supabase.auth.signOut();
    return {
      ok: false,
      error: "This sign-in is for Booth PICs only.",
    };
  }

  if (
    expectedSurface === "admin" &&
    role !== ROLES.SUPER_ADMIN &&
    role !== ROLES.EVENT_ADMIN &&
    role !== ROLES.MANAGEMENT_VIEWER &&
    role !== ROLES.DISPLAY_OPERATOR
  ) {
    await supabase.auth.signOut();
    return {
      ok: false,
      error: "This sign-in is for staff accounts only.",
    };
  }

  revalidatePath("/", "layout");
  redirect(landingPathFor(role as Parameters<typeof landingPathFor>[0]));
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/leaderboard");
}
