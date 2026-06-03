"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Field, Input } from "@/components/ui/Field";
import {
  saveRaffleSettings,
  generateEligible,
  drawWinners,
  lockResults,
} from "@/lib/actions/raffle";
import type { ActionResult } from "@/lib/actions/result";
import type {
  RaffleSettings,
  RaffleWinner,
  MOCK_RAFFLE_STATS as StatsType,
} from "@/lib/dev/ops-mock";

type Stats = typeof StatsType;

export function RaffleManager({
  settings,
  stats,
  winners,
}: {
  settings: RaffleSettings;
  stats: Stats;
  winners: RaffleWinner[];
}) {
  const router = useRouter();
  const [notice, setNotice] = useState<ActionResult | null>(null);
  const [pending, start] = useTransition();

  function run(fn: () => Promise<ActionResult>) {
    start(async () => {
      const res = await fn();
      setNotice(res);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {notice?.message ? (
        <p
          className={`text-sm rounded-md px-3 py-2 ${
            notice.ok
              ? "bg-state-success-bg text-wit-success"
              : "bg-state-duplicate-bg text-wit-orange"
          }`}
        >
          {notice.message}
        </p>
      ) : null}

      <div className="grid md:grid-cols-3 gap-4">
        <Stat label="Eligible" value={stats.eligible} accent="cyan" />
        <Stat label="Full passport" value={stats.fullPassport} accent="green" />
        <Stat label="Total entries" value={stats.entries} accent="violet" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Settings */}
        <GlassCard className="p-6">
          <h2 className="font-bold text-wit-white">Eligibility rules</h2>
          <form action={(fd) => start(async () => { const r = await saveRaffleSettings(undefined, fd); setNotice(r); router.refresh(); })} className="mt-4 space-y-4">
            <Field label="Minimum stamps to qualify">
              <Input type="number" name="minStamps" min={1} max={100} defaultValue={settings.minStamps} />
            </Field>
            <Field label="Full-passport bonus entries">
              <Input type="number" name="fullPassportBonus" min={0} max={10} defaultValue={settings.fullPassportBonus} />
            </Field>
            <Button type="submit" disabled={pending || settings.isLocked}>
              Save rules
            </Button>
          </form>
        </GlassCard>

        {/* Draw */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-wit-white">Draw</h2>
            {settings.isLocked ? <Badge tone="invalid">Locked</Badge> : <Badge tone="success">Open</Badge>}
          </div>
          <div className="mt-4 space-y-4">
            <Button
              variant="secondary"
              onClick={() => run(generateEligible)}
              disabled={pending || settings.isLocked}
            >
              Generate eligible list
            </Button>

            <form action={(fd) => start(async () => { const r = await drawWinners(undefined, fd); setNotice(r); router.refresh(); })} className="space-y-3 border-t border-wit-border pt-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="How many">
                  <Input type="number" name="count" min={1} max={50} defaultValue={1} />
                </Field>
                <Field label="Prize label">
                  <Input name="prize" defaultValue="Grand Prize" />
                </Field>
              </div>
              <Button type="submit" disabled={pending || settings.isLocked}>
                Draw winners
              </Button>
            </form>

            <div className="border-t border-wit-border pt-4">
              <Button
                variant="danger"
                onClick={() => run(lockResults)}
                disabled={pending || settings.isLocked}
              >
                Lock results
              </Button>
              <p className="mt-2 text-xs text-wit-muted">
                Locking freezes winners permanently and prevents re-draws.
              </p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Winners */}
      <GlassCard className="p-6">
        <h2 className="font-bold text-wit-white mb-4">Winners</h2>
        {winners.length === 0 ? (
          <p className="text-sm text-wit-muted">No winners drawn yet.</p>
        ) : (
          <ol className="space-y-2">
            {winners.map((w) => (
              <li
                key={w.order}
                className="flex items-center gap-4 rounded-md bg-wit-graphite px-4 py-3"
              >
                <span className="grid h-8 w-8 place-items-center rounded-full bg-wit-red text-wit-onred font-bold text-sm">
                  {w.order}
                </span>
                <div className="flex-1">
                  <p className="font-semibold text-wit-white">{w.maskedName}</p>
                  <p className="text-xs text-wit-muted">{w.chapter}</p>
                </div>
                <Badge tone="qualified">{w.prize}</Badge>
              </li>
            ))}
          </ol>
        )}
      </GlassCard>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: "cyan" | "green" | "violet";
}) {
  const color = {
    cyan: "text-wit-red",
    green: "text-wit-red",
    violet: "text-wit-red",
  }[accent];
  return (
    <GlassCard className="p-5">
      <p className="text-[11px] uppercase tracking-wider text-wit-muted">{label}</p>
      <p className={`mt-1 text-3xl font-bold tabular-nums ${color}`}>
        {value.toLocaleString()}
      </p>
    </GlassCard>
  );
}
