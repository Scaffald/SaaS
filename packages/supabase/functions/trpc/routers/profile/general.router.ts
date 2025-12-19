import { TRPCError } from '@trpc/server'
import {
  formatPhoneNumber,
  getPhoneRegionCode,
  isValidPhoneNumber,
} from '@scf/trpc/utils'
import {
  type ProfileUpdate,
  profileGeneralInputSchema,
  type UserPrivateUpdate,
} from '@scf/trpc/schemas'
import { protectedProcedure, t } from '../../middleware';

/**
 * Profile General router - handles basic profile information
 */
export const profileGeneralRouter = t.router({
  /**
   * Get current user basic info
   * Returns the authenticated user's ID and basic details
   */
  useUser: protectedProcedure.query(({ ctx }) => {
    const { user } = ctx
    return {
      id: user.id,
      email: user.email,
    }
  }),

  /**
   * Get general profile information
   * Returns user's basic profile data including name, email, phone, about, and address
   */
  getGeneral: protectedProcedure.query(async ({ ctx }) => {
    const { supabase, user, userToken } = ctx

    // Get auth user data for email using the token explicitly
    const { data: authUser, error: authError } = await supabase.auth.getUser(userToken)

    if (authError) {
      console.error('Error fetching auth user:', authError.message)
    }

    // Get profile data from users table (core schema)
    // Note: about is JSONB (rich text field)
    const { data: profile, error: profileError } = await supabase
      .schema('core')
      .from('users')
      .select('avatar_path, about')
      .eq('id', user.id)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to fetch profile: ${profileError.message}`,
      })
    }

    // Get PII data from private.profile table (first_name, last_name, address)
    const { data: privateData, error: privateError } = await supabase
      .schema('core')
      .from('profile')
      .select('first_name, last_name, address, phone')
      .eq('user_id', user.id)
      .single()

    if (privateError && privateError.code !== 'PGRST116') {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to fetch private data: ${privateError.message}`,
      })
    }

    console.log('Auth user email:', authUser?.user?.email)

    const profilePhone = privateData?.phone || authUser?.user?.phone || ''
    const normalizedPhone = profilePhone
      ? (() => {
          const region = getPhoneRegionCode(profilePhone) ?? 'US'
          return isValidPhoneNumber(profilePhone, region)
            ? formatPhoneNumber(profilePhone, region)
            : profilePhone
        })()
      : ''

    return {
      first_name: privateData?.first_name || '',
      last_name: privateData?.last_name || '',
      avatar_path: profile?.avatar_path || '',
      email: authUser?.user?.email || '',
      phone: normalizedPhone,
      about: profile?.about || null,
      address: privateData?.address || null,
    }
  }),

  /**
   * Update general profile information
   * Updates user's basic profile data in users and private.profile tables
   */
  updateGeneral: protectedProcedure
    .input(profileGeneralInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx

      // Note: Email and phone updates are not supported
      // These fields are read-only and come from the auth system

      // Build profile update object with only provided fields (public data)
      const profileUpdate: ProfileUpdate & { about?: unknown } = {
        id: user.id,
        updated_at: new Date().toISOString(),
      }

      if (input.avatar_path !== undefined) {
        profileUpdate.avatar_path = input.avatar_path
      }
      if (input.about !== undefined) {
        // Save to about column (JSONB rich text)
        profileUpdate.about = input.about
      }

      // Update users table only if there are fields to update
      if (Object.keys(profileUpdate).length > 2) {
        // More than just id and updated_at
        const { error: profileError } = await supabase
          .schema('core')
          .from('users')
          .update(profileUpdate)
          .eq('id', user.id)

        if (profileError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to update profile: ${profileError.message}`,
          })
        }
      }

      // Build private.profile update object with only provided fields (PII data)
      const privateUpdate: UserPrivateUpdate & {
        first_name?: string
        last_name?: string
        address?: Record<string, unknown>
        geo?: string
        phone?: string | null
      } = {
        user_id: user.id,
        updated_at: new Date().toISOString(),
      }

      if (input.first_name !== undefined) {
        privateUpdate.first_name = input.first_name
      }
      if (input.last_name !== undefined) {
        privateUpdate.last_name = input.last_name
      }
      if (input.address !== undefined) {
        privateUpdate.address = input.address === null ? undefined : input.address

        // If address has lat/lng, convert to PostGIS POINT for geo field
        if (
          input.address &&
          typeof input.address === 'object' &&
          'latitude' in input.address &&
          'longitude' in input.address &&
          input.address.latitude !== undefined &&
          input.address.longitude !== undefined
        ) {
          // PostGIS POINT format: POINT(longitude latitude)
          privateUpdate.geo = `POINT(${input.address.longitude} ${input.address.latitude})`
        }
      }

      if (input.phone !== undefined) {
        if (!input.phone) {
          privateUpdate.phone = null
        } else {
          const region = getPhoneRegionCode(input.phone) ?? 'US'
          const normalized = isValidPhoneNumber(input.phone, region)
            ? formatPhoneNumber(input.phone, region)
            : input.phone
          privateUpdate.phone = normalized
        }
      }

      // Update private.profile table only if there are fields to update
      if (Object.keys(privateUpdate).length > 2) {
        // More than just user_id and updated_at
        const { error: privateError } = await supabase
          .schema('core')
          .from('profile')
          .upsert(privateUpdate)

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
