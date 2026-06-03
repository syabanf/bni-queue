/**
 * WIT.ID design tokens (red brand, per wit.id). Mirrors the @theme block in
 * app/globals.css so non-Tailwind consumers (Recharts, dynamic styles, canvas)
 * read identical values.
 */

export const colors = {
  black: "#0a0a0f",
  charcoal: "#14121a",
  graphite: "#1c1820",
  border: "#2c2630",
  gray: "#6b7280",
  muted: "#9ca3af",
  lightGray: "#e5e7eb",
  white: "#ffffff",

  // Brand red
  red: "#f5333d",
  redBright: "#ff5862",
  redDeep: "#c81e28",
  maroon: "#5b1119",
  maroonSoft: "#7a1a22",

  // State
  blue: "#2563eb",
  orange: "#f59e0b",
  success: "#22c55e",
  danger: "#ef4444",
  surfaceLight: "#f8fafc",

  stateSuccessBg: "#052e16",
  stateDuplicateBg: "#451a03",
  stateInvalidBg: "#450a0a",
  stateQualifiedBg: "#3a0a0e",
  stateInactiveBg: "#1f2937",
} as const;

export const radii = {
  sm: "8px",
  md: "12px",
  lg: "20px",
  xl: "28px",
  card: "20px",
  panel: "24px",
  scanner: "28px",
} as const;

export const chartTheme = {
  grid: colors.border,
  axis: colors.muted,
  primary: colors.red,
  secondary: colors.redBright,
  positive: colors.success,
  warning: colors.orange,
  negative: colors.danger,
  series: [
    colors.red,
    colors.redBright,
    colors.maroonSoft,
    colors.orange,
    colors.redDeep,
  ],
} as const;

/** Brand gradient (bright → deep red). */
export const GRADIENT_BRAND = `linear-gradient(100deg, ${colors.redBright}, ${colors.redDeep})`;
