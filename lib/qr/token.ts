import "server-only";
import {
  signNewQrTokenWithSecret,
  verifyQrTokenWithSecret,
  hashRawTokenWithSecret,
  type SignedToken,
  type VerifyResult,
} from "./token-impl";

export type { SignedToken, VerifyResult };

function getSecret(): string {
  const secret = process.env.QR_HMAC_SECRET;
  if (!secret) {
    throw new Error(
      "QR_HMAC_SECRET is not set. Generate with: openssl rand -base64 48 | tr -d '\\n=' | tr '+/' '-_'",
    );
  }
  return secret;
}

/**
 * Generate a fresh signed token for a participant. Call at import time and
 * store on `participants.qr_token`.
 */
export function signNewQrToken(version = 1): SignedToken {
  return signNewQrTokenWithSecret(getSecret(), version);
}

/**
 * Verify a QR token. Constant-time signature compare. NO DB calls; this is the
 * first line of defence for the scan endpoint.
 */
export function verifyQrToken(token: string): VerifyResult {
  return verifyQrTokenWithSecret(getSecret(), token);
}

/**
 * SHA-256 hash of a raw token, base64url-encoded. Stored on
 * scan_attempts.raw_token_hash so duplicate/invalid attempts can be debugged
 * without exposing the original token.
 */
export function hashRawToken(token: string): string {
  return hashRawTokenWithSecret(getSecret(), token);
}
