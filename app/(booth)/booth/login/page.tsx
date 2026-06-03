import { LoginForm } from "@/components/shared/LoginForm";
import { DevLoginShortcuts } from "@/components/shared/DevLoginShortcuts";
import { AuthShell } from "@/components/shared/AuthShell";

export const metadata = { title: "Booth PIC Sign-in" };

export default function BoothLoginPage() {
  return (
    <AuthShell>
      <LoginForm
        surface="booth"
        title="Booth PIC Sign-in"
        subtitle="Use the credentials provided by the event admin."
      />
      <DevLoginShortcuts surface="booth" />
    </AuthShell>
  );
}
