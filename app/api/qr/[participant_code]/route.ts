import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { isManagementOrAdmin } from "@/lib/auth/rbac";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isMockMode } from "@/lib/data/mode";
import { renderQrPng } from "@/lib/qr/render";

/**
 * Renders a participant's QR badge as PNG. Admin/management only — the QR token
 * is sensitive (it's what booths scan). In demo mode we encode the participant
 * code itself so the badge preview still renders.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ participant_code: string }> },
) {
  const session = await getSession();
  if (!session || !isManagementOrAdmin(session.role)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { participant_code } = await params;

  let tokenToEncode: string;
  if (await isMockMode()) {
    tokenToEncode = `BNI-NATCON-DEMO-${participant_code}`;
  } else {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("participants")
      .select("qr_token")
      .eq("code", participant_code)
      .is("deleted_at", null)
      .maybeSingle();
    if (error || !data) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    tokenToEncode = (data as { qr_token: string }).qr_token;
  }

  const png = await renderQrPng(tokenToEncode, { width: 512 });
  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "private, max-age=300",
    },
  });
}
