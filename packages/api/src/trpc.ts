import type { Database } from '@app/supabase/types'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { TRPCError, initTRPC } from '@trpc/server'
import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch'
import * as jose from 'jose'
import { cookies, type UnsafeUnwrappedCookies } from 'next/headers'
import superJson from 'superjson'

const jwtSecret = process.env.SUPABASE_AUTH_JWT_SECRET

export const createTRPCContext = async (opts: FetchCreateContextFnOptions) => {
  // if there's auth cookie it'll be authenticated by this helper
  const cookiesStore = (await cookies()) as unknown as UnsafeUnwrappedCookies

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) {
    throw new Error('the `NEXT_PUBLIC_SUPABASE_URL` env variable is not set.')
  }

  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseAnonKey) {
    throw new Error('the `NEXT_PUBLIC_SUPABASE_ANON_KEY` env variable is not set.')
  }

  if (!jwtSecret) {
    throw new Error('the `SUPABASE_AUTH_JWT_SECRET` env variable is not set.')
  }

  let supabase = createRouteHandlerClient<Database>({
    cookies: () => cookiesStore as never,
  })
  let userId = (await supabase.auth.getUser()).data.user?.id

  const authorizationHeader = opts.req.headers.get('authorization')

  // Native clients pass an access token in the authorization header
  if (authorizationHeader) {
    const bearerTokenMatch = authorizationHeader.match(/^Bearer\s+(.+)$/i)
    const accessToken = bearerTokenMatch?.[1]

    if (accessToken) {
      try {
        const encoder = new TextEncoder()
        const { payload } = await jose.jwtVerify(accessToken, encoder.encode(jwtSecret))
        if (typeof payload.sub === 'string') {
          userId = payload.sub
        }
      } catch (error) {
        // Leaves userId undefined, which will eventually fail the enforceUserIsAuthed check
        // Might want to log this out for debugging, etc.
        if (error instanceof Error) {
          console.error('Error parsing JWT', error.message)
        }
      }
    }

    supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      // TODO: remove these options from takeout starter
      // auth: {
      //   autoRefreshToken: false,
      //   detectSessionInUrl: false,
      //   persistSession: false,
      // },
      global: {
        headers: {
          // pass the authorization header through to Supabase
          Authorization: authorizationHeader,
        },
      },
    }) as unknown as typeof supabase
  }

  return {
    requestOrigin: opts.req.headers.get('origin'),

    /**
     * The Supabase user
     * More claims from the JWT or Session can be added here if needed inside tRPC procedures
     */
    user: userId ? { id: userId } : undefined,

    /**
     * The Supabase instance with the authenticated session on it (RLS works)
     *
     * You should import `supabaseAdmin` here in case you want to
     * do anything on behalf of the service role (RLS doesn't work - you're admin)
     */
    supabase,
  }
}

// Avoid exporting the entire t-object since it's not very descriptive.
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superJson,
})

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */
export const publicProcedure = t.procedure

/** Reusable middleware that enforces users are logged in before running the procedure. */
const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  return next({
    ctx: {
      // infers the `user` as non-nullable
      user: { ...ctx.user },
    },
  })
})

/**
 * Protected (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use this. It verifies
 * the session is valid and guarantees `ctx.session.user` is not null.
 *
 * @see https://trpc.io/docs/procedures
 */
export const protectedProcedure = t.procedure.use(enforceUserIsAuthed)
