import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ErrorPanel, GlassCard, RiskBadge } from "@/components/security-ui";
import { listScans } from "@/lib/scans.functions";
import { SCAN_TYPE_LABELS, type ScanRecord } from "@/lib/scan-types";
import { AuthGuard } from "@/components/auth-guard";
import { Calendar, AlertTriangle, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Scan History — TrustShield AI" },
      {
        name: "description",
        content:
          "Browse every screenshot, job offer, URL, voice call, and deepfake scan with its trust score, risk level and full findings report.",
      },
      { property: "og:title", content: "Scan History — TrustShield AI" },
      {
        property: "og:description",
        content: "A complete audit trail of every security scan you have run.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AuthGuard>
      <HistoryPage />
    </AuthGuard>
  ),
});

const TYPE_FILTERS = [
  { key: "all", label: "All Modules" },
  { key: "screenshot", label: "Screenshots" },
  { key: "job_offer", label: "Job Offers" },
  { key: "url", label: "URLs" },
  { key: "voice", label: "Voice Scams" },
  { key: "deepfake", label: "Deepfakes" },
] as const;

const RISK_FILTERS = [
  { key: "all", label: "All Risks" },
  { key: "safe", label: "Safe" },
  { key: "low", label: "Low" },
  { key: "medium", label: "Medium" },
  { key: "high", label: "High" },
  { key: "critical", label: "Critical" },
] as const;

const DATE_FILTERS = [
  { key: "all", label: "All Time" },
  { key: "today", label: "Today" },
  { key: "week", label: "Last 7 Days" },
  { key: "month", label: "Last 30 Days" },
] as const;

function HistoryPage() {
  const fetchScans = useServerFn(listScans);
  const [typeFilter, setTypeFilter] = useState<(typeof TYPE_FILTERS)[number]["key"]>("all");
  const [riskFilter, setRiskFilter] = useState<(typeof RISK_FILTERS)[number]["key"]>("all");
  const [dateFilter, setDateFilter] = useState<(typeof DATE_FILTERS)[number]["key"]>("all");
  const [query, setQuery] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["scan-history"],
    queryFn: () => fetchScans(),
  });

  const now = new Date();
  const getDaysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const scans = (data ?? []).filter((s: ScanRecord) => {
    // 1. Scan Type Filter
    const matchType = typeFilter === "all" || s.scan_type === typeFilter;

    // 2. Risk Level Filter
    const matchRisk = riskFilter === "all" || s.risk_level === riskFilter;

    // 3. Search query filter
    const matchQuery =
      s.input_label.toLowerCase().includes(query.trim().toLowerCase()) ||
      s.verdict.toLowerCase().includes(query.trim().toLowerCase());

    // 4. Date Filter
    let matchDate = true;
    const scanDate = new Date(s.created_at);
    if (dateFilter === "today") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      matchDate = scanDate >= today;
    } else if (dateFilter === "week") {
      matchDate = scanDate >= getDaysAgo(7);
    } else if (dateFilter === "month") {
      matchDate = scanDate >= getDaysAgo(30);
    }

    return matchType && matchRisk && matchQuery && matchDate;
  });

  return (
    <AppShell>
      <header className="mb-6">
        <h1 className="font-display text-3xl">Scan History</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Every analysis, stored with its full report.
        </p>
      </header>

      <GlassCard className="mb-5 p-4 space-y-4">
        {/* Search Input */}
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search scans by name or verdict…"
          className="w-full rounded-xl border border-input bg-background/60 px-4 py-2.5 text-sm outline-none focus:border-primary"
        />

        {/* Filter Badges Row */}
        <div className="flex flex-wrap gap-4 items-center">
          {/* Module Filter */}
          <div className="flex flex-wrap gap-1">
            {TYPE_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setTypeFilter(f.key)}
                className={`rounded-lg px-2.5 py-1.5 text-xs transition-colors cursor-pointer ${
                  typeFilter === f.key
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-secondary/60"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-glass-border hidden lg:block" />

          {/* Quick Selects */}
          <div className="flex flex-wrap gap-3 items-center ml-auto">
            {/* Risk filter */}
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="size-3.5 text-muted-foreground" />
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value as never)}
                className="bg-background/80 text-xs border border-glass-border rounded-lg px-2 py-1 focus:border-primary outline-none"
              >
                {RISK_FILTERS.map((f) => (
                  <option key={f.key} value={f.key}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date filter */}
            <div className="flex items-center gap-1.5">
              <Calendar className="size-3.5 text-muted-foreground" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as never)}
                className="bg-background/80 text-xs border border-glass-border rounded-lg px-2 py-1 focus:border-primary outline-none"
              >
                {DATE_FILTERS.map((f) => (
                  <option key={f.key} value={f.key}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </GlassCard>

      {error && (
        <ErrorPanel message={error instanceof Error ? error.message : "Could not load history."} />
      )}

      {isLoading ? (
        <div className="grid gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-2xl border border-glass-border bg-card/40"
            />
          ))}
        </div>
      ) : scans.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <p className="text-sm text-muted-foreground">No scans match this view yet.</p>
          <Link to="/dashboard" className="mt-4 inline-block text-sm text-primary hover:underline">
            Launch a scan module
          </Link>
        </GlassCard>
      ) : (
        <ul className="grid gap-3">
          {scans.map((scan: ScanRecord) => (
            <li key={scan.id}>
              <Link
                to="/results/$scanId"
                params={{ scanId: scan.id }}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-glass-border bg-card/40 px-5 py-4 transition-colors hover:border-primary/40"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{scan.input_label}</p>
                  <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                    {SCAN_TYPE_LABELS[scan.scan_type]} ·{" "}
                    {new Date(scan.created_at).toLocaleString()}
                  </p>
                  <p className="mt-1.5 line-clamp-1 text-xs text-muted-foreground">
                    {scan.verdict}
                  </p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="font-display text-2xl">{scan.trust_score}</span>
                  <RiskBadge risk={scan.risk_level} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
