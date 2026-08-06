import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BriefcaseBusiness,
  ImageIcon,
  Link2,
  Radar,
  ScanEye,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { GlassCard } from "@/components/security-ui";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TrustShield AI — Detect Scams, Fake Job Offers & Risky Links" },
      {
        name: "description",
        content:
          "TrustShield AI scans screenshots, job offers and URLs with live threat intelligence and returns a trust score, risk level and recommended action in seconds.",
      },
      { property: "og:title", content: "TrustShield AI — AI-Powered Scam Detection Platform" },
      {
        property: "og:description",
        content:
          "Upload a screenshot, paste a job offer or check a URL. Get a real trust score backed by live domain intelligence and AI fraud analysis.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const TOOLS = [
  {
    to: "/scan/screenshot",
    icon: ImageIcon,
    title: "Screenshot Scam Detector",
    body: "Drop a screenshot of any message, invoice or login page. Vision analysis flags impersonation, urgency traps and spoofed branding.",
  },
  {
    to: "/scan/job-offer",
    icon: BriefcaseBusiness,
    title: "Job Offer Verification",
    body: "Paste an offer and recruiter email. We check the domain live and grade recruitment-fraud patterns like upfront fees and chat-only interviews.",
  },
  {
    to: "/scan/url",
    icon: Link2,
    title: "URL Trust Analyzer",
    body: "Live fetch, redirect tracing and RDAP registration lookup combine into a domain trust verdict you can act on.",
  },
] as const;

function Landing() {
  return (
    <AppShell>
      <section className="relative overflow-hidden rounded-3xl border border-glass-border grid-backdrop px-6 py-16 text-center sm:px-12 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-primary">
            <Sparkles className="size-3.5" /> Live threat intelligence
          </span>
          <h1 className="mt-6 font-display text-4xl leading-[1.05] sm:text-6xl">
            Know what&apos;s a scam
            <br />
            <span className="text-gradient-cyber">before it costs you.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
            TrustShield AI inspects screenshots, job offers and links against real domain
            intelligence and fraud heuristics — then returns a trust score, risk level and the exact
            action to take.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link
              to="/scan/url"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground glow-ring transition-transform hover:scale-[1.03]"
            >
              Run a free scan <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl border border-glass-border px-6 py-3 text-sm font-medium transition-colors hover:bg-secondary/60"
            >
              View dashboard
            </Link>
          </div>
        </motion.div>
      </section>

      <section className="mt-8 grid gap-5 md:grid-cols-3">
        {TOOLS.map((tool, i) => (
          <motion.div
            key={tool.to}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i, duration: 0.45 }}
          >
            <Link to={tool.to} className="block h-full">
              <GlassCard className="h-full p-6 transition-transform hover:-translate-y-1">
                <tool.icon className="size-6 text-primary" />
                <h2 className="mt-4 font-display text-lg">{tool.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{tool.body}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary">
                  Start scan <ArrowRight className="size-3.5" />
                </span>
              </GlassCard>
            </Link>
          </motion.div>
        ))}
      </section>

      <section className="mt-8 grid gap-5 sm:grid-cols-3">
        {[
          {
            icon: Radar,
            t: "Live evidence",
            d: "Every URL scan performs a real HTTP fetch, redirect trace and RDAP registration lookup.",
          },
          {
            icon: ScanEye,
            t: "Vision analysis",
            d: "Screenshots are read pixel-and-text for spoofed brands, fake handles and pressure language.",
          },
          {
            icon: ShieldCheck,
            t: "Auditable history",
            d: "Every scan is stored with its findings so you can revisit and share the full report.",
          },
        ].map((f) => (
          <GlassCard key={f.t} className="p-6">
            <f.icon className="size-5 text-accent" />
            <h3 className="mt-3 font-display text-base">{f.t}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{f.d}</p>
          </GlassCard>
        ))}
      </section>
    </AppShell>
  );
}
