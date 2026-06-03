import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-wit-red text-wit-onred font-bold hover:bg-wit-red-bright glow-red",
  secondary:
    "glass border border-wit-border text-wit-white hover:border-wit-red hover:text-wit-red",
  danger: "bg-wit-red text-wit-onred font-semibold hover:bg-wit-red/90",
  ghost: "text-wit-muted hover:text-wit-white hover:bg-wit-graphite",
};

const SIZES: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2.5 text-sm",
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(
        "rounded-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    />
  );
}
