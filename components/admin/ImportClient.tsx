"use client";

import { useActionState } from "react";
import {
  importParticipants,
  type ImportResult,
} from "@/lib/actions/participants-import";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

const initial: ImportResult = { ok: false, inserted: 0, failed: 0, errors: [] };

export function ImportClient() {
  const [state, action, pending] = useActionState(importParticipants, initial);

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Step 1 — grab the template so the columns line up. */}
      <GlassCard className="p-6">
        <p className="text-sm text-wit-white font-semibold">
          1. Download the template
        </p>
        <p className="text-xs text-wit-muted mt-1">
          Fill it in, keeping the header row. City and chapter names must match
          your existing master data exactly.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a href="/api/participants/import-template?format=xlsx">
            <Button size="sm">Excel template (.xlsx)</Button>
          </a>
          <a href="/api/participants/import-template?format=csv">
            <Button size="sm" variant="secondary">
              CSV template (.csv)
            </Button>
          </a>
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <form action={action} className="space-y-4">
          <div>
            <p className="text-sm text-wit-white font-semibold">
              2. Upload the filled file
            </p>
            <p className="text-xs text-wit-muted mt-1">
              Accepts <code className="text-wit-red">.csv</code> or{" "}
              <code className="text-wit-red">.xlsx</code>. Required columns:{" "}
              <code className="text-wit-red">name, city, chapter</code>.
              Optional: <code className="text-wit-red">phone, email, code</code>.
              City and chapter must already exist.
            </p>
          </div>
          <input
            type="file"
            name="file"
            accept=".csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
            required
            className="block w-full text-sm text-wit-muted file:mr-4 file:rounded-md file:border-0 file:bg-wit-red file:px-4 file:py-2 file:text-sm file:font-bold file:text-wit-white hover:file:bg-wit-red-bright"
          />
          <Button type="submit" disabled={pending}>
            {pending ? "Importing…" : "Import"}
          </Button>
        </form>
      </GlassCard>

      {state.message ? (
        <GlassCard className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Badge tone={state.ok ? "success" : "duplicate"}>
              {state.ok ? "Done" : "Notice"}
            </Badge>
            <p className="text-sm text-wit-white">{state.message}</p>
          </div>
          {state.inserted > 0 || state.failed > 0 ? (
            <div className="flex gap-6 text-sm">
              <span className="text-wit-success">
                Inserted: <b>{state.inserted}</b>
              </span>
              <span className="text-wit-orange">
                Skipped: <b>{state.failed}</b>
              </span>
            </div>
          ) : null}
          {state.errors.length > 0 ? (
            <div>
              <p className="text-xs uppercase tracking-wider text-wit-muted mb-2">
                Row errors (first 50)
              </p>
              <ul className="text-xs text-wit-muted space-y-1 max-h-60 overflow-auto">
                {state.errors.map((e, i) => (
                  <li key={i}>
                    {e.row > 0 ? `Row ${e.row}: ` : ""}
                    {e.reason}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </GlassCard>
      ) : null}
    </div>
  );
}
