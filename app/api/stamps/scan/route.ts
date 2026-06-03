import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/session";
import { ROLES } from "@/lib/auth/rbac";
import { verifyQrToken, hashRawToken } from "@/lib/qr/token";
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
  qr_token: z.string().min(1).max(200),
  booth_id: z.string().uuid(),
  client_request_id: z.string().min(1).max(64),
});

/**
 * The hot path. Mobile booth PIC scans a participant QR; this endpoint creates
 * (or refuses to create) the stamp.
 *
 * Order matters:
 *  1. AuthZ — booth_pic role only; booth_id must be in JWT-claims booth_ids.
 *  2. Idempotency — replay the prior outcome if the same client_request_id
 *     has already been processed.
 *  3. Rate limit — guards against runaway clients.
 *  4. HMAC verify — rejects tampered tokens without a DB call.
 *  5. Lookup participant — only via SECURITY DEFINER function (no direct
 *     SELECT on participants for PICs).
 *  6. Insert stamp — UNIQUE constraint is the duplicate arbiter. No
 *     pre-check (TOCTOU race).
 *  7. Log scan_attempts — every outcome, always.
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
      { status: "invalid", reason: "malformed_qr" } satisfies ScanResponse,
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

  // 2. Idempotency replay
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

  // 3. Rate limit
  const userLimit = checkRateLimit(
    `pic:${session.userId}`,
    SCAN_LIMIT_PIC,
  );
  if (!userLimit.allowed) {
    return NextResponse.json(
      {
        status: "rate_limited",
        retry_after_ms: userLimit.retryAfterMs,
      } satisfies ScanResponse,
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(userLimit.retryAfterMs / 1000)),
        },
      },
    );
  }
  const boothLimit = checkRateLimit(
    `booth:${body.booth_id}`,
    SCAN_LIMIT_BOOTH,
  );
  if (!boothLimit.allowed) {
    return NextResponse.json(
      {
        status: "rate_limited",
        retry_after_ms: boothLimit.retryAfterMs,
      } satisfies ScanResponse,
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(boothLimit.retryAfterMs / 1000)),
        },
      },
    );
  }

  // 4. HMAC verify
  const verified = verifyQrToken(body.qr_token);
  const tokenHash = hashRawToken(body.qr_token);

  if (!verified.ok) {
    await logScanAttempt(supabase, {
      outcome: "invalid_qr",
      participant_id: null,
      booth_id: body.booth_id,
      scanned_by: session.userId,
      scan_source: "camera",
      raw_token_hash: tokenHash,
      client_request_id: body.client_request_id,
      user_agent: req.headers.get("user-agent"),
      ip_address: req.headers.get("x-forwarded-for"),
    });
    const reason =
      verified.reason === "malformed"
        ? "malformed_qr"
        : verified.reason === "bad_version"
          ? "bad_version"
          : "bad_signature";
    return NextResponse.json({ status: "invalid", reason } satisfies ScanResponse);
  }

  // 5. Lookup participant via SECURITY DEFINER function.
  // (Cast supabase to any for the RPC — types/database.ts is hand-authored
  // until `supabase gen types` is run against the linked project; the rpc
  // method's generic doesn't pick up our placeholder Functions shape.)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: participantRaw, error: lookupError } = await (supabase as any).rpc(
    "lookup_participant_for_scan",
    { p_qr_token: body.qr_token, p_qr_version: verified.version },
  );

  const participant = participantRaw as ParticipantProjection | null;

  if (lookupError) {
    console.error("lookup_participant_for_scan failed", lookupError);
    return NextResponse.json(
      {
        status: "server_error",
        message: "Lookup failed.",
      } satisfies ScanResponse,
      { status: 500 },
    );
  }

  if (!participant || !participant.participant_id) {
    await logScanAttempt(supabase, {
      outcome: "invalid_participant",
      participant_id: null,
      booth_id: body.booth_id,
      scanned_by: session.userId,
      scan_source: "camera",
      raw_token_hash: tokenHash,
      client_request_id: body.client_request_id,
      user_agent: req.headers.get("user-agent"),
      ip_address: req.headers.get("x-forwarded-for"),
    });
    return NextResponse.json({
      status: "invalid",
      reason: "unknown_participant",
    } satisfies ScanResponse);
  }

  // 6 & 7. Insert stamp + log attempt
  const result = await processStamp(supabase, {
    participant,
    booth_id: body.booth_id,
    scanned_by: session.userId,
    scan_source: "camera",
    client_request_id: body.client_request_id,
    raw_token_hash: tokenHash,
  });

  const httpStatus =
    result.status === "server_error"
      ? 500
      : result.status === "duplicate"
        ? 409
        : 200;
  return NextResponse.json(result, { status: httpStatus });
}
