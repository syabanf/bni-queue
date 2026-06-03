import { cn } from "@/lib/utils/cn";

interface AuroraBackgroundProps {
  className?: string;
  /** Dims the blobs for content-dense surfaces like admin tables. */
  subtle?: boolean;
}

/**
 * Fixed, decorative aurora/gradient-mesh background. Red + maroon blobs drifting
 * over the page base, plus a faint dot grid. Theme-aware: the dot color, edge
 * veil, and blob intensity read from CSS vars that flip in light mode.
 * Purely cosmetic (aria-hidden), sits behind everything via negative z-index.
 */
export function AuroraBackground({ className, subtle }: AuroraBackgroundProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-wit-black print:hidden",
        className,
      )}
    >
      {/* Dot grid */}
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "radial-gradient(circle, var(--aurora-dot) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
        }}
      />
      {/* Aurora blobs (dimmed in light mode via --aurora-blob-opacity) */}
      <div
        className="absolute inset-0"
        style={{ opacity: "var(--aurora-blob-opacity)" }}
      >
        <div
          className={cn(
            "absolute -top-40 -left-32 h-[42rem] w-[42rem] rounded-full blur-3xl animate-aurora",
            subtle ? "opacity-25" : "opacity-60",
          )}
          style={{
            background:
              "radial-gradient(circle at 30% 30%, rgba(245,51,61,0.5), transparent 60%)",
          }}
        />
        <div
          className={cn(
            "absolute top-1/3 -right-40 h-[40rem] w-[40rem] rounded-full blur-3xl animate-aurora-slow",
            subtle ? "opacity-20" : "opacity-50",
          )}
          style={{
            background:
              "radial-gradient(circle at 50% 50%, rgba(123,26,34,0.6), transparent 60%)",
          }}
        />
        <div
          className={cn(
            "absolute -bottom-48 left-1/4 h-[38rem] w-[38rem] rounded-full blur-3xl animate-aurora",
            subtle ? "opacity-15" : "opacity-40",
          )}
          style={{
            background:
              "radial-gradient(circle at 50% 50%, rgba(200,30,40,0.45), transparent 60%)",
          }}
        />
      </div>
      {/* Edge veil — darkens (dark) or lightens (light) the corners */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(130% 100% at 50% 10%, transparent 55%, var(--aurora-veil) 100%)",
        }}
      />
    </div>
  );
}
