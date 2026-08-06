import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Globe } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ErrorPanel, GlassCard, ScanningOverlay } from "@/components/security-ui";
import { ScanResultView } from "@/components/scan-result-view";
import { scanUrl } from "@/lib/scans.functions";
import { AuthGuard } from "@/components/auth-guard";

export const Route = createFileRoute("/scan/url")({
  head: () => ({
    meta: [
      { title: "URL Trust Analyzer — TrustShield AI" },
      {
        name: "description",
        content:
          "Check any link before you click. TrustShield AI performs a live fetch, redirect trace and domain registration lookup to score URL trustworthiness.",
      },
      { property: "og:title", content: "URL Trust Analyzer — TrustShield AI" },
      {
        property: "og:description",
        content: "Live domain intelligence and AI risk scoring for any suspicious link.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AuthGuard>
      <UrlScanner />
    </AuthGuard>
  ),
});

function UrlScanner() {
  const run = useServerFn(scanUrl);
  const queryClient = useQueryClient();
  const [url, setUrl] = useState("");

  const mutation = useMutation({
    mutationFn: (u: string) => run({ data: { url: u } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scan-history"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
  const errorMessage =
    mutation.error instanceof Error
      ? mutation.error.message
      : mutation.error
        ? "Scan failed."
        : null;

  const intel = (mutation.data as any)?.details as
    | {
        hostname?: string;
        httpStatus?: number | null;
        domainCreated?: string | null;
        domainAgeDays?: number | null;
        registrar?: string | null;
        protocol?: string;
        finalUrl?: string | null;
      }
    | undefined;

  return (
    <AppShell>
      <header className="mb-6">
        <h1 className="font-display text-3xl">URL Trust Analyzer</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          We fetch the link live, follow redirects, look up domain registration via RDAP and score
          the result. Nothing is clicked on your device.
        </p>
      </header>

      <GlassCard className="p-5">
        <form
          className="flex flex-col gap-3 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            if (url.trim().length > 2) mutation.mutate(url.trim());
          }}
        >
          <div className="relative flex-1">
            <Globe className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="secure-login-verify.example.com"
              className="w-full rounded-xl border border-input bg-background/60 py-3 pl-10 pr-3 text-sm outline-none focus:border-primary"
            />
          </div>
          <button
            type="submit"
            disabled={url.trim().length < 3 || mutation.isPending}
            className="rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-40"
          >
            {mutation.isPending ? "Scanning…" : "Analyze URL"}
          </button>
        </form>
      </GlassCard>

      <div className="mt-6 grid gap-6">
        {mutation.isPending && (
          <ScanningOverlay label="Resolving host, redirects and registration data" />
        )}
        {errorMessage && !mutation.isPending && <ErrorPanel message={errorMessage} />}
        {!!mutation.data && !mutation.isPending && (
          <>
            <ScanResultView scan={mutation.data as any} />
            <GlassCard className="p-6">
              <h3 className="font-display text-sm uppercase tracking-[0.18em] text-muted-foreground">
                Live technical evidence
              </h3>
              <dl className="mt-4 grid gap-4 sm:grid-cols-3">
                {[
                  ["Hostname", intel?.hostname ?? "—"],
                  ["Protocol", intel?.protocol ?? "—"],
                  [
                    "HTTP status",
                    intel?.httpStatus != null ? String(intel.httpStatus) : "unreachable",
                  ],
                  [
                    "Domain registered",
                    intel?.domainCreated
                      ? new Date(intel.domainCreated).toLocaleDateString()
                      : "unknown",
                  ],
                  [
                    "Domain age",
                    intel?.domainAgeDays != null ? `${intel.domainAgeDays} days` : "unknown",
                  ],
                  ["Registrar", intel?.registrar ?? "unknown"],
                ].map(([k, v]) => (
                  <div
                    key={k as string}
                    className="rounded-xl border border-glass-border bg-card/40 p-4"
                  >
                    <dt className="text-xs uppercase tracking-widest text-muted-foreground">{k}</dt>
                    <dd className="mt-1 break-words font-mono text-sm">{v}</dd>
                  </div>
                ))}
              </dl>
            </GlassCard>
          </>
        )}
      </div>
    </AppShell>
  );
}
