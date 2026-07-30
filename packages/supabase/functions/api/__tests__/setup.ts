/**
 * Test Setup and Utilities for REST API
 * Provides helpers for testing REST endpoints with auth support
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Environment variables for testing
export const TEST_SUPABASE_URL = Deno.env.get("EXPO_PUBLIC_SUPABASE_URL") ||
  Deno.env.get("SUPABASE_URL") ||
  "http://127.0.0.1:54321";

export const TEST_SUPABASE_ANON_KEY =
  Deno.env.get("EXPO_PUBLIC_SUPABASE_ANON_KEY") ||
  Deno.env.get("SUPABASE_ANON_KEY") ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

export const TEST_SUPABASE_SERVICE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

export const TEST_MAILPIT_URL = "http://127.0.0.1:54324";

export const TEST_API_BASE_URL = `${TEST_SUPABASE_URL}/functions/v1/api`;

/**
 * Create a Supabase client for testing
 */
export function createTestSupabaseClient(authToken?: string): SupabaseClient {
  const headers: Record<string, string> = authToken
    ? { Authorization: `Bearer ${authToken}` }
    : {};

  return createClient(TEST_SUPABASE_URL, TEST_SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers },
  });
}

/**
 * Create an admin Supabase client
 */
export function createAdminClient(): SupabaseClient {
  return createClient(TEST_SUPABASE_URL, TEST_SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Test user credentials
 */
export const TEST_USERS = {
  regular: {
    email: "test-api@example.com",
    password: "testpassword123",
  },
  admin: {
    email: "admin-api@example.com",
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
  const supabase = createTestSupabaseClient();

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
 * Fetch with timeout protection
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 5000,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Clean up test data after tests
 */
export async function cleanupTestData() {
  const admin = createAdminClient();

  try {
    // Clean up in dependency order (applications before jobs)
    await admin.schema("core").from("applications").delete().gte(
      "created_at",
      "2020-01-01",
    );
    await admin.schema("core").from("jobs").delete().like("title", "Test%");
    await admin.schema("core").from("api_key_usage").delete().gte(
      "created_at",
      "2020-01-01",
    );
    await admin.schema("core").from("api_keys").delete().like("name", "Test%");
  } catch (error) {
    console.error("Error cleaning up test data:", error);
  }
}

/**
 * Inbucket/Mailpit email structure
 */
export interface MailpitEmail {
  id: string;
  from: string;
  to: string[];
  subject: string;
  date: string;
  body?: {
    text?: string;
    html?: string;
  };
}

/**
 * Get latest email from Mailpit for a specific recipient
 */
export async function getLatestEmail(
  recipient: string,
  timeoutMs = 5000,
): Promise<MailpitEmail | null> {
  const startTime = Date.now();
  const pollInterval = 500;

  while (Date.now() - startTime < timeoutMs) {
    try {
      const remainingTime = timeoutMs - (Date.now() - startTime);
      if (remainingTime < pollInterval) {
        break;
      }

      const response = await fetchWithTimeout(
        `${TEST_MAILPIT_URL}/api/v1/messages`,
        {},
        Math.min(2000, remainingTime),
      );

      if (!response.ok) {
        if (Date.now() - startTime + pollInterval < timeoutMs) {
          await new Promise((resolve) => setTimeout(resolve, pollInterval));
        }
        continue;
      }

      const data = await response.json();
      const emails = data.messages || [];

      const recipientEmails = emails.filter((
        email: { To: { Address: string }[] },
      ) =>
        email.To?.some((to: { Address: string }) => to.Address === recipient)
      );

      if (!recipientEmails.length) {
        if (Date.now() - startTime + pollInterval < timeoutMs) {
          await new Promise((resolve) => setTimeout(resolve, pollInterval));
        }
        continue;
      }

      const latestEmail = recipientEmails[0];
      const emailResponse = await fetchWithTimeout(
        `${TEST_MAILPIT_URL}/api/v1/message/${latestEmail.ID}`,
        {},
        Math.min(2000, timeoutMs - (Date.now() - startTime)),
      );

      if (!emailResponse.ok) {
        throw new Error(
          `Failed to fetch email details: ${emailResponse.status}`,
        );
      }

      const emailData = await emailResponse.json();

      return {
        id: emailData.ID,
        from: emailData.From?.Address || "",
        to: emailData.To?.map((t: { Address: string }) => t.Address) || [],
        subject: emailData.Subject,
        date: emailData.Date,
        body: {
          text: emailData.Text,
          html: emailData.HTML,
        },
      };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        if (Date.now() - startTime + pollInterval < timeoutMs) {
          await new Promise((resolve) => setTimeout(resolve, pollInterval));
          continue;
        }
      }
      if (Date.now() - startTime + pollInterval < timeoutMs) {
        console.error("Error fetching email:", error);
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
      }
    }
  }

  throw new Error(`Email not received within ${timeoutMs}ms for ${recipient}`);
}

/**
 * Extract magic link from email HTML
 */
export function extractMagicLinkFromEmail(emailHtml: string): string | null {
  const linkMatch = emailHtml.match(
    /href="([^"]*(?:\/auth\/v1\/(?:verify|confirm)|token_hash)[^"]*)"/i,
  );

  if (linkMatch?.[1]) {
    const decodedLink = linkMatch[1]
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"');

    return decodedLink;
  }

  return null;
}

/**
 * Complete magic link authentication and get session token
 */
export async function completeMagicLinkAuth(
  magicLink: string,
): Promise<{ token: string; userId: string } | null> {
  try {
    const url = new URL(magicLink);
    const token = url.searchParams.get("token");
    const type = url.searchParams.get("type");

    if (!token || !type) {
      console.error("Missing token or type in magic link");
      return null;
    }

    const supabase = createTestSupabaseClient();

    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: type as "signup" | "magiclink" | "email",
    });

    if (error) {
      console.error("Error verifying OTP:", error);
      return null;
    }

    if (!data.session?.access_token || !data.user?.id) {
      console.error("No access token or user ID in session");
      return null;
    }

    return {
      token: data.session.access_token,
      userId: data.user.id,
    };
  } catch (error) {
    console.error("Error completing magic link auth:", error);
    return null;
  }
}

/**
 * Register user with magic link and get token
 */
export async function registerUserWithMagicLink(
  email: string,
): Promise<{ token: string; userId: string } | null> {
  const supabase = createTestSupabaseClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
    },
  });

  if (error) {
    console.error("Error requesting magic link:", error);
    return null;
  }

  await new Promise((resolve) => setTimeout(resolve, 1000));

  const emailData = await getLatestEmail(email);

  if (!emailData?.body?.html) {
    console.error("No email received in Mailpit");
    return null;
  }

  const magicLink = extractMagicLinkFromEmail(emailData.body.html);

  if (!magicLink) {
    console.error("Could not extract magic link from email");
    return null;
  }

  return await completeMagicLinkAuth(magicLink);
}

/**
 * Test database state management
 */
let testStartTime: number;

export function markTestStart() {
  testStartTime = Date.now();
}

export function getTestStartTime(): number {
  return testStartTime;
}

/**
 * Global test hooks
 */
export function setupTestHooks() {
  // `Deno.test` is always defined when the Deno global is, so testing its
  // truthiness was dead code (TS2774). Checking the global alone carries the
  // intended meaning: record the run's start time when loaded under Deno, so
  // cleanup knows which rows and auth users this run created.
  if (typeof Deno !== "undefined") {
    markTestStart();
  }
}

// Auto-setup when module loads
setupTestHooks();
