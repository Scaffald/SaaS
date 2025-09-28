import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'

// Define the general profile schema directly to avoid import issues
const generalProfileSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  avatar_url: z.string().url().optional().or(z.literal('')),
  email: z.string().email(),
  phone: z.string().optional(),
  about: z.string().max(500).optional(),
})

export const profileRouter = createTRPCRouter({
  // Get general profile data
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
      throw new Error(`Failed to fetch profile: ${profileError.message}`)
    }

    // Get additional data from user_private table
    const { data: privateData, error: privateError } = await supabase
      .from('user_private')
      .select('phone, about')
      .eq('user_id', user.id)
      .single()

    if (privateError && privateError.code !== 'PGRST116') {
      // PGRST116 is "not found" - acceptable for new users
      throw new Error(`Failed to fetch private data: ${privateError.message}`)
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

  // Update general profile data
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
      throw new Error(`Failed to update profile: ${profileError.message}`)
    }

    // Update user_private table
    const { error: privateError } = await supabase.from('user_private').upsert({
      user_id: user.id,
      phone: input.phone,
      about: input.about,
      updated_at: new Date().toISOString(),
    })

    if (privateError) {
      throw new Error(`Failed to update private data: ${privateError.message}`)
    }

    return { success: true }
  }),
})
