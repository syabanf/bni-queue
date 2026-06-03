import { requireRole } from "@/lib/auth/session";
import { MANAGEMENT_OR_ADMIN_ROLES } from "@/lib/auth/rbac";
import { listParticipants } from "@/lib/supabase/queries/participants";
import { PrintToolbar } from "@/components/admin/PrintToolbar";

export const metadata = { title: "Print QR Badges · Admin" };
export const dynamic = "force-dynamic";

export default async function PrintBadgesPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  await requireRole(MANAGEMENT_OR_ADMIN_ROLES);
  const { code } = await searchParams;

  let rows = await listParticipants();
  if (code) rows = rows.filter((p) => p.code === code);

  return (
    <section className="px-4 py-6 md:px-8 md:py-8">
      <PrintToolbar count={rows.length} />

      {/* Badge sheet — always light so it prints cleanly in any theme. */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 print:grid-cols-3 print:gap-3">
        {rows.map((p) => (
          <div
            key={p.id}
            className="break-inside-avoid rounded-xl border border-slate-200 bg-white p-4 text-center text-slate-900 shadow-sm"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-rose-600">
              BNI NatCon
            </p>
            <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400 mb-2">
              Digital Passport
            </p>
            <div className="mx-auto w-fit rounded-lg bg-white p-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/qr/${encodeURIComponent(p.code)}`}
                alt={`QR for ${p.name}`}
                width={150}
                height={150}
                className="h-[150px] w-[150px]"
              />
            </div>
            <p className="mt-2 font-bold leading-tight">{p.name}</p>
            <p className="text-xs text-slate-500">
              {p.chapterName} · {p.cityName}
            </p>
            <p className="mt-1 text-[11px] font-mono text-slate-400">{p.code}</p>
          </div>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-wit-muted">No participants to print.</p>
      ) : null}
    </section>
  );
}
