import { analyzeVoice } from "./src/lib/scan-engine.server.js";

const sampleA = {
  audioBase64: "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA",
  fileName: "dental_reminder.mp3",
  type: "audio/mp3",
  transcript: "Hello. This is a reminder that your dental appointment is tomorrow at 10 AM."
};

const sampleB = {
  audioBase64: "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA",
  fileName: "otp_bank_scam.mp3",
  type: "audio/mp3",
  transcript: "Your bank account has been suspended. Please provide the OTP sent to your phone immediately."
};

async function runDifferential() {
  console.log("==========================================");
  console.log("[RUNNING SAMPLE A - LEGITIMATE DENTAL APPOINTMENT]");
  console.log("==========================================");
  const resultA = await analyzeVoice(sampleA);
  console.log("Result A Backend JSON:", JSON.stringify(resultA, null, 2));

  console.log("\n==========================================");
  console.log("[RUNNING SAMPLE B - BANK OTP SCAM]");
  console.log("==========================================");
  const resultB = await analyzeVoice(sampleB);
  console.log("Result B Backend JSON:", JSON.stringify(resultB, null, 2));

  console.log("\n==========================================");
  console.log("[DIFFERENTIAL ANALYSIS SCORE COMPARISON]");
  console.log(`Sample A (Dental) Trust Score: ${resultA.trust_score}`);
  console.log(`Sample B (OTP Scam) Trust Score: ${resultB.trust_score}`);
  console.log(`Score Differential: ${resultA.trust_score - resultB.trust_score} points`);
  console.log("==========================================");
}

runDifferential();
