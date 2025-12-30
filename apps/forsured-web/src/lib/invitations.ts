// src/lib/invitations.ts
// REQ-126: Broker Invitation System
// REQ-11: Authentication Flow Refinement - Rate limiting
//
// Service for managing broker invitations in Supabase with rate limiting protection

import { forsured } from './supabase'
import { sendBrokerInvitation } from '../services/emailService'

export interface Invitation {
  id: string
  code: string
  email: string | null
  expires_at: string
  max_uses: number
  use_count: number
  created_by: string | null
  created_at: string
  used_by: string | null
  used_at: string | null
  brokerage_name: string | null
  failed_attempts: number
  last_failed_attempt: string | null
  locked_until: string | null
}

// Rate limiting error types
export type InvitationErrorType =
  | 'INVALID_CODE'
  | 'EXPIRED'
  | 'MAX_USES_REACHED'
  | 'EMAIL_MISMATCH'
  | 'CODE_LOCKED'
  | 'RATE_LIMITED'
  | 'UNKNOWN'

export interface InvitationError {
  type: InvitationErrorType
  message: string
  retryAfter?: number // seconds until retry allowed
}

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  // Database level: per-code tracking
  maxFailedAttempts: 10,
  lockDurationMinutes: 60,
  // API level: per-IP tracking (in-memory)
  ipAttemptsPerMinute: 5,
  ipAttemptsPerHour: 10,
  suspiciousThreshold: 20, // log if exceeded per hour
}

// In-memory IP rate limiting (client-side protection)
interface RateLimitEntry {
  attempts: number[]
  hourlyAttempts: number[]
}
const ipRateLimits = new Map<string, RateLimitEntry>()

// Get approximate client identifier (not perfect but adds friction)
function getClientIdentifier(): string {
  // Use a combination of available browser fingerprinting
  const ua = navigator.userAgent
  const lang = navigator.language
  const screen = `${window.screen.width}x${window.screen.height}`
  return btoa(`${ua}-${lang}-${screen}`).slice(0, 20)
}

// Check and update IP-level rate limiting
function checkIpRateLimit(): InvitationError | null {
  const clientId = getClientIdentifier()
  const now = Date.now()
  const oneMinuteAgo = now - 60 * 1000
  const oneHourAgo = now - 60 * 60 * 1000

  let entry = ipRateLimits.get(clientId)
  if (!entry) {
    entry = { attempts: [], hourlyAttempts: [] }
    ipRateLimits.set(clientId, entry)
  }

  // Clean old entries
  entry.attempts = entry.attempts.filter((t) => t > oneMinuteAgo)
  entry.hourlyAttempts = entry.hourlyAttempts.filter((t) => t > oneHourAgo)

  // Check minute limit
  if (entry.attempts.length >= RATE_LIMIT_CONFIG.ipAttemptsPerMinute) {
    const oldestAttempt = Math.min(...entry.attempts)
    const retryAfter = Math.ceil((oldestAttempt + 60 * 1000 - now) / 1000)
    return {
      type: 'RATE_LIMITED',
      message: 'Too many attempts. Please wait before trying again.',
      retryAfter: Math.max(1, retryAfter),
    }
  }

  // Check hourly limit
  if (entry.hourlyAttempts.length >= RATE_LIMIT_CONFIG.ipAttemptsPerHour) {
    const oldestAttempt = Math.min(...entry.hourlyAttempts)
    const retryAfter = Math.ceil((oldestAttempt + 60 * 60 * 1000 - now) / 1000)

    // Log suspicious activity
    if (entry.hourlyAttempts.length >= RATE_LIMIT_CONFIG.suspiciousThreshold) {
      console.warn('[Invitations] Suspicious activity detected:', {
        clientId,
        hourlyAttempts: entry.hourlyAttempts.length,
      })
    }

    return {
      type: 'RATE_LIMITED',
      message: 'Too many attempts this hour. Please try again later.',
      retryAfter: Math.max(1, retryAfter),
    }
  }

  // Record this attempt
  entry.attempts.push(now)
  entry.hourlyAttempts.push(now)

  return null
}

// Validation result type
export interface ValidationResult {
  success: boolean
  invitation?: Invitation
  error?: InvitationError
}

const TABLE_NAME = 'broker_invitations'

/**
 * Validate an invitation code with dual-layer rate limiting
 * @deprecated Use validateInvitationWithRateLimit for detailed error handling
 * Returns the invitation if valid, null if invalid/expired/used up/locked
 */
export async function validateInvitation(code: string): Promise<Invitation | null> {
  const result = await validateInvitationWithRateLimit(code)
  return result.success ? (result.invitation ?? null) : null
}

/**
 * Validate an invitation code with comprehensive rate limiting protection
 * Returns detailed result with invitation or error information
 *
 * Rate limiting layers:
 * 1. Client-side IP tracking (5/min, 10/hour)
 * 2. Database-level per-code tracking (10 failures = 1 hour lockout)
 */
export async function validateInvitationWithRateLimit(
  code: string,
  email?: string
): Promise<ValidationResult> {
  console.log('[Invitations] Validating code with rate limiting:', code)

  // Layer 1: Check client-side rate limiting
  const rateLimitError = checkIpRateLimit()
  if (rateLimitError) {
    console.log('[Invitations] Rate limited by client-side check')
    return { success: false, error: rateLimitError }
  }

  // Fetch the invitation
  const { data, error } = await forsured(TABLE_NAME)
    .select('*')
    .eq('code', code.toUpperCase())
    .single()

  if (error) {
    // PGRST116 means not found
    if (error.code === 'PGRST116') {
      console.log('[Invitations] Code not found')
      return {
        success: false,
        error: {
          type: 'INVALID_CODE',
          message: 'The invitation code you entered is not valid. Please check and try again.',
        },
      }
    }
    console.error('[Invitations] Error validating invitation:', error)
    return {
      success: false,
      error: {
        type: 'UNKNOWN',
        message: 'An error occurred while validating the invitation code. Please try again.',
      },
    }
  }

  if (!data) {
    console.log('[Invitations] No data returned')
    return {
      success: false,
      error: {
        type: 'INVALID_CODE',
        message: 'The invitation code you entered is not valid. Please check and try again.',
      },
    }
  }

  // Layer 2: Check if code is locked (database-level rate limiting)
  if (data.locked_until) {
    const lockedUntil = new Date(data.locked_until)
    if (lockedUntil > new Date()) {
      const retryAfter = Math.ceil((lockedUntil.getTime() - Date.now()) / 1000)
      console.log('[Invitations] Code is locked until:', lockedUntil)
      return {
        success: false,
        error: {
          type: 'CODE_LOCKED',
          message:
            'This invitation code has been locked due to too many failed attempts. Please contact your administrator or try again later.',
          retryAfter,
        },
      }
    }
  }

  // Check if expired
  if (new Date(data.expires_at) < new Date()) {
    console.log('[Invitations] Code expired')
    await recordFailedAttempt(data)
    return {
      success: false,
      error: {
        type: 'EXPIRED',
        message:
          'This invitation code has expired. Please contact your administrator for a new code.',
      },
    }
  }

  // Check if max uses reached
  if (data.use_count >= data.max_uses) {
    console.log('[Invitations] Max uses reached')
    await recordFailedAttempt(data)
    return {
      success: false,
      error: {
        type: 'MAX_USES_REACHED',
        message: 'This invitation code has already been used the maximum number of times.',
      },
    }
  }

  // Check email restriction if applicable
  if (data.email && email && data.email.toLowerCase() !== email.toLowerCase()) {
    console.log('[Invitations] Email mismatch')
    await recordFailedAttempt(data)
    return {
      success: false,
      error: {
        type: 'EMAIL_MISMATCH',
        message: 'This invitation code is assigned to a different email address.',
      },
    }
  }

  // Success! Reset failed attempts
  console.log('[Invitations] Code valid')
  await resetFailedAttempts(data.id)
  return { success: true, invitation: data }
}

/**
 * Record a failed validation attempt for rate limiting
 * Locks the code after maxFailedAttempts
 */
async function recordFailedAttempt(invitation: Invitation): Promise<void> {
  const newFailedAttempts = (invitation.failed_attempts || 0) + 1
  const now = new Date().toISOString()

  const updates: Record<string, unknown> = {
    failed_attempts: newFailedAttempts,
    last_failed_attempt: now,
  }

  // Lock the code if threshold reached
  if (newFailedAttempts >= RATE_LIMIT_CONFIG.maxFailedAttempts) {
    const lockUntil = new Date()
    lockUntil.setMinutes(lockUntil.getMinutes() + RATE_LIMIT_CONFIG.lockDurationMinutes)
    updates.locked_until = lockUntil.toISOString()
    console.warn('[Invitations] Code locked due to too many failed attempts:', {
      code: invitation.code,
      failedAttempts: newFailedAttempts,
      lockedUntil: lockUntil,
    })
  }

  const { error } = await forsured(TABLE_NAME).update(updates).eq('id', invitation.id)

  if (error) {
    console.error('[Invitations] Error recording failed attempt:', error)
  }
}

/**
 * Reset failed attempts after successful validation
 */
async function resetFailedAttempts(invitationId: string): Promise<void> {
  const { error } = await forsured(TABLE_NAME)
    .update({
      failed_attempts: 0,
      last_failed_attempt: null,
      locked_until: null,
    })
    .eq('id', invitationId)

  if (error) {
    console.error('[Invitations] Error resetting failed attempts:', error)
  }
}

/**
 * Mark an invitation as used and increment use count
 */
export async function markInvitationUsed(invitationId: string, profileId: string): Promise<void> {
  console.log('[Invitations] Marking invitation as used:', invitationId)

  // First get current use_count
  const { data: current, error: fetchError } = await forsured(TABLE_NAME)
    .select('use_count')
    .eq('id', invitationId)
    .single()

  if (fetchError) {
    console.error('[Invitations] Error fetching invitation:', fetchError)
    throw fetchError
  }

  // Update with incremented count
  const { error: updateError } = await forsured(TABLE_NAME)
    .update({
      used_by: profileId,
      used_at: new Date().toISOString(),
      use_count: (current?.use_count || 0) + 1,
    })
    .eq('id', invitationId)

  if (updateError) {
    console.error('[Invitations] Error updating invitation:', updateError)
    throw updateError
  }

  console.log('[Invitations] Invitation marked as used')
}

/**
 * Create a new broker invitation
 * Used by admins to generate invitation codes
 */
export async function createInvitation(options: {
  email?: string
  maxUses?: number
  expiresInDays?: number
  createdBy: string
  brokerageName?: string
}): Promise<Invitation> {
  const { email, maxUses = 1, expiresInDays = 30, createdBy, brokerageName } = options

  // Generate a unique code (8 characters, alphanumeric uppercase)
  const code = generateInvitationCode()

  // Calculate expiration date
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + expiresInDays)

  console.log('[Invitations] Creating invitation:', {
    code,
    email,
    maxUses,
    expiresAt,
    brokerageName,
  })

  const { data, error } = await forsured(TABLE_NAME)
    .insert({
      code,
      email: email || null,
      max_uses: maxUses,
      use_count: 0,
      expires_at: expiresAt.toISOString(),
      created_by: createdBy,
      brokerage_name: brokerageName || null,
      failed_attempts: 0,
    })
    .select()
    .single()

  if (error) {
    console.error('[Invitations] Error creating invitation:', error)
    throw error
  }

  console.log('[Invitations] Invitation created successfully')

  // Send invitation email if email address was provided
  if (email) {
    try {
      const emailResult = await sendBrokerInvitation({
        email,
        invitationCode: code,
        expiresAt,
        brokerageName,
      })
      console.log('[Invitations] Invitation email sent:', emailResult.success)
    } catch (emailError) {
      // Log but don't fail - invitation was still created
      console.error('[Invitations] Failed to send invitation email:', emailError)
    }
  }

  return data
}

/**
 * List all invitations (for admin)
 */
export async function listInvitations(): Promise<Invitation[]> {
  const { data, error } = await forsured(TABLE_NAME)
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[Invitations] Error listing invitations:', error)
    throw error
  }

  return data || []
}

/**
 * Revoke an invitation (set max_uses to use_count)
 */
export async function revokeInvitation(invitationId: string): Promise<void> {
  console.log('[Invitations] Revoking invitation:', invitationId)

  const { data: current, error: fetchError } = await forsured(TABLE_NAME)
    .select('use_count')
    .eq('id', invitationId)
    .single()

  if (fetchError) {
    console.error('[Invitations] Error fetching invitation:', fetchError)
    throw fetchError
  }

  const { error: updateError } = await forsured(TABLE_NAME)
    .update({
      max_uses: current?.use_count || 0, // Set max_uses to current use_count to prevent further uses
    })
    .eq('id', invitationId)

  if (updateError) {
    console.error('[Invitations] Error revoking invitation:', updateError)
    throw updateError
  }

  console.log('[Invitations] Invitation revoked')
}

/**
 * Generate a unique 8-character invitation code
 */
function generateInvitationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Removed confusing chars like 0/O, 1/I
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}
