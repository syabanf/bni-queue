import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Pure HMAC + base64url logic for QR tokens. No `server-only` guard so it's
 * unit-testable outside Next.js. The public `lib/qr/token.ts` re-exports with
 * the guard for production use.
 *
 * Format:
 *   BNI-NATCON.<version>.<base64url(16 bytes payload)>.<base64url(8 bytes HMAC)>
 *
 * `.` is the field separator (not `-`) because base64url uses `-` in its
 * alphabet, which would collide. Total length ≈ 47 chars.
 */

const PREFIX = "BNI-NATCON";
const PAYLOAD_BYTES = 16;
const SIG_BYTES = 8;
const SEP = ".";

export function base64url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function fromBase64url(input: string): Buffer {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding =
    padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  return Buffer.from(padded + padding, "base64");
}

function hmac(secret: string, version: number, payload: Buffer): Buffer {
  const h = createHmac("sha256", secret);
  h.update(String(version));
  h.update(payload);
  return h.digest().subarray(0, SIG_BYTES);
}

export interface SignedToken {
  token: string;
  version: number;
  payload: Buffer;
}

export function signNewQrTokenWithSecret(secret: string, version = 1): SignedToken {
  if (!secret || secret.length < 16) {
    throw new Error("QR_HMAC_SECRET missing or too short (need >=16 chars).");
  }
  const payload = randomBytes(PAYLOAD_BYTES);
  const sig = hmac(secret, version, payload);
  const token = `${PREFIX}${SEP}${version}${SEP}${base64url(payload)}${SEP}${base64url(sig)}`;
  return { token, version, payload };
}

export interface VerifyOk {
  ok: true;
  version: number;
}
export interface VerifyFail {
  ok: false;
  reason: "malformed" | "bad_version" | "bad_signature";
}
export type VerifyResult = VerifyOk | VerifyFail;

export function verifyQrTokenWithSecret(
  secret: string,
  token: string,
): VerifyResult {
  if (typeof token !== "string") return { ok: false, reason: "malformed" };

  const parts = token.split(SEP);
  // Expected: ["BNI-NATCON", "<version>", "<payload>", "<sig>"]
  if (parts.length !== 4) return { ok: false, reason: "malformed" };
  if (parts[0] !== PREFIX) return { ok: false, reason: "malformed" };

  const version = Number.parseInt(parts[1]!, 10);
  if (!Number.isInteger(version) || version < 1 || version > 32767) {
    return { ok: false, reason: "bad_version" };
  }

  let payload: Buffer;
  let providedSig: Buffer;
  try {
    payload = fromBase64url(parts[2]!);
    providedSig = fromBase64url(parts[3]!);
  } catch {
    return { ok: false, reason: "malformed" };
  }

  if (payload.length !== PAYLOAD_BYTES || providedSig.length !== SIG_BYTES) {
    return { ok: false, reason: "malformed" };
  }

  const expectedSig = hmac(secret, version, payload);
  if (!timingSafeEqual(providedSig, expectedSig)) {
    return { ok: false, reason: "bad_signature" };
  }

  return { ok: true, version };
}

export function hashRawTokenWithSecret(secret: string, token: string): string {
  const h = createHmac("sha256", secret);
  h.update("hash:");
  h.update(token);
  return base64url(h.digest());
}
