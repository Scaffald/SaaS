import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { initSentry, Sentry } from "../_shared/sentry.ts";
import { createTRPCContext } from "./context.ts";
import { type AppRouter, appRouter } from "./routers/_app.ts";

// Export the router type for client-side usage
export type { AppRouter };

initSentry();

const releaseVersion = Deno.env.get("SENTRY_RELEASE") ??
  Deno.env.get("RELEASE_VERSION");

if (releaseVersion) {
  Sentry.configureScope((scope) => {
    scope.setTag("release", releaseVersion);
  });
}

/**
 * Supabase Edge Function for tRPC
 * Handles all tRPC requests with proper CORS support
 */
Deno.serve(async (req: Request) => {
  // CORS headers to be applied to all responses
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-trpc-source",
  };

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const response = await fetchRequestHandler({
      endpoint: "/trpc",
      req,
      router: appRouter,
      createContext: createTRPCContext,
      batching: {
        enabled: true,
      },
    });

    // Add CORS headers to the response
    const headers = new Headers(response.headers);
    for (const [key, value] of Object.entries(corsHeaders)) {
      headers.set(key, value);
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch (error) {
    console.error("tRPC handler error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        ...corsHeaders
      },
    });
  }
});
