import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, Info, ShieldAlert } from "lucide-react";
import { GlassCard, RiskBadge, TrustGauge } from "./security-ui";
import { SCAN_TYPE_LABELS, type ScanRecord } from "@/lib/scan-types";

const SEVERITY_ICON = {
  info: Info,
  low: CheckCircle2,
  medium: AlertTriangle,
  high: ShieldAlert,
} as const;

const SEVERITY_CLASS = {
  info: "text-primary",
  low: "text-safe",
  medium: "text-caution",
  high: "text-critical",
} as const;

export function ScanResultView({
  scan,
  showLink = true,
}: {
  scan: ScanRecord;
  showLink?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="grid gap-5 lg:grid-cols-[320px_1fr]"
    >
      <GlassCard className="flex flex-col items-center gap-4 p-6">
        <TrustGauge score={scan.trust_score} />
        <RiskBadge risk={scan.risk_level} />
        <p className="text-center font-display text-lg leading-snug">{scan.verdict}</p>
        <p className="text-center text-xs font-mono text-muted-foreground">
          {SCAN_TYPE_LABELS[scan.scan_type]} · {new Date(scan.created_at).toLocaleString()}
        </p>
        {showLink && (
          <Link
            to="/results/$scanId"
            params={{ scanId: scan.id }}
            className="text-xs text-primary underline-offset-4 hover:underline"
          >
            Open full report
          </Link>
        )}
      </GlassCard>

      <div className="grid gap-5">
        <GlassCard className="p-6">
          <h3 className="font-display text-sm uppercase tracking-[0.18em] text-muted-foreground">
            Analyst summary
          </h3>
          <p className="mt-3 text-[15px] leading-relaxed">{scan.summary}</p>
          <div className="mt-5 rounded-xl border border-primary/25 bg-primary/8 p-4">
            <p className="text-xs uppercase tracking-widest text-primary">Recommended action</p>
            <p className="mt-1.5 text-sm">{scan.recommendation}</p>
          </div>
          {scan.threat_categories.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {scan.threat_categories.map((c) => (
                <span
                  key={c}
                  className="rounded-full border border-glass-border bg-secondary/50 px-3 py-1 text-xs text-secondary-foreground"
                >
                  {c}
                </span>
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="font-display text-sm uppercase tracking-[0.18em] text-muted-foreground">
            Detected signals
          </h3>
          <ul className="mt-4 grid gap-3">
            {scan.findings.map((f, i) => {
              const Icon = SEVERITY_ICON[f.severity] ?? Info;
              return (
                <motion.li
                  key={`${f.title}-${i}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex gap-3 rounded-xl border border-glass-border bg-card/40 p-4"
                >
                  <Icon className={`mt-0.5 size-4 shrink-0 ${SEVERITY_CLASS[f.severity]}`} />
                  <div>
                    <p className="text-sm font-medium">{f.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{f.detail}</p>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        </GlassCard>
      </div>
    </motion.div>
  );
}
