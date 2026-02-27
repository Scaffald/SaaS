/**
 * Inbox vs Assigned by Me View
 * TASK-1: View Filter State Management
 *
 * Custom hook that manages task view state ("inbox" | "assigned-by-me")
 * with URL parameter persistence for bookmarkable views.
 */

import { useState, useCallback, useEffect } from 'react';

/**
 * View types for task filtering
 * - inbox: Tasks assigned TO the current user
 * - assigned-by-me: Tasks created BY the current user (assigned to others)
 */
export type TaskViewType = 'inbox' | 'assigned-by-me';

/**
 * Maps TaskViewType to the useTasks hook role parameter
 */
export function viewTypeToRole(view: TaskViewType): 'assigned' | 'created' {
  return view === 'inbox' ? 'assigned' : 'created';
}

/**
 * Hook return type
 */
export interface UseTaskViewFilterReturn {
  /** Current view type */
  currentView: TaskViewType;
  /** Set the current view and update URL */
  setView: (view: TaskViewType) => void;
  /** Get the role parameter for useTasks hook */
  getTaskRole: () => 'assigned' | 'created';
}

/**
 * Default view when no URL parameter is present
 */
const DEFAULT_VIEW: TaskViewType = 'inbox';

/**
 * URL parameter name for view persistence
 */
const VIEW_PARAM = 'view';

/**
 * Parse URL parameter to TaskViewType
 */
function parseViewParam(param: string | null): TaskViewType {
  if (param === 'inbox' || param === 'assigned-by-me') {
    return param;
  }
  return DEFAULT_VIEW;
}

/**
 * Custom hook for managing task view filter state with URL persistence.
 *
 * @example
 * ```tsx
 * const { currentView, setView, getTaskRole } = useTaskViewFilter();
 *
 * // Use with useTasks hook
 * const { tasks } = useTasks({ userId: currentUserId, role: getTaskRole() });
 *
 * // Toggle views
 * <button onClick={() => setView('inbox')}>My Inbox</button>
 * <button onClick={() => setView('assigned-by-me')}>Assigned by Me</button>
 * ```
 */
export function useTaskViewFilter(): UseTaskViewFilterReturn {
  // Initialize state from URL parameter
  const [currentView, setCurrentView] = useState<TaskViewType>(() => {
    if (typeof window === 'undefined') return DEFAULT_VIEW;
    const params = new URLSearchParams(window.location.search);
    return parseViewParam(params.get(VIEW_PARAM));
  });

  // Sync with URL on mount (handles browser back/forward)
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      setCurrentView(parseViewParam(params.get(VIEW_PARAM)));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  /**
   * Set view and update URL parameter without page reload
   */
  const setView = useCallback((view: TaskViewType) => {
    setCurrentView(view);

    // Update URL without triggering page reload
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (view === DEFAULT_VIEW) {
        // Remove param for default view to keep URLs clean
        url.searchParams.delete(VIEW_PARAM);
      } else {
        url.searchParams.set(VIEW_PARAM, view);
      }

      // Use replaceState to avoid adding to browser history for simple view changes
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  /**
   * Get the role parameter for useTasks hook
   */
  const getTaskRole = useCallback(() => {
    return viewTypeToRole(currentView);
  }, [currentView]);

  return {
    currentView,
    setView,
    getTaskRole,
  };
}

export default useTaskViewFilter;
