/**
 * Time formatting helpers. All `timestamptz` values are stored in UTC; the UI
 * always displays Asia/Jakarta (WIB, UTC+7). Use this helper everywhere so the
 * timezone is centralised.
 */

const JAKARTA = "Asia/Jakarta";

export function formatJakartaTime(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: JAKARTA,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function formatJakartaDateTime(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: JAKARTA,
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function formatJakartaDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: JAKARTA,
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

export const WIB_LABEL = "WIB";
