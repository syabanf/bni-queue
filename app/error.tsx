"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-wit-black text-wit-white px-6 text-center">
      <p className="text-xs uppercase tracking-[0.2em] text-wit-red">
        Something broke
      </p>
      <h1 className="mt-2 text-2xl font-bold">An unexpected error occurred</h1>
      <p className="mt-2 text-sm text-wit-muted max-w-md">
        {error.message || "Please try again. If it persists, contact the event admin."}
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-md bg-wit-red text-wit-white font-bold px-5 py-2.5 hover:bg-wit-red-bright glow-red transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
