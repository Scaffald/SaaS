// This file uses Deno ESM imports from esm.sh that are not compatible with TypeScript checking
import { TRPCError } from '@trpc/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

import { protectedProcedure, publicProcedure, t } from '../middleware';
import { supabaseServiceKey, supabaseUrl } from '../context';

const MAGIC_LINK_REDIRECT_FALLBACK =
  Deno.env.get('MAGIC_LINK_REDIRECT_URL') ??
  Deno.env.get('EXPO_PUBLIC_URL') ??
  Deno.env.get('SUPABASE_SITE_URL') ??
  Deno.env.get('SITE_URL') ??
  null

const requestMagicLinkInput = z.object({
  email: z
    .string()
    .email()
    .transform((value) => value.trim().toLowerCase()),
  redirectTo: z.string().url().optional(),
})

/**
 * Auth router - handles authentication-related operations
 */
export const authRouter = t.router({
  /**
   * Request a magic link email for login/signup.
   * Determines whether the email belongs to an existing user and calls
   * Supabase OTP flow with the appropriate `shouldCreateUser` flag so
   * Supabase sends the correct email template (signup vs login).
   */
  requestMagicLink: publicProcedure
    .input(requestMagicLinkInput)
    .mutation(async ({ ctx, input }) => {
      const email = input.email

      if (!ctx.supabase) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Supabase client not available',
        })
      }

      const redirectTarget = input.redirectTo ?? MAGIC_LINK_REDIRECT_FALLBACK
      if (!redirectTarget) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Magic link redirect target is not configured',
        })
      }

      // Create admin client for user lookup (needed to check if user exists)
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

      const { data: existingUsers, error: lookupError } =
        await supabaseAdmin.auth.admin.listUsers({
          email,
          page: 1,
          perPage: 1,
        })

      if (lookupError) {
        console.error('[auth.requestMagicLink] Failed to lookup user', {
          email,
          error: lookupError.message,
        })
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Unable to request magic link',
          cause: lookupError,
        })
      }

      const isExistingUser = Boolean(
        existingUsers?.users?.some((user: { email?: string }) => (user.email ?? '').toLowerCase() === email)
      )

      const { error: otpError } = await ctx.supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTarget,
          shouldCreateUser: !isExistingUser,
        },
      })

      if (otpError) {
        console.error('[auth.requestMagicLink] OTP request failed', {
          email,
          error: otpError.message,
        })
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to send magic link email',
          cause: otpError,
        })
      }

      return {
        mode: isExistingUser ? 'login' : 'signup',
        email,
        redirectTo: redirectTarget,
      }
    }),

  /**
   * Get user roles
   * Returns list of roles assigned to the authenticated user
   */
  getUserRoles: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .schema('core')
      .from('role_assignments')
      .select('role:roles(name)')
      .eq('user_id', ctx.user.id)

    if (error) {
      console.error('[auth.getUserRoles] Failed to fetch roles', {
        userId: ctx.user.id,
        error: error.message,
      })
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Unable to load user roles',
        cause: error,
      })
    }

    const roles =
      (data as Array<{ role?: { name?: string } | null }> | null)
        ?.map((r) => r.role?.name)
        .filter((name): name is string => Boolean(name)) ?? []

    if (process.env.NODE_ENV !== 'production') {
      console.debug('[auth.getUserRoles] Roles fetched', {
        userId: ctx.user.id,
        roleCount: roles.length,
      })
    }

    return { roles }
  }),
})
