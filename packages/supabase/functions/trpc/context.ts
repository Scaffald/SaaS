import { createClient } from "@supabase/supabase-js";

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
  console.log("Auth header present:", !!authorizationHeader);

  // Create Supabase client with user's auth for permission checks
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    global: {
      headers: authorizationHeader
        ? { Authorization: authorizationHeader }
        : {},
    },
  });

  // Create admin client without auth header for elevated operations
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  let userId: string | undefined;
  let userEmail: string | undefined;
  let userToken: string | undefined;

  if (authorizationHeader) {
    const token = authorizationHeader.replace("Bearer ", "");
    userToken = token;
    console.log("Token extracted:", !!token);

    try {
      // Use Supabase's built-in user verification
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);

      if (error) {
        console.error("Auth error:", error.message);
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
    }
  } else {
    console.log("No authorization header found");
  }

  console.log(
    "Final user context:",
    userId ? { id: userId, email: userEmail } : "undefined",
  );
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
