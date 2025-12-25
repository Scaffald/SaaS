/**
 * usePageView Hook
 *
 * Automatically tracks page views when the route changes.
 * Logs to the audit system for compliance tracking.
 *
 * Usage:
 * ```tsx
 * // In a component that wraps all routes:
 * function PageViewTracker() {
 *   usePageView();
 *   return null;
 * }
 *
 * // In Layout:
 * <PageViewTracker />
 * {children}
 * ```
 *
 * REQ: Phase 4 - Hybrid Audit Logging - Page View Tracking
 */

import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { logAuditEvent, initializeAuditService } from '../lib/audit/AuditService';
import { supabase } from '../lib/supabase';

// Initialize audit service with Supabase client
initializeAuditService(supabase);

interface PageViewOptions {
  /** Whether to track anonymous page views (default: true) */
  trackAnonymous?: boolean;
  /** Paths to exclude from tracking (e.g., ['/health', '/api']) */
  excludePaths?: string[];
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Hook to track page views automatically
 *
 * @param options - Configuration options for page view tracking
 */
export function usePageView(options: PageViewOptions = {}) {
  const { trackAnonymous = true, excludePaths = [], debug = false } = options;

  const location = useLocation();
  const { user, profile } = useAuth();
  const previousPathRef = useRef<string | null>(null);

  useEffect(() => {
    // Skip if this is the same path (prevents double logging on mount)
    if (previousPathRef.current === location.pathname) {
      return;
    }

    // Check if path should be excluded
    const shouldExclude = excludePaths.some(
      (excluded) =>
        location.pathname === excluded || location.pathname.startsWith(excluded + '/')
    );

    if (shouldExclude) {
      if (debug) {
        console.log('[usePageView] Skipping excluded path:', location.pathname);
      }
      return;
    }

    // Skip if user is not logged in and trackAnonymous is false
    if (!user && !trackAnonymous) {
      if (debug) {
        console.log('[usePageView] Skipping anonymous page view');
      }
      return;
    }

    // Log the page view
    const logPageView = async () => {
      try {
        await logAuditEvent({
          category: 'data_access',
          action: 'page_view',
          severity: 'low',
          user_id: user?.id,
          organization_id: profile?.organization_id,
          resource_type: 'page',
          resource_name: location.pathname,
          metadata: {
            path: location.pathname,
            search: location.search,
            hash: location.hash,
            referrer: document.referrer || undefined,
            userAgent: navigator.userAgent,
            screenWidth: window.innerWidth,
            screenHeight: window.innerHeight,
            timestamp: new Date().toISOString(),
          },
          status: 'success',
        });

        if (debug) {
          console.log('[usePageView] Logged page view:', location.pathname);
        }
      } catch (error) {
        // Never fail the app due to audit logging
        console.error('[usePageView] Failed to log page view:', error);
      }
    };

    logPageView();
    previousPathRef.current = location.pathname;
  }, [location.pathname, location.search, user, profile, trackAnonymous, excludePaths, debug]);
}

/**
 * Higher-order component for page view tracking
 *
 * Usage:
 * ```tsx
 * function MyComponent() {
 *   return <div>Page content</div>;
 * }
 *
 * export default withPageView(MyComponent);
 * ```
 */
export function withPageView<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options?: PageViewOptions
) {
  return function WithPageViewComponent(props: P) {
    usePageView(options);
    return <WrappedComponent {...props} />;
  };
}

/**
 * Component for page view tracking
 *
 * Usage:
 * ```tsx
 * // In your app layout:
 * <PageViewTracker />
 * ```
 */
export function PageViewTracker(props: PageViewOptions) {
  usePageView(props);
  return null;
}

export default usePageView;
