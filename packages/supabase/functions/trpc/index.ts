import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { createTRPCContext } from './context.ts'
import { type AppRouter, appRouter } from './routers/_app.ts'

// Export the router type for client-side usage
export type { AppRouter }

/**
 * Supabase Edge Function for tRPC
 * Handles all tRPC requests with proper CORS support
 */
Deno.serve(async (req: Request) => {
  console.log('[tRPC handler] Request received:', req.method, req.url)

  // CORS headers to be applied to all responses
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type, x-trpc-source',
    'Access-Control-Max-Age': '86400', // Cache preflight for 24 hours
  }

  // Handle CORS preflight requests - MUST return early with explicit 200 status
  if (req.method === 'OPTIONS') {
    console.log('[tRPC handler] CORS preflight')
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  try {
    console.log('[tRPC handler] Calling fetchRequestHandler')
    const response = await fetchRequestHandler({
      endpoint: '/trpc',
      req,
      router: appRouter,
      createContext: createTRPCContext,
      batching: {
        enabled: true,
      },
    })

    // Add CORS headers to the response
    const headers = new Headers(response.headers)
    for (const [key, value] of Object.entries(corsHeaders)) {
      headers.set(key, value)
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    })
  } catch (error) {
    // Log the full error for debugging
    console.error('tRPC handler error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error(
      'Error details:',
      JSON.stringify(
        {
          name: error instanceof Error ? error.name : typeof error,
          message: error instanceof Error ? error.message : String(error),
          cause: error instanceof Error && 'cause' in error ? error.cause : undefined,
        },
        null,
        2
      )
    )

    // Return error details only in development, generic message in production
    const isDevelopment =
      Deno.env.get('ENVIRONMENT') === 'development' ||
      Deno.env.get('DENO_DEPLOYMENT_ID') === undefined

    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorName = error instanceof Error ? error.name : 'UnknownError'

    // In production, return generic error without sensitive details
    const responseBody = isDevelopment
      ? {
          error: 'Internal server error',
          message: errorMessage,
          type: errorName,
        }
      : {
          error: 'Internal server error',
          message: 'An unexpected error occurred. Please try again later.',
        }

    return new Response(JSON.stringify(responseBody), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    })
  }
})
