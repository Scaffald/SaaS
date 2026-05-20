import { z } from 'zod'

export const eventSchemas = {
  auth_magic_link_requested: z.object({
    email_domain: z.string(),
    mode: z.string().nullable().optional(),
  }),
  auth_magic_link_failed: z.object({
    email_domain: z.string().nullable().optional(),
    error_code: z.string().nullable().optional(),
    message: z.string().nullable().optional(),
  }),
  auth_password_signin_succeeded: z.object({
    email_domain: z.string().nullable().optional(),
  }),
  auth_password_signin_failed: z.object({
    email_domain: z.string().nullable().optional(),
    message: z.string().nullable().optional(),
  }),
  auth_social_sign_in_started: z.object({
    provider: z.enum(['google', 'apple']),
  }),
  // Web only: the OAuth flow has been initiated (Supabase returned a redirect
  // URL) but the round-trip has not completed yet. Used to distinguish "user
  // tapped but Supabase rejected" from "user is still in the consent flow".
  auth_social_sign_in_initiated: z.object({
    provider: z.enum(['google', 'apple']),
  }),
  auth_social_sign_in_succeeded: z.object({
    provider: z.enum(['google', 'apple']),
  }),
  auth_social_sign_in_failed: z.object({
    provider: z.enum(['google', 'apple']),
    error_code: z.string().nullable().optional(),
    message: z.string().nullable().optional(),
  }),
  // SC-60: the OAuth callback (/auth/callback) received an error response
  // from Supabase (e.g. expired Apple client secret, redirect-URI mismatch).
  auth_callback_failed: z.object({
    error: z.string().nullable().optional(),
    error_code: z.string().nullable().optional(),
    error_description: z.string().nullable().optional(),
  }),
  // SC-60: the login screen showed the user a toast for an OAuth callback
  // error that would otherwise have been silent.
  auth_callback_error_surfaced: z.object({
    error: z.string().nullable().optional(),
    error_code: z.string().nullable().optional(),
    error_description: z.string().nullable().optional(),
  }),
  // SC-62: manual identity-linking funnel for the connected-accounts UI.
  // `_initiated` fires when supabase-js has returned the OAuth URL and is
  // about to navigate; the matching success event comes from the callback
  // round-trip back to the settings page.
  auth_identity_link_started: z.object({
    provider: z.enum(['google', 'apple']),
  }),
  auth_identity_link_initiated: z.object({
    provider: z.enum(['google', 'apple']),
  }),
  auth_identity_link_failed: z.object({
    provider: z.enum(['google', 'apple']),
    error_code: z.string().nullable().optional(),
    message: z.string().nullable().optional(),
  }),
  auth_identity_unlink_started: z.object({
    provider: z.string(),
  }),
  auth_identity_unlink_succeeded: z.object({
    provider: z.string(),
  }),
  auth_identity_unlink_failed: z.object({
    provider: z.string(),
    error_code: z.string().nullable().optional(),
    message: z.string().nullable().optional(),
  }),
  // SC-62 Phase 3: shown once when an Apple-relay-email user lands post-signup.
  auth_apple_relay_banner_shown: z.object({}),
  auth_apple_relay_banner_dismissed: z.object({
    action: z.enum(['dismiss', 'sign_out']),
  }),
  user_signed_in: z.object({
    provider: z.string(),
    is_new_user: z.boolean(),
    has_anonymous_history: z.boolean().optional(),
  }),
  user_signed_out: z.object({
    reason: z.enum(['sign_out', 'session_timeout', 'auth_cleared', 'consent_revoked', 'unknown']),
  }),
  job_viewed: z.object({
    job_id: z.string(),
    is_external: z.boolean(),
    organization_id: z.string().nullable().optional(),
  }),
  job_external_link_clicked: z.object({
    job_id: z.string(),
    url: z.string().nullable().optional(),
  }),
  map_profile_hover_card_opened: z.object({
    pin_type: z.enum(['worker', 'organization', 'job']),
    recentered: z.boolean(),
    trigger: z.literal('click'),
    viewport: z.enum(['desktop', 'mobile']),
    reason: z.enum(['edge', 'forced']).optional(),
  }),
} as const

export type AnalyticsEventName = keyof typeof eventSchemas

export type AnalyticsEventProperties<TName extends AnalyticsEventName = AnalyticsEventName> =
  z.infer<(typeof eventSchemas)[TName]>

export const validateEventProperties = <TName extends AnalyticsEventName>(
  name: TName,
  properties: unknown
) => {
  const schema = eventSchemas[name]
  return schema.safeParse(properties)
}

export const assertValidEventProperties = <TName extends AnalyticsEventName>(
  name: TName,
  properties: unknown
) => {
  return eventSchemas[name].parse(properties)
}
