import { LoginForm } from "@/components/shared/LoginForm";
import { DevLoginShortcuts } from "@/components/shared/DevLoginShortcuts";
import { AuthShell } from "@/components/shared/AuthShell";

export const metadata = { title: "Admin Sign-in" };

export default function AdminLoginPage() {
  return (
    <AuthShell>
      <LoginForm
        surface="admin"
        title="BNI NatCon Admin"
        subtitle="Event admins, management viewers, and display operators."
      />
      <DevLoginShortcuts surface="admin" />
    </AuthShell>
  );
}
