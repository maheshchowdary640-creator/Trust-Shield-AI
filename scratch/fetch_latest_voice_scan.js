import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://slskxkxsfavjtbfzgewn.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsc2t4a3hzZmF2anRiZnpnZXduIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTkxNDExMCwiZXhwIjoyMTAxNDkwMTEwfQ.d0sA4-9l45l81u-F-o_h4x-q034-71n901k8125";

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
  realtime: { disabled: true }
});

async function fetchLatestVoiceScan() {
  const { data, error } = await supabase
    .from("scans")
    .select("*")
    .eq("scan_type", "voice")
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    console.error("Database query error:", error);
    return;
  }

  console.log("==========================================");
  console.log("LATEST VOICE SCAN DATABASE RECORDS:");
  console.log(JSON.stringify(data, null, 2));
  console.log("==========================================");
}

fetchLatestVoiceScan();
