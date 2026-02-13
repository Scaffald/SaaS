import { useQuery } from '@tanstack/react-query'

import { supabase } from '../supabase/client'
import { useUser } from '../useUser'

type EventsQueryBuilder = {
  select: (columns?: string) => {
    eq: (
      column: string,
      value: string
    ) => {
      order: (
        column: string,
        options: { ascending: boolean }
      ) => {
        limit: (count: number) => Promise<{ data: unknown[] | null }>
      }
    }
  }
}

function useEventsQuery() {
  // Using supabase directly from import
  const { user } = useUser()

  const queryFn = async () => {
    if (!user?.id) return []

    const result = await (supabase.schema('core').from('events' as string) as EventsQueryBuilder)
      .select('*')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false })
      .limit(4)

    return (result.data || []) as unknown[]
  }

  return useQuery({
    queryKey: ['events'],
    queryFn,
  })
}

export default useEventsQuery
