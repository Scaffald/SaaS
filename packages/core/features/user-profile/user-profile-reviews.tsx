import { YStack, XStack, Text, Card, Button, Spinner } from 'tamagui'
import { Star, ThumbsUp, ThumbsDown, MessageSquarePlus, Shield } from '@tamagui/lucide-icons'
import { randomUUID } from 'expo-crypto'
import { api } from '@app/core/utils/api'

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
  // Fetch real reviews from database
  const { data: reviews, isLoading } = api.reviews.getBySubject.useQuery({
    subjectId: userId,
    subjectType: 'user',
    status: 'released',
  })

  if (isLoading) {
    return (
      <Card elevate bordered>
        <YStack gap="$4" p="$5" items="center" justify="center" minH={400}>
          <Spinner size="large" />
          <Text color="$color10">Loading reviews...</Text>
        </YStack>
      </Card>
    )
  }

  if (!reviews || reviews.length === 0) {
    return (
      <Card elevate bordered>
        <YStack gap="$4" p="$5">
          <XStack justify="space-between" items="center">
            <XStack gap="$2" items="center">
              <Star size={24} color="$blue10" fill="$blue10" />
              <Text fontSize="$7" fontWeight="700" color="$color12">
                Reviews & Ratings
              </Text>
            </XStack>
            {onLeaveReview && (
              <Button size="$3" theme="blue" icon={MessageSquarePlus} onPress={onLeaveReview}>
                Leave Review
              </Button>
            )}
          </XStack>
          <YStack items="center" justify="center" minH={200} gap="$3">
            <Text fontSize="$6" color="$color10">
              No reviews yet
            </Text>
            <YStack items="center">
              <Text fontSize="$4" color="$color9">
                Be the first to leave a review for this user
              </Text>
            </YStack>
          </YStack>
        </YStack>
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
    // biome-ignore lint/suspicious/noExplicitAny: Dynamic category accumulation
    (acc: Record<string, { sum: number; count: number }>, rating: any) => {
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
      ? // biome-ignore lint/suspicious/noExplicitAny: Dynamic rating calculation
        categoryRatings.reduce((sum: number, r: any) => sum + r.rating, 0) / categoryRatings.length
      : 0

  return (
    <Card elevate bordered>
      <YStack gap="$4" p="$5">
        {/* Header with Leave Review Button */}
        <XStack justify="space-between" items="center">
          <XStack gap="$2" items="center">
            <Star size={24} color="$blue10" fill="$blue10" />
            <Text fontSize="$7" fontWeight="700" color="$color12">
              Reviews & Ratings
            </Text>
          </XStack>
          {onLeaveReview && (
            <Button size="$3" theme="blue" icon={MessageSquarePlus} onPress={onLeaveReview}>
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

              {Object.keys(avgByCategory).length > 0 && (
                <YStack flex={1} gap="$2">
                  {/* biome-ignore lint/suspicious/noExplicitAny: Dynamic category data */}
                  {Object.entries(avgByCategory).map(([category, data]: [string, any]) => (
                    <XStack key={category} gap="$2" items="center">
                      <Text fontSize="$3" color="$color11" width={100} textTransform="capitalize">
                        {category}
                      </Text>
                      <XStack flex={1} height={6} bg="$color3" rounded="$2" overflow="hidden">
                        <XStack width={`${(data.sum / data.count / 5) * 100}%`} bg="$yellow10" />
                      </XStack>
                      <Text fontSize="$3" color="$color10" width={30}>
                        {(data.sum / data.count).toFixed(1)}
                      </Text>
                    </XStack>
                  ))}
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
          <Text fontSize="$6" fontWeight="700" color="$color12">
            Reviews ({totalReviews})
          </Text>
          {reviews.map((review: Review) => (
            <Card key={review.id} bordered bg="$color2">
              <YStack gap="$3" p="$4">
                <XStack justify="space-between" items="flex-start">
                  <YStack gap="$1">
                    <XStack gap="$2" items="center">
                      <Text fontSize="$5" fontWeight="700" color="$color12">
                        Anonymous Reviewer
                      </Text>
                      <XStack gap="$1" items="center" px="$2" py="$0.5" bg="$blue3" rounded="$2">
                        <Shield size={12} color="$blue11" />
                        <Text fontSize="$1" color="$blue11" fontWeight="600">
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
        </YStack>
      </YStack>
    </Card>
  )
}
