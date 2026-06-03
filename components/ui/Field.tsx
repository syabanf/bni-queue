import { cn } from "@/lib/utils/cn";

const baseInput =
  "mt-1 w-full rounded-md bg-wit-black/60 border border-wit-border px-3 py-2 text-sm text-wit-white placeholder:text-wit-gray focus:outline-none focus:border-wit-red focus:ring-2 focus:ring-wit-red/30 transition-colors disabled:opacity-60";

export function Label({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "text-xs uppercase tracking-wider text-wit-muted",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Input({
  className,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(baseInput, className)} {...rest} />;
}

export function Textarea({
  className,
  ...rest
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(baseInput, "min-h-24", className)} {...rest} />;
}

export function Select({
  className,
  children,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(baseInput, "appearance-none", className)} {...rest}>
      {children}
    </select>
  );
}

/** Label + control wrapper. */
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <Label>{label}</Label>
      {children}
      {hint ? <span className="mt-1 block text-xs text-wit-gray">{hint}</span> : null}
    </label>
  );
}
