const geminiKey = process.env.GEMINI_API_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsc2t4a3hzZmF2anRiZnpnZXduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MTQxMTAsImV4cCI6MjEwMTQ5MDExMH0.hj8anD5rFNXAvsAVjXOeWFDhPZkDM6cfHQWtrPbtJ_s";

async function checkModels() {
  const candidateModels = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b"
  ];

  console.log("==========================================");
  console.log("[GEMINI MODEL AVAILABILITY AUDIT]");
  console.log("API Endpoint Version: v1beta");
  console.log("==========================================");

  for (const m of candidateModels) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${geminiKey}`;
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: "Respond ONLY with valid JSON: {\"status\": \"ok\", \"model\": \"" + m + "\"}" }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });

      const bodyText = await res.text();
      console.log(`Model: [${m}] -> HTTP Status: ${res.status}`);
      if (res.ok) {
        console.log(`✅ [${m}] is ACTIVE and returned valid response:\n${bodyText.slice(0, 200)}`);
      } else {
        console.log(`❌ [${m}] FAILED: ${bodyText.slice(0, 200)}`);
      }
      console.log("------------------------------------------");
    } catch (err) {
      console.error(`❌ [${m}] EXCEPTION:`, err);
    }
  }
}

checkModels();
