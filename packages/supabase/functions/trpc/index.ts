import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { initTRPC, TRPCError } from '@trpc/server'
import { createClient } from '@supabase/supabase-js'
import {
  profileGeneralSchema,
  profileUpdateSchema,
  userPrivateUpdateSchema,
} from '../_shared/schemas/profile.ts'
import type { ProfileUpdate, UserPrivateUpdate } from '../_shared/types.ts'

// Environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

// Create tRPC context
const createTRPCContext = async (opts: { req: Request }) => {
  const authorizationHeader = opts.req.headers.get('authorization')
  console.log('Auth header present:', !!authorizationHeader)

  // Create Supabase client with auth context
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: authorizationHeader ? { Authorization: authorizationHeader } : {},
    },
  })

  let userId: string | undefined
  let userToken: string | undefined

  if (authorizationHeader) {
    const token = authorizationHeader.replace('Bearer ', '')
    userToken = token
    console.log('Token extracted:', !!token)

    try {
      // Use Supabase's built-in user verification
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token)

      if (error) {
        console.error('Auth error:', error.message)
      } else if (user) {
        userId = user.id
        console.log('User authenticated:', user.id)
      } else {
        console.log('No user found')
      }
    } catch (error) {
      console.error('Error getting user:', error.message)
    }
  } else {
    console.log('No authorization header found')
  }

  console.log('Final user context:', userId ? { id: userId } : 'undefined')
  return {
    user: userId ? { id: userId } : undefined,
    userToken,
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
      userToken: ctx.userToken,
      supabase: ctx.supabase,
    },
  })
})

const protectedProcedure = t.procedure.use(enforceUserIsAuthed)

// Profile router
const profileRouter = t.router({
  getGeneral: protectedProcedure.query(async ({ ctx }) => {
    const { supabase, user, userToken } = ctx

    // Get auth user data for email using the token explicitly
    const { data: authUser, error: authError } = await supabase.auth.getUser(userToken)

    if (authError) {
      console.error('Error fetching auth user:', authError.message)
    }

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

    console.log('Auth user email:', authUser?.user?.email)

    return {
      first_name: profile?.first_name || '',
      last_name: profile?.last_name || '',
      avatar_url: profile?.avatar_url || '',
      email: authUser?.user?.email || '',
      phone: privateData?.phone || '',
      about: privateData?.about || '',
    }
  }),

  updateGeneral: protectedProcedure.input(profileGeneralSchema).mutation(async ({ ctx, input }) => {
    const { supabase, user } = ctx

    // Note: Email updates are not supported to avoid authentication issues
    // The email field is read-only and comes from the auth system

    // Build profile update object with only provided fields
    const profileUpdate: ProfileUpdate = {
      id: user.id,
      updated_at: new Date().toISOString(),
    }

    if (input.first_name !== undefined) profileUpdate.first_name = input.first_name
    if (input.last_name !== undefined) profileUpdate.last_name = input.last_name
    if (input.avatar_url !== undefined) profileUpdate.avatar_url = input.avatar_url

    // Update profiles table only if there are fields to update
    if (Object.keys(profileUpdate).length > 2) {
      // More than just id and updated_at
      const { error: profileError } = await supabase.from('profiles').upsert(profileUpdate)

      if (profileError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to update profile: ${profileError.message}`,
        })
      }
    }

    // Build user_private update object with only provided fields
    const privateUpdate: UserPrivateUpdate = {
      user_id: user.id,
      updated_at: new Date().toISOString(),
    }

    if (input.phone !== undefined) privateUpdate.phone = input.phone
    if (input.about !== undefined) privateUpdate.about = input.about

    // Update user_private table only if there are fields to update
    if (Object.keys(privateUpdate).length > 2) {
      // More than just user_id and updated_at
      const { error: privateError } = await supabase.from('user_private').upsert(privateUpdate)

      if (privateError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to update private data: ${privateError.message}`,
        })
      }
    }

    return { success: true }
  }),
})

// App router
const appRouter = t.router({
  profile: profileRouter,
})

// Use Deno.serve() as recommended by Supabase best practices
Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers':
          'authorization, x-client-info, apikey, content-type, x-trpc-source',
      },
    })
  }

  try {
    return await fetchRequestHandler({
      endpoint: '/trpc',
      req,
      router: appRouter,
      createContext: createTRPCContext,
      batching: {
        enabled: true,
      },
    })
  } catch (error) {
    console.error('tRPC handler error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
