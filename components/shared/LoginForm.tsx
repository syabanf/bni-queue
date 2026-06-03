"use client";

import { useActionState } from "react";
import { signInWithPassword, type SignInResult } from "@/lib/auth/actions";
import { GlassCard } from "@/components/ui/GlassCard";

interface LoginFormProps {
  surface: "booth" | "admin";
  title: string;
  subtitle: string;
}

const initial: SignInResult = { ok: false };

export function LoginForm({ surface, title, subtitle }: LoginFormProps) {
  const [state, action, pending] = useActionState(signInWithPassword, initial);

  return (
    <GlassCard strong gradientBorder className="p-8">
      <form action={action} className="space-y-4">
        <input type="hidden" name="surface" value={surface} />
        <div>
          <h2 className="text-xl font-bold text-wit-white">{title}</h2>
          <p className="text-sm text-wit-muted mt-1">{subtitle}</p>
        </div>

        <label className="block">
          <span className="text-xs uppercase tracking-wider text-wit-muted">
            Email
          </span>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="you@bni.id"
            className="mt-1 w-full rounded-md bg-wit-black/60 border border-wit-border px-3 py-2 text-wit-white placeholder:text-wit-gray focus:outline-none focus:border-wit-red focus:ring-2 focus:ring-wit-red/30 transition-colors"
          />
        </label>

        <label className="block">
          <span className="text-xs uppercase tracking-wider text-wit-muted">
            Password
          </span>
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className="mt-1 w-full rounded-md bg-wit-black/60 border border-wit-border px-3 py-2 text-wit-white placeholder:text-wit-gray focus:outline-none focus:border-wit-red focus:ring-2 focus:ring-wit-red/30 transition-colors"
          />
        </label>

        {state?.error ? (
          <p
            role="alert"
            className="rounded-md bg-state-invalid-bg text-wit-red text-sm px-3 py-2 border border-wit-red/40"
          >
            {state.error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-wit-red text-wit-white font-bold py-2.5 hover:bg-wit-red-bright disabled:opacity-60 transition-colors glow-red"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </GlassCard>
  );
}
