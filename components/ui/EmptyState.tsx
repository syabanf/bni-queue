import { GlassCard } from "./GlassCard";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <GlassCard className="p-10 text-center">
      <p className="text-wit-white font-semibold">{title}</p>
      {description ? (
        <p className="mt-1 text-sm text-wit-muted max-w-md mx-auto">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </GlassCard>
  );
}
