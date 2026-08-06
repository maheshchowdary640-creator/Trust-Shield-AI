import { Link, useRouterState, useRouter } from "@tanstack/react-router";
import {
  Shield,
  LayoutDashboard,
  ImageIcon,
  BriefcaseBusiness,
  Link2,
  History,
  Mic,
  ScanEye,
  User,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/components/auth-context";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/scan/screenshot", label: "Screenshot", icon: ImageIcon },
  { to: "/scan/job-offer", label: "Job Offer", icon: BriefcaseBusiness },
  { to: "/scan/url", label: "URL Trust", icon: Link2 },
  { to: "/scan/voice", label: "Voice Scam", icon: Mic },
  { to: "/scan/deepfake", label: "Deepfake", icon: ScanEye },
  { to: "/history", label: "History", icon: History },
] as const;

export function AppHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-glass-border bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-5 py-3">
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <span className="relative flex size-9 items-center justify-center rounded-xl bg-primary/15 text-primary glow-ring">
            <Shield className="size-5" />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">
            Trust<span className="text-gradient-cyber">Shield</span>{" "}
            <span className="text-xs font-mono text-muted-foreground">AI</span>
          </span>
        </Link>

        {user && (
          <nav className="hidden xl:flex items-center gap-1.5 ml-4">
            {NAV.map(({ to, label, icon: Icon }) => {
              const active = pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                    active
                      ? "bg-primary/12 text-primary"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                  }`}
                >
                  <Icon className="size-3.5" />
                  {label}
                </Link>
              );
            })}
          </nav>
        )}

        <div className="ml-auto flex items-center gap-2.5">
          {user ? (
            <div className="hidden md:flex items-center gap-3">
              <Link
                to="/profile"
                className="flex items-center gap-2 rounded-xl border border-glass-border bg-card/30 px-3.5 py-1.5 text-xs text-muted-foreground hover:border-primary/30 hover:text-foreground transition-all"
              >
                <div className="flex size-5 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <User className="size-3" />
                </div>
                <span className="max-w-[120px] truncate font-mono">{user.email}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-xl border border-danger/30 hover:bg-danger/10 px-3.5 py-1.5 text-xs text-danger transition-colors cursor-pointer"
              >
                <LogOut className="size-3.5" />
                Logout
              </button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link
                to="/login"
                className="rounded-xl border border-glass-border px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-xl bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-transform hover:scale-[1.02]"
              >
                Register
              </Link>
            </div>
          )}

          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center justify-center rounded-lg border border-glass-border p-2 text-muted-foreground hover:bg-secondary/40 hover:text-foreground xl:hidden"
            aria-label="Toggle navigation"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="grid gap-1 border-t border-glass-border bg-background/95 px-5 py-4 xl:hidden">
          {user ? (
            <>
              {NAV.map(({ to, label, icon: Icon }) => {
                const active = pathname === to;
                return (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                    }`}
                  >
                    <Icon className="size-4" />
                    {label}
                  </Link>
                );
              })}
              <div className="mt-4 border-t border-glass-border pt-4 grid gap-2">
                <Link
                  to="/profile"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary/60"
                >
                  <User className="size-4" />
                  Profile settings
                </Link>
                <button
                  onClick={() => {
                    setOpen(false);
                    handleLogout();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-danger hover:bg-danger/10 text-left"
                >
                  <LogOut className="size-4" />
                  Logout
                </button>
              </div>
            </>
          ) : (
            <div className="grid gap-2 pt-2">
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center rounded-xl border border-glass-border py-2.5 text-sm font-medium text-muted-foreground"
              >
                Login
              </Link>
              <Link
                to="/register"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground"
              >
                Register
              </Link>
            </div>
          )}
        </nav>
      )}
    </header>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col justify-between">
      <div>
        <AppHeader />
        <main className="mx-auto w-full max-w-7xl px-5 py-8">{children}</main>
      </div>
      <footer className="mx-auto w-full max-w-7xl px-5 pb-10 pt-4 text-xs text-muted-foreground border-t border-glass-border/30 mt-12">
        <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
          <span>
            TrustShield AI — automated fraud intelligence. Analysis is advisory; always verify
            independently.
          </span>
          <span>© {new Date().getFullYear()} TrustShield AI</span>
        </div>
      </footer>
    </div>
  );
}
