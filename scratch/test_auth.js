import { createClient } from "@supabase/supabase-js";

const url = "https://slskxkxsfavjtbfzgewn.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsc2t4a3hzZmF2anRiZnpnZXduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MTQxMTAsImV4cCI6MjEwMTQ5MDExMH0.hj8anD5rFNXAvsAVjXOeWFDhPZkDM6cfHQWtrPbtJ_s";

const supabase = createClient(url, key, { auth: { persistSession: false }, realtime: { disabled: true } });

async function testAuth() {
  console.log("Testing Supabase auth endpoint connection...");
  const { data, error } = await supabase.auth.signInWithPassword({
    email: "chowdmahesh640@gmail.com",
    password: "invalid_test_password"
  });

  console.log("==========================================");
  if (error) {
    console.log("Auth Error Response Code:", error.status || error.name);
    console.log("Auth Error Message:", error.message);
  } else {
    console.log("Auth Success Data:", data);
  }
  console.log("==========================================");
}

testAuth();
