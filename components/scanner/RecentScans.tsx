"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { REALTIME } from "@/lib/realtime/channels";
import { formatJakartaTime } from "@/lib/utils/time";

interface RecentScan {
  id: string;
  attempted_at: string;
  outcome: string;
  participant_id: string | null;
  scan_source: string;
  display_label: string;
}

interface RecentScansProps {
  boothId: string;
  initial?: RecentScan[];
}

const MAX_RECENT = 15;

/**
 * Live tail of scan_attempts for this booth. Subscribes to Postgres changes
 * filtered server-side by booth_id; RLS scopes the PIC to their assignment.
 *
 * The PIC sees minimal info: timestamp + outcome + scan source. Participant
 * name lookup would need an extra RPC; defer to V2 if needed.
 */
export function RecentScans({ boothId, initial = [] }: RecentScansProps) {
  const [scans, setScans] = useState<RecentScan[]>(initial);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel(REALTIME.boothAttempts(boothId))
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "postgres_changes" as any,
        {
          event: "INSERT",
          schema: "public",
          table: "scan_attempts",
          filter: `booth_id=eq.${boothId}`,
        },
        (payload: { new: Record<string, unknown> }) => {
          const row = payload.new as {
            id: string;
            attempted_at: string;
            outcome: string;
            participant_id: string | null;
            scan_source: string;
          };
          setScans((prev) =>
            [
              {
                ...row,
                display_label: row.participant_id?.slice(0, 8) ?? "—",
              },
              ...prev,
            ].slice(0, MAX_RECENT),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [boothId]);

  if (scans.length === 0) {
    return (
      <div className="text-sm text-wit-muted text-center py-6">
        No scans yet.
      </div>
    );
  }

  return (
    <ul className="divide-y divide-wit-border rounded-card border border-wit-border bg-wit-charcoal">
      {scans.map((scan) => (
        <li
          key={scan.id}
          className="px-4 py-2.5 flex items-center justify-between gap-3 text-sm"
        >
          <span className="font-mono text-wit-muted">
            {formatJakartaTime(scan.attempted_at)}
          </span>
          <span className="truncate text-wit-white flex-1">
            {scan.display_label}
          </span>
          <OutcomeBadge outcome={scan.outcome} source={scan.scan_source} />
        </li>
      ))}
    </ul>
  );
}

function OutcomeBadge({ outcome, source }: { outcome: string; source: string }) {
  const isManual = source === "manual_input";
  const colour =
    outcome === "success"
      ? "bg-state-success-bg text-wit-success"
      : outcome === "duplicate"
        ? "bg-state-duplicate-bg text-wit-orange"
        : "bg-state-invalid-bg text-wit-red";
  return (
    <span className={`text-xs uppercase tracking-wider rounded px-2 py-0.5 ${colour}`}>
      {outcome}
      {isManual ? " · M" : ""}
    </span>
  );
}
