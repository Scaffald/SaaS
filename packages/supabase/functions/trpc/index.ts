import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { initTRPC, TRPCError } from '@trpc/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import {
  profileGeneralSchema,
  profileEmploymentSchema,
  profileSkillsSchema,
  profileUpdateSchema,
  userPrivateUpdateSchema,
  userPrivateEmploymentUpdateSchema,
} from '../_shared/schemas/profile.ts'
import type {
  ProfileUpdate,
  UserPrivateUpdate,
  UserPrivateEmploymentUpdate,
} from '../_shared/types.ts'

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

  getEmployment: protectedProcedure.query(async ({ ctx }) => {
    const { supabase, user } = ctx

    // Get employment data from user_private table
    const { data: employmentData, error: employmentError } = await supabase
      .from('user_private')
      .select(`
        employment_street,
        employment_city,
        employment_state,
        employment_zip,
        employment_country,
        preferred_work_locations,
        willing_to_travel,
        travel_distance_miles,
        us_resident,
        residency_countries,
        us_passport,
        drivers_license_classes,
        military_status,
        availability,
        hourly_rate
      `)
      .eq('user_id', user.id)
      .single()

    if (employmentError && employmentError.code !== 'PGRST116') {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to fetch employment data: ${employmentError.message}`,
      })
    }

    return {
      address: employmentData
        ? {
            street: employmentData.employment_street || '',
            city: employmentData.employment_city || '',
            state: employmentData.employment_state || '',
            zip: employmentData.employment_zip || '',
            country: employmentData.employment_country || '',
          }
        : null,
      preferred_work_locations: employmentData?.preferred_work_locations || [],
      willing_to_travel: employmentData?.willing_to_travel || false,
      travel_distance_miles: employmentData?.travel_distance_miles || 25,
      us_resident: employmentData?.us_resident || false,
      residency_countries: employmentData?.residency_countries || [],
      us_passport: employmentData?.us_passport || false,
      drivers_license_classes: employmentData?.drivers_license_classes || [],
      military_status: employmentData?.military_status || [],
      availability: employmentData?.availability || [],
      hourly_rate: employmentData?.hourly_rate || null,
    }
  }),

  updateEmployment: protectedProcedure
    .input(profileEmploymentSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx

      // Build employment update object with only provided fields
      const employmentUpdate: UserPrivateEmploymentUpdate = {
        user_id: user.id,
        updated_at: new Date().toISOString(),
      }

      // Handle address components separately
      if (input.address !== undefined) {
        if (input.address.street !== undefined)
          employmentUpdate.employment_street = input.address.street
        if (input.address.city !== undefined) employmentUpdate.employment_city = input.address.city
        if (input.address.state !== undefined)
          employmentUpdate.employment_state = input.address.state
        if (input.address.zip !== undefined) employmentUpdate.employment_zip = input.address.zip
        if (input.address.country !== undefined)
          employmentUpdate.employment_country = input.address.country
      }
      if (input.preferred_work_locations !== undefined) {
        employmentUpdate.preferred_work_locations = input.preferred_work_locations
      }
      if (input.willing_to_travel !== undefined) {
        employmentUpdate.willing_to_travel = input.willing_to_travel
      }
      if (input.travel_distance_miles !== undefined) {
        employmentUpdate.travel_distance_miles = input.travel_distance_miles
      }
      if (input.us_resident !== undefined) {
        employmentUpdate.us_resident = input.us_resident
      }
      if (input.residency_countries !== undefined) {
        employmentUpdate.residency_countries = input.residency_countries
      }
      if (input.us_passport !== undefined) {
        employmentUpdate.us_passport = input.us_passport
      }
      if (input.drivers_license_classes !== undefined) {
        employmentUpdate.drivers_license_classes = input.drivers_license_classes
      }
      if (input.military_status !== undefined) {
        employmentUpdate.military_status = input.military_status
      }
      if (input.availability !== undefined) {
        employmentUpdate.availability = input.availability
      }
      if (input.hourly_rate !== undefined) {
        employmentUpdate.hourly_rate = input.hourly_rate
      }

      // Update user_private table only if there are fields to update
      if (Object.keys(employmentUpdate).length > 2) {
        // More than just user_id and updated_at
        const { error: employmentError } = await supabase
          .from('user_private')
          .upsert(employmentUpdate)

        if (employmentError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to update employment data: ${employmentError.message}`,
          })
        }
      }

      return { success: true }
    }),

  getSkills: protectedProcedure.query(async () => {
    // For now, we'll return mock data since we don't have a skills table yet
    // TODO: Implement actual skills table query using ctx.supabase and ctx.user
    // In a real implementation, you'd query from a user_skills table
    return {
      skills: [],
      primary_industry_id: null,
      secondary_industries: [],
      skill_categories: [],
    }
  }),

  updateSkills: protectedProcedure.input(profileSkillsSchema).mutation(async ({ input }) => {
    // For now, we'll just return success since we don't have a skills table yet
    // TODO: In a real implementation, you'd update the user_skills table using ctx.supabase and ctx.user
    console.log('Skills data to save:', input)

    return { success: true }
  }),

  uploadAvatar: protectedProcedure
    .input(
      z.object({
        file: z.string(), // Base64 encoded file
        fileName: z.string(),
        contentType: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx

      try {
        // Convert base64 to Uint8Array
        const base64Data = input.file.split(',')[1] // Remove data:image/jpeg;base64, prefix
        const binaryString = atob(base64Data)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }

        // Generate unique file name
        const fileExtension = input.fileName.split('.').pop() || 'jpg'
        const uniqueFileName = `${user.id}/avatar-${Date.now()}.${fileExtension}`

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(uniqueFileName, bytes, {
            contentType: input.contentType,
            upsert: true,
          })

        if (uploadError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to upload avatar: ${uploadError.message}`,
          })
        }

        // Store only the file path, not the full URL
        // Client will construct the full URL using their environment variables
        const { error: updateError } = await supabase.from('profiles').upsert({
          id: user.id,
          avatar_url: uniqueFileName, // Store just the file path
          updated_at: new Date().toISOString(),
        })

        if (updateError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to update profile with avatar path: ${updateError.message}`,
          })
        }

        return {
          success: true,
          avatarPath: uniqueFileName, // Return the file path
        }
      } catch (error) {
        console.error('Avatar upload error:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Avatar upload failed: ${error.message}`,
        })
      }
    }),
})

// App router
const appRouter = t.router({
  profile: profileRouter,
})

// Export the router type for client-side usage
export type AppRouter = typeof appRouter

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
