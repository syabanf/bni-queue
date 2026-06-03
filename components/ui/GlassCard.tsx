import { cn } from "@/lib/utils/cn";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Stronger blur + brighter edge for hero/featured tiles. */
  strong?: boolean;
  /** Animated cyan→lime gradient hairline border. */
  gradientBorder?: boolean;
  /** Neon accent glow. */
  glow?: "green" | "cyan" | "none";
}

/**
 * Glassmorphic surface — translucent, blurred, faint inner gradient. The
 * building block for the futuristic WIT look.
 */
export function GlassCard({
  strong,
  gradientBorder,
  glow = "none",
  className,
  children,
  ...rest
}: GlassCardProps) {
  return (
    <div
      className={cn(
        strong ? "glass-strong" : "glass-panel",
        "rounded-card",
        gradientBorder && "grad-border",
        glow === "green" && "glow-red",
        glow === "cyan" && "glow-red",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
