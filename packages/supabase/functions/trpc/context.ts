// This file is excluded from expo tsconfig but imported for types
import { createClient } from "@supabase/supabase-js";
import type { Database } from '../_shared/database.types';

const DEFAULT_LOCAL_SUPABASE_URL = "http://127.0.0.1:54321";
const DEFAULT_LOCAL_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
const DEFAULT_LOCAL_SUPABASE_SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const resolvedSupabaseUrl = Deno.env.get("SUPABASE_URL") ??
  Deno.env.get("EXPO_PUBLIC_SUPABASE_URL") ??
  Deno.env.get("SUPABASE_SITE_URL") ??
  "";

const supabaseUrl = resolvedSupabaseUrl.length > 0
  ? resolvedSupabaseUrl
  : DEFAULT_LOCAL_SUPABASE_URL;

const isLocalSupabase = supabaseUrl.includes("127.0.0.1") ||
  supabaseUrl.includes("localhost") ||
  (Deno.env.get("ENVIRONMENT") ?? Deno.env.get("NODE_ENV")) === "development";

const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ??
  Deno.env.get("SUPABASE_KEY") ??
  Deno.env.get("ANON_KEY") ??
  (isLocalSupabase ? DEFAULT_LOCAL_SUPABASE_ANON_KEY : "");

const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
  (isLocalSupabase ? DEFAULT_LOCAL_SUPABASE_SERVICE_KEY : "");

const maskKey = (value: string) => {
  if (!value) return "<missing>";
  if (value.length <= 8) return `${value.substring(0, 4)}…`;
  return `${value.substring(0, 4)}…${value.substring(value.length - 4)}`;
};

// Debug: Log key availability without exposing secrets
console.log("[tRPC context] Environment check", {
  hasUrl: Boolean(supabaseUrl),
  hasServiceKey: Boolean(supabaseServiceKey),
  hasAnonKey: Boolean(supabaseAnonKey),
  url: supabaseUrl,
  serviceKey: maskKey(supabaseServiceKey),
  anonKey: maskKey(supabaseAnonKey),
});

if (!supabaseUrl) {
  throw new Error(
    "[tRPC context] Missing SUPABASE_URL environment variable. Configure it or set EXPO_PUBLIC_SUPABASE_URL.",
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    "[tRPC context] Missing Supabase anon key. Set SUPABASE_ANON_KEY (or SUPABASE_KEY / ANON_KEY).",
  );
}

if (!supabaseServiceKey) {
  throw new Error(
    "[tRPC context] Missing Supabase service role key. Set SUPABASE_SERVICE_ROLE_KEY.",
  );
}

/**
 * Create tRPC context with Supabase client and user authentication
 */
export const createTRPCContext = async (opts: { req: Request }) => {
  const authorizationHeader = opts.req.headers.get("authorization");

  let userId: string | undefined;
  let userEmail: string | undefined;
  let userToken: string | undefined;
  let isAnonKey = false;

  // Extract token if present
  if (authorizationHeader) {
    // Validate Authorization header format
    // Only process if it's properly formatted as "Bearer {token}"
    if (!authorizationHeader.startsWith("Bearer ")) {
      console.error(
        "Invalid authorization header format:",
        authorizationHeader.substring(0, 20),
      );
      // Don't throw - just log and continue without user context
      // This allows public endpoints to work even with malformed headers
    } else {
      const token = authorizationHeader.replace("Bearer ", "").trim();

      // Only process if token is not empty
      if (!token || token.length === 0) {
        console.error("Empty token in Authorization header");
      } else {
        // Check if this is the anon key (used for public endpoints)
        // Supabase Edge Functions require an Authorization header, so clients send anon key for public requests
        isAnonKey = token === supabaseAnonKey;

        if (isAnonKey) {
          console.log(
            "Anon key detected - treating as public/unauthenticated request",
          );
        } else {
          // This looks like a user token, try to authenticate
          userToken = token;
          console.log("Token extracted:", !!token);

          try {
            // Create a temporary client to verify the token
            const tempClient = createClient(supabaseUrl, supabaseAnonKey);
            const {
              data: { user },
              error,
            } = await tempClient.auth.getUser(token);

            if (error) {
              console.error("Auth error:", error.message);
              // Don't throw - just log and continue without user context
              // This allows public endpoints to work even with invalid tokens
            } else if (user) {
              userId = user.id;
              userEmail = user.email;
              console.log("User authenticated:", user.id);
            } else {
              console.log("No user found");
            }
          } catch (error) {
            const errorMessage = error instanceof Error
              ? error.message
              : String(error);
            console.error("Error getting user:", errorMessage);
            // Don't throw - just log and continue without user context
          }
        }
      }
    }
  } else {
    console.log("No authorization header found");
  }

  // Default to anon key client with Authorization header for RLS
  // This respects RLS policies while allowing authenticated operations
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: authorizationHeader && !isAnonKey && userId
        ? { Authorization: authorizationHeader }
        : {},
    },
  });

  // Service client is only created when explicitly needed via role checking
  // Do not create it by default - use role-based middleware instead
  console.log(
    "Final user context:",
    userId ? { id: userId, email: userEmail } : "undefined",
  );

  return {
    user: userId ? { id: userId, email: userEmail } : undefined,
    userToken,
    supabase, // Default client with anon key + auth header (respects RLS)
    // supabaseAdmin is not created by default
    // Use role-based middleware (enforceOfficeRole, etc.) to add it when needed
  };
};

// Export environment variables for use in routers
export { supabaseAnonKey, supabaseServiceKey, supabaseUrl };

// Export type for context
// Note: supabaseAdmin is optional and only added by role-based middleware
export type Context = Awaited<ReturnType<typeof createTRPCContext>> & {
  supabaseAdmin?: ReturnType<typeof createClient<Database>>;
};
