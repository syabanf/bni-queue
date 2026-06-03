import Link from "next/link";
import { headers } from "next/headers";
import { AuroraBackground } from "@/components/ui/AuroraBackground";
import { BrandMark } from "@/components/ui/BrandMark";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

/**
 * Public layout shell — no auth, futuristic dark glass theme, masked data only.
 * The LED display (`/leaderboard/display`) renders chrome-free / fullscreen.
 */
export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = (await headers()).get("x-pathname") ?? "";
  if (pathname.startsWith("/leaderboard/display")) {
    return <>{children}</>;
  }

  return (
    <div className="relative min-h-screen flex flex-col text-wit-white">
      <AuroraBackground />
      <header className="sticky top-0 z-30 border-b border-wit-border glass">
        <div className="mx-auto max-w-7xl px-6 py-3 flex items-center justify-between">
          <Link href="/leaderboard">
            <BrandMark />
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            {[
              { href: "/leaderboard", label: "Leaderboard" },
              { href: "/booths", label: "Booths" },
              { href: "/raffle-status", label: "Raffle" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-1.5 text-wit-muted hover:text-wit-red hover:bg-wit-graphite transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <ThemeToggle className="ml-1" />
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-wit-border text-xs text-wit-muted">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <span>BNI National Conference</span>
          <span>
            Powered by{" "}
            <span className="text-gradient font-semibold">WIT.ID</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
