import { devAuthEnabled } from "@/lib/auth/dev-session";
import { devSignInAs } from "@/lib/auth/dev-actions";
import { ROLES, type UserRole } from "@/lib/auth/rbac";
import { GlassCard } from "@/components/ui/GlassCard";

interface DevLoginShortcutsProps {
  surface: "booth" | "admin";
}

interface ShortcutDef {
  role: UserRole;
  label: string;
}

const BOOTH_SHORTCUTS: ShortcutDef[] = [
  { role: ROLES.BOOTH_PIC, label: "Sign in as Booth PIC" },
];

const ADMIN_SHORTCUTS: ShortcutDef[] = [
  { role: ROLES.SUPER_ADMIN, label: "Sign in as Super Admin" },
  { role: ROLES.EVENT_ADMIN, label: "Sign in as Event Admin" },
  { role: ROLES.MANAGEMENT_VIEWER, label: "Sign in as Management Viewer" },
  { role: ROLES.DISPLAY_OPERATOR, label: "Sign in as Display Operator" },
];

/**
 * Dev shortcut buttons under each login form. Rendered only when
 * BNI_DEV_AUTH=true (server-side); in prod builds the entire panel is gone.
 */
export function DevLoginShortcuts({ surface }: DevLoginShortcutsProps) {
  if (!devAuthEnabled()) return null;
  const shortcuts = surface === "booth" ? BOOTH_SHORTCUTS : ADMIN_SHORTCUTS;

  return (
    <GlassCard className="mt-4 p-5 space-y-3 border-dashed">
      <div>
        <p className="text-xs uppercase tracking-wider text-wit-orange font-bold">
          Dev shortcut
        </p>
        <p className="text-xs text-wit-muted mt-1">
          Bypasses Supabase. Shown because{" "}
          <code className="text-wit-red">BNI_DEV_AUTH=true</code>.
        </p>
      </div>
      <div className="space-y-2">
        {shortcuts.map((s) => (
          <form key={s.role} action={devSignInAs.bind(null, s.role)}>
            <button
              type="submit"
              className="w-full rounded-md bg-wit-black/40 border border-wit-border text-wit-white text-sm font-semibold py-2 hover:border-wit-red hover:text-wit-red transition-colors"
            >
              {s.label}
            </button>
          </form>
        ))}
      </div>
    </GlassCard>
  );
}
