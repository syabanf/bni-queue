"use client";

import { useCallback, useState } from "react";
import { CameraScanner } from "./CameraScanner";
import { ScanResultCard } from "./ScanResultCard";
import { ManualInputForm } from "./ManualInputForm";
import { RecentScans } from "./RecentScans";
import { GlassCard } from "@/components/ui/GlassCard";
import type { ScanResponse } from "@/lib/scans/types";
import { formatJakartaTime, WIB_LABEL } from "@/lib/utils/time";

interface ScannerClientProps {
  boothId: string;
  boothName: string;
  boothCode: string;
  pic: { name: string | null; email: string | null };
  initialStats: {
    totalToday: number;
    duplicateToday: number;
    lastScanAt: string | null;
  };
}

type Mode = "camera" | "manual";

type ResultState =
  | { kind: "idle" }
  | { kind: "validating" }
  | { kind: "result"; response: ScanResponse };

const SCAN_COOLDOWN_MS = 2500;

/**
 * Full scanner page state machine (spec §C.Scanner Flow):
 *   IDLE → VALIDATING → SUCCESS/DUPLICATE/INVALID → IDLE
 *   IDLE → MANUAL_INPUT → MANUAL_CONFIRM → VALIDATING → ...
 *
 * The result state auto-dismisses after SCAN_COOLDOWN_MS so the PIC can flow
 * through a queue without tapping for each one.
 */
export function ScannerClient({
  boothId,
  boothName,
  boothCode,
  pic,
  initialStats,
}: ScannerClientProps) {
  const [mode, setMode] = useState<Mode>("camera");
  const [result, setResult] = useState<ResultState>({ kind: "idle" });
  const [stats] = useState(initialStats);

  const resetResult = useCallback(() => {
    setResult({ kind: "idle" });
  }, []);

  const submitToken = useCallback(
    async (qrToken: string) => {
      setResult({ kind: "validating" });
      try {
        const res = await fetch("/api/stamps/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            qr_token: qrToken,
            booth_id: boothId,
            client_request_id: crypto.randomUUID(),
          }),
        });
        const data = (await res.json()) as ScanResponse | { status: string };
        if ("status" in data && data.status === "idempotent_replay") {
          // Already saw this one; treat as cooldown.
          resetResult();
          return;
        }
        setResult({ kind: "result", response: data as ScanResponse });
        if (navigator.vibrate) {
          if ((data as ScanResponse).status === "success") navigator.vibrate(150);
          else if ((data as ScanResponse).status === "duplicate")
            navigator.vibrate([60, 50, 60]);
          else navigator.vibrate([200, 100, 200]);
        }
        // Auto-dismiss after cooldown so the next scan can happen quickly.
        window.setTimeout(resetResult, SCAN_COOLDOWN_MS);
      } catch (err) {
        setResult({
          kind: "result",
          response: {
            status: "server_error",
            message:
              err instanceof Error ? err.message : "Network error.",
          },
        });
      }
    },
    [boothId, resetResult],
  );

  const submitManual = useCallback(
    async (code: string) => {
      setResult({ kind: "validating" });
      const res = await fetch("/api/stamps/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participant_code: code,
          booth_id: boothId,
          client_request_id: crypto.randomUUID(),
        }),
      });
      const data = (await res.json()) as ScanResponse | { status: string };
      if ("status" in data && data.status === "idempotent_replay") {
        resetResult();
        setMode("camera");
        return;
      }
      setResult({ kind: "result", response: data as ScanResponse });
      window.setTimeout(() => {
        resetResult();
        setMode("camera");
      }, SCAN_COOLDOWN_MS);
    },
    [boothId, resetResult],
  );

  const isShowingResult = result.kind === "result";

  return (
    <div className="px-4 py-4 max-w-2xl mx-auto space-y-4">
      <GlassCard className="flex items-start justify-between p-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-wit-red">
            BNI NatCon Stamp Scanner
          </p>
          <h1 className="text-lg font-bold text-wit-white mt-0.5">
            {boothName}
          </h1>
          <p className="text-xs text-wit-muted">
            Code {boothCode} · PIC {pic.name ?? pic.email}
          </p>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-wit-success">
          <span className="inline-block h-2 w-2 rounded-full bg-wit-success animate-glow-pulse" />
          Online
        </span>
      </GlassCard>

      {mode === "camera" ? (
        <CameraScanner
          enabled={!isShowingResult}
          onDetect={(token) => {
            // Re-detection of the same QR within cooldown is handled by
            // CameraScanner's internal throttle.
            if (!isShowingResult) submitToken(token);
          }}
        />
      ) : (
        <ManualInputForm
          boothId={boothId}
          boothName={boothName}
          onConfirmed={submitManual}
          onCancel={() => setMode("camera")}
        />
      )}

      {result.kind === "result" ? (
        <ScanResultCard
          response={result.response}
          boothName={boothName}
          onNext={() => {
            resetResult();
            setMode("camera");
          }}
        />
      ) : null}

      {mode === "camera" ? (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setMode("manual")}
            className="flex-1 rounded-md glass border border-white/10 py-2.5 text-wit-white font-semibold hover:border-wit-red hover:text-wit-red transition-colors"
          >
            Manual input
          </button>
        </div>
      ) : null}

      <GlassCard className="p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-wit-red">
          Today at this booth
        </p>
        <div className="mt-2 grid grid-cols-3 gap-3 text-center">
          <Stat label="Visitors" value={stats.totalToday} accent />
          <Stat label="Duplicates" value={stats.duplicateToday} />
          <Stat
            label="Last scan"
            value={
              stats.lastScanAt
                ? `${formatJakartaTime(stats.lastScanAt)} ${WIB_LABEL}`
                : "—"
            }
            small
          />
        </div>
      </GlassCard>

      <section>
        <p className="text-[10px] uppercase tracking-[0.2em] text-wit-muted mb-2">
          Recent scan
        </p>
        <RecentScans boothId={boothId} />
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  small,
  accent,
}: {
  label: string;
  value: string | number;
  small?: boolean;
  accent?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-wit-muted">{label}</p>
      <p
        className={`mt-0.5 font-bold tabular-nums ${
          accent ? "text-wit-red" : "text-wit-white"
        } ${small ? "text-sm" : "text-2xl"}`}
      >
        {value}
      </p>
    </div>
  );
}
