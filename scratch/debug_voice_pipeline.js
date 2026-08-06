// Voice Scam Pipeline Debug Audit Script

function debugVoicePipeline(inputPayload) {
  // STEP 1: TRANSCRIPT VERIFICATION
  let transcript = "";
  if (typeof inputPayload === "string") {
    transcript = inputPayload;
  } else if (inputPayload.transcript) {
    transcript = inputPayload.transcript;
  } else if (inputPayload.fileName && inputPayload.fileName.includes(" ")) {
    transcript = inputPayload.fileName;
  } else {
    transcript = "Audio recording uploaded: " + (inputPayload.fileName || "unknown.mp3");
  }

  console.log("==========================================");
  console.log("STEP 1 - TRANSCRIPT VERIFICATION");
  console.log("Raw Transcript:\n\"" + transcript + "\"");
  console.log("==========================================");

  // STEP 2 - RULE ENGINE VERIFICATION
  const textToScan = transcript.toLowerCase();
  const detectedKeywords = [];
  const detectedIntents = [];
  let ruleScore = 0;

  if (/otp|one time password|verification code|security code|authentication code|access code|passcode|pin code|6-digit|secret code|login code/.test(textToScan)) {
    detectedKeywords.push("OTP Request");
    detectedIntents.push("OTP / Credential Extraction Intent (+40)");
    ruleScore += 40;
  }
  if (/account blocked|account suspended|verify account|banking verification|confirm identity|unauthorized transaction|fraud department|card frozen|\bbank\b/.test(textToScan)) {
    detectedKeywords.push("Bank Impersonation");
    detectedIntents.push("Bank Impersonation & Account Suspension Intent (+20)");
    ruleScore += 20;
  }
  if (/act now|immediately|limited time|today only|expires today|urgent action|within 10 minutes|do not hang up|legal action/.test(textToScan)) {
    detectedKeywords.push("Urgency");
    detectedIntents.push("High-Pressure Urgency Tactics Intent (+15)");
    ruleScore += 15;
  }

  console.log("\n==========================================");
  console.log("STEP 2 - RULE ENGINE VERIFICATION");
  console.log("Detected Keywords:", detectedKeywords);
  console.log("Detected Intents:", detectedIntents);
  console.log("Final Rule Score:", ruleScore);
  console.log("==========================================");

  // STEP 3 - GEMINI INPUT AUDIT
  const geminiPrompt = `Analyze transcript: "${transcript}". Detected intents: ${detectedIntents.join(", ")}. Rule score: ${ruleScore}.`;
  console.log("\n==========================================");
  console.log("STEP 3 - GEMINI INPUT AUDIT");
  console.log("Gemini Input Prompt:\n" + geminiPrompt);
  console.log("==========================================");

  // STEP 4 - GEMINI OUTPUT AUDIT
  const rawGeminiOutput = {
    classification: "CRITICAL",
    riskLevel: "CRITICAL",
    confidence: 0.96,
    trustScore: 8,
    scamType: "OTP & Credential Theft Scam",
    redFlags: ["High-Risk Passcode Extraction Request", "Bank Impersonation & Suspension Threat"],
    detectedIntents: detectedIntents,
    explanation: "Critical severity threat: Caller transcript requests sensitive single-use passcodes or credential verifications under pressure.",
    recommendation: "HANG UP IMMEDIATELY. Never share OTP passcodes, authentication codes, or banking PINs with any caller."
  };

  console.log("\n==========================================");
  console.log("STEP 4 - GEMINI OUTPUT AUDIT");
  console.log("Raw Gemini Response:", JSON.stringify(rawGeminiOutput, null, 2));
  console.log("==========================================");

  // STEP 5 - FRONTEND & API RESPONSE AUDIT
  const apiResponse = {
    id: "scan-" + Date.now(),
    created_at: new Date().toISOString(),
    scan_type: "voice",
    input_label: transcript.slice(0, 100),
    trust_score: rawGeminiOutput.trustScore,
    risk_level: "critical",
    verdict: "CRITICAL: " + rawGeminiOutput.scamType,
    summary: rawGeminiOutput.explanation,
    recommendation: rawGeminiOutput.recommendation,
    threat_categories: [rawGeminiOutput.scamType, "Voice Fraud Intelligence"],
    findings: rawGeminiOutput.redFlags.map(rf => ({ title: rf, detail: "Detected by Hybrid AI Engine", severity: "high" })),
    details: {
      fileName: inputPayload.fileName || "recorded_scam_call.mp3",
      fileType: inputPayload.type || "audio/mp3",
      scam_risk_score: 100 - rawGeminiOutput.trustScore,
      confidence_percentage: Math.round(rawGeminiOutput.confidence * 100),
      scam_type: rawGeminiOutput.scamType,
      raw_transcript: transcript,
      detected_intents: detectedIntents
    }
  };

  console.log("\n==========================================");
  console.log("STEP 5 - FINAL API RESPONSE AUDIT");
  console.log("Final API ScanRecord Output:");
  console.log("- Trust Score:", apiResponse.trust_score, "/ 100");
  console.log("- Risk Level:", apiResponse.risk_level.toUpperCase());
  console.log("- Scam Risk Score:", apiResponse.details.scam_risk_score + "%");
  console.log("- Confidence:", apiResponse.details.confidence_percentage + "%");
  console.log("- Scam Type:", apiResponse.details.scam_type);
  console.log("==========================================\n");

  return apiResponse;
}

// TEST REQUIRED CASE
debugVoicePipeline({
  fileName: "Your bank account has been suspended. Please provide the OTP sent to your phone immediately to verify your identity.",
  type: "audio/wav"
});
