/**
 * Referral Tracking Utilities
 *
 * REQ-128: Flexible Invitation System
 *
 * Client-side utilities for capturing and persisting referral attribution
 * across page loads and signup. Uses cookie + localStorage for redundancy.
 *
 * Key Rule: Referral credit is ONLY awarded on account creation (signup),
 * not on signin. This prevents double attribution.
 */

import { forsured } from '../supabase'
import { auditService } from '../audit/AuditService'
import type { ReferralData } from '../invitations/types'

const COOKIE_NAME = 'fs_ref'
const STORAGE_KEY = 'fs_referral'
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 // 7 days in seconds
const REFERRAL_MAX_AGE = 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds

/**
 * Capture referral from URL params
 * Should be called on landing pages and any page with potential ?ref= params
 */
export function captureReferral(): void {
  if (typeof window === 'undefined') return

  const params = new URLSearchParams(window.location.search)
  const refCode = params.get('ref')
  const refType = params.get('type')

  if (!refCode) return

  const referralData: ReferralData = {
    code: refCode.toUpperCase(),
    type: refType || undefined,
    timestamp: Date.now(),
    landingUrl: window.location.href,
  }

  // Store in cookie (7 days, for cross-device tracking if cookies synced)
  try {
    document.cookie = `${COOKIE_NAME}=${refCode.toUpperCase()}; max-age=${COOKIE_MAX_AGE}; path=/; secure; samesite=lax`
  } catch (e) {
    console.warn('[referral-tracking] Failed to set cookie:', e)
  }

  // Store in localStorage (permanent until signup)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(referralData))
  } catch (e) {
    console.warn('[referral-tracking] Failed to set localStorage:', e)
  }
}

/**
 * Get stored referral data from localStorage
 * Returns null if no referral or if referral has expired
 */
export function getStoredReferral(): ReferralData | null {
  if (typeof window === 'undefined') return null

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null

    const data: ReferralData = JSON.parse(stored)

    // Check if referral is still valid (30 days)
    if (Date.now() - data.timestamp > REFERRAL_MAX_AGE) {
      clearReferral()
      return null
    }

    return data
  } catch {
    return null
  }
}

/**
 * Get referral code from cookie
 * Fallback when localStorage is unavailable
 */
export function getReferralFromCookie(): string | null {
  if (typeof window === 'undefined') return null

  try {
    const cookies = document.cookie.split(';')
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=')
      if (name === COOKIE_NAME) {
        return value
      }
    }
  } catch {
    return null
  }

  return null
}

/**
 * Clear referral data after attribution or expiry
 */
export function clearReferral(): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignore localStorage errors
  }

  try {
    document.cookie = `${COOKIE_NAME}=; max-age=0; path=/`
  } catch {
    // Ignore cookie errors
  }
}

/**
 * Attribute referral on signup (NOT signin)
 *
 * This should be called ONLY when a new user account is created.
 * It looks up the invitation by referral code and creates a referral record
 * crediting the original inviter.
 */
export async function attributeReferralOnSignup(
  newUserId: string
): Promise<{ success: boolean; referrerId?: string; invitationId?: string }> {
  const referralData = getStoredReferral()
  if (!referralData) {
    return { success: false }
  }

  try {
    // Look up the invitation by referral code
    const { data: invitation, error: invError } = await forsured('generic_invitations')
      .select('id, inviter_id, inviter_organization_id')
      .eq('referral_code', referralData.code)
      .single()

    if (invError || !invitation) {
      console.warn('[referral-tracking] Invitation not found for code:', referralData.code)
      clearReferral()
      return { success: false }
    }

    // Check if this new user is the intended invitee (link invitation to user)
    const { error: updateError } = await forsured('generic_invitations')
      .update({ invitee_user_id: newUserId })
      .eq('id', invitation.id)
      .is('invitee_user_id', null)

    if (updateError) {
      console.warn('[referral-tracking] Failed to link invitation to user:', updateError)
    }

    // Audit log the attribution
    await auditService.log({
      category: 'data_modification',
      action: 'referral_attributed_on_signup',
      severity: 'medium',
      user_id: newUserId,
      resource_type: 'generic_invitation',
      resource_id: invitation.id,
      status: 'success',
      metadata: {
        referrerId: invitation.inviter_id,
        referralCode: referralData.code,
        attributionSource: 'cookie',
        landingUrl: referralData.landingUrl,
      },
    })

    // Clear referral data after successful attribution
    clearReferral()

    return {
      success: true,
      referrerId: invitation.inviter_id,
      invitationId: invitation.id,
    }
  } catch (error) {
    console.error('[referral-tracking] Error attributing referral:', error)
    return { success: false }
  }
}

/**
 * Get referral stats for a user
 */
export async function getReferralStats(userId: string): Promise<{
  totalInvitations: number
  acceptedInvitations: number
  pendingInvitations: number
}> {
  try {
    const { data: invitations, error } = await forsured('generic_invitations')
      .select('id, status')
      .eq('inviter_id', userId)

    if (error) throw error

    const total = invitations?.length || 0
    const accepted = invitations?.filter((inv) => inv.status === 'accepted').length || 0
    const pending = invitations?.filter((inv) => inv.status === 'pending').length || 0

    return {
      totalInvitations: total,
      acceptedInvitations: accepted,
      pendingInvitations: pending,
    }
  } catch (error) {
    console.error('[referral-tracking] Error getting referral stats:', error)
    return {
      totalInvitations: 0,
      acceptedInvitations: 0,
      pendingInvitations: 0,
    }
  }
}
