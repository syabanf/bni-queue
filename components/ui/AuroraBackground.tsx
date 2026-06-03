import { cn } from "@/lib/utils/cn";

interface AuroraBackgroundProps {
  className?: string;
  /** Dims the blobs for content-dense surfaces like admin tables. */
  subtle?: boolean;
}

/**
 * Fixed, decorative aurora/gradient-mesh background. Cyan + lime blobs drifting
 * over near-black, plus a faint dot grid. Purely cosmetic (aria-hidden), sits
 * behind everything via negative z-index.
 */
export function AuroraBackground({ className, subtle }: AuroraBackgroundProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-wit-black",
        className,
      )}
    >
      {/* Dot grid */}
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.10) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
        }}
      />
      {/* Aurora blobs */}
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
      {/* Vignette to keep edges deep black without smothering the blobs */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(130% 100% at 50% 10%, transparent 55%, rgba(10,10,15,0.72) 100%)",
        }}
      />
    </div>
  );
}
