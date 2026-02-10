import { api } from '@scf/core/utils/api'
import { useUser } from '@scf/core/utils/useUser'
import {
  Button,
  DashboardWidget,
  Heading,
  LoadingState,
  ResponsiveModal,
  spacing,
} from '@unicornlove/beyond-ui'
import { randomUUID } from 'expo-crypto'
import { MessageSquarePlus, Shield, Star, ThumbsDown, ThumbsUp } from 'lucide-react-native'
import { useState } from 'react'
import { Card, Text, Row, Stack } from '@unicornlove/beyond-ui'
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
  const { data: profile } = api.userProfile.getUserProfile.useQuery(
    { userId: userId || '' },
    { enabled: !!userId }
  )

  // Fetch reviews
  const {
    data: reviews,
    isLoading,
    error,
    refetch,
    isFetching,
  } = api.reviews.getBySubject.useQuery(
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
        <Stack gap={spacing.md} alignItems="center" paddingVertical="$6">
          <Text color="$red10">Failed to load reviews</Text>
          <Text color="$color11" fontSize="$2">
            {error.message}
          </Text>
          <Button
            variant="primary"
            size="$2"
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
            <Row justifyContent="space-between" alignItems="center">
              <Heading variant="h4">Reviews & Ratings</Heading>
              {canLeaveReview && (
                <Button
                  variant="primary"
                  size="$2"
                  icon={<MessageSquarePlus size={16} />}
                  onPress={handleLeaveReview}
                >
                  Leave Review
                </Button>
              )}
            </Row>
            <Stack alignItems="center" justifyContent="center" minHeight={150} gap="$2">
              <Text fontSize="$5" color="$color10">
                No reviews yet
              </Text>
              {canLeaveReview && (
                <Text fontSize="$3" color="$color9">
                  Be the first to leave a review
                </Text>
              )}
            </Stack>
          </Stack>
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
        <Stack gap={spacing.md}>
          {/* Header */}
          <Row justifyContent="space-between" alignItems="center">
            <Heading variant="h4">Reviews & Ratings</Heading>
            {canLeaveReview && (
              <Button
                variant="primary"
                size="$2"
                icon={<MessageSquarePlus size={16} />}
                onPress={handleLeaveReview}
              >
                Leave Review
              </Button>
            )}
          </Row>

          {/* Rating Summary */}
          <Card bordered backgroundColor="$color2">
            <Stack gap="$3" padding="$4">
              <Row gap="$4" alignItems="center">
                <Stack alignItems="center">
                  <Text fontSize="$10" fontWeight="700" color="$color12">
                    {overallRating.toFixed(1)}
                  </Text>
                  <Row gap="$1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={randomUUID()}
                        size={16}
                        color="$yellow10"
                        fill={i < Math.floor(overallRating) ? '$yellow10' : 'transparent'}
                      />
                    ))}
                  </Row>
                  <Text fontSize="$3" color="$color10">
                    {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
                  </Text>
                </Stack>

                {Object.keys(avgByCategory).length > 0 && !showCompact && (
                  <Stack flex={1} gap="$2">
                    {Object.entries(avgByCategory).map(([category, data]) => {
                      const categoryData = data as { sum: number; count: number }
                      return (
                        <Row key={category} gap="$2" alignItems="center">
                          <Text
                            fontSize="$3"
                            color="$color11"
                            width={100}
                            textTransform="capitalize"
                          >
                            {category}
                          </Text>
                          <Row
                            flex={1}
                            height={6}
                            backgroundColor="$color3"
                            borderRadius="$2"
                            overflow="hidden"
                          >
                            <Row
                              width={`${(categoryData.sum / categoryData.count / 5) * 100}%`}
                              backgroundColor="$yellow10"
                            />
                          </Row>
                          <Text fontSize="$3" color="$color10" width={30}>
                            {(categoryData.sum / categoryData.count).toFixed(1)}
                          </Text>
                        </Row>
                      )
                    })}
                  </Stack>
                )}
              </Row>

              {/* Recommend Stats */}
              <Row gap="$3" justifyContent="center">
                <Row
                  gap="$2"
                  alignItems="center"
                  paddingHorizontal="$3"
                  paddingVertical="$2"
                  backgroundColor="$green3"
                  borderRadius="$3"
                >
                  <ThumbsUp size={16} color="$green11" />
                  <Text fontSize="$4" fontWeight="600" color="$green11">
                    {recommendCount} Recommend
                  </Text>
                </Row>
                <Row
                  gap="$2"
                  alignItems="center"
                  paddingHorizontal="$3"
                  paddingVertical="$2"
                  backgroundColor="$red3"
                  borderRadius="$3"
                >
                  <ThumbsDown size={16} color="$red11" />
                  <Text fontSize="$4" fontWeight="600" color="$red11">
                    {notRecommendCount} Don't Recommend
                  </Text>
                </Row>
              </Row>
            </Stack>
          </Card>

          {/* Reviews List */}
          <Stack gap="$3">
            <Text fontSize="$5" fontWeight="700" color="$color12">
              Reviews ({totalReviews})
            </Text>
            {reviewsToShow.map((review: Review) => (
              <Card key={review.id} bordered backgroundColor="$color2">
                <Stack gap="$3" padding="$4">
                  <Row justifyContent="space-between" alignItems="flex-start">
                    <Stack gap="$1">
                      <Row gap="$2" alignItems="center">
                        <Text fontSize="$5" fontWeight="700" color="$color12">
                          Anonymous Reviewer
                        </Text>
                        <Row
                          gap="$1"
                          alignItems="center"
                          paddingHorizontal="$2"
                          paddingVertical="$0.5"
                          backgroundColor="$blue2"
                          borderRadius="$2"
                        >
                          <Shield size={12} color="$blue11" />
                          <Text fontSize="$1" color="$blue11" fontWeight="600">
                            VERIFIED
                          </Text>
                        </Row>
                      </Row>
                    </Stack>
                    <Text fontSize="$3" color="$color10">
                      {new Date(review.created_at).toLocaleDateString()}
                    </Text>
                  </Row>

                  {/* Overall Rating */}
                  {review.review_category_ratings && review.review_category_ratings.length > 0 && (
                    <Row gap="$1">
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
                    </Row>
                  )}

                  {/* Comment */}
                  {review.comment && (
                    <Text fontSize="$4" color="$color11">
                      {review.comment}
                    </Text>
                  )}

                  {/* Recommendation */}
                  {review.reaction !== null && (
                    <Row gap="$2" alignItems="center">
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
                    </Row>
                  )}
                </Stack>
              </Card>
            ))}

            {showCompact && reviews.length > 2 && (
              <Text fontSize="$3" color="$blue7" fontWeight="600" cursor="pointer">
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
