const url = "https://slskxkxsfavjtbfzgewn.supabase.co/rest/v1/scans?scan_type=eq.voice&order=created_at.desc&limit=5";
const apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsc2t4a3hzZmF2anRiZnpnZXduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MTQxMTAsImV4cCI6MjEwMTQ5MDExMH0.hj8anD5rFNXAvsAVjXOeWFDhPZkDM6cfHQWtrPbtJ_s";

async function run() {
  const res = await fetch(url, {
    headers: {
      "apikey": apiKey,
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    }
  });

  const data = await res.json();
  console.log("==========================================");
  console.log("DB LATEST VOICE SCANS:");
  console.log(JSON.stringify(data, null, 2));
  console.log("==========================================");
}

run();
