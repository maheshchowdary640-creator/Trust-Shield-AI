const url = "https://slskxkxsfavjtbfzgewn.supabase.co/auth/v1/token?grant_type=password";
const apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsc2t4a3hzZmF2anRiZnpnZXduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MTQxMTAsImV4cCI6MjEwMTQ5MDExMH0.hj8anD5rFNXAvsAVjXOeWFDhPZkDM6cfHQWtrPbtJ_s";

async function run() {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "apikey": apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email: "chowdmahesh640@gmail.com",
      password: "invalid_test_password"
    })
  });

  const data = await res.json();
  console.log("==========================================");
  console.log("AUTH RESPONSE STATUS:", res.status);
  console.log("AUTH RESPONSE PAYLOAD:", JSON.stringify(data, null, 2));
  console.log("==========================================");
}

run();
