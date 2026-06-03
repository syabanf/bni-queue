import { GlowOrb } from "@/components/ui/GlowOrb";

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  /** Optional gradient-highlighted leading word. */
  titleAccent?: string;
  description?: string;
  actions?: React.ReactNode;
}

/**
 * Standard admin page header: eyebrow + (gradient accent) title + description,
 * with an optional actions slot (e.g. a "New" button) on the right.
 */
export function PageHeader({
  eyebrow,
  title,
  titleAccent,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <header className="relative mb-6 flex items-start justify-between gap-4">
      <div className="relative">
        <GlowOrb color="cyan" className="-top-8 -left-4 h-28 w-28 opacity-60" />
        <p className="text-xs uppercase tracking-[0.2em] text-wit-red">
          {eyebrow}
        </p>
        <h1 className="mt-1 text-2xl md:text-3xl font-extrabold tracking-tight">
          {titleAccent ? (
            <>
              <span className="text-gradient">{titleAccent}</span>{" "}
            </>
          ) : null}
          <span className="text-wit-white">{title}</span>
        </h1>
        {description ? (
          <p className="mt-1.5 text-sm text-wit-muted max-w-2xl">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="shrink-0 flex gap-2">{actions}</div> : null}
    </header>
  );
}
