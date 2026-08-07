import { createClient } from "@supabase/supabase-js";

const url = "https://slskxkxsfavjtbfzgewn.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsc2t4a3hzZmF2anRiZnpnZXduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MTQxMTAsImV4cCI6MjEwMTQ5MDExMH0.hj8anD5rFNXAvsAVjXOeWFDhPZkDM6cfHQWtrPbtJ_s";

const supabase = createClient(url, key);

console.log("==========================================");
console.log("[SUPABASE REALTIME VERIFICATION]");
console.log("Connecting to Supabase Realtime channel for table: public.scans...");
console.log("==========================================");

const channel = supabase
  .channel("realtime-audit-channel")
  .on(
    "postgres_changes",
    { event: "INSERT", schema: "public", table: "scans" },
    (payload) => {
      console.log("[REALTIME EVENT RECEIVED] -> INSERT:", payload.new);
    }
  )
  .on(
    "postgres_changes",
    { event: "UPDATE", schema: "public", table: "scans" },
    (payload) => {
      console.log("[REALTIME EVENT RECEIVED] -> UPDATE:", payload.new);
    }
  )
  .on(
    "postgres_changes",
    { event: "DELETE", schema: "public", table: "scans" },
    (payload) => {
      console.log("[REALTIME EVENT RECEIVED] -> DELETE:", payload.old);
    }
  )
  .subscribe((status, err) => {
    console.log(`[CHANNEL SUBSCRIPTION STATUS]: ${status}`);
    if (err) {
      console.log(`[CHANNEL ERROR DETAILS]:`, err);
    }
    if (status === "SUBSCRIBED") {
      console.log("==========================================");
      console.log("✅ SUCCESS: Realtime Channel is SUBSCRIBED and actively listening for public.scans changes!");
      console.log("==========================================");
      process.exit(0);
    }
  });

setTimeout(() => {
  console.log("Timeout waiting for realtime status...");
  process.exit(1);
}, 10000);
