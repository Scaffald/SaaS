import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef } from 'react'
import { supabase } from './client'

/**
 * Hook to subscribe to real-time analytics updates
 * Invalidates analytics query cache when profile views or engagement events change
 * Debounces invalidation to prevent excessive refetches during high activity
 */
export function useAnalyticsSubscription(userId: string | null) {
  const queryClient = useQueryClient()
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const debouncedInvalidate = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }
    debounceTimer.current = setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['analytics', 'summary'] })
      queryClient.invalidateQueries({ queryKey: ['analytics', 'engagement', 'visitors'] })
    }, 5000) // 5-second debounce
  }, [queryClient])

  useEffect(() => {
    if (!userId) return

    // Subscribe to profile views targeting this user
    const profileViewsChannel = supabase
      .channel(`analytics-profile-views-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'engagement',
          table: 'profile_views',
          filter: `viewed_user_id=eq.${userId}`,
        },
        () => {
          debouncedInvalidate()
        }
      )
      .subscribe()

    // Subscribe to engagement events targeting this user
    const eventsChannel = supabase
      .channel(`analytics-events-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'engagement',
          table: 'activity_events',
          filter: `target_id=eq.${userId}`,
        },
        () => {
          debouncedInvalidate()
        }
      )
      .subscribe()

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
      supabase.removeChannel(profileViewsChannel)
      supabase.removeChannel(eventsChannel)
    }
  }, [userId, debouncedInvalidate])
}
