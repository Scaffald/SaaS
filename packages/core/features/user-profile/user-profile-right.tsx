import { useState } from 'react'
import { YStack, Dialog, Sheet } from 'tamagui'
import { Platform } from 'react-native'
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

      {/* Review Modal - Dialog for web, Sheet for mobile */}
      {Platform.OS === 'web' ? (
        <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
          <Dialog.Portal>
            <Dialog.Overlay
              key="overlay"
              animation="quick"
              opacity={0.5}
              enterStyle={{ opacity: 0 }}
              exitStyle={{ opacity: 0 }}
            />
            <Dialog.Content
              bordered
              elevate
              key="content"
              animateOnly={['transform', 'opacity']}
              animation={[
                'quick',
                {
                  opacity: {
                    overshootClamping: true,
                  },
                },
              ]}
              enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
              exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
              width={900}
            >
              <ReviewWizard
                subjectId={userId}
                subjectName={profile?.name || 'this user'}
                onCancel={handleCloseReview}
                onComplete={handleReviewComplete}
              />
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog>
      ) : (
        <Sheet
          modal
          open={showReviewModal}
          onOpenChange={setShowReviewModal}
          snapPoints={[90]}
          dismissOnSnapToBottom
        >
          <Sheet.Overlay animation="lazy" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
          <Sheet.Handle />
          <Sheet.Frame p="$4" gap="$4">
            <ReviewWizard
              subjectId={userId}
              subjectName={profile?.name || 'this user'}
              onCancel={handleCloseReview}
              onComplete={handleReviewComplete}
            />
          </Sheet.Frame>
        </Sheet>
      )}
    </>
  )
}
