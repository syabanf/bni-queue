import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { ROLES, isManagementOrAdmin } from "@/lib/auth/rbac";
import { AuroraBackground } from "@/components/ui/AuroraBackground";
import { BrandMark } from "@/components/ui/BrandMark";
import { AdminMobileNav } from "@/components/admin/AdminMobileNav";
import { AdminSidebarNav } from "@/components/admin/AdminSidebarNav";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") ?? "";

  if (pathname.startsWith("/admin/login")) {
    return <>{children}</>;
  }

  const session = await getSession();
  if (!session) {
    redirect("/admin/login");
  }

  // Display Operator only gets /admin/display-control.
  if (session.role === ROLES.DISPLAY_OPERATOR) {
    if (!pathname.startsWith("/admin/display-control")) {
      redirect("/admin/display-control");
    }
  } else if (!isManagementOrAdmin(session.role)) {
    redirect("/booth/scanner");
  }

  return (
    <div className="relative min-h-screen md:flex text-wit-white">
      <AuroraBackground subtle />

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-wit-border glass print:!hidden">
        <div className="px-5 py-5 border-b border-wit-border">
          <BrandMark />
        </div>
        <AdminSidebarNav />
        <div className="border-t border-wit-border px-5 py-4 text-xs">
          <p className="text-wit-muted truncate">{session.email}</p>
          <p className="uppercase tracking-wider text-gradient font-semibold mt-1">
            {session.role.replace("_", " ")}
          </p>
          <div className="mt-3 flex items-center justify-between">
            <form action="/admin/logout" method="post">
              <button
                type="submit"
                className="text-wit-muted hover:text-wit-red transition-colors"
              >
                Sign out
              </button>
            </form>
            <ThemeToggle className="-mr-1" />
          </div>
        </div>
      </aside>

      {/* Content column (mobile top bar + page) */}
      <div className="flex-1 min-w-0 flex flex-col">
        <AdminMobileNav email={session.email} role={session.role} />
        <main className="flex-1 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
