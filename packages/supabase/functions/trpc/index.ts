import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { createTRPCContext } from "./context.ts";
import { type AppRouter, appRouter } from "./routers/_app.ts";

// Export the router type for client-side usage
export type { AppRouter };

/**
 * Supabase Edge Function for tRPC
 * Handles all tRPC requests with proper CORS support
 */
Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type, x-trpc-source",
      },
    });
  }

  try {
    return await fetchRequestHandler({
      endpoint: "/trpc",
      req,
      router: appRouter,
      createContext: createTRPCContext,
      batching: {
        enabled: true,
      },
    });
  } catch (error) {
    console.error("tRPC handler error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
