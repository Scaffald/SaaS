import { useReviewsBySubject } from '@scf/core/utils/reviews-sdk-hooks'
import { useUserProfile } from '@scf/core/utils/user-profiles-sdk-hooks'
import { useUser } from '@scf/core/utils/useUser'
import {
  Button,
  Card,
  DashboardWidget,
  H4,
  ResponsiveModal,
  Skeleton,
  SkeletonBox,
  SkeletonList,
  Text,
  Row,
  Stack,
  useThemeContext,
} from '@scaffald/ui'
import { randomUUID } from 'expo-crypto'
import { MessageSquarePlus, Shield, Star, ThumbsDown, ThumbsUp } from 'lucide-react-native'
import { useState } from 'react'
import { colors } from '@scaffald/ui/tokens'
import { ReviewWizard } from '../../reviews/components/ReviewWizard'
import { ReviewImpactSummary } from '../../reviews/components/ReviewImpactSummary'
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
  const [completedReviewId, setCompletedReviewId] = useState<string | null>(null)
  const { theme } = useThemeContext()
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

  const handleReviewComplete = async (reviewId: string) => {
    setCompletedReviewId(reviewId)
    await refetch()
  }

  const handleDismissImpact = () => {
    setCompletedReviewId(null)
    setShowReviewModal(false)
  }

  if (isLoading) {
    return (
      <DashboardWidget>
        <Stack gap={16}>
          <Skeleton width={140} height={20} shape="text" />
          <SkeletonBox width="100%" height={80} borderRadius={12} />
          <SkeletonList count={2} variant="profile" />
        </Stack>
      </DashboardWidget>
    )
  }

  if (error) {
    return (
      <DashboardWidget>
        <Stack gap={16} align="center" paddingVertical={24}>
          <Text style={{ color: colors.fg[theme].error }}>Failed to load reviews</Text>
          <Text style={{ color: colors.text[theme].secondary }}>{error.message}</Text>
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
              <Text style={{ color: colors.text[theme].secondary }}>No reviews yet</Text>
              {canLeaveReview && <Text style={{ color: colors.text[theme].secondary }}>Be the first to leave a review</Text>}
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
            {completedReviewId ? (
              <ReviewImpactSummary
                subjectId={userId || ''}
                subjectName={profile?.name || 'this user'}
                reviewId={completedReviewId}
                onDismiss={handleDismissImpact}
              />
            ) : (
              <ReviewWizard
                subjectId={userId || ''}
                subjectName={profile?.name || 'this user'}
                onCancel={handleCloseReview}
                onComplete={(id) => void handleReviewComplete(id)}
              />
            )}
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
          <Card variant="outlined" backgroundColor={colors.bg[theme].subtle}>
            <Stack gap={12} padding="md">
              <Row gap={16} align="center">
                <Stack align="center">
                  <Text style={{ color: colors.text[theme].secondary }}>{overallRating.toFixed(1)}</Text>
                  <Row gap={4}>
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={randomUUID()}
                        size={16}
                        color={colors.amber[600]}
                        fill={i < Math.floor(overallRating) ? colors.amber[600] : 'transparent'}
                      />
                    ))}
                  </Row>
                  <Text style={{ color: colors.text[theme].secondary }}>
                    {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
                  </Text>
                </Stack>

                {Object.keys(avgByCategory).length > 0 && !showCompact && (
                  <Stack flex={1} gap={8}>
                    {Object.entries(avgByCategory).map(([category, data]) => {
                      const categoryData = data as { sum: number; count: number }
                      return (
                        <Row key={category} gap={8} align="center">
                          <Text style={{ color: colors.text[theme].secondary, width: 100, textTransform: 'capitalize' }}>
                            {category}
                          </Text>
                          <Row
                            flex={1}
                            height={6}
                            backgroundColor={colors.bg[theme].muted}
                            borderRadius={8}
                            style={{ overflow: 'hidden' }}
                          >
                            <Row
                              width={`${(categoryData.sum / categoryData.count / 5) * 100}%`}
                              backgroundColor={colors.amber[600]}
                            />
                          </Row>
                          <Text style={{ color: colors.text[theme].secondary, width: 30 }}>
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
                  backgroundColor={colors.green[100]}
                  borderRadius={12}
                >
                  <ThumbsUp size={16} color={colors.fg[theme].success} />
                  <Text style={{ color: colors.fg[theme].success }}>{recommendCount} Recommend</Text>
                </Row>
                <Row
                  gap={8}
                  align="center"
                  paddingHorizontal={12}
                  paddingVertical={8}
                  backgroundColor={colors.error[50]}
                  borderRadius={12}
                >
                  <ThumbsDown size={16} color={colors.fg[theme].error} />
                  <Text style={{ color: colors.fg[theme].error }}>{notRecommendCount} Don't Recommend</Text>
                </Row>
              </Row>
            </Stack>
          </Card>

          {/* Reviews List */}
          <Stack gap={12}>
            <Text style={{ color: colors.text[theme].secondary }}>Reviews ({totalReviews})</Text>
            {reviewsToShow.map((review: Review) => (
              <Card key={review.id} variant="outlined" backgroundColor={colors.bg[theme].subtle}>
                <Stack gap={12} padding="md">
                  <Row justify="space-between" align="flex-start">
                    <Stack gap={4}>
                      <Row gap={8} align="center">
                        <Text style={{ color: colors.text[theme].secondary }}>Anonymous Reviewer</Text>
                        <Row
                          gap={4}
                          align="center"
                          paddingHorizontal={8}
                          paddingVertical={2}
                          backgroundColor={colors.blue[100]}
                          borderRadius={8}
                        >
                          <Shield size={14} color={colors.blue[600]} />
                          <Text style={{ color: colors.blue[600] }}>VERIFIED</Text>
                        </Row>
                      </Row>
                    </Stack>
                    <Text style={{ color: colors.text[theme].secondary }}>{new Date(review.created_at).toLocaleDateString()}</Text>
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
                            color={colors.amber[600]}
                            fill={i < Math.floor(avgRating) ? colors.amber[600] : 'transparent'}
                          />
                        )
                      })}
                    </Row>
                  )}

                  {/* Comment */}
                  {review.comment && <Text style={{ color: colors.text[theme].secondary }}>{review.comment}</Text>}

                  {/* Recommendation */}
                  {review.reaction !== null && (
                    <Row gap={8} align="center">
                      {review.reaction === 1 ? (
                        <>
                          <ThumbsUp size={16} color={colors.fg[theme].success} />
                          <Text style={{ color: colors.fg[theme].success }}>Recommends this person</Text>
                        </>
                      ) : (
                        <>
                          <ThumbsDown size={16} color={colors.fg[theme].error} />
                          <Text style={{ color: colors.fg[theme].error }}>Does not recommend</Text>
                        </>
                      )}
                    </Row>
                  )}
                </Stack>
              </Card>
            ))}

            {showCompact && reviews.length > 2 && (
              <Text style={{ color: colors.blue[500], cursor: 'pointer' }}>
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
            onComplete={(id) => void handleReviewComplete(id)}
          />
        </ResponsiveModal>
      )}
    </>
  )
}
