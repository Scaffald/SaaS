import { useQuery } from '@tanstack/react-query'

import { supabase } from '../supabase/client'
import { useUser } from '../useUser'

const getEvents = async (supabase, userId) => {
  return supabase
    .from('events')
    .select('*')
    .eq('profile_id', userId)
    .order('created_at', { ascending: false })
    .limit(4)
}

function useEventsQuery() {
  // Using supabase directly from import
  const { user } = useUser()

  const queryFn = async () => {
    return getEvents(supabase, user?.id).then((result) => result.data)
  }

  return useQuery({
    queryKey: ['events'],
    queryFn,
  })
}

export default useEventsQuery
