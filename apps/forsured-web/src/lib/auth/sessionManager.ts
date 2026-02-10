/**
 * Session Manager
 * OAuth 2.0 + RBAC Authentication System
 *
 * Manages user sessions, activity tracking, and session timeout
 */

import { UserSession, AuthError, AuthErrorCode } from './types';
import { tokenManager } from './tokenManager';

/**
 * Session configuration
 */
const SESSION_CONFIG = {
  // Session timeouts
  IDLE_TIMEOUT_MS: 30 * 60 * 1000, // 30 minutes of inactivity
  ABSOLUTE_TIMEOUT_MS: 8 * 60 * 60 * 1000, // 8 hours maximum session

  // Activity check interval
  ACTIVITY_CHECK_INTERVAL_MS: 60 * 1000, // Check every minute

  // Warning before timeout
  IDLE_WARNING_MS: 5 * 60 * 1000, // Warn 5 minutes before idle timeout
};

/**
 * Session event types
 */
export enum SessionEvent {
  ACTIVITY_DETECTED = 'session:activity',
  IDLE_WARNING = 'session:idle_warning',
  IDLE_TIMEOUT = 'session:idle_timeout',
  ABSOLUTE_TIMEOUT = 'session:absolute_timeout',
  SESSION_REFRESHED = 'session:refreshed',
  SESSION_ENDED = 'session:ended',
}

/**
 * Session event listener
 */
type SessionEventListener = (event: SessionEvent, session: UserSession | null) => void;

/**
 * Session Manager Class
 * Handles session lifecycle, timeout, and activity tracking
 */
export class SessionManager {
  private activityCheckInterval: ReturnType<typeof setInterval> | null = null;
  private listeners: SessionEventListener[] = [];
  private lastWarningTime: number = 0;

  /**
   * Initialize session manager
   * Sets up activity tracking and timeout monitoring
   */
  initialize(): void {
    // Set up activity listeners
    this.setupActivityListeners();

    // Start activity check interval
    this.startActivityCheck();

    console.log('Session manager initialized');
  }

  /**
   * Cleanup session manager
   */
  cleanup(): void {
    this.removeActivityListeners();
    this.stopActivityCheck();
    this.listeners = [];
    console.log('Session manager cleaned up');
  }

  /**
   * Set up activity listeners
   * Track user interactions to update last activity timestamp
   */
  private setupActivityListeners(): void {
    // Mouse and keyboard activity
    document.addEventListener('mousemove', this.handleActivity);
    document.addEventListener('mousedown', this.handleActivity);
    document.addEventListener('keydown', this.handleActivity);
    document.addEventListener('scroll', this.handleActivity);
    document.addEventListener('touchstart', this.handleActivity);

    // Page visibility changes
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  /**
   * Remove activity listeners
   */
  private removeActivityListeners(): void {
    document.removeEventListener('mousemove', this.handleActivity);
    document.removeEventListener('mousedown', this.handleActivity);
    document.removeEventListener('keydown', this.handleActivity);
    document.removeEventListener('scroll', this.handleActivity);
    document.removeEventListener('touchstart', this.handleActivity);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }

  /**
   * Handle user activity
   */
  private handleActivity = (): void => {
    this.updateLastActivity();
    this.emitEvent(SessionEvent.ACTIVITY_DETECTED, null);
  };

  /**
   * Handle page visibility change
   */
  private handleVisibilityChange = (): void => {
    if (!document.hidden) {
      // Page became visible - check session validity
      this.checkSessionValidity();
    }
  };

  /**
   * Update last activity timestamp
   */
  private async updateLastActivity(): Promise<void> {
    try {
      const session = await tokenManager.getSession();
      if (session) {
        session.last_activity_at = Date.now();
        sessionStorage.setItem('forsured_user_session', JSON.stringify(session));
      }
    } catch (error) {
      console.error('Failed to update last activity:', error);
    }
  }

  /**
   * Start periodic activity check
   */
  private startActivityCheck(): void {
    if (this.activityCheckInterval) {
      clearInterval(this.activityCheckInterval);
    }

    this.activityCheckInterval = setInterval(
      () => this.checkSessionValidity(),
      SESSION_CONFIG.ACTIVITY_CHECK_INTERVAL_MS
    );
  }

  /**
   * Stop activity check
   */
  private stopActivityCheck(): void {
    if (this.activityCheckInterval) {
      clearInterval(this.activityCheckInterval);
      this.activityCheckInterval = null;
    }
  }

  /**
   * Check session validity
   * Checks for idle timeout and absolute timeout
   */
  private async checkSessionValidity(): Promise<void> {
    try {
      const session = await tokenManager.getSession();
      if (!session) {
        return;
      }

      const now = Date.now();
      const idleTime = now - session.last_activity_at;
      const sessionDuration = now - session.created_at;

      // Check absolute timeout
      if (sessionDuration >= SESSION_CONFIG.ABSOLUTE_TIMEOUT_MS) {
        await this.handleTimeout(SessionEvent.ABSOLUTE_TIMEOUT, session);
        return;
      }

      // Check idle timeout
      if (idleTime >= SESSION_CONFIG.IDLE_TIMEOUT_MS) {
        await this.handleTimeout(SessionEvent.IDLE_TIMEOUT, session);
        return;
      }

      // Check if we should warn about idle timeout
      const timeUntilIdleTimeout = SESSION_CONFIG.IDLE_TIMEOUT_MS - idleTime;
      if (
        timeUntilIdleTimeout <= SESSION_CONFIG.IDLE_WARNING_MS &&
        now - this.lastWarningTime > SESSION_CONFIG.IDLE_WARNING_MS
      ) {
        this.lastWarningTime = now;
        this.emitEvent(SessionEvent.IDLE_WARNING, session);
      }
    } catch (error) {
      console.error('Session validity check failed:', error);
    }
  }

  /**
   * Handle session timeout
   */
  private async handleTimeout(event: SessionEvent, session: UserSession): Promise<void> {
    this.emitEvent(event, session);

    // Clear session
    await tokenManager.clearTokens();
    this.emitEvent(SessionEvent.SESSION_ENDED, null);
  }

  /**
   * Refresh session
   * Extends session by refreshing access token
   */
  async refreshSession(): Promise<void> {
    try {
      // Get valid access token (will refresh if needed)
      await tokenManager.getValidAccessToken();

      // Update last activity
      await this.updateLastActivity();

      const session = await tokenManager.getSession();
      this.emitEvent(SessionEvent.SESSION_REFRESHED, session);
    } catch (error) {
      console.error('Session refresh failed:', error);
      throw this.createAuthError(
        AuthErrorCode.REFRESH_FAILED,
        'Failed to refresh session'
      );
    }
  }

  /**
   * Get session status
   */
  async getSessionStatus(): Promise<{
    isActive: boolean;
    idleTimeMs: number;
    sessionDurationMs: number;
    timeUntilIdleTimeoutMs: number;
    timeUntilAbsoluteTimeoutMs: number;
  }> {
    const session = await tokenManager.getSession();

    if (!session) {
      return {
        isActive: false,
        idleTimeMs: 0,
        sessionDurationMs: 0,
        timeUntilIdleTimeoutMs: 0,
        timeUntilAbsoluteTimeoutMs: 0,
      };
    }

    const now = Date.now();
    const idleTimeMs = now - session.last_activity_at;
    const sessionDurationMs = now - session.created_at;

    return {
      isActive: true,
      idleTimeMs,
      sessionDurationMs,
      timeUntilIdleTimeoutMs: Math.max(0, SESSION_CONFIG.IDLE_TIMEOUT_MS - idleTimeMs),
      timeUntilAbsoluteTimeoutMs: Math.max(
        0,
        SESSION_CONFIG.ABSOLUTE_TIMEOUT_MS - sessionDurationMs
      ),
    };
  }

  /**
   * Add event listener
   */
  addEventListener(listener: SessionEventListener): () => void {
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Emit session event
   */
  private emitEvent(event: SessionEvent, session: UserSession | null): void {
    this.listeners.forEach(listener => {
      try {
        listener(event, session);
      } catch (error) {
        console.error('Session event listener error:', error);
      }
    });
  }

  /**
   * Create standardized AuthError
   */
  private createAuthError(code: AuthErrorCode, message: string): AuthError {
    return { code, message };
  }
}

/**
 * Singleton instance
 */
export const sessionManager = new SessionManager();
