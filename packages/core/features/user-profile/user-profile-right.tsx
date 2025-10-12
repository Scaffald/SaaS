import { useState } from 'react'
import { YStack } from 'tamagui'
import { ResponsiveModal } from '@app/ui'
import { DashboardWidget } from '@app/ui'
import { api } from '@app/core/utils/api'
import { useUser } from '@app/core/utils/useUser'
import { UserProfileReviews } from './user-profile-reviews'
import { ReviewWizard } from '../reviews/components/ReviewWizard'

interface UserProfileRightProps {
  userId: string
}

/**
 * User Profile Right Column
 * Reviews and ratings widget with review functionality
 */
export function UserProfileRight({ userId }: UserProfileRightProps) {
  const [showReviewModal, setShowReviewModal] = useState(false)
  const { user: currentUser } = useUser()

  const { data: profile } = api.userProfile.getUserProfile.useQuery({ userId })

  // Check if current user can leave a review (not viewing their own profile)
  const canLeaveReview = currentUser?.id !== userId

  const handleLeaveReview = () => {
    setShowReviewModal(true)
  }

  const handleCloseReview = () => {
    setShowReviewModal(false)
  }

  const handleReviewComplete = () => {
    setShowReviewModal(false)
    // Reviews component will automatically refetch when modal closes
  }

  return (
    <>
      <YStack gap="$4">
        {/* Reviews Widget */}
        <DashboardWidget>
          <UserProfileReviews
            userId={userId}
            onLeaveReview={canLeaveReview ? handleLeaveReview : undefined}
          />
        </DashboardWidget>
      </YStack>

      {/* Review Modal */}
      <ResponsiveModal
        open={showReviewModal}
        onOpenChange={setShowReviewModal}
        title={`Review ${profile?.name || 'User'}`}
        size="large"
      >
        <ReviewWizard
          subjectId={userId}
          subjectName={profile?.name || 'this user'}
          onCancel={handleCloseReview}
          onComplete={handleReviewComplete}
        />
      </ResponsiveModal>
    </>
  )
}
