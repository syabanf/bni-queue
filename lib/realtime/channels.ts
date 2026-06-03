/**
 * Realtime channel naming. Keep all channel names in one place so consumers
 * and publishers can't drift.
 *
 * Two patterns (see plan §Realtime Strategy):
 *  - Postgres-change subscriptions for admin / PIC live activity.
 *  - Broadcast channel for the public leaderboard (decoupled from DB load).
 */

export const REALTIME = {
  /** Per-booth live scan feed for PICs and admins. */
  boothAttempts: (boothId: string) => `booth-attempts-${boothId}`,
  /** Global admin scan feed. */
  adminAttempts: "admin-attempts-v1",
  /** Public leaderboard "data ready" broadcast — payload is just {version, refreshedAt}. */
  leaderboard: "leaderboard-v1",
  /** Display settings changes (LED display + operator console). */
  displaySettings: "display-settings-v1",
} as const;
