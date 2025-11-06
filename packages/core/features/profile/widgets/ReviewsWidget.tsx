import { useState } from 'react'
import { YStack, XStack, Text, Card, Spinner } from 'tamagui'
import { Star, ThumbsUp, ThumbsDown, MessageSquarePlus, Shield } from '@tamagui/lucide-icons'
import { randomUUID } from 'expo-crypto'
import { DashboardWidget, ResponsiveModal, Button } from '@app/ui'
import { Heading } from '@app/ui/components/typography/Heading'
import { LoadingState } from '@app/ui/components/states/LoadingState'
import { api } from '@app/core/utils/api'
import { useUser } from '@app/core/utils/useUser'
import { ReviewWizard } from '../../reviews/components/ReviewWizard'
import { spacing } from '@/tokens/design-tokens'
import type { ProfileWidgetProps } from './types'

interface CategoryRating {
  category: string
  rating: number
}

interface Review {
  id: string
  created_at: string
  comment: string | null
  reaction: number | null
  review_category_ratings: CategoryRating[]
}

/**
 * ReviewsWidget
 * Displays user reviews and ratings with ability to leave new reviews
 *
 * @param userId - User ID to display reviews for
 * @param showEdit - Whether to show "Leave Review" button (hidden when viewing own profile)
 * @param variant - Display variant (compact shows fewer reviews)
 */
export function ReviewsWidget({ userId, showEdit = false, variant = 'full' }: ProfileWidgetProps) {
  const [showReviewModal, setShowReviewModal] = useState(false)
  const { user: currentUser } = useUser()

  // Fetch profile data for review modal
  const { data: profile } = api.userProfile.getUserProfile.useQuery(
    { userId: userId || '' },
    { enabled: !!userId }
  )

  // Fetch reviews
  const { data: reviews, isLoading } = api.reviews.getBySubject.useQuery(
    {
      subjectId: userId || '',
      subjectType: 'user',
      status: 'released',
    },
    { enabled: !!userId }
  )

  const showCompact = variant === 'compact'

  // Only show "Leave Review" button if viewing someone else's profile
  const canLeaveReview = showEdit && currentUser?.id !== userId

  const handleLeaveReview = () => {
    setShowReviewModal(true)
  }

  const handleCloseReview = () => {
    setShowReviewModal(false)
  }

  const handleReviewComplete = () => {
    setShowReviewModal(false)
  }

  if (isLoading) {
    return (
      <DashboardWidget>
        <LoadingState message="Loading reviews..." />
      </DashboardWidget>
    )
  }

  if (!reviews || reviews.length === 0) {
    return (
      <>
        <DashboardWidget>
          <YStack gap={spacing.md}>
            <XStack justify="space-between" items="center">
              <Heading variant="h4">Reviews & Ratings</Heading>
              {canLeaveReview && (
                <Button
                  variant="primary"
                  size="small"
                  icon={<MessageSquarePlus size={16} />}
                  onPress={handleLeaveReview}
                >
                  Leave Review
                </Button>
              )}
            </XStack>
            <YStack items="center" justify="center" minH={150} gap="$2">
              <Text fontSize="$5" color="$color10">
                No reviews yet
              </Text>
              {canLeaveReview && (
                <Text fontSize="$3" color="$color9">
                  Be the first to leave a review
                </Text>
              )}
            </YStack>
          </YStack>
        </DashboardWidget>

        {canLeaveReview && (
          <ResponsiveModal
            open={showReviewModal}
            onOpenChange={setShowReviewModal}
            title={`Review ${profile?.name || 'User'}`}
            size="large"
          >
            <ReviewWizard
              subjectId={userId || ''}
              subjectName={profile?.name || 'this user'}
              onCancel={handleCloseReview}
              onComplete={handleReviewComplete}
            />
          </ResponsiveModal>
        )}
      </>
    )
  }

  // Calculate statistics
  const totalReviews = reviews.length
  const recommendCount = reviews.filter((r: Review) => r.reaction === 1).length
  const notRecommendCount = reviews.filter((r: Review) => r.reaction === -1).length

  // Calculate average ratings
  const categoryRatings = reviews.flatMap((r: Review) => r.review_category_ratings || [])
  const avgByCategory = categoryRatings.reduce(
    (acc: Record<string, { sum: number; count: number }>, rating: CategoryRating) => {
      if (!acc[rating.category]) {
        acc[rating.category] = { sum: 0, count: 0 }
      }
      acc[rating.category].sum += rating.rating
      acc[rating.category].count += 1
      return acc
    },
    {} as Record<string, { sum: number; count: number }>
  )

  const overallRating =
    categoryRatings.length > 0
      ? categoryRatings.reduce((sum: number, r: CategoryRating) => sum + r.rating, 0) /
        categoryRatings.length
      : 0

  const reviewsToShow = showCompact ? reviews.slice(0, 2) : reviews

  return (
    <>
      <DashboardWidget>
        <YStack gap={spacing.md}>
          {/* Header */}
          <XStack justify="space-between" items="center">
            <Heading variant="h4">Reviews & Ratings</Heading>
            {canLeaveReview && (
              <Button
                variant="primary"
                size="small"
                icon={<MessageSquarePlus size={16} />}
                onPress={handleLeaveReview}
              >
                Leave Review
              </Button>
            )}
          </XStack>

          {/* Rating Summary */}
          <Card bordered bg="$color2">
            <YStack gap="$3" p="$4">
              <XStack gap="$4" items="center">
                <YStack items="center">
                  <Text fontSize="$10" fontWeight="700" color="$color12">
                    {overallRating.toFixed(1)}
                  </Text>
                  <XStack gap="$1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={randomUUID()}
                        size={16}
                        color="$yellow10"
                        fill={i < Math.floor(overallRating) ? '$yellow10' : 'transparent'}
                      />
                    ))}
                  </XStack>
                  <Text fontSize="$3" color="$color10">
                    {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
                  </Text>
                </YStack>

                {Object.keys(avgByCategory).length > 0 && !showCompact && (
                  <YStack flex={1} gap="$2">
                    {Object.entries(avgByCategory).map(([category, data]) => {
                      const categoryData = data as { sum: number; count: number }
                      return (
                        <XStack key={category} gap="$2" items="center">
                          <Text
                            fontSize="$3"
                            color="$color11"
                            width={100}
                            textTransform="capitalize"
                          >
                            {category}
                          </Text>
                          <XStack flex={1} height={6} bg="$color3" rounded="$2" overflow="hidden">
                            <XStack
                              width={`${(categoryData.sum / categoryData.count / 5) * 100}%`}
                              bg="$yellow10"
                            />
                          </XStack>
                          <Text fontSize="$3" color="$color10" width={30}>
                            {(categoryData.sum / categoryData.count).toFixed(1)}
                          </Text>
                        </XStack>
                      )
                    })}
                  </YStack>
                )}
              </XStack>

              {/* Recommend Stats */}
              <XStack gap="$3" justify="center">
                <XStack gap="$2" items="center" px="$3" py="$2" bg="$green3" rounded="$3">
                  <ThumbsUp size={16} color="$green11" />
                  <Text fontSize="$4" fontWeight="600" color="$green11">
                    {recommendCount} Recommend
                  </Text>
                </XStack>
                <XStack gap="$2" items="center" px="$3" py="$2" bg="$red3" rounded="$3">
                  <ThumbsDown size={16} color="$red11" />
                  <Text fontSize="$4" fontWeight="600" color="$red11">
                    {notRecommendCount} Don't Recommend
                  </Text>
                </XStack>
              </XStack>
            </YStack>
          </Card>

          {/* Reviews List */}
          <YStack gap="$3">
            <Text fontSize="$5" fontWeight="700" color="$color12">
              Reviews ({totalReviews})
            </Text>
            {reviewsToShow.map((review: Review) => (
              <Card key={review.id} bordered bg="$color2">
                <YStack gap="$3" p="$4">
                  <XStack justify="space-between" items="flex-start">
                    <YStack gap="$1">
                      <XStack gap="$2" items="center">
                        <Text fontSize="$5" fontWeight="700" color="$color12">
                          Anonymous Reviewer
                        </Text>
                        <XStack gap="$1" items="center" px="$2" py="$0.5" bg="$teal2" rounded="$2">
                          <Shield size={12} color="$teal11" />
                          <Text fontSize="$1" color="$teal11" fontWeight="600">
                            VERIFIED
                          </Text>
                        </XStack>
                      </XStack>
                    </YStack>
                    <Text fontSize="$3" color="$color10">
                      {new Date(review.created_at).toLocaleDateString()}
                    </Text>
                  </XStack>

                  {/* Overall Rating */}
                  {review.review_category_ratings && review.review_category_ratings.length > 0 && (
                    <XStack gap="$1">
                      {[...Array(5)].map((_, i) => {
                        const avgRating =
                          review.review_category_ratings.reduce(
                            (sum: number, r: CategoryRating) => sum + r.rating,
                            0
                          ) / review.review_category_ratings.length
                        return (
                          <Star
                            key={randomUUID()}
                            size={16}
                            color="$yellow10"
                            fill={i < Math.floor(avgRating) ? '$yellow10' : 'transparent'}
                          />
                        )
                      })}
                    </XStack>
                  )}

                  {/* Comment */}
                  {review.comment && (
                    <Text fontSize="$4" color="$color11">
                      {review.comment}
                    </Text>
                  )}

                  {/* Recommendation */}
                  {review.reaction !== null && (
                    <XStack gap="$2" items="center">
                      {review.reaction === 1 ? (
                        <>
                          <ThumbsUp size={16} color="$green11" />
                          <Text fontSize="$3" color="$green11" fontWeight="600">
                            Recommends this person
                          </Text>
                        </>
                      ) : (
                        <>
                          <ThumbsDown size={16} color="$red11" />
                          <Text fontSize="$3" color="$red11" fontWeight="600">
                            Does not recommend
                          </Text>
                        </>
                      )}
                    </XStack>
                  )}
                </YStack>
              </Card>
            ))}

            {showCompact && reviews.length > 2 && (
              <Text fontSize="$3" color="$teal7" fontWeight="600" cursor="pointer">
                + {reviews.length - 2} more reviews
              </Text>
            )}
          </YStack>
        </YStack>
      </DashboardWidget>

      {/* Review Modal */}
      {canLeaveReview && (
        <ResponsiveModal
          open={showReviewModal}
          onOpenChange={setShowReviewModal}
          title={`Review ${profile?.name || 'User'}`}
          size="large"
        >
          <ReviewWizard
            subjectId={userId || ''}
            subjectName={profile?.name || 'this user'}
            onCancel={handleCloseReview}
            onComplete={handleReviewComplete}
          />
        </ResponsiveModal>
      )}
    </>
  )
}
