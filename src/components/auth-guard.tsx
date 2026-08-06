import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";
import { useAuth } from "./auth-context";
import { Shield } from "lucide-react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.navigate({ to: "/login" });
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <div className="relative flex size-20 items-center justify-center rounded-full border border-primary/20 bg-primary/5 text-primary glow-ring [animation:pulse-ring_1.6s_ease-in-out_infinite]">
          <Shield className="size-10" />
        </div>
        <p className="mt-6 font-display text-lg tracking-wide text-foreground">
          Verifying secure session…
        </p>
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          checking client token · decrypting claims
        </p>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
}
