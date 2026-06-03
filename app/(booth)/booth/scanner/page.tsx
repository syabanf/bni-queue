import { requireBoothPic } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDevSession } from "@/lib/auth/dev-session";
import {
  getBoothById,
  getBoothDailyStats,
} from "@/lib/supabase/queries/booth";
import { ScannerClient } from "@/components/scanner/ScannerClient";
import { DEV_USERS } from "@/lib/dev/mock-data";

export const metadata = { title: "Booth Scanner" };
export const dynamic = "force-dynamic";

export default async function ScannerPage() {
  const session = await requireBoothPic();

  if (session.boothIds.length === 0) {
    return (
      <div className="px-6 py-12 max-w-md mx-auto text-center">
        <h1 className="text-xl font-bold text-wit-white">No booth assigned</h1>
        <p className="text-wit-muted mt-3 text-sm">
          Your account is set up as a Booth PIC but no booth is assigned yet.
          Ask the event admin to assign you in /admin/booths.
        </p>
      </div>
    );
  }

  // MVP: use the first assigned booth. Multi-booth switching can come later.
  const boothId = session.boothIds[0]!;

  const [booth, stats, profile] = await Promise.all([
    getBoothById(boothId),
    getBoothDailyStats(boothId),
    fetchProfile(session.userId),
  ]);

  if (!booth) {
    return (
      <div className="px-6 py-12 max-w-md mx-auto text-center">
        <h1 className="text-xl font-bold text-wit-white">Booth not found</h1>
        <p className="text-wit-muted mt-3 text-sm">
          Your assigned booth was deleted or deactivated. Ask the event admin to
          reassign you.
        </p>
      </div>
    );
  }

  return (
    <ScannerClient
      boothId={booth.id}
      boothName={booth.name}
      boothCode={booth.code}
      pic={{ name: profile.name, email: session.email }}
      initialStats={stats}
    />
  );
}

async function fetchProfile(userId: string): Promise<{ name: string | null }> {
  const dev = await getDevSession();
  if (dev) {
    return { name: DEV_USERS.booth_pic.name };
  }
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("users")
    .select("name")
    .eq("id", userId)
    .maybeSingle();
  return { name: ((data as { name: string } | null)?.name) ?? null };
}
