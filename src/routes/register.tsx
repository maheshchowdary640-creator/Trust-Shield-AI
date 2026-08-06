import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Mail, Lock, ArrowRight } from "lucide-react";
import { GlassCard, ErrorPanel } from "@/components/security-ui";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Register — TrustShield AI" },
      {
        name: "description",
        content: "Create a TrustShield AI account for cyber-security scan protection.",
      },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.navigate({ to: "/dashboard" });
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setSuccess(false);
    setSubmitting(true);

    try {
      const { data, error } = await (supabase.auth as any).signUp({
        email: email.trim(),
        password: password,
      });

      if (error) {
        setAuthError(error.message);
      } else {
        // If auto-confirm is enabled, it logs in; otherwise ask to confirm.
        if (data.session) {
          router.navigate({ to: "/dashboard" });
        } else {
          setSuccess(true);
        }
      }
    } catch (err) {
      setAuthError("An unexpected error occurred. Please try again.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2.5">
          <span className="relative flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary glow-ring">
            <Shield className="size-5.5" />
          </span>
          <span className="font-display text-xl font-semibold tracking-tight">
            Trust<span className="text-gradient-cyber">Shield</span>{" "}
            <span className="text-xs font-mono text-muted-foreground">AI</span>
          </span>
        </Link>

        <GlassCard className="p-8">
          <header className="mb-6 text-center">
            <h1 className="font-display text-2xl">Create Free Account</h1>
            <p className="mt-2 text-xs text-muted-foreground">
              Register to save scan reports and track threat history.
            </p>
          </header>

          {authError && (
            <div className="mb-4">
              <ErrorPanel message={authError} />
            </div>
          )}

          {success ? (
            <div className="rounded-xl border border-safe/40 bg-safe/10 p-4 text-sm text-safe text-center">
              Registration successful! Please check your email to verify your account.
              <div className="mt-4">
                <Link to="/login" className="text-xs text-primary underline">
                  Go to Login
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs uppercase tracking-widest text-muted-foreground"
                >
                  Email Address
                </label>
                <div className="relative mt-2">
                  <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full rounded-xl border border-input bg-background/60 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-xs uppercase tracking-widest text-muted-foreground"
                >
                  Password
                </label>
                <div className="relative mt-2">
                  <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-input bg-background/60 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? "Creating account…" : "Register"} <ArrowRight className="size-4" />
              </button>
            </form>
          )}

          {!success && (
            <footer className="mt-6 text-center text-xs text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </footer>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
