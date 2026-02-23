import { useReviewsBySubject } from '@scf/core/utils/reviews-sdk-hooks'
import { useUserProfile } from '@scf/core/utils/user-profiles-sdk-hooks'
import { useUser } from '@scf/core/utils/useUser'
import {
  Button,
  DashboardWidget,
  H4,
  LoadingState,
  ResponsiveModal,
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
        <Stack gap={16} align="center" paddingVertical={24}>
          <Text style={{ color: '#ef4444' }}>Failed to load reviews</Text>
          <Text style={{ color: '#414e62' }}>{error.message}</Text>
          <Button
            variant="filled" color="primary"
            size="sm"
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
          <Stack gap={16}>
            <Row justify="space-between" align="center">
              <H4>Reviews & Ratings</H4>
              {canLeaveReview && (
                <Button
                  variant="filled" color="primary"
                  size="sm"
                  iconStart={MessageSquarePlus}
                  onPress={handleLeaveReview}
                >
                  Leave Review
                </Button>
              )}
            </Row>
            <Stack align="center" justify="center" minHeight={150} gap={8}>
              <Text style={{ color: '#414e62' }}>No reviews yet</Text>
              {canLeaveReview && <Text style={{ color: '#414e62' }}>Be the first to leave a review</Text>}
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
        <Stack gap={16}>
          {/* Header */}
          <Row justify="space-between" align="center">
            <H4>Reviews & Ratings</H4>
            {canLeaveReview && (
              <Button
                variant="filled" color="primary"
                size="sm"
                iconStart={MessageSquarePlus}
                onPress={handleLeaveReview}
              >
                Leave Review
              </Button>
            )}
          </Row>

          {/* Rating Summary */}
          <Card variant="outlined" backgroundColor="#f9fafb">
            <Stack gap={12} padding="md">
              <Row gap={16} align="center">
                <Stack align="center">
                  <Text style={{ color: '#414e62' }}>{overallRating.toFixed(1)}</Text>
                  <Row gap={4}>
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={randomUUID()}
                        size={16}
                        color="#d97706"
                        fill={i < Math.floor(overallRating) ? '#d97706' : 'transparent'}
                      />
                    ))}
                  </Row>
                  <Text style={{ color: '#414e62' }}>
                    {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
                  </Text>
                </Stack>

                {Object.keys(avgByCategory).length > 0 && !showCompact && (
                  <Stack flex={1} gap={8}>
                    {Object.entries(avgByCategory).map(([category, data]) => {
                      const categoryData = data as { sum: number; count: number }
                      return (
                        <Row key={category} gap={8} align="center">
                          <Text style={{ color: '#414e62', width: 100, textTransform: 'capitalize' }}>
                            {category}
                          </Text>
                          <Row
                            flex={1}
                            height={6}
                            backgroundColor="#f3f4f6"
                            borderRadius={8}
                            style={{ overflow: 'hidden' }}
                          >
                            <Row
                              width={`${(categoryData.sum / categoryData.count / 5) * 100}%`}
                              backgroundColor="#d97706"
                            />
                          </Row>
                          <Text style={{ color: '#414e62', width: 30 }}>
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
                  backgroundColor="#dcfce7"
                  borderRadius={12}
                >
                  <ThumbsUp size={16} color="#16a34a" />
                  <Text style={{ color: '#16a34a' }}>{recommendCount} Recommend</Text>
                </Row>
                <Row
                  gap={8}
                  align="center"
                  paddingHorizontal={12}
                  paddingVertical={8}
                  backgroundColor="#fef2f2"
                  borderRadius={12}
                >
                  <ThumbsDown size={16} color="#ef4444" />
                  <Text style={{ color: '#ef4444' }}>{notRecommendCount} Don't Recommend</Text>
                </Row>
              </Row>
            </Stack>
          </Card>

          {/* Reviews List */}
          <Stack gap={12}>
            <Text style={{ color: '#414e62' }}>Reviews ({totalReviews})</Text>
            {reviewsToShow.map((review: Review) => (
              <Card key={review.id} variant="outlined" backgroundColor="#f9fafb">
                <Stack gap={12} padding="md">
                  <Row justify="space-between" align="flex-start">
                    <Stack gap={4}>
                      <Row gap={8} align="center">
                        <Text style={{ color: '#414e62' }}>Anonymous Reviewer</Text>
                        <Row
                          gap={4}
                          align="center"
                          paddingHorizontal={8}
                          paddingVertical={2}
                          backgroundColor="#dbeafe"
                          borderRadius={8}
                        >
                          <Shield size={14} color="#2563eb" />
                          <Text style={{ color: '#2563eb' }}>VERIFIED</Text>
                        </Row>
                      </Row>
                    </Stack>
                    <Text style={{ color: '#414e62' }}>{new Date(review.created_at).toLocaleDateString()}</Text>
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
                            size={16}
                            color="#d97706"
                            fill={i < Math.floor(avgRating) ? '#d97706' : 'transparent'}
                          />
                        )
                      })}
                    </Row>
                  )}

                  {/* Comment */}
                  {review.comment && <Text style={{ color: '#414e62' }}>{review.comment}</Text>}

                  {/* Recommendation */}
                  {review.reaction !== null && (
                    <Row gap={8} align="center">
                      {review.reaction === 1 ? (
                        <>
                          <ThumbsUp size={16} color="#16a34a" />
                          <Text style={{ color: '#16a34a' }}>Recommends this person</Text>
                        </>
                      ) : (
                        <>
                          <ThumbsDown size={16} color="#ef4444" />
                          <Text style={{ color: '#ef4444' }}>Does not recommend</Text>
                        </>
                      )}
                    </Row>
                  )}
                </Stack>
              </Card>
            ))}

            {showCompact && reviews.length > 2 && (
              <Text style={{ color: '#3b82f6', cursor: 'pointer' }}>
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
