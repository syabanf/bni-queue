import { DisplayRotator } from "@/components/leaderboard/DisplayRotator";
import {
  MOCK_LEADERBOARD,
  MOCK_BOOTHS,
  MOCK_EVENT_STATS,
} from "@/lib/dev/leaderboard-mock";

export const metadata = { title: "LED Display · BNI NatCon" };

/**
 * Fullscreen, auto-rotating LED display. Rendered chrome-free (the public
 * layout bypasses its header/footer for this path). Demo data today; wires to
 * the live leaderboard + Realtime broadcast in production.
 */
export default function LeaderboardDisplayPage() {
  return (
    <DisplayRotator
      data={{
        participants: MOCK_LEADERBOARD,
        booths: MOCK_BOOTHS,
        stats: {
          participants: MOCK_EVENT_STATS.participants,
          totalStamps: MOCK_EVENT_STATS.totalStamps,
          qualified: MOCK_EVENT_STATS.qualified,
        },
      }}
    />
  );
}
