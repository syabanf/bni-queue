import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/session";
import { ROLES } from "@/lib/auth/rbac";
import {
  checkRateLimit,
  SCAN_LIMIT_PIC,
  SCAN_LIMIT_BOOTH,
} from "@/lib/utils/rate-limit";
import { findPriorAttempt } from "@/lib/scans/replay";
import { processStamp } from "@/lib/scans/process-stamp";
import { logScanAttempt } from "@/lib/scans/log-attempt";
import type { ParticipantProjection, ScanResponse } from "@/lib/scans/types";

const RequestSchema = z.object({
  participant_code: z.string().min(1).max(64),
  booth_id: z.string().uuid(),
  client_request_id: z.string().min(1).max(64),
});

/**
 * Manual stamp entry. Used when the camera fails or the QR is damaged.
 *
 * The client MUST first call /api/stamps/manual/validate to show the resolved
 * participant on a confirmation screen, then call this endpoint with the same
 * code + a fresh client_request_id. We do NOT skip the confirm step on the
 * server because the spec requires it (§C.7).
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { status: "unauthorized_pic", message: "Sign in required." },
      { status: 401 },
    );
  }
  if (session.role !== ROLES.BOOTH_PIC) {
    return NextResponse.json(
      { status: "unauthorized_pic", message: "Scanner is for Booth PICs only." },
      { status: 403 },
    );
  }

  let body: z.infer<typeof RequestSchema>;
  try {
    body = RequestSchema.parse(await req.json());
  } catch {
    return NextResponse.json(
      { status: "invalid", reason: "unknown_participant" } satisfies ScanResponse,
      { status: 400 },
    );
  }

  if (!session.boothIds.includes(body.booth_id)) {
    return NextResponse.json(
      {
        status: "unauthorized_pic",
        message: "Not assigned to this booth.",
      } satisfies ScanResponse,
      { status: 403 },
    );
  }

  const supabase = await createSupabaseServerClient();

  const prior = await findPriorAttempt(
    supabase,
    session.userId,
    body.client_request_id,
  );
  if (prior) {
    return NextResponse.json({
      status: "idempotent_replay",
      original_outcome: prior.outcome,
      attempted_at: prior.attempted_at,
    });
  }

  const userLimit = checkRateLimit(`pic:${session.userId}`, SCAN_LIMIT_PIC);
  if (!userLimit.allowed) {
    return NextResponse.json(
      {
        status: "rate_limited",
        retry_after_ms: userLimit.retryAfterMs,
      } satisfies ScanResponse,
      { status: 429 },
    );
  }
  const boothLimit = checkRateLimit(`booth:${body.booth_id}`, SCAN_LIMIT_BOOTH);
  if (!boothLimit.allowed) {
    return NextResponse.json(
      {
        status: "rate_limited",
        retry_after_ms: boothLimit.retryAfterMs,
      } satisfies ScanResponse,
      { status: 429 },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: participantRaw, error: lookupError } = await (supabase as any).rpc(
    "lookup_participant_for_scan_by_code",
    { p_participant_code: body.participant_code },
  );

  const participant = participantRaw as ParticipantProjection | null;

  if (lookupError) {
    console.error("lookup_participant_for_scan_by_code failed", lookupError);
    return NextResponse.json(
      { status: "server_error", message: "Lookup failed." } satisfies ScanResponse,
      { status: 500 },
    );
  }

  if (!participant || !participant.participant_id) {
    await logScanAttempt(supabase, {
      outcome: "invalid_participant",
      participant_id: null,
      booth_id: body.booth_id,
      scanned_by: session.userId,
      scan_source: "manual_input",
      client_request_id: body.client_request_id,
      user_agent: req.headers.get("user-agent"),
      ip_address: req.headers.get("x-forwarded-for"),
    });
    return NextResponse.json({
      status: "invalid",
      reason: "unknown_participant",
    } satisfies ScanResponse);
  }

  const result = await processStamp(supabase, {
    participant,
    booth_id: body.booth_id,
    scanned_by: session.userId,
    scan_source: "manual_input",
    client_request_id: body.client_request_id,
  });

  const httpStatus =
    result.status === "server_error"
      ? 500
      : result.status === "duplicate"
        ? 409
        : 200;
  return NextResponse.json(result, { status: httpStatus });
}
