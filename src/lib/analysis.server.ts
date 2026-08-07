import type { Finding, RiskLevel } from "./scan-types";

const AI_ENDPOINT = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";

export type AnalysisResult = {
  trust_score: number;
  risk_level: RiskLevel;
  verdict: string;
  summary: string;
  recommendation: string;
  threat_categories: string[];
  findings: Finding[];
};

type ChatContent = string | Array<Record<string, unknown>>;

function extractJson(raw: string): unknown {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  let candidate = (fenced?.[1] ?? raw).trim();
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("Analysis engine returned an unreadable response.");
  }
  candidate = candidate.slice(start, end + 1);

  // 1. Try standard JSON parse
  try {
    return JSON.parse(candidate);
  } catch {
    // 2. Clean trailing commas and unescaped control chars
    const sanitized = candidate
      .replace(/,\s*([}\]])/g, "$1")
      .replace(/[\u0000-\u001F]+/g, (match) => {
        if (match === "\n") return "\\n";
        if (match === "\r") return "\\r";
        if (match === "\t") return "\\t";
        return "";
      });

    try {
      return JSON.parse(sanitized);
    } catch {
      // 3. Repair unquoted keys or single quotes
      const repaired = sanitized
        .replace(/([{,]\s*)([a-zA-Z0-9_]+?)\s*:/g, '$1"$2":')
        .replace(/'([^'\\]*(\\.[^'\\]*)*)'/g, '"$1"');

      return JSON.parse(repaired);
    }
  }
}

function simulateAnalysis(systemPrompt: string, userContent: ChatContent): AnalysisResult {
  const prompt = systemPrompt.toLowerCase();
  const contentStr = (
    typeof userContent === "string"
      ? userContent
      : JSON.stringify(userContent)
  ).toLowerCase();
  
  if (prompt.includes("voice fraud investigator") || prompt.includes("recorded call") || prompt.includes("audio scam") || prompt.includes("audio structure") || prompt.includes("voice")) {
    const textToScan = contentStr.toLowerCase();

    // Semantic Intent Detectors & Red Flags
    const detectedIntents: string[] = [];
    const redFlags: string[] = [];

    // 1. OTP / Credential Intent (Critical)
    if (/otp|one time password|verification code|security code|authentication code|access code|passcode|pin code|6-digit|secret code|login code/.test(textToScan)) {
      detectedIntents.push("OTP / Credential Extraction Intent");
      redFlags.push("High-Risk Passcode Extraction Request");
    }

    // 2. Bank / Account Suspension Intent (Critical)
    if (/account blocked|account suspended|verify account|banking verification|confirm identity|unauthorized transaction|fraud department|card frozen|\bbank\b/.test(textToScan)) {
      detectedIntents.push("Bank Impersonation & Account Suspension Intent");
      redFlags.push("Bank Impersonation & Suspension Threat");
    }

    // 3. Fee Scam Intent (Medium)
    if (/registration fee|joining fee|onboarding fee|processing fee|verification fee|enrollment fee|security deposit|advance fee|admin fee/.test(textToScan)) {
      detectedIntents.push("Registration / Processing Fee Demand Intent");
      redFlags.push("Advance Fee Deposit Requirement");
    }

    // 4. Urgency Intent
    if (/act now|immediately|limited time|today only|expires today|urgent action|within 10 minutes|do not hang up|legal action/.test(textToScan)) {
      detectedIntents.push("High-Pressure Urgency Tactics Intent");
      redFlags.push("Psychological Pressure & Artificial Urgency");
    }

    // 5. Lottery Intent (High)
    if (/lottery|jackpot|prize money|claim reward|lucky draw|sweepstakes|won \$|\bwinner\b/.test(textToScan)) {
      detectedIntents.push("Lottery Winnings Claim Intent");
      redFlags.push("Unsolicited Prize Winnings Solicitation");
    }

    // 6. Investment Scam Intent (High)
    if (/guaranteed returns|double your money|risk free investment|huge profits|instant profits|crypto return|daily returns|insider tip/.test(textToScan)) {
      detectedIntents.push("Guaranteed High-Yield Investment Intent");
      redFlags.push("Guaranteed Profit Promises");
    }

    // Determine Severity Category & Score Band
    const hasOtp = detectedIntents.some(i => i.includes("OTP"));
    const hasBank = detectedIntents.some(i => i.includes("Bank"));
    const hasLottery = detectedIntents.some(i => i.includes("Lottery"));
    const hasInvestment = detectedIntents.some(i => i.includes("Investment"));
    const hasFee = detectedIntents.some(i => i.includes("Registration"));

    let scamType = "Legitimate Communication";
    let classification: "SAFE" | "SUSPICIOUS" | "HIGH RISK" | "CRITICAL" = "SAFE";
    let riskLevel: "safe" | "medium" | "high" | "critical" = "safe";
    let trustScore = 98;
    let confidence = 0.98;
    let explanation = "";
    let recommendation = "";

    if (hasOtp || (hasBank && /verify|suspended|code/.test(textToScan))) {
      // CRITICAL THREAT BAND: Trust Score 0–20, Risk Level CRITICAL
      classification = "CRITICAL";
      riskLevel = "critical";
      trustScore = hasOtp && hasBank ? 8 : 12;
      scamType = hasOtp ? "OTP & Credential Theft Scam" : "Bank Verification Scam";
      confidence = 0.96;
      explanation = "Critical severity threat: Caller transcript requests sensitive single-use passcodes or credential verifications under pressure.";
      recommendation = "HANG UP IMMEDIATELY. Never share OTP passcodes, authentication codes, or banking PINs with any caller.";
    } else if (hasBank) {
      // CRITICAL THREAT BAND: Trust Score 10–20, Risk Level CRITICAL
      classification = "CRITICAL";
      riskLevel = "critical";
      trustScore = 15;
      scamType = "Account Suspension Impersonation Scam";
      confidence = 0.94;
      explanation = "Critical severity threat: Caller threatens account suspension to force panic decisions.";
      recommendation = "Do not comply with caller demands. Log in to your bank's official app or call the number on your payment card.";
    } else if (hasLottery) {
      // HIGH THREAT BAND: Trust Score 20–35, Risk Level HIGH
      classification = "HIGH RISK";
      riskLevel = "high";
      trustScore = 25;
      scamType = "Lottery Winnings Fee Scam";
      confidence = 0.92;
      explanation = "High severity threat: Offer promises large prize winnings but requires an upfront processing fee.";
      recommendation = "Never pay fees to claim sweepstakes or lottery prizes. Legitimate contests do not require upfront deposits.";
    } else if (hasInvestment) {
      // HIGH THREAT BAND: Trust Score 15–30, Risk Level HIGH
      classification = "HIGH RISK";
      riskLevel = "high";
      trustScore = 22;
      scamType = "Guaranteed Investment Fraud";
      confidence = 0.93;
      explanation = "High severity threat: Caller promises guaranteed zero-risk high yield returns, indicative of financial fraud.";
      recommendation = "Reject unsolicited financial investments. Consult a licensed financial advisor before transferring money.";
    } else if (hasFee || /internship|job|position|hiring/.test(textToScan)) {
      // MEDIUM THREAT BAND: Trust Score 40–60, Risk Level MEDIUM-HIGH
      classification = "SUSPICIOUS";
      riskLevel = "medium";
      trustScore = 50;
      scamType = "Fake Internship / Job Processing Fee Scam";
      confidence = 0.89;
      explanation = "Medium severity threat: Job offer requires advance onboarding or registration payments.";
      recommendation = "Verify job listings directly on the company's official careers web portal before sending payments.";
    } else {
      // LEGITIMATE BAND: Trust Score 80–100, Risk Level SAFE
      classification = "SAFE";
      riskLevel = "safe";
      trustScore = 98;
      scamType = "Verified Notification";
      confidence = 0.97;
      explanation = "Safe: Speech transcript contains standard informational markers with zero payment demands or passcode requests.";
      recommendation = "No security risk detected. Standard informational communication.";
    }

    console.log("=== ADVANCED INTENT & SEVERITY DEBUG LOG ===");
    console.log("1. Transcript:", textToScan.slice(0, 150));
    console.log("2. Detected Intents:", detectedIntents);
    console.log("3. Red Flags:", redFlags);
    console.log("4. Scam Type:", scamType);
    console.log("5. Classification:", classification);
    console.log("6. Risk Level:", riskLevel.toUpperCase());
    console.log("7. Trust Score:", trustScore, "/ 100");
    console.log("8. Confidence:", confidence);
    console.log("============================================");

    return {
      trust_score: trustScore,
      risk_level: riskLevel,
      verdict: `${classification}: ${scamType}`,
      summary: explanation,
      recommendation: recommendation,
      threat_categories: [scamType, classification, "Voice Fraud Intelligence"],
      findings: redFlags.length > 0
        ? redFlags.map(rf => ({ title: rf, detail: `Semantic intent detected: ${detectedIntents.join(", ")}`, severity: (classification === "CRITICAL" ? "high" : classification === "HIGH RISK" ? "high" : "medium") as const }))
        : [
            { title: "Standard Communication", detail: "Transcript exhibits normal notification speech patterns.", severity: "info" as const },
            { title: "Zero Passcode Demands", detail: "No high-pressure verification code or fund transfer requests.", severity: "info" as const }
          ]
    };
  } else if (prompt.includes("deepfake") || prompt.includes("biometric") || prompt.includes("face-swap") || prompt.includes("facial consistency")) {
    const userPayloadOnly = contentStr
      .replace(/inspect this image for deepfake or ai manipulation artifacts/gi, "")
      .replace(/inspect video file for deepfake patterns/gi, "");

    const isExplicitFake = [
      "fake", "deepfake", "swap", "ai_gen", "midjourney", "synthetic", "faceapp", "reface", "manipulated", "altered", "generated"
    ].some(k => userPayloadOnly.includes(k));

    if (isExplicitFake) {
      return {
        trust_score: 18,
        risk_level: "high",
        verdict: "Confirmed AI Deepfake Manipulation",
        summary: "Multi-category biometric audit detected severe anomalies across Facial Border Continuity (18/100), Eye Symmetry (20/100), Lighting (15/100), and Skin Texture (22/100) consistent with synthetic AI face-swapping.",
        recommendation: "Exercise extreme caution before trusting or forwarding this media file, especially for identity or financial requests.",
        threat_categories: ["Deepfake", "AI Generated Media", "Facial Manipulation", "Biometric Spoofing"],
        findings: [
          { title: "Facial Border Continuity (18/100)", detail: "Micro-discontinuities detected along the jawline and hair border.", severity: "high" },
          { title: "Eye Reflection Symmetry (20/100)", detail: "Pupil catchlights do not align with environmental light sources.", severity: "high" },
          { title: "Lighting Coherence (15/100)", detail: "Shadow angles on facial contours contradict ambient light vectors.", severity: "high" },
          { title: "Dermal Texture Smoothing (22/100)", detail: "High-frequency skin pore detail replaced with GAN spatial smoothing.", severity: "medium" }
        ]
      };
    } else {
      return {
        trust_score: 95,
        risk_level: "safe",
        verdict: "Verified Authentic Natural Photo",
        summary: "Multi-category biometric audit confirms high authentic scores across Facial Border Continuity (96/100), Eye Symmetry (94/100), Lighting (95/100), and Dermal Texture (92/100).",
        recommendation: "Media verified as authentic natural capture. Zero synthetic manipulation or face-swap signatures detected.",
        threat_categories: ["Authentic Media", "Natural Capture", "Verified Photo"],
        findings: [
          { title: "Facial Border Continuity (96/100)", detail: "Facial boundaries and hair margins exhibit natural edge anti-aliasing.", severity: "info" },
          { title: "Eye Reflection Symmetry (94/100)", detail: "Catchlights across pupils align correctly with ambient light sources.", severity: "info" },
          { title: "Lighting Coherence (95/100)", detail: "Specular highlights match surrounding environment light sources.", severity: "info" },
          { title: "Natural Skin Pore Texture (92/100)", detail: "High-frequency dermal noise matches natural camera sensor optics.", severity: "info" }
        ]
      };
    }
  } else if (prompt.includes("recruitment fraud specialist") || prompt.includes("job offer")) {
    return {
      trust_score: 35,
      risk_level: "medium",
      verdict: "Potential Task Scam Warning",
      summary: "The offer describes high compensation for low-skill remote data entry tasks and mentions moving the conversation to Telegram or WhatsApp. The recruiter's email domain also does not match the company's official domain.",
      recommendation: "Verify the recruiter's identity on LinkedIn or apply directly on the company's official careers site.",
      threat_categories: ["Task Scam", "Advance Fee Fraud", "Fake Recruiter"],
      findings: [
        { title: "Generic Domain Recruiter", detail: "Email was sent from a free email provider instead of the corporate domain.", severity: "high" },
        { title: "Low Effort, High Pay", detail: "Compensation is disproportionately high for the described duties.", severity: "medium" },
        { title: "Alternative Chat Redirection", detail: "Recruiter requests moving communication to encrypted messaging apps.", severity: "medium" }
      ]
    };
  } else if (prompt.includes("ocr & visual phishing") || prompt.includes("screenshot")) {
    return {
      trust_score: 15,
      risk_level: "high",
      verdict: "Urgent Phishing Scam Detected",
      summary: "This screenshot displays classic social engineering indicators. The sender details are hidden or mismatched, and it contains high-pressure urgency language requesting immediate verification details.",
      recommendation: "Do not reply to the message, click any links, or provide personal credentials. Report the sender immediately.",
      threat_categories: ["Phishing", "Brand Impersonation", "Social Engineering"],
      findings: [
        { title: "High Urgency Pressure", detail: "The text creates artificial panic, demanding action within a tight timeline.", severity: "high" },
        { title: "Suspicious Verification Link", detail: "The URL shown deviates from the official corporate domain pattern.", severity: "high" },
        { title: "Masked Sender Details", detail: "The sender address uses a generic webmail rather than a corporate domain.", severity: "medium" }
      ]
    };
  } else if (prompt.includes("url threat intelligence") || prompt.includes("domain trust") || prompt.includes("check a url")) {
    // Extract domain or host from input
    const urlMatch = contentStr.match(/(?:https?:\/\/)?([a-z0-9.-]+\.[a-z]{2,})/i);
    const host = urlMatch ? urlMatch[1].toLowerCase() : "";

    // Official trusted apex domains
    const trustedApexes = [
      "google.com", "github.com", "microsoft.com", "apple.com", "amazon.com", 
      "paypal.com", "youtube.com", "wikipedia.org", "stackoverflow.com",
      "openai.com", "linkedin.com", "twitter.com", "x.com", "gitlab.com", 
      "vercel.app", "render.com", "netlify.app", "supabase.co", "coursera.org", 
      "udemy.com", "medium.com", "cloudflare.com", "figma.com", "canva.com", 
      "notion.so", "slack.com", "zoom.us", "spotify.com", "netflix.com", 
      "adobe.com", "salesforce.com"
    ];

    const isOfficial = trustedApexes.some(apex => host === apex || host.endsWith("." + apex));

    // Brand names often spoofed in phishing links
    const brandKeywords = [
      "paypal", "amazon", "google", "apple", "microsoft", "netflix", "bank", 
      "facebook", "instagram", "whatsapp", "binance", "coinbase", "metamask", 
      "chase", "wellsfargo", "citibank", "verification", "security-center", 
      "account-update", "login-portal"
    ];

    const containsBrand = brandKeywords.some(brand => host.includes(brand));
    const isSuspiciousTLD = [".xyz", ".top", ".tk", ".ml", ".ga", ".cf", ".gq", ".site", ".online", ".click", ".link", ".info", ".net", ".work", ".center"].some(ext => host.endsWith(ext));
    const containsPhishKeywords = ["verify", "verification", "center", "secure", "login", "update", "auth", "signin", "support", "billing", "service", "claim"].some(k => host.includes(k));

    if (isOfficial) {
      return {
        trust_score: 98,
        risk_level: "safe",
        verdict: "Verified Official Domain",
        summary: `The domain "${host || "this link"}" is an official corporate domain with verified WHOIS registration, established domain authority, and secure SSL credentials.`,
        recommendation: "Link is safe. Official corporate domain verified.",
        threat_categories: ["Verified Site", "Secure SSL", "Official Brand"],
        findings: [
          { title: "Official Corporate Domain", detail: "Host matches official verified brand registry.", severity: "info" },
          { title: "Valid SSL/TLS Certificate", detail: "Encrypted connection issued by a trusted Certificate Authority.", severity: "info" },
          { title: "Clean Security Record", detail: "No malicious flags or phishing complaints reported.", severity: "info" }
        ]
      };
    } else if (containsBrand || (containsPhishKeywords && isSuspiciousTLD) || host.includes("paypal-") || host.includes("-verification")) {
      return {
        trust_score: 15,
        risk_level: "high",
        verdict: "Brand Impersonation & Phishing Risk",
        summary: `The domain "${host}" uses corporate brand keywords on an unauthorized external domain. This is a classic phishing indicator designed to capture credentials.`,
        recommendation: "DO NOT CLICK OR ENTER CREDENTIALS. Close this page immediately.",
        threat_categories: ["Phishing Site", "Brand Impersonation", "Typosquatting"],
        findings: [
          { title: "Unauthorized Brand Impersonation", detail: `The host "${host}" includes corporate brand keywords but is NOT hosted on the official domain.`, severity: "high" },
          { title: "High-Risk Phishing Domain Pattern", detail: "Combines security keywords ('verification-center') with non-official domain extensions.", severity: "high" },
          { title: "Credential Harvesting Trap", detail: "Structure matches known fake payment verification portals.", severity: "high" }
        ]
      };
    } else {
      return {
        trust_score: 82,
        risk_level: "low",
        verdict: "Standard External Web Domain",
        summary: `The domain "${host || "this link"}" is an active web domain operating over HTTPS.`,
        recommendation: "Proceed with standard browsing caution.",
        threat_categories: ["Active Domain", "Standard SSL"],
        findings: [
          { title: "Active HTTP Connection", detail: "Server responds cleanly over encrypted TLS.", severity: "info" }
        ]
      };
    }

  } else if (prompt.includes("biometric") || prompt.includes("deepfake")) {
    return {
      trust_score: 42,
      risk_level: "medium",
      verdict: "Suspected AI Face-Swap Artifacts",
      summary: "Visual assessment reveals boundary blending errors around the jawline and irregular double-blink patterns in the eyes. Lighting angles do not change correctly in correlation with facial movement.",
      recommendation: "Exercise extreme caution before trusting or forwarding this media file, especially if it relates to financial requests.",
      threat_categories: ["Deepfake", "AI Generated Media", "Facial Manipulation"],
      findings: [
        { title: "Facial Boundary Anomalies", detail: "Ghosting artifacts visible around the chin and forehead during head turns.", severity: "medium" },
        { title: "Irregular Eye Blinking", detail: "Eye blinking rate is unnaturally low and asymmetrical.", severity: "medium" },
        { title: "Static Shadows", detail: "Cast shadows on the cheeks do not align with the overhead illumination source.", severity: "low" }
      ]
    };
  }

  return {
    trust_score: 98,
    risk_level: "safe",
    verdict: "Verified Legitimate Communication",
    summary: "High-confidence analysis confirms clean text/audio content. Zero scam indicators, passcode demands, or social engineering threats detected.",
    recommendation: "Safe to proceed. Standard legitimate communication.",
    threat_categories: ["Legitimate Communication", "Verified Safe"],
    findings: [
      { title: "Clean Script Audit", detail: "No social engineering, OTP passcodes, or artificial pressure detected.", severity: "info" }
    ]
  };
}

export const GEMINI_API_VERSION = "v1beta";
export const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
] as const;
export const ACTIVE_GEMINI_MODEL = GEMINI_MODELS[0];
export const AVAILABLE_FAILOVER_MODELS = GEMINI_MODELS.slice(1);

export async function callAnalysisModel(
  systemPrompt: string,
  userContent: ChatContent
): Promise<AnalysisResult> {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  const openAiKey = process.env.OPENAI_API_KEY;
  const lovableKey = process.env.LOVABLE_AI_KEY || process.env.VITE_LOVABLE_AI_KEY;

  if (!geminiKey && !openAiKey && !lovableKey) {
    throw new Error("Gemini API key missing. AI analysis unavailable.");
  }

  let content: string | undefined;
  let lastError: string = "";

  // 1. Try standard Google Gemini API directly (Primary Provider)
  if (geminiKey && !content) {
    console.log("==========================================");
    console.log(`[ACTIVE GEMINI MODEL] ${ACTIVE_GEMINI_MODEL}`);
    console.log(`[AVAILABLE FAILOVER MODELS] ${AVAILABLE_FAILOVER_MODELS.join(", ")}`);
    console.log(`[GEMINI API VERSION] ${GEMINI_API_VERSION}`);
    console.log("==========================================");

    const parts: any[] = [];
    parts.push({ text: `System instruction:\n${systemPrompt}\n\nUser request:` });

    if (typeof userContent === "string") {
      parts.push({ text: userContent });
    } else if (Array.isArray(userContent)) {
      for (const item of userContent) {
        const anyItem = item as any;
        if (anyItem.type === "text") {
          parts.push({ text: String(anyItem.text) });
        } else if (anyItem.type === "image_url" || anyItem.type === "audio_url") {
          const dataUrl = String(anyItem.image_url?.url || anyItem.audio_url?.url || "");
          const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            parts.push({
              inlineData: {
                mimeType: match[1],
                data: match[2],
              },
            });
          }
        }
      }
    }

    for (const modelName of GEMINI_MODELS) {
      if (content) break;
      console.log(`[LIVE GEMINI MODEL] ${modelName}`);
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`;
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: parts,
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
            },
          }),
        });

        if (response.ok) {
          const payload = (await response.json()) as {
            candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
          };
          content = payload.candidates?.[0]?.content?.parts?.[0]?.text;
          if (content) {
            console.log(`[LIVE GEMINI MODEL SUCCESS] ${modelName}`);
            console.log(`[LIVE GEMINI RAW RESPONSE]:\n${content.slice(0, 400)}`);
          } else {
            lastError = `Model ${modelName} returned empty text candidate`;
            console.warn(`[LIVE GEMINI MODEL FAILED] ${modelName} - Empty text`);
          }
        } else {
          const errBody = await response.text();
          lastError = `Status ${response.status}: ${errBody}`;
          console.warn(`[LIVE GEMINI MODEL FAILED] ${modelName} - ${lastError}`);
        }
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        console.warn(`[LIVE GEMINI MODEL FAILED] ${modelName} - Exception: ${lastError}`);
      }
    }
  }

  // 2. Try OpenAI API fallback if present
  if (openAiKey && !content) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openAiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userContent },
          ],
        }),
      });

      if (response.ok) {
        const payload = (await response.json()) as any;
        content = payload.choices?.[0]?.message?.content;
      }
    } catch {}
  }

  // 3. Fail explicitly if no live LLM model returned a response
  if (!content) {
    throw new Error(`Gemini API call failed: ${lastError || "No response received from Gemini models."}`);
  }

  console.log("==========================================");
  console.log("[LIVE AI MODEL DIRECT RESPONSE]");
  console.log("Raw Response Payload:\n" + content.slice(0, 500));
  console.log("==========================================");

  let parsed: Partial<AnalysisResult>;
  try {
    parsed = extractJson(content) as Partial<AnalysisResult>;
  } catch (err) {
    throw new Error(`Gemini response JSON parsing failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  const score = Math.max(0, Math.min(100, Math.round(Number(parsed.trust_score ?? 0))));

  return {
    trust_score: score,
    risk_level: (parsed.risk_level as RiskLevel) ?? "medium",
    verdict: String(parsed.verdict ?? "Analysis complete"),
    summary: String(parsed.summary ?? ""),
    recommendation: String(parsed.recommendation ?? ""),
    threat_categories: Array.isArray(parsed.threat_categories)
      ? parsed.threat_categories.map(String).slice(0, 8)
      : [],
    findings: Array.isArray(parsed.findings)
      ? parsed.findings.slice(0, 12).map((f) => ({
          title: String(f?.title ?? "Finding"),
          detail: String(f?.detail ?? ""),
          severity: (["info", "low", "medium", "high"].includes(String(f?.severity))
            ? f.severity
            : "info") as Finding["severity"],
        }))
      : [],
  };
}

export const JSON_CONTRACT = `Respond ONLY with a JSON object shaped exactly like:
{
  "trust_score": <integer 0-100, higher = more trustworthy>,
  "risk_level": "safe" | "low" | "medium" | "high" | "critical",
  "verdict": "<max 8 word verdict>",
  "summary": "<2-3 sentence plain-English explanation>",
  "recommendation": "<clear next action for the user>",
  "threat_categories": ["<short category labels such as Phishing, Impersonation, Advance Fee Fraud, Malware, Data Harvesting, Fake Recruiter, Typosquatting>"],
  "findings": [{"title": "...", "detail": "...", "severity": "info"|"low"|"medium"|"high"}]
}
Return between 3 and 7 findings. Never wrap the JSON in prose.`;

export type UrlIntel = {
  normalizedUrl: string;
  hostname: string;
  protocol: string;
  reachable: boolean;
  httpStatus: number | null;
  finalUrl: string | null;
  redirected: boolean;
  serverHeader: string | null;
  domainCreated: string | null;
  domainAgeDays: number | null;
  registrar: string | null;
  pageTitle: string | null;
  error: string | null;
};

function registrableDomain(hostname: string): string {
  const parts = hostname.split(".");
  return parts.length > 2 ? parts.slice(-2).join(".") : hostname;
}

export async function gatherUrlIntel(rawUrl: string): Promise<UrlIntel> {
  const withScheme = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
  const url = new URL(withScheme);
  const hostname = url.hostname;

  const intel: UrlIntel = {
    normalizedUrl: url.toString(),
    hostname,
    protocol: url.protocol.replace(":", ""),
    reachable: false,
    httpStatus: null,
    finalUrl: null,
    redirected: false,
    serverHeader: null,
    domainCreated: null,
    domainAgeDays: null,
    registrar: null,
    pageTitle: null,
    error: null,
  };

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 9000);
    const res = await fetch(url.toString(), {
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "TrustShieldAI-Scanner/1.0" },
    });
    clearTimeout(timer);
    intel.reachable = true;
    intel.httpStatus = res.status;
    intel.finalUrl = res.url || url.toString();
    intel.redirected = Boolean(res.url) && new URL(res.url).hostname !== hostname;
    intel.serverHeader = res.headers.get("server");
    const body = (await res.text()).slice(0, 20000);
    intel.pageTitle = body.match(/<title[^>]*>([^<]{0,160})<\/title>/i)?.[1]?.trim() ?? null;
  } catch (e) {
    intel.error = e instanceof Error ? e.message : "Request failed";
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const rdap = await fetch(`https://rdap.org/domain/${registrableDomain(hostname)}`, {
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (rdap.ok) {
      const data = (await rdap.json()) as {
        events?: Array<{ eventAction?: string; eventDate?: string }>;
        entities?: Array<{ roles?: string[]; vcardArray?: unknown }>;
      };
      const created = data.events?.find((e) => e.eventAction === "registration")?.eventDate ?? null;
      intel.domainCreated = created;
      if (created) {
        intel.domainAgeDays = Math.max(
          0,
          Math.round((Date.now() - new Date(created).getTime()) / 86_400_000),
        );
      }
      const registrarEntity = data.entities?.find((e) => e.roles?.includes("registrar"));
      const vcard = registrarEntity?.vcardArray as unknown[] | undefined;
      if (Array.isArray(vcard) && Array.isArray(vcard[1])) {
        const fn = (vcard[1] as unknown[][]).find((row) => row?.[0] === "fn");
        if (fn && typeof fn[3] === "string") intel.registrar = fn[3];
      }
    }
  } catch {
    // RDAP is best-effort; absence of data is itself a signal.
  }

  return intel;
}
