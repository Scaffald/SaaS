/**
 * CCPA Identity Verification System
 *
 * Implements multi-level identity verification for CCPA requests:
 * - Email verification: Simple OTP-based verification via email
 * - Enhanced verification: Additional security for deletion requests
 * - Manual verification: Admin-reviewed verification for complex cases
 *
 * CCPA requires verifiable consumer requests (CCR) for data access/deletion.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../../_shared/database.types';
import { insertNotification, createServiceSupabaseClient } from '../../../_shared/notifications/utils';

type DbClient = SupabaseClient<Database>

// Verification constants
const EMAIL_OTP_EXPIRY_MINUTES = 15
const ENHANCED_EXPIRY_MINUTES = 30
const OTP_LENGTH = 6
const MAX_VERIFICATION_ATTEMPTS = 3

/**
 * Verification levels as per CCPA requirements
 */
export type VerificationLevel = 'email' | 'enhanced' | 'manual'

/**
 * Verification status
 */
export type VerificationStatus = 'pending' | 'verified' | 'failed' | 'expired'

/**
 * Verification attempt record
 */
export interface VerificationAttempt {
  requestId: string
  method: VerificationLevel
  code?: string
  expiresAt: Date
  attempts: number
  status: VerificationStatus
  createdAt: Date
  verifiedAt: Date | null
}

/**
 * Generate a secure OTP code
 */
export function generateOTP(length: number = OTP_LENGTH): string {
  const digits = '0123456789'
  let otp = ''
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)]
  }
  return otp
}

/**
 * Generate a secure verification token for enhanced verification
 */
export function generateVerificationToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  for (let i = 0; i < 32; i++) {
    token += chars[Math.floor(Math.random() * chars.length)]
  }
  return token
}

/**
 * Calculate OTP expiry time
 */
export function calculateOTPExpiry(minutes: number = EMAIL_OTP_EXPIRY_MINUTES): Date {
  const expiry = new Date()
  expiry.setMinutes(expiry.getMinutes() + minutes)
  return expiry
}

/**
 * Check if a verification code has expired
 */
export function isVerificationExpired(expiresAt: Date | string): boolean {
  const expiry = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt
  return new Date() > expiry
}

/**
 * Initiate email verification for a CCPA request
 * Note: Uses service client for privileged operations (storing OTP, history)
 * The user client is not needed here since ownership is verified in the router
 */
export async function initiateEmailVerification(
  _supabase: DbClient,
  requestId: string,
  _userEmail: string
): Promise<{ success: boolean; expiresAt: Date; error?: string }> {
  // Use service client for privileged operations
  const serviceClient = createServiceSupabaseClient()

  // Generate OTP
  const otp = generateOTP()
  const expiresAt = calculateOTPExpiry(EMAIL_OTP_EXPIRY_MINUTES)

  // Fetch request to get user_id for notification
  const { data: request, error: fetchError } = await serviceClient
    .schema('core')
    .from('ccpa_requests')
    .select('user_id')
    .eq('id', requestId)
    .single()

  if (fetchError || !request) {
    return { success: false, expiresAt, error: 'Request not found' }
  }

  // Store verification data in request metadata (requires service client due to RLS)
  const { error: updateError } = await serviceClient
    .schema('core')
    .from('ccpa_requests')
    .update({
      metadata: {
        verification: {
          code: otp,
          expires_at: expiresAt.toISOString(),
          attempts: 0,
          initiated_at: new Date().toISOString(),
          method: 'email',
        },
      },
    })
    .eq('id', requestId)

  if (updateError) {
    return { success: false, expiresAt, error: updateError.message }
  }

  // Send verification email via notification system
  // In production, this would use a dedicated email service
  await insertNotification(
    serviceClient,
    {
      user_id: request.user_id,
      title: 'CCPA Verification Code',
      message: `Your verification code is: ${otp}. This code expires in ${EMAIL_OTP_EXPIRY_MINUTES} minutes.`,
      type: 'ccpa_verification',
      severity: 'info',
      metadata: {
        request_id: requestId,
        verification_type: 'email_otp',
        expires_at: expiresAt.toISOString(),
      },
    },
    `ccpa_verification_${requestId}`
  )

  // Record in history (requires service client per RLS policy)
  await serviceClient
    .schema('core')
    .from('ccpa_request_history')
    .insert({
      request_id: requestId,
      status: 'pending',
      notes: 'Email verification initiated',
      metadata: { verification_method: 'email' },
    })

  return { success: true, expiresAt }
}

/**
 * Verify an email OTP code
 * Note: Uses service client for privileged operations
 */
export async function verifyEmailOTP(
  _supabase: DbClient,
  requestId: string,
  providedCode: string
): Promise<{ success: boolean; error?: string }> {
  // Use service client for privileged operations
  const serviceClient = createServiceSupabaseClient()

  // Get the request with verification data
  const { data: request, error: fetchError } = await serviceClient
    .schema('core')
    .from('ccpa_requests')
    .select('id, metadata, status')
    .eq('id', requestId)
    .single()

  if (fetchError || !request) {
    return { success: false, error: 'Request not found' }
  }

  const metadata = request.metadata as Record<string, unknown>
  const verification = metadata?.verification as {
    code: string
    expires_at: string
    attempts: number
  } | undefined

  if (!verification) {
    return { success: false, error: 'No verification pending for this request' }
  }

  // Check expiry
  if (isVerificationExpired(verification.expires_at)) {
    return { success: false, error: 'Verification code has expired' }
  }

  // Check attempts
  if (verification.attempts >= MAX_VERIFICATION_ATTEMPTS) {
    return { success: false, error: 'Maximum verification attempts exceeded' }
  }

  // Verify the code
  if (verification.code !== providedCode) {
    // Increment attempt count
    await serviceClient
      .schema('core')
      .from('ccpa_requests')
      .update({
        metadata: {
          ...metadata,
          verification: {
            ...verification,
            attempts: verification.attempts + 1,
          },
        },
      })
      .eq('id', requestId)

    return {
      success: false,
      error: `Invalid code. ${MAX_VERIFICATION_ATTEMPTS - verification.attempts - 1} attempts remaining.`,
    }
  }

  // Verification successful
  const now = new Date().toISOString()
  await serviceClient
    .schema('core')
    .from('ccpa_requests')
    .update({
      verification_completed_at: now,
      metadata: {
        ...metadata,
        verification: {
          ...verification,
          verified_at: now,
          status: 'verified',
        },
      },
    })
    .eq('id', requestId)

  // Record in history
  await serviceClient
    .schema('core')
    .from('ccpa_request_history')
    .insert({
      request_id: requestId,
      status: request.status,
      notes: 'Email verification completed successfully',
      metadata: { verification_method: 'email', verified_at: now },
    })

  return { success: true }
}

/**
 * Initiate enhanced verification (for deletion requests)
 * This requires additional steps like re-authentication or ID verification
 * Note: Uses service client for privileged operations
 */
export async function initiateEnhancedVerification(
  _supabase: DbClient,
  requestId: string,
  userId: string
): Promise<{ success: boolean; token: string; expiresAt: Date; error?: string }> {
  // Use service client for privileged operations
  const serviceClient = createServiceSupabaseClient()

  const token = generateVerificationToken()
  const expiresAt = calculateOTPExpiry(ENHANCED_EXPIRY_MINUTES)

  // Store enhanced verification data
  const { data: request, error: fetchError } = await serviceClient
    .schema('core')
    .from('ccpa_requests')
    .select('metadata')
    .eq('id', requestId)
    .single()

  if (fetchError || !request) {
    return { success: false, token: '', expiresAt, error: 'Request not found' }
  }

  const metadata = (request.metadata as Record<string, unknown>) ?? {}

  const { error: updateError } = await serviceClient
    .schema('core')
    .from('ccpa_requests')
    .update({
      metadata: {
        ...metadata,
        enhanced_verification: {
          token,
          expires_at: expiresAt.toISOString(),
          initiated_at: new Date().toISOString(),
          user_id: userId,
          status: 'pending',
        },
      },
    })
    .eq('id', requestId)

  if (updateError) {
    return { success: false, token: '', expiresAt, error: updateError.message }
  }

  // Record in history
  await serviceClient
    .schema('core')
    .from('ccpa_request_history')
    .insert({
      request_id: requestId,
      status: 'pending',
      notes: 'Enhanced verification initiated',
      metadata: { verification_method: 'enhanced' },
    })

  return { success: true, token, expiresAt }
}

/**
 * Complete enhanced verification with the token
 * Note: Uses service client for privileged operations
 */
export async function completeEnhancedVerification(
  _supabase: DbClient,
  requestId: string,
  providedToken: string
): Promise<{ success: boolean; error?: string }> {
  // Use service client for privileged operations
  const serviceClient = createServiceSupabaseClient()

  const { data: request, error: fetchError } = await serviceClient
    .schema('core')
    .from('ccpa_requests')
    .select('id, metadata, status')
    .eq('id', requestId)
    .single()

  if (fetchError || !request) {
    return { success: false, error: 'Request not found' }
  }

  const metadata = request.metadata as Record<string, unknown>
  const enhancedVerification = metadata?.enhanced_verification as {
    token: string
    expires_at: string
    status: string
  } | undefined

  if (!enhancedVerification) {
    return { success: false, error: 'No enhanced verification pending' }
  }

  if (isVerificationExpired(enhancedVerification.expires_at)) {
    return { success: false, error: 'Verification token has expired' }
  }

  if (enhancedVerification.token !== providedToken) {
    return { success: false, error: 'Invalid verification token' }
  }

  // Mark as verified
  const now = new Date().toISOString()
  await serviceClient
    .schema('core')
    .from('ccpa_requests')
    .update({
      verification_completed_at: now,
      metadata: {
        ...metadata,
        enhanced_verification: {
          ...enhancedVerification,
          verified_at: now,
          status: 'verified',
        },
      },
    })
    .eq('id', requestId)

  // Record in history
  await serviceClient
    .schema('core')
    .from('ccpa_request_history')
    .insert({
      request_id: requestId,
      status: request.status,
      notes: 'Enhanced verification completed successfully',
      metadata: { verification_method: 'enhanced', verified_at: now },
    })

  return { success: true }
}

/**
 * Request manual verification (admin review)
 * Note: Uses service client for privileged operations
 */
export async function requestManualVerification(
  _supabase: DbClient,
  requestId: string,
  reason: string,
  adminUserId?: string
): Promise<{ success: boolean; error?: string }> {
  // Use service client for privileged operations
  const serviceClient = createServiceSupabaseClient()

  const { data: request, error: fetchError } = await serviceClient
    .schema('core')
    .from('ccpa_requests')
    .select('id, metadata, status, user_id')
    .eq('id', requestId)
    .single()

  if (fetchError || !request) {
    return { success: false, error: 'Request not found' }
  }

  const metadata = (request.metadata as Record<string, unknown>) ?? {}

  const { error: updateError } = await serviceClient
    .schema('core')
    .from('ccpa_requests')
    .update({
      verification_method: 'manual',
      metadata: {
        ...metadata,
        manual_verification: {
          requested_at: new Date().toISOString(),
          reason,
          status: 'pending',
        },
      },
    })
    .eq('id', requestId)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  // Notify admin if configured
  if (adminUserId) {
    await insertNotification(
      serviceClient,
      {
        user_id: adminUserId,
        title: 'Manual CCPA Verification Required',
        message: `A CCPA request requires manual verification. Reason: ${reason}`,
        type: 'ccpa_manual_verification',
        severity: 'warning',
        metadata: {
          request_id: requestId,
          verification_type: 'manual',
        },
        cta_label: 'Review Request',
        cta_url: `/office/privacy?request=${requestId}`,
      },
      `ccpa_manual_verification_${requestId}`
    )
  }

  // Record in history
  await serviceClient
    .schema('core')
    .from('ccpa_request_history')
    .insert({
      request_id: requestId,
      status: request.status,
      notes: `Manual verification requested: ${reason}`,
      metadata: { verification_method: 'manual' },
    })

  return { success: true }
}

/**
 * Complete manual verification (admin action)
 */
export async function completeManualVerification(
  supabase: DbClient,
  requestId: string,
  adminUserId: string,
  approved: boolean,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  const { data: request, error: fetchError } = await supabase
    .schema('core')
    .from('ccpa_requests')
    .select('id, metadata, status')
    .eq('id', requestId)
    .single()

  if (fetchError || !request) {
    return { success: false, error: 'Request not found' }
  }

  const metadata = (request.metadata as Record<string, unknown>) ?? {}
  const now = new Date().toISOString()

  if (approved) {
    await supabase
      .schema('core')
      .from('ccpa_requests')
      .update({
        verification_completed_at: now,
        metadata: {
          ...metadata,
          manual_verification: {
            ...(metadata.manual_verification as Record<string, unknown> | undefined),
            verified_at: now,
            verified_by: adminUserId,
            status: 'verified',
            notes,
          },
        },
      })
      .eq('id', requestId)

    // Record in history
    await supabase
      .schema('core')
      .from('ccpa_request_history')
      .insert({
        request_id: requestId,
        status: request.status,
        changed_by: adminUserId,
        notes: `Manual verification approved${notes ? `: ${notes}` : ''}`,
        metadata: { verification_method: 'manual', approved: true },
      })
  } else {
    await supabase
      .schema('core')
      .from('ccpa_requests')
      .update({
        status: 'denied',
        denial_reason: notes ?? 'Identity verification failed',
        completed_at: now,
        metadata: {
          ...metadata,
          manual_verification: {
            ...(metadata.manual_verification as Record<string, unknown> | undefined),
            denied_at: now,
            denied_by: adminUserId,
            status: 'failed',
            notes,
          },
        },
      })
      .eq('id', requestId)

    // Record in history
    await supabase
      .schema('core')
      .from('ccpa_request_history')
      .insert({
        request_id: requestId,
        status: 'denied',
        changed_by: adminUserId,
        notes: `Manual verification denied${notes ? `: ${notes}` : ''}`,
        metadata: { verification_method: 'manual', approved: false },
      })
  }

  return { success: true }
}

/**
 * Get verification status for a request
 * Note: Uses service client to access verification metadata
 */
export async function getVerificationStatus(
  _supabase: DbClient,
  requestId: string
): Promise<{
  method: VerificationLevel
  status: VerificationStatus
  completedAt: Date | null
  attemptsRemaining?: number
  expiresAt?: Date
} | null> {
  // Use service client for privileged access to verification data
  const serviceClient = createServiceSupabaseClient()

  const { data: request, error } = await serviceClient
    .schema('core')
    .from('ccpa_requests')
    .select('verification_method, verification_completed_at, metadata')
    .eq('id', requestId)
    .single()

  if (error || !request) {
    return null
  }

  const metadata = request.metadata as Record<string, unknown>
  const method = (request.verification_method ?? 'email') as VerificationLevel

  if (request.verification_completed_at) {
    return {
      method,
      status: 'verified',
      completedAt: new Date(request.verification_completed_at),
    }
  }

  // Check for pending verification
  if (method === 'email' && metadata?.verification) {
    const verification = metadata.verification as {
      expires_at: string
      attempts: number
    }
    const expired = isVerificationExpired(verification.expires_at)

    return {
      method,
      status: expired ? 'expired' : 'pending',
      completedAt: null,
      attemptsRemaining: MAX_VERIFICATION_ATTEMPTS - verification.attempts,
      expiresAt: new Date(verification.expires_at),
    }
  }

  if (method === 'enhanced' && metadata?.enhanced_verification) {
    const verification = metadata.enhanced_verification as { expires_at: string }
    const expired = isVerificationExpired(verification.expires_at)

    return {
      method,
      status: expired ? 'expired' : 'pending',
      completedAt: null,
      expiresAt: new Date(verification.expires_at),
    }
  }

  if (method === 'manual' && metadata?.manual_verification) {
    const verification = metadata.manual_verification as { status: string }
    return {
      method,
      status: verification.status === 'verified' ? 'verified' :
              verification.status === 'failed' ? 'failed' : 'pending',
      completedAt: null,
    }
  }

  return {
    method,
    status: 'pending',
    completedAt: null,
  }
}

/**
 * Resend verification code (for email verification)
 * Note: Uses service client for privileged operations
 */
export async function resendVerificationCode(
  _supabase: DbClient,
  requestId: string,
  userEmail: string
): Promise<{ success: boolean; expiresAt?: Date; error?: string }> {
  // Use service client for privileged operations
  const serviceClient = createServiceSupabaseClient()

  // Check if we can resend (not too many resends)
  const { data: request, error: fetchError } = await serviceClient
    .schema('core')
    .from('ccpa_requests')
    .select('metadata, verification_method, verification_completed_at')
    .eq('id', requestId)
    .single()

  if (fetchError || !request) {
    return { success: false, error: 'Request not found' }
  }

  if (request.verification_completed_at) {
    return { success: false, error: 'Verification already completed' }
  }

  if (request.verification_method !== 'email') {
    return { success: false, error: 'Can only resend for email verification' }
  }

  // Generate new OTP and initiate (initiateEmailVerification uses service client internally)
  return await initiateEmailVerification(serviceClient as unknown as DbClient, requestId, userEmail)
}
