import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ErrorPanel, GlassCard, ScanningOverlay } from "@/components/security-ui";
import { ScanResultView } from "@/components/scan-result-view";
import { scanJobOffer } from "@/lib/scans.functions";
import { AuthGuard } from "@/components/auth-guard";

export const Route = createFileRoute("/scan/job-offer")({
  head: () => ({
    meta: [
      { title: "Job Offer Verification Agent — TrustShield AI" },
      {
        name: "description",
        content:
          "Verify whether a job offer is legitimate. TrustShield AI checks the recruiter domain live and grades recruitment-fraud patterns like upfront fees and chat-only interviews.",
      },
      { property: "og:title", content: "Job Offer Verification Agent — TrustShield AI" },
      {
        property: "og:description",
        content: "Paste a job offer and recruiter email to get a fraud risk verdict in seconds.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AuthGuard>
      <JobOfferScanner />
    </AuthGuard>
  ),
});

function JobOfferScanner() {
  const run = useServerFn(scanJobOffer);
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [recruiterEmail, setRecruiterEmail] = useState("");
  const [offerText, setOfferText] = useState("");

  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (vars: {
      company?: string;
      role?: string;
      recruiterEmail?: string;
      offerText: string;
    }) => run({ data: vars }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scan-history"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.refetchQueries({ queryKey: ["dashboard-stats"] });
      queryClient.refetchQueries({ queryKey: ["scan-history"] });
    },
  });

  const tooShort = offerText.trim().length < 30;
  const errorMessage =
    mutation.error instanceof Error
      ? mutation.error.message
      : mutation.error
        ? "Scan failed."
        : null;

  const field =
    "mt-2 w-full rounded-xl border border-input bg-background/60 px-3 py-2 text-sm outline-none focus:border-primary";
  const label = "block text-xs uppercase tracking-widest text-muted-foreground";

  return (
    <AppShell>
      <header className="mb-6">
        <h1 className="font-display text-3xl">Job Offer Verification Agent</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Paste the full offer or recruiter message. We inspect the recruiter&apos;s domain live and
          score classic recruitment-fraud patterns.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard className="p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label}>Company</label>
              <input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className={field}
                placeholder="Acme Corp"
              />
            </div>
            <div>
              <label className={label}>Role</label>
              <input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className={field}
                placeholder="Data Entry Specialist"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className={label}>Recruiter email</label>
            <input
              value={recruiterEmail}
              onChange={(e) => setRecruiterEmail(e.target.value)}
              className={field}
              placeholder="hr@acme-careers.com"
            />
          </div>
          <div className="mt-4">
            <label className={label}>Offer / message text</label>
            <textarea
              value={offerText}
              onChange={(e) => setOfferText(e.target.value.slice(0, 15000))}
              rows={12}
              className={`${field} font-mono text-[13px]`}
              placeholder="Paste the complete offer letter, recruiter message or chat transcript here…"
            />
            <p className="mt-1 text-right text-xs text-muted-foreground">
              {offerText.length}/15000
            </p>
          </div>

          <button
            disabled={tooShort || mutation.isPending}
            onClick={() =>
              mutation.mutate({
                offerText: offerText.trim(),
                ...(company.trim() ? { company: company.trim() } : {}),
                ...(role.trim() ? { role: role.trim() } : {}),
                ...(recruiterEmail.trim() ? { recruiterEmail: recruiterEmail.trim() } : {}),
              })
            }
            className="mt-5 w-full rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-40"
          >
            {mutation.isPending ? "Verifying offer…" : "Verify job offer"}
          </button>
          {tooShort && offerText.length > 0 && (
            <p className="mt-2 text-xs text-caution">Add at least 30 characters of offer text.</p>
          )}
        </GlassCard>

        <div>
          {mutation.isPending && <ScanningOverlay label="Verifying recruiter and offer terms" />}
          {errorMessage && !mutation.isPending && <ErrorPanel message={errorMessage} />}
          {!!mutation.data && !mutation.isPending && <ScanResultView scan={mutation.data as any} />}
          {!mutation.isPending && !mutation.data && !errorMessage && (
            <GlassCard className="flex h-full min-h-64 items-center justify-center p-8 text-center text-sm text-muted-foreground">
              Your verification report will appear here.
            </GlassCard>
          )}
        </div>
      </div>
    </AppShell>
  );
}
