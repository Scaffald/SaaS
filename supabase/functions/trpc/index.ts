import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { fetchRequestHandler } from 'https://esm.sh/@trpc/server@10.45.0/adapters/fetch'
import { initTRPC, TRPCError } from 'https://esm.sh/@trpc/server@10.45.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { z } from 'https://esm.sh/zod@3.22.4'
import * as jose from 'https://esm.sh/jose@5.1.3'

// Environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
const jwtSecret = Deno.env.get('SUPABASE_AUTH_JWT_SECRET') ?? ''

// Create tRPC context
const createTRPCContext = async (opts: { req: Request }) => {
  let supabase = createClient(supabaseUrl, supabaseAnonKey)
  let userId: string | undefined

  const authorizationHeader = opts.req.headers.get('authorization')

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
        console.error('Error parsing JWT', error)
      }
    }

    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authorizationHeader,
        },
      },
    })
  }

  return {
    user: userId ? { id: userId } : undefined,
    supabase,
  }
}

// Initialize tRPC
const t = initTRPC.context<typeof createTRPCContext>().create()

// Middleware for protected procedures
const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({
    ctx: {
      user: { ...ctx.user },
    },
  })
})

const protectedProcedure = t.procedure.use(enforceUserIsAuthed)

// General profile schema
const generalProfileSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  avatar_url: z.string().url().optional().or(z.literal('')),
  email: z.string().email(),
  phone: z.string().optional(),
  about: z.string().max(500).optional(),
})

// Profile router
const profileRouter = t.router({
  getGeneral: protectedProcedure.query(async ({ ctx }) => {
    const { supabase, user } = ctx

    // Get auth user data for email
    const { data: authUser } = await supabase.auth.getUser()

    // Get profile data from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, last_name, avatar_url')
      .eq('id', user.id)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to fetch profile: ${profileError.message}`,
      })
    }

    // Get additional data from user_private table
    const { data: privateData, error: privateError } = await supabase
      .from('user_private')
      .select('phone, about')
      .eq('user_id', user.id)
      .single()

    if (privateError && privateError.code !== 'PGRST116') {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to fetch private data: ${privateError.message}`,
      })
    }

    return {
      first_name: profile?.first_name || '',
      last_name: profile?.last_name || '',
      avatar_url: profile?.avatar_url || '',
      email: authUser.user?.email || '',
      phone: privateData?.phone || '',
      about: privateData?.about || '',
    }
  }),

  updateGeneral: protectedProcedure.input(generalProfileSchema).mutation(async ({ ctx, input }) => {
    const { supabase, user } = ctx

    // Update profiles table
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: user.id,
      first_name: input.first_name,
      last_name: input.last_name,
      avatar_url: input.avatar_url,
      updated_at: new Date().toISOString(),
    })

    if (profileError) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to update profile: ${profileError.message}`,
      })
    }

    // Update user_private table
    const { error: privateError } = await supabase.from('user_private').upsert({
      user_id: user.id,
      phone: input.phone,
      about: input.about,
      updated_at: new Date().toISOString(),
    })

    if (privateError) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to update private data: ${privateError.message}`,
      })
    }

    return { success: true }
  }),
})

// App router
const appRouter = t.router({
  profile: profileRouter,
})

// Handler
const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/trpc',
    req,
    router: appRouter,
    createContext: createTRPCContext,
  })

serve(handler)
