/**
 * useAuthAudit - Authentication Event Audit Hook
 *
 * REQ-130: Email Communication Auditability - Auth Audit Component
 *
 * Captures authentication events for complete audit trail:
 * - Magic link request (when user enters email)
 * - Magic link used (when user clicks link and logs in)
 * - Session refresh
 * - Logout
 *
 * This enables complete auditability of authentication flows,
 * including Supabase-managed magic link emails.
 */

import { useCallback } from 'react'
import { useAuditLog } from '../lib/audit/useAuditLog'

/**
 * Authentication audit event types
 */
export type AuthAuditAction =
  | 'magic_link_requested'
  | 'magic_link_used'
  | 'session_refreshed'
  | 'logout'
  | 'login_success'
  | 'login_failure'

/**
 * Auth audit metadata
 */
export interface AuthAuditMetadata {
  email?: string
  auth_method?: 'magic_link' | 'oauth' | 'password'
  provider?: string
  session_id?: string
  failure_reason?: string
  ip_address?: string
  user_agent?: string
}

/**
 * Hook for auditing authentication events
 *
 * @example
 * ```tsx
 * const { auditMagicLinkRequest, auditLoginSuccess } = useAuthAudit()
 *
 * // When user submits email for magic link
 * const handleSubmit = async (email: string) => {
 *   await auditMagicLinkRequest(email)
 *   await supabase.auth.signInWithOtp({ email })
 * }
 *
 * // In auth callback after successful login
 * useEffect(() => {
 *   if (session?.user) {
 *     auditLoginSuccess(session.user.id, session.user.email)
 *   }
 * }, [session])
 * ```
 */
export function useAuthAudit() {
  const { logEvent } = useAuditLog()

  /**
   * Audit magic link request
   * Call when user submits email for magic link authentication
   */
  const auditMagicLinkRequest = useCallback(
    async (email: string) => {
      await logEvent({
        category: 'authentication',
        action: 'magic_link_requested',
        severity: 'info',
        metadata: {
          email,
          auth_method: 'magic_link',
          requested_at: new Date().toISOString(),
        },
      })
    },
    [logEvent]
  )

  /**
   * Audit magic link used successfully
   * Call in auth callback when user clicks magic link and logs in
   */
  const auditMagicLinkUsed = useCallback(
    async (userId: string, email?: string, sessionId?: string) => {
      await logEvent({
        category: 'authentication',
        action: 'login_success',
        severity: 'info',
        user_id: userId,
        metadata: {
          email,
          auth_method: 'magic_link',
          session_id: sessionId,
          authenticated_at: new Date().toISOString(),
        },
      })
    },
    [logEvent]
  )

  /**
   * Audit successful login (any method)
   */
  const auditLoginSuccess = useCallback(
    async (
      userId: string,
      email?: string,
      authMethod: AuthAuditMetadata['auth_method'] = 'magic_link'
    ) => {
      await logEvent({
        category: 'authentication',
        action: 'login_success',
        severity: 'info',
        user_id: userId,
        status: 'success',
        metadata: {
          email,
          auth_method: authMethod,
          login_at: new Date().toISOString(),
        },
      })
    },
    [logEvent]
  )

  /**
   * Audit failed login attempt
   */
  const auditLoginFailure = useCallback(
    async (email: string, reason: string) => {
      await logEvent({
        category: 'authentication',
        action: 'login_failure',
        severity: 'medium',
        status: 'failure',
        metadata: {
          email,
          failure_reason: reason,
          attempted_at: new Date().toISOString(),
        },
      })
    },
    [logEvent]
  )

  /**
   * Audit session refresh
   */
  const auditSessionRefresh = useCallback(
    async (userId: string, sessionId?: string) => {
      await logEvent({
        category: 'authentication',
        action: 'session_refreshed',
        severity: 'info',
        user_id: userId,
        metadata: {
          session_id: sessionId,
          refreshed_at: new Date().toISOString(),
        },
      })
    },
    [logEvent]
  )

  /**
   * Audit logout
   */
  const auditLogout = useCallback(
    async (userId: string, reason?: 'user_initiated' | 'session_expired' | 'forced') => {
      await logEvent({
        category: 'authentication',
        action: 'logout',
        severity: 'info',
        user_id: userId,
        metadata: {
          logout_reason: reason || 'user_initiated',
          logged_out_at: new Date().toISOString(),
        },
      })
    },
    [logEvent]
  )

  return {
    auditMagicLinkRequest,
    auditMagicLinkUsed,
    auditLoginSuccess,
    auditLoginFailure,
    auditSessionRefresh,
    auditLogout,
  }
}

/**
 * Standalone functions for server-side auth audit logging
 * Use these in API routes and auth callbacks
 */
export const authAuditActions = {
  /**
   * Log magic link request (server-side)
   */
  async logMagicLinkRequest(email: string): Promise<void> {
    // Import dynamically to avoid circular deps
    const { auditService } = await import('../lib/audit')
    await auditService.log({
      category: 'authentication',
      action: 'magic_link_requested',
      severity: 'info',
      metadata: {
        email,
        auth_method: 'magic_link',
        requested_at: new Date().toISOString(),
      },
    })
  },

  /**
   * Log successful login (server-side)
   */
  async logLoginSuccess(
    userId: string,
    email?: string,
    authMethod: 'magic_link' | 'oauth' | 'password' = 'magic_link'
  ): Promise<void> {
    const { auditService } = await import('../lib/audit')
    await auditService.log({
      category: 'authentication',
      action: 'login_success',
      severity: 'info',
      user_id: userId,
      status: 'success',
      metadata: {
        email,
        auth_method: authMethod,
        login_at: new Date().toISOString(),
      },
    })
  },

  /**
   * Log failed login (server-side)
   */
  async logLoginFailure(email: string, reason: string): Promise<void> {
    const { auditService } = await import('../lib/audit')
    await auditService.log({
      category: 'authentication',
      action: 'login_failure',
      severity: 'medium',
      status: 'failure',
      metadata: {
        email,
        failure_reason: reason,
        attempted_at: new Date().toISOString(),
      },
    })
  },

  /**
   * Log logout (server-side)
   */
  async logLogout(
    userId: string,
    reason: 'user_initiated' | 'session_expired' | 'forced' = 'user_initiated'
  ): Promise<void> {
    const { auditService } = await import('../lib/audit')
    await auditService.log({
      category: 'authentication',
      action: 'logout',
      severity: 'info',
      user_id: userId,
      metadata: {
        logout_reason: reason,
        logged_out_at: new Date().toISOString(),
      },
    })
  },
}
