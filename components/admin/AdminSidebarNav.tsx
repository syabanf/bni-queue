"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV_GROUPS } from "@/lib/admin/nav";
import { cn } from "@/lib/utils/cn";

/**
 * Desktop sidebar navigation. Client component so the active highlight tracks
 * the current route via usePathname() — the server layout doesn't re-render on
 * client-side navigation, which previously froze the marker on the first page.
 */
export function AdminSidebarNav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5 text-sm">
      {ADMIN_NAV_GROUPS.map((group, gi) => (
        <div key={group.title ?? `g-${gi}`} className="space-y-1">
          {group.title ? (
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-wit-muted/60">
              {group.title}
            </p>
          ) : null}
          {group.items.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative block rounded-md px-3 py-2 transition-colors",
                  active
                    ? "bg-wit-red font-semibold text-wit-onred"
                    : "text-wit-muted hover:bg-wit-graphite hover:text-wit-red",
                )}
              >
                {active ? (
                  <span className="absolute left-0 inset-y-1.5 w-1 rounded-r-full bg-wit-white/80" />
                ) : null}
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
