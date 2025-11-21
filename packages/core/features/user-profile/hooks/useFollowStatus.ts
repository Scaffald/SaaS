import { api } from '@app/core/utils/api'

export function useFollowStatus(targetUserId: string | null) {
  const { data: following, isLoading } = api.follows.getFollowing.useQuery(
    undefined,
    {
      enabled: !!targetUserId,
    }
  )

  const isFollowing = following?.some((follow: { user?: { id: string } | null }) => follow.user?.id === targetUserId) ?? false

  return {
    isFollowing,
    isLoading,
  }
}

