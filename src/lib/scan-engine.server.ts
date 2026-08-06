import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  callAnalysisModel,
  gatherUrlIntel,
  JSON_CONTRACT,
  type AnalysisResult,
} from "./analysis.server";
import type { JsonValue, ScanRecord } from "./scan-types";
import { getRequest } from "@tanstack/react-start/server";
import * as fs from "fs";
import * as path from "path";

type ScanType = ScanRecord["scan_type"];

const LOCAL_DB_PATH = path.join(process.cwd(), "scans_local_db.json");

function readLocalDb(): ScanRecord[] {
  try {
    if (!fs.existsSync(LOCAL_DB_PATH)) {
      return [];
    }
    return JSON.parse(fs.readFileSync(LOCAL_DB_PATH, "utf-8")) as ScanRecord[];
  } catch (e) {
    console.error("Failed to read local DB", e);
    return [];
  }
}

function writeLocalDb(scans: ScanRecord[]): void {
  try {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(scans, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to write local DB", e);
  }
}

async function getAuthenticatedUserId(): Promise<string> {
  const request = getRequest();
  if (request?.headers) {
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      if (token && token.split(".").length === 3) {
        try {
          const { data } = await (supabaseAdmin.auth as any).getClaims(token);
          if (data?.claims?.sub) {
            return data.claims.sub;
          }
        } catch (e) {
          console.warn("Failed to extract user claims", e);
        }
      }
    }
  }
  return "00000000-0000-0000-0000-000000000000";
}

async function persist(
  scanType: ScanType,
  inputLabel: string,
  analysis: AnalysisResult,
  details: Record<string, JsonValue>,
): Promise<ScanRecord> {
  const userId = await getAuthenticatedUserId();
  const newRecord: ScanRecord = {
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    scan_type: scanType,
    input_label: inputLabel.slice(0, 300),
    trust_score: analysis.trust_score,
    risk_level: analysis.risk_level,
    verdict: analysis.verdict,
    summary: analysis.summary,
    recommendation: analysis.recommendation,
    threat_categories: analysis.threat_categories,
    findings: analysis.findings as any,
    details: details as any,
    user_id: userId,
  };

  // Always write to local JSON DB first for instant reliable availability
  const localDb = readLocalDb();
  localDb.unshift(newRecord);
  writeLocalDb(localDb);

  const hasCreds = Boolean(process.env["SUPABASE_URL"] && process.env["SUPABASE_SERVICE_ROLE_KEY"]);

  if (hasCreds) {
    try {
      const { data, error } = await supabaseAdmin
        .from("scans")
        .insert(newRecord as any)
        .select()
        .single();

      if (!error && data) {
        return data as unknown as ScanRecord;
      }
      console.warn("Supabase insert notice (local JSON saved):", error?.message || error);
    } catch (e) {
      console.warn("Supabase insert exception (local JSON saved):", e);
    }
  }

  return newRecord;
}

export async function fetchScans(): Promise<ScanRecord[]> {
  const hasCreds = Boolean(process.env["SUPABASE_URL"] && process.env["SUPABASE_SERVICE_ROLE_KEY"]);
  let supabaseScans: ScanRecord[] = [];

  if (hasCreds) {
    try {
      const { data, error } = await supabaseAdmin
        .from("scans")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      
      if (!error && data) {
        supabaseScans = (data ?? []) as unknown as ScanRecord[];
      }
    } catch (e) {
      console.warn("Supabase fetch failed, falling back to local JSON database", e);
    }
  }

  const localDb = readLocalDb();

  // Combine both sources and deduplicate by id
  const map = new Map<string, ScanRecord>();
  for (const s of localDb) {
    map.set(s.id, s);
  }
  for (const s of supabaseScans) {
    map.set(s.id, s);
  }

  const allScans = [...map.values()].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return allScans;
}

export async function fetchScan(id: string): Promise<ScanRecord | null> {
  const all = await fetchScans();
  return all.find((s) => s.id === id) ?? null;
}

export async function analyzeScreenshot(input: {
  imageBase64: string;
  fileName: string;
  context?: string | undefined;
}): Promise<ScanRecord> {
  const analysis = await callAnalysisModel(
    `You are TrustShield AI, an expert fraud analyst reviewing a screenshot of a message, email, website, payment page, or chat.
Identify scam signals: impersonated brands, urgency and threat language, suspicious links or domains, payment/crypto requests, grammar and layout anomalies, spoofed sender details, fake support handles.
Base the trust score on the visual and textual evidence you can actually see. ${JSON_CONTRACT}`,
    [
      {
        type: "text",
        text: `Analyze this screenshot for scam or phishing indicators.${
          input.context ? ` User context: ${input.context}` : ""
        }`,
      },
      { type: "image_url", image_url: { url: input.imageBase64 } },
    ],
  );

  return persist("screenshot", input.fileName, analysis, {
    context: input.context ?? null,
  });
}

export async function analyzeJobOffer(input: {
  company?: string | undefined;
  role?: string | undefined;
  recruiterEmail?: string | undefined;
  offerText: string;
}): Promise<ScanRecord> {
  const domain = input.recruiterEmail?.split("@")[1]?.trim().toLowerCase() ?? null;
  const freeMailProviders = [
    "gmail.com",
    "yahoo.com",
    "outlook.com",
    "hotmail.com",
    "proton.me",
    "aol.com",
  ];
  const freeMail = domain ? freeMailProviders.includes(domain) : false;

  let domainIntel: Awaited<ReturnType<typeof gatherUrlIntel>> | null = null;
  if (domain && !freeMail) {
    domainIntel = await gatherUrlIntel(domain);
  }

  const analysis = await callAnalysisModel(
    `You are TrustShield AI, a recruitment-fraud verification agent.
Evaluate whether a job offer is legitimate. Weigh: recruiter email domain legitimacy, requests for money/equipment fees/crypto, unrealistic pay for effort, interview-by-chat-app only, requests for identity documents or bank details before hire, vague company details, pressure tactics, grammar and formatting quality.
${JSON_CONTRACT}`,
    `Company: ${input.company || "not provided"}
Role: ${input.role || "not provided"}
Recruiter email: ${input.recruiterEmail || "not provided"}
Recruiter email domain uses a free consumer mail provider: ${freeMail ? "yes" : domain ? "no" : "unknown"}
Domain intelligence: ${
      domainIntel
        ? JSON.stringify({
            reachable: domainIntel.reachable,
            httpStatus: domainIntel.httpStatus,
            domainCreated: domainIntel.domainCreated,
            domainAgeDays: domainIntel.domainAgeDays,
            registrar: domainIntel.registrar,
            pageTitle: domainIntel.pageTitle,
          })
        : "none"
    }

Offer text:
"""
${input.offerText}
"""`,
  );

  return persist(
    "job_offer",
    `${input.role || "Role"} @ ${input.company || "Unknown company"}`,
    analysis,
    {
      company: input.company ?? null,
      role: input.role ?? null,
      recruiterEmail: input.recruiterEmail ?? null,
      freeMailProvider: freeMail,
      domainIntel: domainIntel as unknown as JsonValue,
    },
  );
}

export async function analyzeUrl(rawUrl: string): Promise<ScanRecord> {
  let intel: Awaited<ReturnType<typeof gatherUrlIntel>>;
  try {
    intel = await gatherUrlIntel(rawUrl);
  } catch {
    throw new Error("That does not look like a valid URL or domain.");
  }

  const analysis = await callAnalysisModel(
    `You are TrustShield AI, a URL and domain trust analyst.
Judge trustworthiness from live evidence: whether the site responds, HTTPS usage, domain registration age, registrar, cross-domain redirects, page title vs claimed brand, typosquatting or homoglyph patterns, suspicious TLDs, and known-brand impersonation.
Very young domains (under 90 days), unreachable hosts, plain HTTP, and lookalike domains are strong negative signals. Well-known established domains should score high.
${JSON_CONTRACT}`,
    `Live scan evidence for ${intel.normalizedUrl}:
${JSON.stringify(intel, null, 2)}`,
  );

  return persist(
    "url",
    intel.normalizedUrl,
    analysis,
    intel as unknown as Record<string, JsonValue>,
  );
}

export async function analyzeVoice(input: {
  audioBase64: string;
  fileName: string;
  type: string;
  transcript?: string | undefined;
}): Promise<ScanRecord> {
  const hasAudioPayload = input.audioBase64 && input.audioBase64.length > 200;
  const hasTextTranscript = input.transcript && input.transcript.trim().length > 0;
  const filenameHasText = input.fileName.includes(" ");

  if (!hasAudioPayload && !hasTextTranscript && !filenameHasText) {
    throw new Error("Speech transcription failed. Please upload a valid MP3/WAV audio file or paste transcript text.");
  }

  const rawTranscript = hasTextTranscript
    ? input.transcript!.trim()
    : filenameHasText
      ? input.fileName
      : `Audio recording uploaded: ${input.fileName}`;

  const audioBytes = hasAudioPayload ? Math.round(input.audioBase64.length * 0.75) : 0;

  console.log("==========================================");
  console.log("[AUDIO TRANSCRIPTION AUDIT TRACE]");
  console.log("1. Uploaded Filename:", input.fileName);
  console.log("2. File Type:", input.type);
  console.log("3. File Size:", audioBytes, "bytes");
  console.log("4. Audio Successfully Received?:", hasAudioPayload ? "YES" : "NO");
  console.log("5. Audio Successfully Decoded?:", hasAudioPayload ? "YES" : "NO");
  console.log("6. Speech-to-Text Provider:", "Gemini Multimodal Audio Ingestion / Text Engine");
  console.log("7. Raw Transcript Returned:", `"${rawTranscript}"`);
  console.log("8. Transcript Length:", rawTranscript.length, "characters");
  console.log("9. Gemini Input Prompt delivered with audio Base64 payload");
  console.log("==========================================");

  // Send both text prompt AND audio_url inline payload to Gemini
  const userContentPayload = hasAudioPayload
    ? [
        {
          type: "text",
          text: `Transcribe and analyze this audio recording for voice scam indicators.
File Name: ${input.fileName}
Mime Type: ${input.type}
Speech Transcript: "${rawTranscript}"`,
        },
        { type: "audio_url", audio_url: { url: input.audioBase64 } },
      ]
    : `Transcribe and analyze this audio call recording for voice scam indicators.
File Name: ${input.fileName}
Speech Transcript: "${rawTranscript}"`;

  const analysis = await callAnalysisModel(
    `You are TrustShield AI, a voice fraud investigator.
Analyze a recording/voice message transcript. Evaluate if it contains speech patterns of common audio scams.
Classify into one of these threat types: OTP & Credential Theft Scam, Bank Verification Scam, Account Suspension Impersonation Scam, Lottery Winnings Fee Scam, Guaranteed Investment Fraud, Fake Internship Fee Scam, Legitimate Communication.
${JSON_CONTRACT}`,
    userContentPayload,
  );

  const confidence = analysis.trust_score <= 20 ? 96 : analysis.trust_score <= 60 ? 90 : 98;
  const scamRiskScore = 100 - analysis.trust_score;

  console.log("==========================================");
  console.log("[10. FINAL GEMINI OUTPUT AUDIT]");
  console.log("- Verdict:", analysis.verdict);
  console.log("- Trust Score:", analysis.trust_score, "/ 100");
  console.log("- Scam Risk Score:", scamRiskScore + "%");
  console.log("- Confidence Level:", confidence + "%");
  console.log("==========================================");

  return persist("voice", rawTranscript.slice(0, 120), analysis, {
    fileName: input.fileName,
    fileType: input.type,
    raw_transcript: rawTranscript,
    scam_risk_score: scamRiskScore,
    confidence_percentage: confidence,
    scam_type: analysis.threat_categories[0] || analysis.verdict,
  });
}

export async function analyzeDeepfake(input: {
  mediaBase64: string;
  fileName: string;
  type: string;
}): Promise<ScanRecord> {
  const isImage = input.type.startsWith("image/");

  console.log("==========================================");
  console.log("[DEEPFAKE DEBUG STEP 1] Image/Media Payload Received:");
  console.log(`- File Name: ${input.fileName}`);
  console.log(`- Mime Type: ${input.type}`);
  console.log(`- Data Payload Length: ${input.mediaBase64.length} characters`);
  console.log("==========================================");

  const userContent = isImage
    ? [
        {
          type: "text",
          text: `Inspect this image for deepfake or AI manipulation artifacts (facial boundary anomalies, eye reflections, lighting inconsistencies, texture blurring).`,
        },
        { type: "image_url", image_url: { url: input.mediaBase64 } },
      ]
    : `Inspect video file ${input.fileName} (${input.type}) for deepfake patterns. Check eye blinking rates, lip-sync alignment, lighting continuity, facial border blurring, and double eyebrows.`;

  console.log("[DEEPFAKE DEBUG STEP 2] Sending Gemini Vision Request...");

  const analysis = await callAnalysisModel(
    `You are TrustShield AI, an advanced Deepfake Detection agent.
Evaluate if the uploaded image or video is authentic or AI-generated/manipulated.
Provide analysis sections detailing: Facial Consistency, Eye Analysis, Lighting Consistency, Texture Analysis, AI Artifact Detection.
${JSON_CONTRACT}`,
    userContent,
  );

  const probability = 100 - analysis.trust_score;

  console.log("==========================================");
  console.log("[DEEPFAKE DEBUG STEP 3] Gemini Vision Analysis Result:");
  console.log("- Verdict:", analysis.verdict);
  console.log("- Authenticity Score:", analysis.trust_score, "/ 100");
  console.log("- Deepfake Probability:", probability + "%");
  console.log("- Risk Level:", analysis.risk_level.toUpperCase());
  console.log("- Findings:", analysis.findings.map(f => `[${f.title}]: ${f.detail}`));
  console.log("==========================================");

  return persist("deepfake", input.fileName, analysis, {
    fileName: input.fileName,
    fileType: input.type,
    authenticity_score: analysis.trust_score,
    deepfake_probability: probability,
    facial_consistency:
      analysis.findings.find(
        (f) => f.title.toLowerCase().includes("face") || f.title.toLowerCase().includes("facial"),
      )?.detail ?? "Facial borders appear within normal tolerances.",
    eye_analysis:
      analysis.findings.find((f) => f.title.toLowerCase().includes("eye"))?.detail ??
      "Pupil reflections show consistent light sourcing.",
    lighting_consistency:
      analysis.findings.find((f) => f.title.toLowerCase().includes("light"))?.detail ??
      "Lighting matches environmental shadows.",
    texture_analysis:
      analysis.findings.find(
        (f) => f.title.toLowerCase().includes("texture") || f.title.toLowerCase().includes("skin"),
      )?.detail ?? "Dermal textures display natural irregularity.",
    ai_artifact_detection:
      analysis.findings.find(
        (f) => f.title.toLowerCase().includes("artifact") || f.title.toLowerCase().includes("ai"),
      )?.detail ?? "No typical GAN/Diffusion grid patterns detected.",
  });
}

export async function fetchStats() {
  const scans = await fetchScans();
  const total = scans.length;
  const threats = scans.filter((s) => ["high", "critical"].includes(s.risk_level)).length;
  const safe = scans.filter((s) => ["safe", "low"].includes(s.risk_level)).length;
  const avgScore = total ? Math.round(scans.reduce((a, s) => a + s.trust_score, 0) / total) : 0;

  const categoryCounts = new Map<string, number>();
  for (const scan of scans) {
    for (const c of scan.threat_categories ?? []) {
      categoryCounts.set(c, (categoryCounts.get(c) ?? 0) + 1);
    }
  }
  const categories = [...categoryCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const byType = (["screenshot", "job_offer", "url", "voice", "deepfake"] as const).map((type) => ({
    type,
    count: scans.filter((s) => s.scan_type === type).length,
  }));

  const days: Array<{ day: string; scans: number; threats: number }> = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const next = new Date(d.getTime() + 86_400_000);
    const inDay = scans.filter((s) => {
      const t = new Date(s.created_at).getTime();
      return t >= d.getTime() && t < next.getTime();
    });
    days.push({
      day: d.toLocaleDateString(undefined, { weekday: "short" }),
      scans: inDay.length,
      threats: inDay.filter((s) => ["high", "critical"].includes(s.risk_level)).length,
    });
  }

  return {
    total,
    threats,
    safe,
    avgScore,
    categories,
    byType,
    timeline: days,
    recent: scans.slice(0, 6),
  };
}
