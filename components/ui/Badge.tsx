import { cn } from "@/lib/utils/cn";

export type BadgeTone =
  | "success"
  | "duplicate"
  | "invalid"
  | "qualified"
  | "pending"
  | "active"
  | "inactive"
  | "info"
  | "neutral";

// Mirrors spec §15.9 badge palette plus a couple of extras.
const TONES: Record<BadgeTone, string> = {
  success: "bg-state-success-bg text-wit-success",
  duplicate: "bg-state-duplicate-bg text-wit-orange",
  invalid: "bg-state-invalid-bg text-wit-red",
  qualified: "bg-state-qualified-bg text-wit-red",
  pending: "bg-state-duplicate-bg text-wit-orange",
  active: "bg-state-success-bg text-wit-success",
  inactive: "bg-state-inactive-bg text-wit-muted",
  info: "bg-wit-red/10 text-wit-red",
  neutral: "bg-wit-graphite text-wit-muted",
};

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: BadgeTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium uppercase tracking-wider",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
