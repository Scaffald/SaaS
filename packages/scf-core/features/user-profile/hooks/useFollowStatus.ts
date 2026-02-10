import { useFollowing } from '@scf/core/utils/engagement-sdk-hooks'

export function useFollowStatus(targetUserId: string | null) {
  const { data: followingData, isLoading } = useFollowing(undefined, {
    enabled: !!targetUserId,
  })

  const isFollowing =
    followingData?.data.some((follow: { followee_id?: string }) => follow.followee_id === targetUserId) ?? false

  return {
    isFollowing,
    isLoading,
  }
}

