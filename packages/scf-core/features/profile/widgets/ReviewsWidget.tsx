import { useReviewsBySubject } from '@scf/core/utils/reviews-sdk-hooks'
import { useUserProfile } from '@scf/core/utils/user-profiles-sdk-hooks'
import { useUser } from '@scf/core/utils/useUser'
import {
  Button,
  Card,
  DashboardWidget,
  DashboardWidgetHeader,
  ResponsiveModal,
  Skeleton,
  SkeletonBox,
  SkeletonList,
  Text,
  Row,
  Stack,
  useThemeContext,
  useToast,
} from '@scaffald/ui'
import { randomUUID } from 'expo-crypto'
import { MessageSquarePlus, Pin, PinOff, Shield, Star, ThumbsDown, ThumbsUp } from 'lucide-react-native'
import { useMemo, useState } from 'react'
import { Pressable } from 'react-native'
import { colors } from '@scaffald/ui/tokens'
import { workerPalette } from '@scf/core/components/ui/styles'
import { Pill } from '@scf/core/components/ui/CardPrimitives'
import { ReviewWizard } from '../../reviews/components/ReviewWizard'
import { ReviewImpactSummary } from '../../reviews/components/ReviewImpactSummary'
import {
  REVIEW_PIN_LIMIT,
  usePinReviewMutation,
  usePinnedReviews,
  useUnpinReviewMutation,
} from '../../reviews/hooks/useReviewPins'
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
  const t = theme === 'dark' ? 'dark' : 'light' as const
  const pal = workerPalette[t]
  const { user: currentUser } = useUser()
  const toast = useToast()

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

  // SC-30: pin/unpin state for the subject's own profile.
  const isOwnProfile = !!currentUser?.id && currentUser.id === userId
  const { data: pins } = usePinnedReviews(userId)
  const pinReview = usePinReviewMutation(userId)
  const unpinReview = useUnpinReviewMutation(userId)

  const pinPositionByReviewId = useMemo(() => {
    const map = new Map<string, number>()
    for (const pin of pins ?? []) map.set(pin.review_id, pin.position)
    return map
  }, [pins])
  const pinCount = pinPositionByReviewId.size
  const atPinCap = pinCount >= REVIEW_PIN_LIMIT

  /** Pick the lowest free position 0..2 for a new pin, or null if full. */
  const nextFreePosition = (): number | null => {
    const taken = new Set(pinPositionByReviewId.values())
    for (let i = 0; i < REVIEW_PIN_LIMIT; i++) if (!taken.has(i)) return i
    return null
  }

  const handleTogglePin = (reviewId: string) => {
    if (!isOwnProfile) return
    const currentPosition = pinPositionByReviewId.get(reviewId)
    if (currentPosition !== undefined) {
      unpinReview.mutate(reviewId, {
        onError: (err) => toast.show({ variant: 'error', title: 'Could not unpin', message: (err as Error).message }),
      })
      return
    }
    const slot = nextFreePosition()
    if (slot === null) {
      toast.show({
        variant: 'info',
        title: 'Pin limit reached',
        message: `You can pin up to ${REVIEW_PIN_LIMIT} reviews. Unpin one to make room.`,
      })
      return
    }
    pinReview.mutate(
      { reviewId, position: slot },
      { onError: (err) => toast.show({ variant: 'error', title: 'Could not pin', message: (err as Error).message }) },
    )
  }

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
            <DashboardWidgetHeader
              title="Reviews & Ratings"
              action={
                canLeaveReview ? (
                  <Button
                    variant="filled" color="primary"
                    size="sm"
                    iconStart={MessageSquarePlus}
                    onPress={handleLeaveReview}
                  >
                    Leave Review
                  </Button>
                ) : undefined
              }
            />
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

  // SC-30: pinned reviews float to the top (in pin order); rest by recency.
  const orderedReviews = useMemo(() => {
    const list = [...reviews]
    list.sort((a: Review, b: Review) => {
      const pa = pinPositionByReviewId.get(a.id)
      const pb = pinPositionByReviewId.get(b.id)
      if (pa !== undefined && pb !== undefined) return pa - pb
      if (pa !== undefined) return -1
      if (pb !== undefined) return 1
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
    return list
  }, [reviews, pinPositionByReviewId])

  const reviewsToShow = showCompact ? orderedReviews.slice(0, 2) : orderedReviews

  return (
    <>
      <DashboardWidget>
        <Stack gap={16}>
          {/* Header */}
          <DashboardWidgetHeader
            title="Reviews & Ratings"
            action={
              canLeaveReview ? (
                <Button
                  variant="filled" color="primary"
                  size="sm"
                  iconStart={MessageSquarePlus}
                  onPress={handleLeaveReview}
                >
                  Leave Review
                </Button>
              ) : undefined
            }
          />

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
            {reviewsToShow.map((review: Review) => {
              const isPinned = pinPositionByReviewId.has(review.id)
              const canPinAction = isOwnProfile && (isPinned || !atPinCap)
              const pinBusy = pinReview.isPending || unpinReview.isPending
              return (
              <Card key={review.id} variant="outlined" backgroundColor={colors.bg[theme].subtle}>
                <Stack gap={12} padding="md">
                  <Row justify="space-between" align="flex-start">
                    <Stack gap={4}>
                      <Row gap={8} align="center">
                        <Text style={{ color: colors.text[theme].secondary }}>Anonymous Reviewer</Text>
                        <Row gap={4} align="center">
                          <Shield size={14} color={pal.accent} />
                          <Pill label="VERIFIED" bgColor={pal.pillBg} textColor={pal.pillText} />
                        </Row>
                        {isPinned ? (
                          <Pill label="PINNED" bgColor={pal.pillBg} textColor={pal.pillText} />
                        ) : null}
                      </Row>
                    </Stack>
                    <Row gap={8} align="center">
                      <Text style={{ color: colors.text[theme].secondary }}>{new Date(review.created_at).toLocaleDateString()}</Text>
                      {isOwnProfile ? (
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={isPinned ? 'Unpin from profile' : 'Pin to profile'}
                          disabled={!canPinAction || pinBusy}
                          onPress={() => handleTogglePin(review.id)}
                          hitSlop={8}
                          style={({ pressed }) => ({
                            opacity: !canPinAction ? 0.35 : pressed ? 0.6 : 1,
                          })}
                        >
                          {isPinned ? (
                            <PinOff size={18} color={pal.accent} />
                          ) : (
                            <Pin size={18} color={canPinAction ? pal.accent : colors.text[theme].secondary} />
                          )}
                        </Pressable>
                      ) : null}
                    </Row>
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
              )
            })}

            {showCompact && reviews.length > 2 && (
              <Text style={{ color: pal.accent, cursor: 'pointer' }}>
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
