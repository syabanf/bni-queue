"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { ADMIN_NAV_GROUPS } from "@/lib/admin/nav";
import { BrandMark } from "@/components/ui/BrandMark";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

/**
 * Mobile-only admin navigation: a sticky top bar with a hamburger that opens a
 * slide-in drawer holding the same nav as the desktop sidebar. Hidden at md+.
 */
export function AdminMobileNav({
  email,
  role,
}: {
  email: string | null;
  role: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="md:hidden print:hidden">
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-wit-border glass px-4 py-3">
        <Link href="/admin/overview" onClick={() => setOpen(false)}>
          <BrandMark />
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="-mr-2 p-2 text-wit-white"
          >
            <Menu size={22} />
          </button>
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-wit-black/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85%] glass-strong flex flex-col animate-rise">
            <div className="flex items-center justify-between border-b border-wit-border px-5 py-4">
              <BrandMark />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="p-1 text-wit-muted hover:text-wit-white"
              >
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4 text-sm">
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
                        onClick={() => setOpen(false)}
                        aria-current={active ? "page" : undefined}
                        className={
                          active
                            ? "block rounded-md px-3 py-2.5 font-semibold text-wit-onred bg-wit-red"
                            : "block rounded-md px-3 py-2.5 text-wit-muted hover:bg-wit-graphite hover:text-wit-red transition-colors"
                        }
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </nav>
            <div className="border-t border-wit-border px-5 py-4 text-xs">
              <p className="text-wit-muted truncate">{email}</p>
              <p className="uppercase tracking-wider text-gradient font-semibold mt-1">
                {role.replace("_", " ")}
              </p>
              <form action="/admin/logout" method="post" className="mt-3">
                <button
                  type="submit"
                  className="text-wit-muted hover:text-wit-red transition-colors"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
