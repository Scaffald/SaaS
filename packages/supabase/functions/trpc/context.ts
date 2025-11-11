import { createClient } from "@supabase/supabase-js";

import { Sentry } from "../_shared/sentry.ts";

// Environment variables
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
// Try multiple possible anon key env var names
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ??
  Deno.env.get("SUPABASE_KEY") ??
  Deno.env.get("ANON_KEY") ?? "";

// Debug: Log key availability
console.log("Environment check:", {
  hasUrl: !!supabaseUrl,
  hasServiceKey: !!supabaseServiceKey,
  hasAnonKey: !!supabaseAnonKey,
  anonKeyLength: supabaseAnonKey.length,
  url: supabaseUrl,
  // Log first few chars of keys to verify they're loading
  serviceKeyPrefix: supabaseServiceKey.substring(0, 12),
  anonKeyPrefix: supabaseAnonKey.substring(0, 12),
});

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

  // Create Supabase client - use anon key for public access (respects RLS)
  // Use service_role key only for authenticated user requests
  const supabaseKey = (userId && !isAnonKey)
    ? supabaseServiceKey
    : supabaseAnonKey;
  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: authorizationHeader && !isAnonKey && userId
        ? { Authorization: authorizationHeader }
        : {},
    },
  });

  // Create admin client without auth header for elevated operations
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  console.log(
    "Final user context:",
    userId ? { id: userId, email: userEmail } : "undefined",
  );

  if (Sentry.getCurrentHub().getClient()) {
    if (userId) {
      Sentry.setUser({
        id: userId,
        email: userEmail ?? undefined,
      });
    } else {
      Sentry.setUser(null);
    }

    Sentry.setContext("request", {
      procedureUserId: userId,
      hasAuthorizationHeader: Boolean(authorizationHeader),
      isAnonKey,
    });
  }

  return {
    user: userId ? { id: userId, email: userEmail } : undefined,
    userToken,
    supabase,
    supabaseAdmin, // Admin client without user auth
  };
};

// Export environment variables for use in routers
export { supabaseAnonKey, supabaseUrl };

// Export type for context
export type Context = Awaited<ReturnType<typeof createTRPCContext>>;
