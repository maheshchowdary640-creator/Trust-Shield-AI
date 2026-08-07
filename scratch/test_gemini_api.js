const geminiKey = process.env.GEMINI_API_KEY || "";
console.log("==========================================");
console.log("GEMINI_API_KEY PRESENT =", geminiKey ? "YES" : "NO");
if (geminiKey) {
  console.log("GEMINI_API_KEY length =", geminiKey.length);
  console.log("GEMINI_API_KEY prefix =", geminiKey.slice(0, 8) + "...");
}
console.log("==========================================");

async function testGemini() {
  if (!geminiKey) {
    console.error("ERROR: GEMINI_API_KEY is not configured in process.env!");
    return;
  }

  const models = ["gemini-1.5-flash", "gemini-2.0-flash-exp", "gemini-1.5-pro"];

  for (const modelName of models) {
    console.log(`Testing Gemini API endpoint for model: ${modelName}...`);
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: "Hello! Respond ONLY with valid JSON: {\"status\": \"ok\", \"model\": \"" + modelName + "\"}" }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });

      console.log(`Model ${modelName} Response HTTP Status:`, res.status);
      const text = await res.text();
      console.log(`Model ${modelName} Raw Response:\n`, text.slice(0, 300));
      console.log("------------------------------------------");
    } catch (err) {
      console.error(`Model ${modelName} Error:`, err);
    }
  }
}

testGemini();
