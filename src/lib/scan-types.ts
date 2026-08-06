export type JsonValue =
  string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export type RiskLevel = "safe" | "low" | "medium" | "high" | "critical";

export type Finding = {
  title: string;
  detail: string;
  severity: "info" | "low" | "medium" | "high";
};

export type ScanRecord = {
  id: string;
  scan_type: "screenshot" | "job_offer" | "url" | "voice" | "deepfake";
  input_label: string;
  trust_score: number;
  risk_level: string;
  verdict: string;
  summary: string;
  recommendation: string;
  threat_categories: string[];
  findings: Finding[];
  details: Record<string, JsonValue>;
  created_at: string;
  user_id?: string;
};

export const SCAN_TYPE_LABELS: Record<ScanRecord["scan_type"], string> = {
  screenshot: "Screenshot Scam Detector",
  job_offer: "Job Offer Verification",
  url: "URL Trust Analyzer",
  voice: "Voice Scam Agent",
  deepfake: "Deepfake Detection Agent",
};

export function riskFromScore(score: number): RiskLevel {
  if (score >= 85) return "safe";
  if (score >= 70) return "low";
  if (score >= 45) return "medium";
  if (score >= 25) return "high";
  return "critical";
}

export function riskToneClass(risk: string): string {
  switch (risk) {
    case "safe":
      return "border-safe/40 bg-safe/12 text-safe";
    case "low":
      return "border-safe/30 bg-safe/10 text-safe";
    case "medium":
      return "border-caution/40 bg-caution/12 text-caution";
    case "high":
      return "border-danger/40 bg-danger/12 text-danger";
    case "critical":
      return "border-critical/50 bg-critical/15 text-critical";
    default:
      return "border-border bg-muted/40 text-muted-foreground";
  }
}
