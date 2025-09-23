import { useQuery } from '@tanstack/react-query'

import type { Database } from '@app/supabase/types'
import { useSupabase } from '@app/core/utils/supabase/useSupabase'
import { useUser } from '@app/core/utils/useUser'

type AffiliateRow = Database['public']['Tables']['affiliates']['Row']
type ViewerIndustry = Pick<Database['public']['Tables']['users']['Row'], 'industry_id'>

export const useAffiliateResources = () => {
  const supabase = useSupabase()
  const { user } = useUser()

  return useQuery<AffiliateRow[]>({
    queryKey: ['affiliate-resources', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      if (!user?.id) {
        return []
      }

      const { data: viewer, error: viewerError } = await supabase
        .from('users')
        .select('industry_id')
        .eq('id', user.id)
        .maybeSingle()

      if (viewerError) {
        throw new Error(viewerError.message)
      }

      const industryId = (viewer as ViewerIndustry | null)?.industry_id ?? null

      let query = supabase
        .from('affiliates')
        .select('*')
        .eq('is_active', true)
        .eq('type', 'education' as AffiliateRow['type'])

      if (industryId) {
        query = query.or(`industry_id.eq.${industryId},industry_id.is.null`)
      } else {
        query = query.is('industry_id', null)
      }

      query = query
        .order('industry_id', { ascending: true, nullsFirst: false })
        .order('name', { ascending: true })
        .limit(6)

      const { data, error } = await query

      if (error) {
        throw new Error(error.message)
      }

      return data ?? []
    },
  })
}
