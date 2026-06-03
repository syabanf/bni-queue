"use client";

import { useState, useTransition } from "react";
import type { ParticipantProjection } from "@/lib/scans/types";

interface ManualInputFormProps {
  boothId: string;
  boothName: string;
  onConfirmed: (code: string) => Promise<void>;
  onCancel: () => void;
}

type State =
  | { kind: "input"; error?: string }
  | { kind: "validating" }
  | { kind: "confirm"; code: string; participant: ParticipantProjection }
  | { kind: "submitting" }
  | { kind: "error"; message: string };

/**
 * Manual stamp flow (spec §C.Manual Input):
 *   1. PIC types participant code.
 *   2. Validate against /api/stamps/manual/validate; shows the masked
 *      projection.
 *   3. PIC taps Confirm; we call onConfirmed which posts to /api/stamps/manual.
 *
 * The intermediate confirm step is mandatory by spec and by good sense — a
 * 17-char fat-finger is a real failure mode.
 */
export function ManualInputForm({
  boothId,
  onConfirmed,
  onCancel,
}: ManualInputFormProps) {
  const [state, setState] = useState<State>({ kind: "input" });
  const [pending, startTransition] = useTransition();

  async function handleValidate(code: string) {
    setState({ kind: "validating" });
    try {
      const res = await fetch("/api/stamps/manual/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participant_code: code.trim(), booth_id: boothId }),
      });

      if (res.status === 404) {
        setState({ kind: "input", error: "Participant code not found." });
        return;
      }
      if (!res.ok) {
        setState({ kind: "input", error: "Validation failed. Try again." });
        return;
      }
      const data = (await res.json()) as {
        status: string;
        participant?: ParticipantProjection;
      };
      if (data.status === "found" && data.participant) {
        setState({ kind: "confirm", code: code.trim(), participant: data.participant });
      } else {
        setState({ kind: "input", error: "Unexpected response from server." });
      }
    } catch {
      setState({ kind: "input", error: "Network error. Try again." });
    }
  }

  async function handleConfirm() {
    if (state.kind !== "confirm") return;
    setState({ kind: "submitting" });
    try {
      await onConfirmed(state.code);
    } catch (err) {
      setState({
        kind: "error",
        message:
          err instanceof Error ? err.message : "Could not submit stamp.",
      });
    }
  }

  if (state.kind === "input" || state.kind === "validating") {
    return (
      <form
        action={() => {}}
        onSubmit={(e) => {
          e.preventDefault();
          const code = new FormData(e.currentTarget).get("code");
          if (typeof code === "string" && code.trim()) {
            startTransition(() => handleValidate(code));
          }
        }}
        className="rounded-card border border-wit-border bg-wit-charcoal p-5 max-w-md mx-auto space-y-4"
      >
        <div>
          <p className="text-xs uppercase tracking-wider text-wit-muted">
            Manual stamp input
          </p>
          <h2 className="text-lg font-bold text-wit-white mt-1">
            Participant code
          </h2>
        </div>
        <input
          name="code"
          autoFocus
          autoCapitalize="characters"
          spellCheck={false}
          placeholder="BNI-NATCON-000123"
          className="w-full rounded-md bg-wit-black border border-wit-border px-3 py-2 text-wit-white focus:outline-none focus:border-wit-red"
        />
        {state.kind === "input" && state.error ? (
          <p className="text-wit-red text-sm">{state.error}</p>
        ) : null}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={pending || state.kind === "validating"}
            className="flex-1 rounded-md bg-wit-red text-wit-onred font-bold py-2.5 hover:bg-wit-red-bright disabled:opacity-60"
          >
            {state.kind === "validating" ? "Validating…" : "Validate"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-wit-border bg-wit-graphite px-4 py-2.5 text-wit-white"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  if (state.kind === "confirm" || state.kind === "submitting") {
    const p = state.kind === "confirm" ? state.participant : null;
    return (
      <div className="rounded-card border border-wit-blue bg-wit-charcoal p-5 max-w-md mx-auto space-y-4">
        <p className="text-xs uppercase tracking-wider text-wit-blue font-bold">
          CONFIRM PARTICIPANT
        </p>
        {p ? (
          <div>
            <p className="text-lg font-bold text-wit-white">{p.display_name}</p>
            <p className="text-sm text-wit-muted mt-1">City: {p.city_name}</p>
            <p className="text-sm text-wit-muted">Chapter: {p.chapter_name}</p>
            <p className="text-sm text-wit-muted">
              Current stamps: {p.current_stamp_count}
            </p>
          </div>
        ) : null}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={state.kind === "submitting"}
            className="flex-1 rounded-md bg-wit-red text-wit-onred font-bold py-2.5 hover:bg-wit-red-bright disabled:opacity-60"
          >
            {state.kind === "submitting" ? "Stamping…" : "Confirm stamp"}
          </button>
          <button
            type="button"
            onClick={() => setState({ kind: "input" })}
            className="rounded-md border border-wit-border bg-wit-graphite px-4 py-2.5 text-wit-white"
          >
            Edit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-card border border-wit-red bg-state-invalid-bg p-5 max-w-md mx-auto">
      <p className="text-wit-red text-sm">{state.message}</p>
      <button
        type="button"
        onClick={() => setState({ kind: "input" })}
        className="mt-3 rounded-md bg-wit-red text-wit-onred font-bold px-4 py-2 hover:bg-wit-red-bright"
      >
        Retry
      </button>
    </div>
  );
}
