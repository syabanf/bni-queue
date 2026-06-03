import { headers } from "next/headers";
import { getSession } from "@/lib/auth/session";
import { ROLES } from "@/lib/auth/rbac";
import { redirect } from "next/navigation";
import { AuroraBackground } from "@/components/ui/AuroraBackground";
import { BrandMark } from "@/components/ui/BrandMark";
import { BoothNav } from "@/components/booth/BoothNav";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

/**
 * Booth PIC shell. Gates everything under `/booth/*` (except /booth/login,
 * which renders its own minimal layout because Next.js layouts compose).
 *
 * Server-side role check; defence-in-depth via RLS in supabase.
 */
export default async function BoothLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") ?? "";

  // The login route renders without the gate.
  if (pathname.startsWith("/booth/login")) {
    return <>{children}</>;
  }

  const session = await getSession();
  if (!session) {
    redirect("/booth/login");
  }
  if (session.role !== ROLES.BOOTH_PIC) {
    // Wrong role hitting /booth/* — send them somewhere sensible.
    redirect("/admin/overview");
  }

  return (
    <div className="relative min-h-screen flex flex-col text-wit-white">
      <AuroraBackground subtle />
      <header className="sticky top-0 z-30 border-b border-wit-border glass">
        <div className="px-4 py-3 flex items-center justify-between">
          <BrandMark withWordmark={false} />
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-wit-red">
                Booth PIC
              </p>
              <p className="text-xs font-semibold text-wit-white">
                {session.email ?? "—"}
              </p>
            </div>
            <ThemeToggle />
            <form action="/booth/logout" method="post">
              <button
                type="submit"
                className="text-xs text-wit-muted hover:text-wit-red transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
        <div className="px-4 pb-2">
          <BoothNav />
        </div>
      </header>
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}
