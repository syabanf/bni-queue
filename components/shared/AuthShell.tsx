import { AuroraBackground } from "@/components/ui/AuroraBackground";
import { GlowOrb } from "@/components/ui/GlowOrb";
import { BrandMark } from "@/components/ui/BrandMark";

/**
 * Full-screen auth backdrop: aurora mesh + a glowing brand lockup above a glass
 * card slot. Shared by /booth/login and /admin/login.
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-10">
      <AuroraBackground />

      <div className="relative mb-8 flex flex-col items-center text-center">
        <GlowOrb color="cyan" className="-top-6 left-1/2 h-32 w-32 -translate-x-1/2" />
        <BrandMark className="flex-col gap-3 [&>span:last-child]:text-center" withWordmark={false} />
        <h1 className="mt-4 text-2xl font-bold tracking-tight">
          <span className="text-gradient">BNI NatCon</span>
          <span className="text-wit-white"> Digital Passport</span>
        </h1>
        <p className="mt-1 text-sm text-wit-muted">
          Real-time stamp, leaderboard & raffle platform
        </p>
      </div>

      <div className="relative z-10 w-full max-w-sm animate-rise">{children}</div>

      <p className="relative mt-8 text-xs text-wit-muted/70">
        Powered by <span className="text-gradient font-semibold">WIT.ID</span>
      </p>
    </div>
  );
}
