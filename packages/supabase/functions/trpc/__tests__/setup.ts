/**
 * Test Setup and Utilities
 * Provides helpers for testing tRPC endpoints with auth support
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
export const TOKENS_FIXTURE_PATH = "./tokens.json";

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

  // tRPC batch format: ?batch=1&input={"0":...}
  const url = input
    ? `${TEST_SUPABASE_URL}/functions/v1/trpc/${path}?batch=1&input=${
      encodeURIComponent(JSON.stringify({ "0": input }))
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

/**
 * Cached token structure
 */
export interface CachedTokens {
  regular: {
    token: string;
    email: string;
    userId: string;
    expiresAt: number;
  };
  admin: {
    token: string;
    email: string;
    userId: string;
    expiresAt: number;
  };
  cachedAt: number;
}

/**
 * Load cached tokens from fixture file
 */
export async function loadCachedTokens(): Promise<CachedTokens | null> {
  try {
    const content = await Deno.readTextFile(TOKENS_FIXTURE_PATH);
    return JSON.parse(content);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return null;
    }
    throw error;
  }
}

/**
 * Save tokens to fixture file
 */
export async function saveCachedTokens(tokens: CachedTokens): Promise<void> {
  // Ensure fixtures directory exists
  try {
    await Deno.mkdir("./packages/supabase/functions/trpc/__tests__/fixtures", {
      recursive: true,
    });
  } catch (error) {
    if (!(error instanceof Deno.errors.AlreadyExists)) {
      throw error;
    }
  }

  await Deno.writeTextFile(
    TOKENS_FIXTURE_PATH,
    JSON.stringify(tokens, null, 2),
  );
}

/**
 * Check if a token is expired
 */
export function isTokenExpired(expiresAt: number): boolean {
  // Add 60 second buffer to avoid edge cases
  return Date.now() >= (expiresAt - 60000);
}

/**
 * Inbucket email structure
 */
export interface InbucketEmail {
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
  maxRetries = 10,
  retryDelay = 500,
): Promise<InbucketEmail | null> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      // Get list of emails from Mailpit
      const response = await fetch(
        `${TEST_MAILPIT_URL}/api/v1/messages`,
      );

      if (!response.ok) {
        if (i < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
          continue;
        }
        return null;
      }

      const data = await response.json();
      const emails = data.messages || [];

      // Filter emails for this recipient
      const recipientEmails = emails.filter((
        email: { To: { Address: string }[] },
      ) =>
        email.To?.some((to: { Address: string }) => to.Address === recipient)
      );

      if (!recipientEmails.length) {
        if (i < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
          continue;
        }
        return null;
      }

      // Get the latest email (first in list)
      const latestEmail = recipientEmails[0];
      const emailResponse = await fetch(
        `${TEST_MAILPIT_URL}/api/v1/message/${latestEmail.ID}`,
      );

      if (!emailResponse.ok) {
        return null;
      }

      const emailData = await emailResponse.json();

      // Transform Mailpit format to our interface
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
      console.error(`Error fetching email (attempt ${i + 1}):`, error);
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        continue;
      }
      return null;
    }
  }

  return null;
}

/**
 * Extract magic link from email HTML
 */
export function extractMagicLinkFromEmail(emailHtml: string): string | null {
  // Look for the auth verification link in the email
  // Matches: /auth/v1/verify, /auth/v1/confirm, or token_hash parameter
  const linkMatch = emailHtml.match(
    /href="([^"]*(?:\/auth\/v1\/(?:verify|confirm)|token_hash)[^"]*)"/i,
  );

  if (linkMatch && linkMatch[1]) {
    // Decode HTML entities (&amp; -> &)
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
 * Returns both token and user ID
 */
export async function completeMagicLinkAuth(
  magicLink: string,
): Promise<{ token: string; userId: string } | null> {
  try {
    // Use Supabase client to verify the OTP token
    const url = new URL(magicLink);
    const token = url.searchParams.get("token");
    const type = url.searchParams.get("type");

    if (!token || !type) {
      console.error("Missing token or type in magic link");
      return null;
    }

    const supabase = createTestClient();

    // Verify the OTP
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
  const supabase = createTestClient();

  // Request magic link
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

  // Wait for email to arrive
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Get email from Mailpit
  const emailData = await getLatestEmail(email);

  if (!emailData?.body?.html) {
    console.error("No email received in Mailpit");
    return null;
  }

  // Extract magic link
  const magicLink = extractMagicLinkFromEmail(emailData.body.html);

  if (!magicLink) {
    console.error("Could not extract magic link from email");
    return null;
  }

  // Complete authentication
  return await completeMagicLinkAuth(magicLink);
}

/**
 * Login existing user with magic link
 */
export async function loginUserWithMagicLink(
  email: string,
): Promise<{ token: string; userId: string } | null> {
  const supabase = createTestClient();

  // Request magic link (won't create new user)
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
    },
  });

  if (error) {
    console.error("Error requesting magic link:", error);
    return null;
  }

  // Wait for email to arrive
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Get email from Mailpit
  const emailData = await getLatestEmail(email);

  if (!emailData?.body?.html) {
    console.error("No email received in Mailpit");
    return null;
  }

  // Extract magic link
  const magicLink = extractMagicLinkFromEmail(emailData.body.html);

  if (!magicLink) {
    console.error("Could not extract magic link from email");
    return null;
  }

  // Complete authentication
  return await completeMagicLinkAuth(magicLink);
}

/**
 * Get user ID from token
 */
export async function getUserIdFromToken(
  token: string,
): Promise<string | null> {
  const supabase = createTestClient();

  // Set the session with the token
  const { data: sessionData, error: sessionError } = await supabase.auth
    .setSession({
      access_token: token,
      refresh_token: "", // Not needed for verification
    });

  if (sessionError || !sessionData.user) {
    console.error("Error setting session:", sessionError);
    return null;
  }

  return sessionData.user.id;
}
