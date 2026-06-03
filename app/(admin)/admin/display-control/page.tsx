import { requireRole } from "@/lib/auth/session";
import { ROLES } from "@/lib/auth/rbac";

export const metadata = { title: "Display Control" };

/**
 * Display control placeholder for Display Operator role. Week 6 fills in the
 * mode/rotation/announcement/winner controls backed by `display_settings`.
 */
export default async function DisplayControlPage() {
  const session = await requireRole([
    ROLES.SUPER_ADMIN,
    ROLES.EVENT_ADMIN,
    ROLES.DISPLAY_OPERATOR,
  ]);

  return (
    <section className="px-4 py-6 md:px-8 md:py-8">
      <p className="text-xs uppercase tracking-wider text-wit-muted">
        Display Control
      </p>
      <h1 className="text-2xl font-bold text-wit-white mt-1">
        LED Screen Control
      </h1>
      <p className="text-sm text-wit-muted mt-2">
        Signed in as {session.email}. Controls ship in week 6.
      </p>
    </section>
  );
}
