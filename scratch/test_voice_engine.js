// Test suite for Voice Scam Agent Hybrid AI + Rules Engine

function evaluateVoiceTranscript(transcript) {
  const text = transcript.toLowerCase();
  const keywordsDetected = [];
  let ruleScore = 0;

  // STEP 2 & 3: Keyword detection & Risk Points
  if (/otp|one time password|share your code|verification code|pin code/.test(text)) {
    keywordsDetected.push("OTP / One Time Password Request");
    ruleScore += 40;
  }
  if (/account suspended|account blocked|account frozen|card blocked/.test(text)) {
    keywordsDetected.push("Account Suspension Threat");
    ruleScore += 20;
  }
  if (/urgent action|act now|do not hang up|immediately|right now|within 10 minutes/.test(text)) {
    keywordsDetected.push("Urgency Language");
    ruleScore += 15;
  }
  if (/registration fee|processing fee|security deposit|refundable fee/.test(text)) {
    keywordsDetected.push("Registration / Processing Fee");
    ruleScore += 30;
  }
  if (/lottery winner|prize money|jackpot|won \$|claim prize/.test(text)) {
    keywordsDetected.push("Lottery Winnings Claim");
    ruleScore += 30;
  }
  if (/guaranteed returns|invest now|double your money|risk-free return/.test(text)) {
    keywordsDetected.push("Guaranteed Investment Return");
    ruleScore += 25;
  }
  if (/bank verification|send money|payment required|transfer funds|pay via zelle|gift card/.test(text)) {
    keywordsDetected.push("Bank Verification / Send Money Requirement");
    ruleScore += 25;
  }

  // Cap rule score at 95
  const cappedRuleScore = Math.min(95, ruleScore);

  // STEP 4: AI Model Classification
  let geminiClassification = "SAFE";
  let scamType = "None";
  
  if (cappedRuleScore >= 25) {
    geminiClassification = "SCAM";
    if (keywordsDetected.some(k => k.includes("OTP"))) scamType = "Urgent OTP Scam";
    else if (keywordsDetected.some(k => k.includes("Lottery"))) scamType = "Urgent Lottery Scam";
    else if (keywordsDetected.some(k => k.includes("Registration"))) scamType = "Fake Internship Fee Scam";
    else if (keywordsDetected.some(k => k.includes("Investment"))) scamType = "Guaranteed Investment Scam";
    else if (keywordsDetected.some(k => k.includes("Suspension"))) scamType = "Bank Account Impersonation Scam";
    else scamType = "Social Engineering Scam";
  }

  // STEP 5: Combined Classification & Scoring
  const classification = geminiClassification;
  const finalRiskScore = classification === "SCAM" ? Math.max(cappedRuleScore, 70) : Math.min(cappedRuleScore, 15);
  const finalTrustScore = Math.max(5, 100 - finalRiskScore);
  const riskLevel = finalTrustScore < 20 ? "CRITICAL" : finalTrustScore < 40 ? "HIGH" : finalTrustScore < 80 ? "MEDIUM" : "LOW";

  console.log("\n==========================================");
  console.log("=== VOICE SCAM ENGINE DEBUG LOG ===");
  console.log("1. Transcript:", transcript);
  console.log("2. Keywords Detected:", keywordsDetected);
  console.log("3. Rule Risk Score:", cappedRuleScore);
  console.log("4. Gemini Classification:", geminiClassification);
  console.log("5. Scam Type:", scamType);
  console.log("6. Final Risk Score:", finalRiskScore);
  console.log("7. Final Trust Score:", finalTrustScore, `(${riskLevel})`);
  console.log("==========================================\n");

  return {
    transcript,
    keywordsDetected,
    ruleScore: cappedRuleScore,
    geminiClassification,
    scamType,
    finalRiskScore,
    finalTrustScore,
    riskLevel,
    classification
  };
}

// TEST CASES
console.log("RUNNING VOICE SCAM AGENT TEST SUITE:\n");

console.log("--- TEST 1: Dental Appointment Reminder ---");
const test1 = evaluateVoiceTranscript(
  "Hello, this is Dr. Smith's office reminding you of your dental appointment tomorrow at 10 AM. Please call back if you need to reschedule."
);

console.log("--- TEST 2: OTP Bank Scam ---");
const test2 = evaluateVoiceTranscript(
  "This is Security Officer Mark from Chase Bank. Your account has been suspended due to suspicious activity. Please read out the one time password OTP code sent to your phone right now to verify your identity."
);

console.log("--- TEST 3: Fake Internship Fee Scam ---");
const test3 = evaluateVoiceTranscript(
  "Congratulations! You have been selected for a remote data entry internship at TechCorp. To secure your slot, you must pay a registration fee of $50 and processing fee right now via Zelle."
);

console.log("--- TEST 4: Lottery Scam ---");
const test4 = evaluateVoiceTranscript(
  "Congratulations, you are the official lottery winner of $500,000 prize money! To claim your jackpot, you need to pay a small processing fee of $200 immediately."
);
