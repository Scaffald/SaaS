import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from './client.ts'

/**
 * Hook to subscribe to real-time updates for an inquiry
 * Automatically invalidates React Query cache when changes occur
 */
export function useInquirySubscription(inquiryId: string | null) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!inquiryId) return

    // Subscribe to inquiry updates
    const inquiryChannel = supabase
      .channel(`inquiry-${inquiryId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'core',
          table: 'application_inquiries',
          filter: `id=eq.${inquiryId}`,
        },
        () => {
          // Invalidate inquiry query
          queryClient.invalidateQueries({
            queryKey: [['inquiries', 'getByApplication']],
          })
        }
      )
      .subscribe()

    // Subscribe to comment updates
    const commentsChannel = supabase
      .channel(`inquiry-comments-${inquiryId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'core',
          table: 'inquiry_comments',
          filter: `inquiry_id=eq.${inquiryId}`,
        },
        () => {
          // Invalidate inquiry query to refresh comments
          queryClient.invalidateQueries({
            queryKey: [['inquiries', 'getByApplication']],
          })
        }
      )
      .subscribe()

    // Subscribe to section acceptance updates
    const sectionsChannel = supabase
      .channel(`inquiry-sections-${inquiryId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'core',
          table: 'inquiry_sections',
          filter: `inquiry_id=eq.${inquiryId}`,
        },
        () => {
          // Invalidate inquiry query to refresh sections
          queryClient.invalidateQueries({
            queryKey: [['inquiries', 'getByApplication']],
          })
        }
      )
      .subscribe()

    // Subscribe to capability response updates
    const capabilityChannel = supabase
      .channel(`inquiry-capability-${inquiryId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'core',
          table: 'inquiry_capability_responses',
          filter: `inquiry_id=eq.${inquiryId}`,
        },
        () => {
          // Invalidate inquiry query to refresh capability responses
          queryClient.invalidateQueries({
            queryKey: [['inquiries', 'getByApplication']],
          })
        }
      )
      .subscribe()

    return () => {
      inquiryChannel.unsubscribe()
      commentsChannel.unsubscribe()
      sectionsChannel.unsubscribe()
      capabilityChannel.unsubscribe()
    }
  }, [inquiryId, queryClient])
}
