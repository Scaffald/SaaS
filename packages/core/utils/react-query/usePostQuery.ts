import { useQuery } from '@tanstack/react-query'

import { supabase } from '../supabase/client'

const getPosts = async (supabase) => {
  return supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(4)
}

function usePostQuery() {
  // Using supabase directly from import

  const queryFn = async () => {
    return getPosts(supabase).then((result) => result.data)
  }

  return useQuery({
    queryKey: ['posts'],
    queryFn,
  })
}

export default usePostQuery
