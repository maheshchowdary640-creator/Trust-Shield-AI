import { motion } from "framer-motion";
import { riskToneClass } from "@/lib/scan-types";

export function RiskBadge({ risk, className = "" }: { risk: string; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wider ${riskToneClass(
        risk,
      )} ${className}`}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {risk} risk
    </span>
  );
}

export function TrustGauge({ score, size = 190 }: { score: number; size?: number }) {
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = circumference - (clamped / 100) * circumference * 0.75;
  const track = circumference * 0.25;

  const color =
    clamped >= 70
      ? "var(--safe)"
      : clamped >= 45
        ? "var(--caution)"
        : clamped >= 25
          ? "var(--danger)"
          : "var(--critical)";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-[135deg]">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--muted)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference - track} ${track}`}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.1, ease: "easeOut" }}
          style={{ filter: `drop-shadow(0 0 10px ${color})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-5xl font-semibold"
          style={{ color }}
        >
          {clamped}
        </motion.span>
        <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          trust score
        </span>
      </div>
    </div>
  );
}

export function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`glass-panel rounded-2xl ${className}`}>{children}</div>;
}

export function ScanningOverlay({ label }: { label: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-glass-border bg-card/50 p-10 text-center">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-primary/25 to-transparent [animation:scan-sweep_2.2s_linear_infinite]" />
      <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full border border-primary/30 text-primary [animation:pulse-ring_1.6s_ease-in-out_infinite]">
        <svg className="size-7 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeOpacity="0.25"
            strokeWidth="3"
          />
          <path
            d="M22 12a10 10 0 0 0-10-10"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <p className="font-display text-lg">{label}</p>
      <p className="mt-1 font-mono text-xs text-muted-foreground">
        running threat heuristics · correlating signals · scoring trust
      </p>
    </div>
  );
}

export function ErrorPanel({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-critical/40 bg-critical/10 px-4 py-3 text-sm text-critical">
      {message}
    </div>
  );
}
