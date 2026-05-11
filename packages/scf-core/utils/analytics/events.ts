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
  auth_social_sign_in_failed: z.object({
    provider: z.enum(['google', 'apple']),
    error_code: z.string().nullable().optional(),
    message: z.string().nullable().optional(),
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
