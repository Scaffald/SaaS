// Test RLS with JWT token
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "http://127.0.0.1:54321";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwOi8vMTI3LjAuMC4xOjU0MzIxL2F1dGgvdjEiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcxMTY0NDAwMCwiZXhwIjoxODY5NDEwNDAwfQ.qf0oF8fBEz4zQgQ3RvJLzFsTFxZqf";
const userToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwOi8vMTI3LjAuMC4xOjU0MzIxL2F1dGgvdjEiLCJzdWIiOiJiNjZlZGMwZS1iOWNiLTQ0NmQtODRjMS1iOTU5NTI1MWY3ZWEiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzU5NzA1NTM2LCJpYXQiOjE3NTk3MDE5MzYsImVtYWlsIjoiY2xheUB1bmljb3JuLmxvdmUiLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6Imdvb2dsZSIsInByb3ZpZGVycyI6WyJnb29nbGUiXX0sInVzZXJfbWV0YWRhdGEiOnsiYXZhdGFyX3VybCI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0pGcGwxUEZXS0hVVURoM29tM3ZQZzZYZ1AzbEtfQ1JhODhUVk9URTZxbUl1cUZMWV9PPXM5Ni1jIiwiY3VzdG9tX2NsYWltcyI6eyJoZCI6InVuaWNvcm4ubG92ZSJ9LCJlbWFpbCI6ImNsYXlAdW5pY29ybi5sb3ZlIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZ1bGxfbmFtZSI6IkNsYXkgVW5pY29ybiIsImlzcyI6Imh0dHBzOi8vYWNjb3VudHMuZ29vZ2xlLmNvbSIsIm5hbWUiOiJDbGF5IFVuaWNvcm4iLCJwaG9uZV92ZXJpZmllZCI6ZmFsc2UsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NKRnBsMVBGV0tIVVVEaDNvbTN2UGc2WGdQM2xLX0NSYTg4VFZPVEU2cW1JdXFGTFlfTz1zOTYtYyIsInByb3ZpZGVyX2lkIjoiMTEyOTEwMjk2NDc1ODYyMTgxODA0Iiwic3ViIjoiMTEyOTEwMjk2NDc1ODYyMTgxODA0In0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoib2F1dGgiLCJ0aW1lc3RhbXAiOjE3NTk3MDE5MzZ9XSwic2Vzc2lvbl9pZCI6IjhiOGQ5MGRhLTkxNWQtNGNiMS05ZTVmLWU5NTdjYzFmZjUzYiIsImlzX2Fub255bW91cyI6ZmFsc2V9.oRAu_soXIU82-pzTJglSlbFh4s-t_2lj_tAPPc_fnMc";

async function testRLS() {
  console.log("Testing RLS with JWT...\n");

  // Create client with anon key and user token
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  // Check auth context
  const { data: authData, error: authError } = await client.auth.getUser();
  console.log("Auth check:", {
    hasUser: !!authData?.user,
    userId: authData?.user?.id,
    email: authData?.user?.email,
    error: authError?.message,
  });

  // Try to insert
  const { data, error } = await client.from("user_skills").insert({
    user_id: "b66edc0e-b9cb-446d-84c1-b9595251f7ea",
    skill_id: "1f901e6b-880d-5af9-aa91-83bc5cf6e6e5",
    proficiency: 3,
    source: "self",
  });

  console.log("\nInsert result:", {
    success: !!data && !error,
    hasData: !!data,
    hasError: !!error,
    errorCode: error?.code,
    errorMessage: error?.message,
    errorDetails: error?.details,
    errorHint: error?.hint,
  });

  if (error) {
    console.log("\n Full error object:", JSON.stringify(error, null, 2));
  }
}

testRLS().catch(console.error);
