// Advanced Semantic Intent & Scam Severity Engine Test Suite

function evaluateAdvancedVoiceScam(transcript) {
  const text = transcript.toLowerCase();

  // Semantic Intent Detectors
  const detectedIntents = [];
  const redFlags = [];

  // 1. OTP / Credential Intent (Critical)
  if (/otp|one time password|verification code|security code|authentication code|access code|passcode|pin code|6-digit|secret code|login code/.test(text)) {
    detectedIntents.push("OTP / Credential Extraction Intent");
    redFlags.push("High-Risk Passcode Request");
  }

  // 2. Bank / Account Suspension Intent (Critical)
  if (/account blocked|account suspended|verify account|banking verification|confirm identity|unauthorized transaction|fraud department|card frozen|\bbank\b/.test(text)) {
    detectedIntents.push("Bank Impersonation & Account Suspension Intent");
    redFlags.push("Bank Impersonation Threat");
  }

  // 3. Fee Scam Intent (Medium)
  if (/registration fee|joining fee|onboarding fee|processing fee|verification fee|enrollment fee|security deposit|advance fee|admin fee/.test(text)) {
    detectedIntents.push("Registration / Processing Fee Demand Intent");
    redFlags.push("Advance Fee Demand");
  }

  // 4. Urgency Intent
  if (/act now|immediately|limited time|today only|expires today|urgent action|within 10 minutes|do not hang up|legal action/.test(text)) {
    detectedIntents.push("High-Pressure Urgency Tactics Intent");
    redFlags.push("Psychological Urgency Pressure");
  }

  // 5. Lottery Intent (High)
  if (/lottery|jackpot|prize money|claim reward|lucky draw|sweepstakes|won \$|\bwinner\b/.test(text)) {
    detectedIntents.push("Lottery Winnings Claim Intent");
    redFlags.push("Unsolicited Winnings Pitch");
  }

  // 6. Investment Scam Intent (High)
  if (/guaranteed returns|double your money|risk free investment|huge profits|instant profits|crypto return|daily returns|insider tip/.test(text)) {
    detectedIntents.push("Guaranteed High-Yield Investment Intent");
    redFlags.push("Unrealistic Return Promises");
  }

  // Determine Severity Category & Exact Score Band
  const hasOtp = detectedIntents.some(i => i.includes("OTP"));
  const hasBank = detectedIntents.some(i => i.includes("Bank"));
  const hasLottery = detectedIntents.some(i => i.includes("Lottery"));
  const hasInvestment = detectedIntents.some(i => i.includes("Investment"));
  const hasFee = detectedIntents.some(i => i.includes("Registration"));

  let scamType = "Legitimate Communication";
  let classification = "SAFE";
  let riskLevel = "SAFE";
  let trustScore = 98;
  let confidence = 0.98;
  let explanation = "";
  let recommendation = "";

  if (hasOtp || (hasBank && /verify|suspended|code/.test(text))) {
    // CRITICAL THREAT BAND: 0 - 15
    classification = "CRITICAL";
    riskLevel = "CRITICAL";
    trustScore = hasOtp && hasBank ? 8 : 12;
    scamType = hasOtp ? "OTP & Credential Theft Scam" : "Bank Verification Scam";
    confidence = 0.96;
    explanation = "Critical threat: Audio contains high-pressure requests for sensitive verification codes or bank account authorization.";
    recommendation = "HANG UP IMMEDIATELY. Never share one-time passcodes (OTP) or banking credentials with any caller.";
  } else if (hasBank) {
    // CRITICAL THREAT BAND: 10 - 20
    classification = "CRITICAL";
    riskLevel = "CRITICAL";
    trustScore = 15;
    scamType = "Account Suspension Impersonation Scam";
    confidence = 0.94;
    explanation = "Critical threat: Caller is threatening account suspension to coerce emergency action.";
    recommendation = "Do not comply with caller requests. Verify your account state via your official bank app.";
  } else if (hasLottery) {
    // HIGH THREAT BAND: 20 - 35
    classification = "HIGH RISK";
    riskLevel = "HIGH";
    trustScore = 25;
    scamType = "Lottery Winnings Fee Scam";
    confidence = 0.92;
    explanation = "High threat: Caller promises large lottery winnings while requiring an advance processing fee.";
    recommendation = "Do not transfer money to claim prizes. Legitimate lotteries never require advance fees.";
  } else if (hasInvestment) {
    // HIGH THREAT BAND: 15 - 30
    classification = "HIGH RISK";
    riskLevel = "HIGH";
    trustScore = 22;
    scamType = "Guaranteed Investment Fraud";
    confidence = 0.93;
    explanation = "High threat: Solicitations promoting zero-risk guaranteed profits are classic financial fraud.";
    recommendation = "Reject unsolicited investment offers. Consult a registered financial advisor.";
  } else if (hasFee || /internship|job|position|hiring/.test(text)) {
    // MEDIUM THREAT BAND: 40 - 60
    classification = "SUSPICIOUS";
    riskLevel = "MEDIUM";
    trustScore = 50;
    scamType = "Fake Internship / Job Processing Fee Scam";
    confidence = 0.89;
    explanation = "Medium threat: Offer requires an upfront registration or processing deposit to secure position.";
    recommendation = "Verify employer credentials directly via official company career sites before paying any fee.";
  } else {
    // LEGITIMATE BAND: 80 - 100
    classification = "SAFE";
    riskLevel = "SAFE";
    trustScore = 98;
    scamType = "Verified Notification";
    confidence = 0.97;
    explanation = "Safe: Speech transcript contains standard notification markers with zero high-pressure or payment demands.";
    recommendation = "No security risk detected. Standard informational communication.";
  }

  const result = {
    classification,
    riskLevel,
    confidence,
    trustScore,
    scamType,
    redFlags,
    detectedIntents,
    explanation,
    recommendation
  };

  console.log("\n==================================================");
  console.log("=== ADVANCED INTENT & SEVERITY DEBUG LOG ===");
  console.log("Transcript:", transcript.slice(0, 110) + "...");
  console.log("Intents:", detectedIntents);
  console.log("Scam Type:", scamType);
  console.log("Classification:", classification);
  console.log("Risk Level:", riskLevel);
  console.log("Trust Score:", trustScore, "/ 100");
  console.log("==================================================");

  return result;
}

// RUN THE 6 REQUIRED TEST CASES
console.log("\n==================================================");
console.log("RUNNING ADVANCED VOICE SCAM ENGINE TEST SUITE");
console.log("==================================================");

console.log("\n--- TEST 1: Dental Appointment Reminder ---");
evaluateAdvancedVoiceScam(
  "Hello, this is Dr. Smith's office reminding you of your dental appointment tomorrow at 10 AM. Please call back if you need to reschedule."
);

console.log("\n--- TEST 2: Fake Internship Fee Scam ---");
evaluateAdvancedVoiceScam(
  "Congratulations! You have been selected for a remote data entry internship at TechCorp. To secure your slot, you must pay an onboarding registration fee of $50 right now."
);

console.log("\n--- TEST 3: Lottery Scam ---");
evaluateAdvancedVoiceScam(
  "Congratulations, you are the official lottery jackpot winner of $500,000 prize money! To claim your lucky draw reward, you must pay a small processing fee immediately."
);

console.log("\n--- TEST 4: Investment Scam ---");
evaluateAdvancedVoiceScam(
  "Hi, this is Crypto Capital. We offer guaranteed returns of 300% on your deposit. Invest now to double your money with zero risk and instant daily profits."
);

console.log("\n--- TEST 5: OTP Bank Scam ---");
evaluateAdvancedVoiceScam(
  "This is Security Officer Mark from Chase Bank. Your account is blocked due to unauthorized activity. Please read out the authentication code OTP sent to your phone right now."
);

console.log("\n--- TEST 6: Bank Verification Scam ---");
evaluateAdvancedVoiceScam(
  "Urgent message from Bank of America Fraud Department. Your debit card has been suspended. Please press 1 to confirm identity and complete banking verification immediately."
);
