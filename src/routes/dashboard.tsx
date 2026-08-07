import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  ShieldAlert,
  ShieldCheck,
  Gauge,
  ImageIcon,
  BriefcaseBusiness,
  Link2,
  Mic,
  ScanEye,
  ArrowRight,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ErrorPanel, GlassCard, RiskBadge } from "@/components/security-ui";
import { getDashboardStats } from "@/lib/scans.functions";
import { SCAN_TYPE_LABELS } from "@/lib/scan-types";
import { AuthGuard } from "@/components/auth-guard";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Security Dashboard — TrustShield AI" },
      {
        name: "description",
        content:
          "Live scan statistics, threat categories and recent activity across every TrustShield AI detection module.",
      },
      { property: "og:title", content: "Security Dashboard — TrustShield AI" },
      {
        property: "og:description",
        content: "Track scan volume, threats blocked and average trust score in real time.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AuthGuard>
      <Dashboard />
    </AuthGuard>
  ),
});

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const SCAN_MODULES = [
  {
    to: "/scan/screenshot",
    label: "Screenshot Scanner",
    icon: ImageIcon,
    desc: "Scan images of chats, invoices or logins for fraud indicators.",
    tone: "text-primary border-primary/20 bg-primary/5",
  },
  {
    to: "/scan/job-offer",
    label: "Job Verification",
    icon: BriefcaseBusiness,
    desc: "Audit job emails and offer text for recruitment scams.",
    tone: "text-accent border-accent/20 bg-accent/5",
  },
  {
    to: "/scan/url",
    label: "URL Analyzer",
    icon: Link2,
    desc: "Inspect redirect chains, RDAP registration, and SSL.",
    tone: "text-safe border-safe/20 bg-safe/5",
  },
  {
    to: "/scan/voice",
    label: "Voice Scam Agent",
    icon: Mic,
    desc: "Verify call records, voicemails and audio clips for traps.",
    tone: "text-caution border-caution/20 bg-caution/5",
  },
  {
    to: "/scan/deepfake",
    label: "Deepfake Detector",
    icon: ScanEye,
    desc: "Check face consistency, lighting and artifacts on profiles.",
    tone: "text-danger border-danger/20 bg-danger/5",
  },
] as const;

function Dashboard() {
  const fetchStats = useServerFn(getDashboardStats);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => fetchStats(),
    refetchInterval: 2_000,
  });

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    function setupRealtimeSubscription() {
      try {
        const channelId = `realtime-dashboard-${Math.random().toString(36).substring(2, 9)}`;
        channel = supabase
          .channel(channelId)
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "scans" },
            (payload) => {
              console.log("[SUPABASE REALTIME] INSERT event received for scans:", payload.new);
              queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
              queryClient.refetchQueries({ queryKey: ["dashboard-stats"] });
              queryClient.invalidateQueries({ queryKey: ["scan-history"] });
            }
          )
          .on(
            "postgres_changes",
            { event: "UPDATE", schema: "public", table: "scans" },
            (payload) => {
              console.log("[SUPABASE REALTIME] UPDATE event received for scans:", payload.new);
              queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
              queryClient.refetchQueries({ queryKey: ["dashboard-stats"] });
              queryClient.invalidateQueries({ queryKey: ["scan-history"] });
            }
          )
          .on(
            "postgres_changes",
            { event: "DELETE", schema: "public", table: "scans" },
            (payload) => {
              console.log("[SUPABASE REALTIME] DELETE event received for scans:", payload.old);
              queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
              queryClient.refetchQueries({ queryKey: ["dashboard-stats"] });
              queryClient.invalidateQueries({ queryKey: ["scan-history"] });
            }
          )
          .subscribe((status, err) => {
            console.log(`[SUPABASE REALTIME CHANNEL STATUS]: ${status}`);
            if (err) {
              console.warn("[SUPABASE REALTIME CHANNEL ERROR]:", err);
            }
          });
      } catch (err) {
        console.warn("[SUPABASE REALTIME SETUP EXCEPTION]:", err);
      }
    }

    setupRealtimeSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [queryClient]);

  const cards = [
    { label: "Total scans", value: data?.total ?? 0, icon: Activity, tone: "text-primary" },
    { label: "Safe scans", value: data?.safe ?? 0, icon: ShieldCheck, tone: "text-safe" },
    { label: "Suspicious scans", value: data?.suspicious ?? 0, icon: ShieldAlert, tone: "text-caution" },
    { label: "High risk threats", value: data?.highRisk ?? 0, icon: ShieldAlert, tone: "text-critical" },
    { label: "Average trust score", value: data?.avgScore ?? 0, icon: Gauge, tone: "text-accent" },
  ];

  return (
    <AppShell>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Security Dashboard</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Real-time security intelligence across every active scan module.
          </p>
        </div>
      </header>

      {error && (
        <ErrorPanel
          message={error instanceof Error ? error.message : "Could not load statistics."}
        />
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {cards.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <GlassCard className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{c.label}</p>
                <c.icon className={`size-4 ${c.tone}`} />
              </div>
              <p className="mt-3 font-display text-3xl">{isLoading ? "—" : c.value}</p>
            </GlassCard>
          </motion.div>
        ))}
      </section>

      {/* Quick Actions / Security Modules */}
      <section className="mt-8">
        <h2 className="font-display text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">
          Quick Actions &amp; Security Modules
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {SCAN_MODULES.map((mod, i) => (
            <motion.div
              key={mod.to}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
            >
              <Link to={mod.to} className="block h-full group">
                <GlassCard className="h-full p-4 flex flex-col justify-between border-glass-border hover:border-primary/40 transition-colors">
                  <div>
                    <div
                      className={`flex size-10 items-center justify-center rounded-xl border ${mod.tone}`}
                    >
                      <mod.icon className="size-5" />
                    </div>
                    <h3 className="mt-3 font-display text-sm font-semibold group-hover:text-primary transition-colors">
                      {mod.label}
                    </h3>
                    <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                      {mod.desc}
                    </p>
                  </div>
                  <span className="mt-4 flex items-center gap-1 text-[11px] font-mono text-primary uppercase tracking-wider group-hover:gap-2 transition-all">
                    Launch scan <ArrowRight className="size-3" />
                  </span>
                </GlassCard>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mt-8 grid gap-5 lg:grid-cols-3">
        <GlassCard className="p-6 lg:col-span-2">
          <h2 className="font-display text-sm uppercase tracking-[0.18em] text-muted-foreground">
            Scan activity — last 7 days
          </h2>
          <div className="mt-5 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.timeline ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis allowDecimals={false} stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    color: "var(--popover-foreground)",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="scans"
                  stroke="var(--chart-1)"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="threats"
                  stroke="var(--chart-5)"
                  strokeWidth={2.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="font-display text-sm uppercase tracking-[0.18em] text-muted-foreground">
            Threat categories
          </h2>
          {data && data.categories.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">
              No threat categories yet. Run a scan to populate intelligence.
            </p>
          ) : (
            <div className="mt-5 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.categories ?? []} layout="vertical" margin={{ left: 10 }}>
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    stroke="var(--muted-foreground)"
                    fontSize={12}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={110}
                    stroke="var(--muted-foreground)"
                    fontSize={11}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--muted)" }}
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      color: "var(--popover-foreground)",
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    {(data?.categories ?? []).map((_unused: any, i: number) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </GlassCard>
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-3">
        <GlassCard className="p-6">
          <h2 className="font-display text-sm uppercase tracking-[0.18em] text-muted-foreground">
            Scans by module
          </h2>
          <ul className="mt-4 grid gap-3">
            {(data?.byType ?? []).map((t: any) => (
              <li
                key={t.type}
                className="flex items-center justify-between rounded-xl border border-glass-border bg-card/40 px-4 py-3"
              >
                <span className="text-sm">
                  {SCAN_TYPE_LABELS[t.type as "screenshot" | "job_offer" | "url" | "voice" | "deepfake"]}
                </span>
                <span className="font-display text-lg">{t.count}</span>
              </li>
            ))}
          </ul>
        </GlassCard>

        <GlassCard className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm uppercase tracking-[0.18em] text-muted-foreground">
              Recent scans
            </h2>
            <Link to="/history" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </div>
          {data && data.recent.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">
              No scans yet — run your first analysis.
            </p>
          ) : (
            <ul className="mt-4 grid gap-2">
              {(data?.recent ?? []).map((scan: any) => (
                <li key={scan.id}>
                  <Link
                    to="/results/$scanId"
                    params={{ scanId: scan.id }}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-glass-border bg-card/40 px-4 py-3 transition-colors hover:border-primary/40"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm">{scan.input_label}</p>
                      <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                        {SCAN_TYPE_LABELS[
                          scan.scan_type as "screenshot" | "job_offer" | "url" | "voice" | "deepfake"
                        ]} ·{" "}
                        {new Date(scan.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-display text-lg">{scan.trust_score}</span>
                      <RiskBadge risk={scan.risk_level} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>
      </section>
    </AppShell>
  );
}
