import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/session";
import { ROLES } from "@/lib/auth/rbac";
import type { ParticipantProjection } from "@/lib/scans/types";

const RequestSchema = z.object({
  participant_code: z.string().min(1).max(64),
  booth_id: z.string().uuid(),
});

/**
 * Manual-flow validation step. PIC types a code, we return the masked
 * projection so they can confirm "yes this is the right person" before the
 * actual stamp insert. Does NOT write anything.
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== ROLES.BOOTH_PIC) {
    return NextResponse.json({ status: "unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof RequestSchema>;
  try {
    body = RequestSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ status: "bad_request" }, { status: 400 });
  }

  if (!session.boothIds.includes(body.booth_id)) {
    return NextResponse.json(
      { status: "unauthorized_pic", message: "Not assigned to this booth." },
      { status: 403 },
    );
  }

  const supabase = await createSupabaseServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc(
    "lookup_participant_for_scan_by_code",
    { p_participant_code: body.participant_code },
  );

  if (error) {
    console.error("manual validate lookup failed", error);
    return NextResponse.json({ status: "server_error" }, { status: 500 });
  }

  const projection = data as ParticipantProjection | null;
  if (!projection || !projection.participant_id) {
    return NextResponse.json({ status: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ status: "found", participant: projection });
}
