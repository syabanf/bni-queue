"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";

interface ToggleState {
  sound: boolean;
  vibration: boolean;
}

const KEY = "bni-scanner-prefs";

/**
 * Scanner feedback preferences (sound + vibration), persisted to localStorage
 * and read by the scanner. Off by default per spec (§C — optional feedback).
 */
export function ProfileToggles() {
  const [prefs, setPrefs] = useState<ToggleState>({
    sound: false,
    vibration: true,
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // localStorage is only readable post-hydration, so loading prefs in an
    // effect (rather than a lazy initializer) is the correct pattern here.
    /* eslint-disable react-hooks/set-state-in-effect */
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setPrefs(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setLoaded(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  function update(next: Partial<ToggleState>) {
    setPrefs((prev) => {
      const merged = { ...prev, ...next };
      try {
        localStorage.setItem(KEY, JSON.stringify(merged));
      } catch {
        /* ignore */
      }
      return merged;
    });
  }

  return (
    <GlassCard className="p-5 space-y-1">
      <Toggle
        label="Sound on scan"
        description="Play a chime on each successful stamp."
        checked={loaded && prefs.sound}
        onChange={(v) => update({ sound: v })}
      />
      <div className="h-px bg-wit-graphite" />
      <Toggle
        label="Vibration on scan"
        description="Buzz the device on success / duplicate."
        checked={loaded && prefs.vibration}
        onChange={(v) => update({ vibration: v })}
      />
    </GlassCard>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 py-3 cursor-pointer">
      <span>
        <span className="block text-sm font-medium text-wit-white">{label}</span>
        <span className="block text-xs text-wit-muted">{description}</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? "bg-wit-red" : "bg-wit-border"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </label>
  );
}
