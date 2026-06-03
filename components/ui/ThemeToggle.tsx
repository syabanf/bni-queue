"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * Light/dark theme toggle. Flips `html.light` and persists to localStorage.
 * The initial class is set pre-paint by the inline script in the root layout,
 * so this just reflects + updates it.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const [light, setLight] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setLight(document.documentElement.classList.contains("light"));
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  function toggle() {
    const next = !light;
    document.documentElement.classList.toggle("light", next);
    try {
      localStorage.setItem("bni-theme", next ? "light" : "dark");
    } catch {
      /* ignore */
    }
    setLight(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={light ? "Switch to dark mode" : "Switch to light mode"}
      title={light ? "Dark mode" : "Light mode"}
      className={cn(
        "inline-flex items-center justify-center rounded-md p-2 text-wit-muted hover:text-wit-red hover:bg-wit-graphite transition-colors",
        className,
      )}
    >
      {light ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
}
