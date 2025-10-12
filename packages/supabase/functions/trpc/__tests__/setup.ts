/**
 * Test Setup and Utilities
 * Provides helpers for testing tRPC endpoints
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Environment variables for testing
export const TEST_SUPABASE_URL = Deno.env.get("SUPABASE_URL") ||
  "http://127.0.0.1:54321";
export const TEST_SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
export const TEST_SUPABASE_SERVICE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
  "";

/**
 * Create a Supabase client for testing
 */
export function createTestClient(
  authToken?: string,
): SupabaseClient {
  const headers: Record<string, string> = authToken
    ? { Authorization: `Bearer ${authToken}` }
    : {};

  return createClient(TEST_SUPABASE_URL, TEST_SUPABASE_ANON_KEY, {
    global: { headers },
  });
}

/**
 * Create an admin Supabase client
 */
export function createAdminClient(): SupabaseClient {
  return createClient(TEST_SUPABASE_URL, TEST_SUPABASE_SERVICE_KEY);
}

/**
 * Test user credentials
 */
export const TEST_USERS = {
  regular: {
    email: "test@example.com",
    password: "testpassword123",
  },
  admin: {
    email: "admin@example.com",
    password: "adminpassword123",
  },
};

/**
 * Sign in and get auth token
 */
export async function getAuthToken(
  email: string,
  password: string,
): Promise<string | null> {
  const supabase = createTestClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Auth error:", error);
    return null;
  }

  return data.session?.access_token || null;
}

/**
 * Create tRPC context for testing
 */
export function createTestContext(authToken?: string) {
  const supabase = createTestClient(authToken);
  const supabaseAdmin = createAdminClient();

  return {
    supabase,
    supabaseAdmin,
    user: null, // Will be populated by auth middleware
  };
}

/**
 * Make a tRPC request via HTTP
 */
export async function callTRPCEndpoint(
  path: string,
  input?: unknown,
  authToken?: string,
) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const url = input
    ? `${TEST_SUPABASE_URL}/functions/v1/trpc/${path}?input=${
      encodeURIComponent(JSON.stringify({ 0: input }))
    }`
    : `${TEST_SUPABASE_URL}/functions/v1/trpc/${path}`;

  const response = await fetch(url, {
    method: "GET",
    headers,
  });

  return response.json();
}

/**
 * Clean up test data
 */
export async function cleanupTestData() {
  const admin = createAdminClient();

  // Clean up test jobs, applications, etc.
  await admin.from("applications").delete().like("user_id", "%");
  await admin.from("jobs").delete().like("title", "Test%");
}
