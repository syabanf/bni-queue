export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-wit-black">
      <div className="flex flex-col items-center gap-3">
        <span className="h-10 w-10 rounded-full border-2 border-wit-border border-t-wit-red animate-spin" />
        <p className="text-xs uppercase tracking-[0.2em] text-wit-muted">
          Loading…
        </p>
      </div>
    </div>
  );
}
