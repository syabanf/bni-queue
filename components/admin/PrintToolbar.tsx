"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";

/**
 * Screen-only toolbar for the badge print page (hidden when printing).
 */
export function PrintToolbar({ count }: { count: number }) {
  return (
    <div className="print:hidden mb-6 flex items-center justify-between gap-3">
      <div>
        <Link
          href="/admin/participants"
          className="text-sm text-wit-muted hover:text-wit-red transition-colors"
        >
          ← Back to directory
        </Link>
        <p className="text-sm text-wit-muted mt-1">
          {count} badge{count === 1 ? "" : "s"} ready. Use your browser print
          dialog to save as PDF or print.
        </p>
      </div>
      <Button onClick={() => window.print()}>Print / Save PDF</Button>
    </div>
  );
}
