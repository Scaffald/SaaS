import { api } from '@scf/core/utils/api'
import { useAuth } from '@scf/core/provider/auth/useAuth'
import { MessageSquarePlus, Shield, Star, ThumbsDown, ThumbsUp } from 'lucide-react-native'
import { randomUUID } from 'expo-crypto'
import { useEffect, useRef } from 'react'
import { Button, Card, Spinner, Text, Row, Stack } from '@unicornlove/beyond-ui'

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

interface UserProfileReviewsProps {
  userId: string
  onLeaveReview?: () => void
}

export function UserProfileReviews({ userId, onLeaveReview }: UserProfileReviewsProps) {
  const { session } = useAuth()
  const currentUserId = session?.user?.id
  const hasTrackedViewRef = useRef(false) // Track if we've already recorded a view for this component mount

  // Track review view for engagement analytics
  const trackEventMutation = api.engagement.trackEvent.useMutation()

  // Fetch real reviews from database
  const { data: reviewsData, isLoading } = api.reviews.getBySubject.useQuery({
    subjectId: userId,
    subjectType: 'user',
    status: 'released',
  })

  const reviews = (Array.isArray(reviewsData) ? reviewsData : []) as Review[]

  // Track review view when reviews are loaded (only once per mount, and not for own profile)
  useEffect(() => {
    // Don't track if: already tracked, loading, no data, viewing own profile, or no reviews
    if (
      hasTrackedViewRef.current ||
      isLoading ||
      !reviewsData ||
      !currentUserId ||
      currentUserId === userId ||
      reviews.length === 0
    ) {
      return
    }

    // Mark as tracked
    hasTrackedViewRef.current = true

    // Track review view
    try {
      trackEventMutation.mutate({
        eventType: 'review.viewed',
        targetType: 'user',
        targetId: userId,
        metadata: {
          reviews_count: reviews.length,
        },
      })
    } catch (error) {
      // Silent error handling - don't impact review display
      console.warn('Failed to track review view:', error)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, currentUserId, isLoading, reviewsData, reviews.length, trackEventMutation.mutate, trackEventMutation])

  if (isLoading) {
    return (
      <Card elevate bordered>
        <Stack gap="$4" padding="$5" alignItems="center" justifyContent="center" minHeight={400}>
          <Spinner size="large" />
          <Text color="$color10">Loading reviews...</Text>
        </Stack>
      </Card>
    )
  }

  if (!reviewsData || reviews.length === 0) {
    return (
      <Card elevate bordered>
        <Stack gap="$4" padding="$5">
          <Row justifyContent="space-between" alignItems="center">
            <Row gap="$2" alignItems="center">
              <Star size={24} color="$blue10" fill="$blue10" />
              <Text fontSize="$7" fontWeight="700" color="$color12">
                Reviews & Ratings
              </Text>
            </Row>
            {onLeaveReview && (
              <Button size="$3" theme="info" icon={MessageSquarePlus} onPress={onLeaveReview}>
                Leave Review
              </Button>
            )}
          </Row>
          <Stack alignItems="center" justifyContent="center" minHeight={200} gap="$3">
            <Text fontSize="$6" color="$color10">
              No reviews yet
            </Text>
            <Stack alignItems="center">
              <Text fontSize="$4" color="$color9">
                Be the first to leave a review for this user
              </Text>
            </Stack>
          </Stack>
        </Stack>
      </Card>
    )
  }

  // Calculate statistics from real reviews
  const totalReviews = reviews.length
  const recommendCount = reviews.filter((r: Review) => r.reaction === 1).length
  const notRecommendCount = reviews.filter((r: Review) => r.reaction === -1).length

  // Calculate average ratings from category ratings
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

  return (
    <Card elevate bordered>
      <Stack gap="$4" padding="$5">
        {/* Header with Leave Review Button */}
        <Row justifyContent="space-between" alignItems="center">
          <Row gap="$2" alignItems="center">
            <Star size={24} color="$blue10" fill="$blue10" />
            <Text fontSize="$7" fontWeight="700" color="$color12">
              Reviews & Ratings
            </Text>
          </Row>
          {onLeaveReview && (
            <Button size="$3" theme="info" icon={MessageSquarePlus} onPress={onLeaveReview}>
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

              {Object.keys(avgByCategory).length > 0 && (
                <Stack flex={1} gap="$2">
                  {Object.entries(avgByCategory).map(([category, data]) => (
                    <Row key={category} gap="$2" alignItems="center">
                      <Text fontSize="$3" color="$color11" width={100} textTransform="capitalize">
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
                          width={`${(data.sum / data.count / 5) * 100}%`}
                          backgroundColor="$yellow10"
                        />
                      </Row>
                      <Text fontSize="$3" color="$color10" width={30}>
                        {(data.sum / data.count).toFixed(1)}
                      </Text>
                    </Row>
                  ))}
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
          <Text fontSize="$6" fontWeight="700" color="$color12">
            Reviews ({totalReviews})
          </Text>
          {reviews.map((review: Review) => (
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
                        backgroundColor="$blue3"
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
        </Stack>
      </Stack>
    </Card>
  )
}
