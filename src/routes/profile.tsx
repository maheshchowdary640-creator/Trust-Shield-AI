import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/components/auth-context";
import { AuthGuard } from "@/components/auth-guard";
import { AppShell } from "@/components/app-shell";
import { GlassCard } from "@/components/security-ui";
import { ShieldCheck, Mail, Calendar, Key, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — TrustShield AI" },
      {
        name: "description",
        content: "View your TrustShield AI user profile and session settings.",
      },
    ],
  }),
  component: () => (
    <AuthGuard>
      <ProfilePage />
    </AuthGuard>
  ),
});

function ProfilePage() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <AppShell>
      <header className="mb-6">
        <h1 className="font-display text-3xl">User Profile</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage your credentials and view account information.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        <GlassCard className="p-6 text-center md:col-span-1">
          <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-primary/15 text-primary">
            <span className="font-display text-3xl font-semibold">
              {user.email?.[0].toUpperCase() ?? "U"}
            </span>
          </div>
          <h2 className="mt-4 font-display text-lg">{user.email}</h2>
          <p className="text-xs font-mono text-muted-foreground mt-1">ID: {user.id}</p>
          <button
            onClick={() => logout()}
            className="mt-6 w-full rounded-xl bg-destructive px-4 py-2.5 text-sm font-medium text-destructive-foreground hover:bg-destructive/95"
          >
            Log out
          </button>
        </GlassCard>

        <div className="grid gap-4 md:col-span-2">
          <GlassCard className="p-6">
            <h3 className="font-display text-base font-semibold text-primary flex items-center gap-2">
              <ShieldCheck className="size-4" /> Account Details
            </h3>
            <ul className="mt-4 divide-y divide-glass-border">
              <li className="flex items-center justify-between py-3">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Mail className="size-4" /> Email Address
                </span>
                <span className="text-sm font-mono">{user.email}</span>
              </li>
              <li className="flex items-center justify-between py-3">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="size-4" /> Account Created
                </span>
                <span className="text-sm">
                  {user.created_at
                    ? new Date(user.created_at).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "N/A"}
                </span>
              </li>
              <li className="flex items-center justify-between py-3">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Key className="size-4" /> Authentication Provider
                </span>
                <span className="text-sm capitalize font-mono">
                  {user.app_metadata?.provider ?? "email"}
                </span>
              </li>
            </ul>
          </GlassCard>

          <GlassCard className="p-6 border-danger/30 bg-danger/5">
            <h3 className="font-display text-base font-semibold text-danger flex items-center gap-2">
              <ShieldAlert className="size-4" /> Security Notice
            </h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Your scan history and uploaded media are associated with your account credentials.
              Please ensure you keep your password secure and do not share your login details with
              anyone.
            </p>
          </GlassCard>
        </div>
      </div>
    </AppShell>
  );
}
