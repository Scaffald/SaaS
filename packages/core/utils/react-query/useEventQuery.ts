import { useQuery } from '@tanstack/react-query'

import { supabase } from '../supabase/client'
import { useUser } from '../useUser'

function useEventsQuery() {
  // Using supabase directly from import
  const { user } = useUser()

  const queryFn = async () => {
    if (!user?.id) return []

    const result = await (
      supabase
        .schema('core')
        // @ts-expect-error events table may not exist in generated types yet
        // biome-ignore lint/suspicious/noExplicitAny: events table may not exist in database types yet
        .from('events') as any
    )
      .select('*')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false })
      .limit(4)

    return result.data || []
  }

  return useQuery({
    queryKey: ['events'],
    queryFn,
  })
}

export default useEventsQuery
