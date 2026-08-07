import { createClient } from "@supabase/supabase-js";

const url = "https://slskxkxsfavjtbfzgewn.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsc2t4a3hzZmF2anRiZnpnZXduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MTQxMTAsImV4cCI6MjEwMTQ5MDExMH0.hj8anD5rFNXAvsAVjXOeWFDhPZkDM6cfHQWtrPbtJ_s";

const supabase = createClient(url, key);

console.log("==========================================");
console.log("SUPABASE WEBSOCKET REALTIME TEST");
console.log("Supabase URL:", url);
console.log("Realtime WS URL:", url.replace("https://", "wss://") + "/realtime/v1/websocket");
console.log("==========================================");

const channelName = `realtime-scans-${Date.now()}`;
const channel = supabase
  .channel(channelName)
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "scans" },
    (payload) => {
      console.log("[EVENT RECEIVED]:", payload.eventType, payload.new || payload.old);
    }
  )
  .subscribe((status, err) => {
    console.log(`[CHANNEL STATUS TRANSITION] -> ${status}`);
    if (err) console.error("[CHANNEL ERROR]:", err);
    if (status === "SUBSCRIBED") {
      console.log("✅ REALTIME WEBSOCKET CONNECTED SUCCESSFULLY!");
      process.exit(0);
    }
  });

setTimeout(() => {
  console.log("Realtime test timeout reached.");
  process.exit(1);
}, 10000);
