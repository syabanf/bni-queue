/**
 * Single source of truth for participant-name masking on public surfaces
 * (spec §15.5: "F*** Syaban"). Used by leaderboard, LED display, and any
 * public listing. NEVER mask in admin UI.
 *
 * Rule: first letter of the first name + "***" + last name as-is.
 * If only one name token, mask everything past the first letter.
 */
export function maskParticipantName(fullName: string): string {
  const trimmed = fullName.trim().replace(/\s+/g, " ");
  if (!trimmed) return "***";

  const parts = trimmed.split(" ");
  if (parts.length === 1) {
    return `${parts[0]!.charAt(0).toUpperCase()}***`;
  }

  const first = parts[0]!;
  const last = parts.slice(1).join(" ");
  return `${first.charAt(0).toUpperCase()}*** ${last}`;
}

/**
 * Mask an email for display in confirmation screens visible to PICs
 * (spec §C: "f***@gmail.com").
 */
export function maskEmail(email: string): string {
  const trimmed = email.trim();
  const at = trimmed.indexOf("@");
  if (at <= 0) return "***";
  const user = trimmed.slice(0, at);
  const domain = trimmed.slice(at);
  return `${user.charAt(0)}***${domain}`;
}
