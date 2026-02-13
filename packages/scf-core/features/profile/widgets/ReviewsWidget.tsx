import { useReviewsBySubject } from '@scf/core/utils/reviews-sdk-hooks'
import { useUserProfile } from '@scf/core/utils/user-profiles-sdk-hooks'
import { useUser } from '@scf/core/utils/useUser'
import {
  Button,
  DashboardWidget,
  Heading,
  LoadingState,
  ResponsiveModal,
  spacing,
} from '@scaffald/ui'
import { randomUUID } from 'expo-crypto'
import { MessageSquarePlus, Shield, Star, ThumbsDown, ThumbsUp } from 'lucide-react-native'
import { useState } from 'react'
import { Card, Text, Row, Stack } from '@scaffald/ui'
import { ReviewWizard } from '../../reviews/components/ReviewWizard'
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
  const { data: profile } = useUserProfile(userId)

  // Fetch reviews
  const {
    data: reviews,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useReviewsBySubject(
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

  const handleReviewComplete = async () => {
    setShowReviewModal(false)
    // Refetch reviews to update aggregates after new review submission
    await refetch()
  }

  if (isLoading) {
    return (
      <DashboardWidget>
        <LoadingState message="Loading reviews..." />
      </DashboardWidget>
    )
  }

  if (error) {
    return (
      <DashboardWidget>
        <Stack gap={spacing.md} align="center" paddingVertical={24}>
          <Text color="$red10">Failed to load reviews</Text>
          <Text color="$gray11">{error.message}</Text>
          <Button
            variant="primary"
            size="xs"
            onPress={() => {
              void refetch()
            }}
            disabled={isFetching}
          >
            Retry
          </Button>
        </Stack>
      </DashboardWidget>
    )
  }

  if (!reviews || reviews.length === 0) {
    return (
      <>
        <DashboardWidget>
          <Stack gap={spacing.md}>
            <Row justify="space-between" align="center">
              <Heading variant="h4">Reviews & Ratings</Heading>
              {canLeaveReview && (
                <Button
                  variant="primary"
                  size="xs"
                  iconStart={<MessageSquarePlus size="md" />}
                  onPress={handleLeaveReview}
                >
                  Leave Review
                </Button>
              )}
            </Row>
            <Stack align="center" justify="center" minHeight={150} gap={8}>
              <Text color="$gray11">No reviews yet</Text>
              {canLeaveReview && <Text color="$gray11">Be the first to leave a review</Text>}
            </Stack>
          </Stack>
        </DashboardWidget>

        {canLeaveReview && (
          <ResponsiveModal
            open={showReviewModal}
            onOpenChange={setShowReviewModal}
            title={`Review ${profile?.name || 'User'}`}
            size="lg"
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
        <Stack gap={spacing.md}>
          {/* Header */}
          <Row justify="space-between" align="center">
            <Heading variant="h4">Reviews & Ratings</Heading>
            {canLeaveReview && (
              <Button
                variant="primary"
                size="xs"
                iconStart={<MessageSquarePlus size="md" />}
                onPress={handleLeaveReview}
              >
                Leave Review
              </Button>
            )}
          </Row>

          {/* Rating Summary */}
          <Card bordered backgroundColor="$color2">
            <Stack gap={12} padding="md">
              <Row gap={16} align="center">
                <Stack align="center">
                  <Text color="$gray11">{overallRating.toFixed(1)}</Text>
                  <Row gap={4}>
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={randomUUID()}
                        size="md"
                        color="$yellow10"
                        fill={i < Math.floor(overallRating) ? '$yellow10' : 'transparent'}
                      />
                    ))}
                  </Row>
                  <Text color="$gray11">
                    {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
                  </Text>
                </Stack>

                {Object.keys(avgByCategory).length > 0 && !showCompact && (
                  <Stack flex={1} gap={8}>
                    {Object.entries(avgByCategory).map(([category, data]) => {
                      const categoryData = data as { sum: number; count: number }
                      return (
                        <Row key={category} gap={8} align="center">
                          <Text color="$gray11" width={100} textTransform="capitalize">
                            {category}
                          </Text>
                          <Row
                            flex={1}
                            height={6}
                            backgroundColor="$color3"
                            borderRadius={8}
                            overflow="hidden"
                          >
                            <Row
                              width={`${(categoryData.sum / categoryData.count / 5) * 100}%`}
                              backgroundColor="$yellow10"
                            />
                          </Row>
                          <Text color="$gray11" width={30}>
                            {(categoryData.sum / categoryData.count).toFixed(1)}
                          </Text>
                        </Row>
                      )
                    })}
                  </Stack>
                )}
              </Row>

              {/* Recommend Stats */}
              <Row gap={12} justify="center">
                <Row
                  gap={8}
                  align="center"
                  paddingHorizontal={12}
                  paddingVertical={8}
                  backgroundColor="$green3"
                  borderRadius={12}
                >
                  <ThumbsUp size="md" color="$green11" />
                  <Text color="$green11">{recommendCount} Recommend</Text>
                </Row>
                <Row
                  gap={8}
                  align="center"
                  paddingHorizontal={12}
                  paddingVertical={8}
                  backgroundColor="$red3"
                  borderRadius={12}
                >
                  <ThumbsDown size="md" color="$red11" />
                  <Text color="$red11">{notRecommendCount} Don't Recommend</Text>
                </Row>
              </Row>
            </Stack>
          </Card>

          {/* Reviews List */}
          <Stack gap={12}>
            <Text color="$gray11">Reviews ({totalReviews})</Text>
            {reviewsToShow.map((review: Review) => (
              <Card key={review.id} bordered backgroundColor="$color2">
                <Stack gap={12} padding="md">
                  <Row justify="space-between" align="flex-start">
                    <Stack gap={4}>
                      <Row gap={8} align="center">
                        <Text color="$gray11">Anonymous Reviewer</Text>
                        <Row
                          gap={4}
                          align="center"
                          paddingHorizontal={8}
                          paddingVertical={2}
                          backgroundColor="$blue2"
                          borderRadius={8}
                        >
                          <Shield size="sm" color="$blue11" />
                          <Text color="$blue11">VERIFIED</Text>
                        </Row>
                      </Row>
                    </Stack>
                    <Text color="$gray11">{new Date(review.created_at).toLocaleDateString()}</Text>
                  </Row>

                  {/* Overall Rating */}
                  {review.review_category_ratings && review.review_category_ratings.length > 0 && (
                    <Row gap={4}>
                      {[...Array(5)].map((_, i) => {
                        const avgRating =
                          review.review_category_ratings.reduce(
                            (sum: number, r: CategoryRating) => sum + r.rating,
                            0
                          ) / review.review_category_ratings.length
                        return (
                          <Star
                            key={randomUUID()}
                            size="md"
                            color="$yellow10"
                            fill={i < Math.floor(avgRating) ? '$yellow10' : 'transparent'}
                          />
                        )
                      })}
                    </Row>
                  )}

                  {/* Comment */}
                  {review.comment && <Text color="$gray11">{review.comment}</Text>}

                  {/* Recommendation */}
                  {review.reaction !== null && (
                    <Row gap={8} align="center">
                      {review.reaction === 1 ? (
                        <>
                          <ThumbsUp size="md" color="$green11" />
                          <Text color="$green11">Recommends this person</Text>
                        </>
                      ) : (
                        <>
                          <ThumbsDown size="md" color="$red11" />
                          <Text color="$red11">Does not recommend</Text>
                        </>
                      )}
                    </Row>
                  )}
                </Stack>
              </Card>
            ))}

            {showCompact && reviews.length > 2 && (
              <Text color="$blue7" cursor="pointer">
                + {reviews.length - 2} more reviews
              </Text>
            )}
          </Stack>
        </Stack>
      </DashboardWidget>

      {/* Review Modal */}
      {canLeaveReview && (
        <ResponsiveModal
          open={showReviewModal}
          onOpenChange={setShowReviewModal}
          title={`Review ${profile?.name || 'User'}`}
          size="lg"
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
