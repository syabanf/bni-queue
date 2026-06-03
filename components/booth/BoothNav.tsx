"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const LINKS = [
  { href: "/booth/scanner", label: "Scan" },
  { href: "/booth/my-visitors", label: "Visitors" },
  { href: "/booth/scan-history", label: "History" },
  { href: "/booth/profile", label: "Profile" },
];

export function BoothNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1">
      {LINKS.map((l) => {
        const active = pathname === l.href;
        return (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
              active
                ? "bg-wit-red text-wit-onred"
                : "text-wit-muted hover:text-wit-red hover:bg-wit-graphite",
            )}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
