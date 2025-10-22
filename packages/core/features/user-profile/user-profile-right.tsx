import { YStack } from 'tamagui'
import { useRouter } from 'expo-router'
import { DashboardWidget } from '@app/ui'
import { api } from '@app/core/utils/api'
import { useUser } from '@app/core/utils/useUser'
import { UserProfileReviews } from './user-profile-reviews'

interface UserProfileRightProps {
  userId: string
}

/**
 * User Profile Right Column
 * Reviews and ratings widget with review functionality
 */
export function UserProfileRight({ userId }: UserProfileRightProps) {
  const router = useRouter()
  const { user: currentUser } = useUser()

  // Check if current user can leave a review (not viewing their own profile)
  const canLeaveReview = currentUser?.id !== userId

  const handleLeaveReview = () => {
    router.push(`/dashboard/users/${userId}/review`)
  }

  return (
    <YStack gap="$4">
      {/* Reviews Widget */}
      <DashboardWidget>
        <UserProfileReviews
          userId={userId}
          onLeaveReview={canLeaveReview ? handleLeaveReview : undefined}
        />
      </DashboardWidget>
    </YStack>
  )
}
