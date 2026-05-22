/**
 * SC-42: community participation badges.
 *
 * Returns the user's *verified* community memberships, joined with
 * the community name + slug, ordered by joined_at ASC (oldest first
 * = most established membership). Verified-only matches the public
 * read policy added in migration 330.
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@scf/core/utils/supabase/client'

export type CommunityBadge = {
  community_id: string
  name: string
  slug: string
  joined_at: string
}

export function useCommunityBadges(userId: string | null | undefined) {
  return useQuery<CommunityBadge[]>({
    queryKey: ['community-badges', userId],
    queryFn: async () => {
      if (!userId) return []
      const { data, error } = await supabase
        .schema('community')
        .from('memberships')
        .select('community_id, joined_at, communities!inner(name, slug, is_active)')
        .eq('user_id', userId)
        .eq('is_verified', true)
        .order('joined_at', { ascending: true })
      if (error) throw error
      return (data ?? [])
        .filter((row) => {
          const c = row.communities as { is_active?: boolean } | null
          return c?.is_active !== false
        })
        .map((row): CommunityBadge => {
          const c = row.communities as { name: string; slug: string }
          return {
            community_id: row.community_id,
            joined_at: row.joined_at,
            name: c.name,
            slug: c.slug,
          }
        })
    },
    enabled: !!userId,
    staleTime: 60_000,
  })
}
