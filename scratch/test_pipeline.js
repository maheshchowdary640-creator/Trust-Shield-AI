import { callAnalysisModel } from "../src/lib/analysis.server.ts";

async function runTests() {
  console.log("==================================================");
  console.log("COMPREHENSIVE AI CLASSIFICATION & DECISION ENGINE AUDIT");
  console.log("==================================================\n");

  const voiceTests = [
    {
      name: "OTP Scam Call",
      input: "Hello this is the bank fraud department. Your credit card has been blocked due to unauthorized activity. Please share the 6-digit OTP passcode sent to your phone immediately to unblock your account."
    },
    {
      name: "Fake Job Scam Call",
      input: "Work from home data entry position. Earn $500 daily. Send a $50 registration deposit to our recruiter on Telegram to receive your laptop."
    },
    {
      name: "Lottery Winnings Scam Call",
      input: "Congratulations! You have been selected as the 1 million dollar jackpot winner. Pay a small $100 processing fee to claim your prize money."
    },
    {
      name: "Guaranteed Investment Scam Call",
      input: "Guaranteed 100% returns in 24 hours! Double your bitcoin now with our insider risk-free crypto trading tip."
    },
    {
      name: "Legitimate Appointment Reminder",
      input: "Hi, this is Dr. Smith's clinic reminding you of your doctor appointment scheduled for tomorrow at 10 AM. Please call us if you need to reschedule."
    }
  ];

  console.log("--- VOICE SCAM AGENT COMPREHENSIVE TESTS ---\n");
  for (const test of voiceTests) {
    const result = await callAnalysisModel(
      "You are TrustShield AI, a voice fraud investigator.",
      test.input
    );
    console.log(`[TEST]: ${test.name}`);
    console.log(`  Verdict       : ${result.verdict}`);
    console.log(`  Risk Level    : ${result.risk_level.toUpperCase()}`);
    console.log(`  Trust Score   : ${result.trust_score} / 100 (Scam Risk: ${100 - result.trust_score}%)`);
    console.log(`  Categories    : ${result.threat_categories.join(", ")}`);
    console.log(`  Summary       : ${result.summary}`);
    console.log("--------------------------------------------------\n");
  }

  console.log("--- DEEPFAKE DETECTOR COMPREHENSIVE TESTS ---\n");
  const deepfakeTests = [
    {
      name: "Manipulated AI Face-Swap Media",
      input: "Inspect video file deepfake_face_swap_synthetic.mp4 for facial boundary anomalies, eye reflections, and lighting inconsistencies."
    },
    {
      name: "Authentic Natural Portrait Capture",
      input: "Inspect image file WhatsApp Image 2026-08-06 at 1.16.24 PM.jpeg for facial boundary anomalies, eye reflections, and lighting inconsistencies."
    }
  ];

  for (const test of deepfakeTests) {
    const result = await callAnalysisModel(
      "You are TrustShield AI, an advanced Deepfake Detection agent.",
      test.input
    );
    console.log(`[TEST]: ${test.name}`);
    console.log(`  Verdict       : ${result.verdict}`);
    console.log(`  Risk Level    : ${result.risk_level.toUpperCase()}`);
    console.log(`  Authenticity  : ${result.trust_score} / 100 (Deepfake Prob: ${100 - result.trust_score}%)`);
    console.log(`  Categories    : ${result.threat_categories.join(", ")}`);
    console.log(`  Summary       : ${result.summary}`);
    console.log("--------------------------------------------------\n");
  }
}

runTests().catch(err => {
  console.error("Test execution failed:", err);
});
