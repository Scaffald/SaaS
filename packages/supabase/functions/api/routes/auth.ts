/**
 * Authentication Routes
 * Handles magic link authentication and user role management
 *
 * Migrated from: packages/supabase/functions/trpc/routers/auth.router.ts
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '../middleware/auth.ts'

const app = new Hono()

// Environment configuration
const MAGIC_LINK_REDIRECT_FALLBACK =
  Deno.env.get('MAGIC_LINK_REDIRECT_URL') ??
  Deno.env.get('EXPO_PUBLIC_URL') ??
  Deno.env.get('SUPABASE_SITE_URL') ??
  Deno.env.get('SITE_URL') ??
  null

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || Deno.env.get('EXPO_PUBLIC_SUPABASE_URL') || ''
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

// ============================================================================
// Validation Schemas
// ============================================================================

const requestMagicLinkSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .transform((value) => value.trim().toLowerCase())
    .describe('User email address'),
  redirectTo: z
    .string()
    .url('Invalid redirect URL')
    .optional()
    .describe('URL to redirect after authentication'),
})

// ============================================================================
// POST /v1/auth/magic-link - Request magic link for login/signup
// ============================================================================

app.post('/magic-link', zValidator('json', requestMagicLinkSchema), async (c) => {
  try {
    const input = c.req.valid('json')
    const supabase = c.get('supabase')
    const email = input.email

    // Determine redirect target
    const redirectTarget = input.redirectTo ?? MAGIC_LINK_REDIRECT_FALLBACK
    if (!redirectTarget) {
      return c.json(
        {
          error: 'Configuration Error',
          message: 'Magic link redirect target is not configured',
        },
        500
      )
    }

    // Create admin client to check if user exists
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Check if user exists
    // Note: Supabase admin API doesn't support email filter directly
    const { data: existingUsers, error: lookupError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    })

    if (lookupError) {
      console.error('[auth.requestMagicLink] Failed to lookup user', {
        email,
        error: lookupError.message,
      })
      return c.json(
        {
          error: 'Internal Server Error',
          message: 'Unable to request magic link',
          details: lookupError.message,
        },
        500
      )
    }

    // Check if email exists in user list
    const isExistingUser = Boolean(
      existingUsers?.users?.some(
        (user: { email?: string | null }) => user.email?.toLowerCase() === email.toLowerCase()
      )
    )

    // Request magic link OTP
    const { error: otpError } = await supabase.auth.signInWithOtp({
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
      return c.json(
        {
          error: 'Internal Server Error',
          message: 'Failed to send magic link email',
          details: otpError.message,
        },
        500
      )
    }

    return c.json(
      {
        data: {
          mode: isExistingUser ? 'login' : 'signup',
          email,
          redirectTo: redirectTarget,
        },
        message: `Magic link sent to ${email}`,
      },
      200
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json(
        {
          error: 'Validation Error',
          message: 'Invalid request data',
          details: error.errors,
        },
        400
      )
    }

    console.error('[auth.requestMagicLink] Unexpected error', error)
    return c.json(
      {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      },
      500
    )
  }
})

// ============================================================================
// GET /v1/auth/roles - Get current user's roles
// ============================================================================

app.get('/roles', requireAuth, async (c) => {
  try {
    const user = c.get('user')
    const supabase = c.get('supabase')

    if (!user) {
      return c.json(
        {
          error: 'Unauthorized',
          message: 'Authentication required',
        },
        401
      )
    }

    // Fetch user roles from database
    const { data, error } = await supabase
      .schema('core')
      .from('role_assignments')
      .select('role:roles(name)')
      .eq('user_id', user.id)

    if (error) {
      console.error('[auth.getUserRoles] Failed to fetch roles', {
        userId: user.id,
        error: error.message,
      })
      return c.json(
        {
          error: 'Internal Server Error',
          message: 'Unable to load user roles',
          details: error.message,
        },
        500
      )
    }

    // Extract role names
    const roles =
      (data as Array<{ role?: { name?: string } | null }> | null)
        ?.map((r) => r.role?.name)
        .filter((name): name is string => Boolean(name)) ?? []

    if (Deno.env.get('NODE_ENV') !== 'production') {
      console.debug('[auth.getUserRoles] Roles fetched', {
        userId: user.id,
        roleCount: roles.length,
      })
    }

    return c.json({
      data: {
        roles,
        userId: user.id,
      },
    })
  } catch (error) {
    console.error('[auth.getUserRoles] Unexpected error', error)
    return c.json(
      {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      },
      500
    )
  }
})

// ============================================================================
// GET /v1/auth/session - Get current session info
// ============================================================================

app.get('/session', requireAuth, async (c) => {
  try {
    const user = c.get('user')
    const supabase = c.get('supabase')

    if (!user) {
      return c.json(
        {
          error: 'Unauthorized',
          message: 'No active session',
        },
        401
      )
    }

    // Get session from Supabase
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error || !session) {
      return c.json(
        {
          error: 'Unauthorized',
          message: 'Invalid or expired session',
        },
        401
      )
    }

    return c.json({
      data: {
        user: {
          id: user.id,
          email: user.email,
          emailVerified: user.email_confirmed_at != null,
          createdAt: user.created_at,
        },
        session: {
          accessToken: session.access_token,
          refreshToken: session.refresh_token,
          expiresAt: session.expires_at,
          expiresIn: session.expires_in,
        },
      },
    })
  } catch (error) {
    console.error('[auth.getSession] Unexpected error', error)
    return c.json(
      {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      },
      500
    )
  }
})

export default app
