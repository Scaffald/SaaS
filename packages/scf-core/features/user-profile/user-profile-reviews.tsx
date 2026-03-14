import { useAuth } from "@scf/core/provider/auth/useAuth";
import { useTrackEngagementMutation } from "@scf/core/utils/engagement-sdk-hooks";
import { useReviewsBySubject } from "@scf/core/utils/reviews-sdk-hooks";
import {
  MessageSquarePlus,
  Shield,
  Star,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react-native";
import { randomUUID } from "expo-crypto";
import { useEffect, useRef } from "react";
import { Button, Card, Spinner, Text, Row, Stack, useThemeContext } from "@scaffald/ui";
import { colors } from "@scaffald/ui/tokens";

interface CategoryRating {
  category: string;
  rating: number;
}

interface Review {
  id: string;
  created_at: string;
  comment: string | null;
  reaction: number | null;
  review_category_ratings: CategoryRating[];
}

interface UserProfileReviewsProps {
  userId: string;
  onLeaveReview?: () => void;
}

export function UserProfileReviews({
  userId,
  onLeaveReview,
}: UserProfileReviewsProps) {
  const { session } = useAuth();
  const currentUserId = session?.user?.id;
  const { theme } = useThemeContext();
  const t = theme === "dark" ? "dark" : "light";
  const hasTrackedViewRef = useRef(false); // Track if we've already recorded a view for this component mount

  // Track review view for engagement analytics
  const trackEventMutation = useTrackEngagementMutation();

  // Fetch real reviews from database
  const { data: reviewsData, isLoading } = useReviewsBySubject({
    subjectId: userId,
    subjectType: "user",
    status: "released",
  });

  const reviews = (Array.isArray(reviewsData) ? reviewsData : []) as Review[];

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
      return;
    }

    // Mark as tracked
    hasTrackedViewRef.current = true;

    // Track review view
    try {
      trackEventMutation.mutate({
        eventType: "review.viewed" as never,
        targetType: "user",
        targetId: userId,
        metadata: {
          reviews_count: reviews.length,
        },
      });
    } catch (error) {
      // Silent error handling - don't impact review display
      console.warn("Failed to track review view:", error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    userId,
    currentUserId,
    isLoading,
    reviewsData,
    reviews.length,
    trackEventMutation.mutate,
    trackEventMutation,
  ]);

  if (isLoading) {
    return (
      <Card elevate bordered>
        <Stack
          gap={16}
          padding="lg"
          align="center"
          justify="center"
          minHeight={400}
        >
          <Spinner size="lg" />
          <Text style={{ color: colors.text[t].secondary }}>Loading reviews...</Text>
        </Stack>
      </Card>
    );
  }

  if (!reviewsData || reviews.length === 0) {
    return (
      <Card elevate bordered>
        <Stack gap={16} padding="lg">
          <Row justify="space-between" align="center">
            <Row gap={8} align="center">
              <Star size={24} color={t === "dark" ? colors.blue[300] : colors.blue[600]} fill={t === "dark" ? colors.blue[300] : colors.blue[600]} />
              <Text style={{ color: colors.text[t].secondary }}>Reviews & Ratings</Text>
            </Row>
            {onLeaveReview && (
              <Button
                size="sm"
                color="primary"
                iconStart={MessageSquarePlus}
                onPress={onLeaveReview}
              >
                Leave Review
              </Button>
            )}
          </Row>
          <Stack align="center" justify="center" minHeight={200} gap={12}>
            <Text style={{ color: colors.text[t].secondary }}>No reviews yet</Text>
            <Stack align="center">
              <Text style={{ color: colors.text[t].secondary }}>
                Be the first to leave a review for this user
              </Text>
            </Stack>
          </Stack>
        </Stack>
      </Card>
    );
  }

  // Calculate statistics from real reviews
  const totalReviews = reviews.length;
  const recommendCount = reviews.filter((r: Review) => r.reaction === 1).length;
  const notRecommendCount = reviews.filter(
    (r: Review) => r.reaction === -1
  ).length;

  // Calculate average ratings from category ratings
  const categoryRatings = reviews.flatMap(
    (r: Review) => r.review_category_ratings || []
  );
  const avgByCategory = categoryRatings.reduce(
    (
      acc: Record<string, { sum: number; count: number }>,
      rating: CategoryRating
    ) => {
      if (!acc[rating.category]) {
        acc[rating.category] = { sum: 0, count: 0 };
      }
      acc[rating.category].sum += rating.rating;
      acc[rating.category].count += 1;
      return acc;
    },
    {} as Record<string, { sum: number; count: number }>
  );

  const overallRating =
    categoryRatings.length > 0
      ? categoryRatings.reduce(
          (sum: number, r: CategoryRating) => sum + r.rating,
          0
        ) / categoryRatings.length
      : 0;

  return (
    <Card elevate bordered>
      <Stack gap={16} padding="lg">
        {/* Header with Leave Review Button */}
        <Row justify="space-between" align="center">
          <Row gap={8} align="center">
            <Star size={24} color={t === "dark" ? colors.blue[300] : colors.blue[600]} fill={t === "dark" ? colors.blue[300] : colors.blue[600]} />
            <Text style={{ color: colors.text[t].secondary }}>Reviews & Ratings</Text>
          </Row>
          {onLeaveReview && (
            <Button
              size="sm"
              color="primary"
              iconStart={MessageSquarePlus}
              onPress={onLeaveReview}
            >
              Leave Review
            </Button>
          )}
        </Row>

        {/* Rating Summary */}
        <Card bordered style={{ backgroundColor: colors.bg[t].subtle }}>
          <Stack gap={12} padding="md">
            <Row gap={16} align="center">
              <Stack align="center">
                <Text style={{ color: colors.text[t].secondary }}>{overallRating.toFixed(1)}</Text>
                <Row gap={4}>
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={randomUUID()}
                      size="md"
                      color={t === "dark" ? colors.yellow[300] : colors.yellow[600]}
                      fill={
                        i < Math.floor(overallRating)
                          ? (t === "dark" ? colors.yellow[300] : colors.yellow[600])
                          : "transparent"
                      }
                    />
                  ))}
                </Row>
                <Text style={{ color: colors.text[t].secondary }}>
                  {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
                </Text>
              </Stack>

              {Object.keys(avgByCategory).length > 0 && (
                <Stack flex={1} gap={8}>
                  {Object.entries(avgByCategory).map(([category, data]) => (
                    <Row key={category} gap={8} align="center">
                      <Text
                        style={{ width: 100, textTransform: "capitalize", color: colors.text[t].secondary }}
                      >
                        {category}
                      </Text>
                      <Row
                        flex={1}
                        style={{
                          height: 6,
                          backgroundColor: colors.bg[t].muted,
                          borderRadius: 8,
                          overflow: "hidden",
                        }}
                      >
                        <Row
                          width={`${(data.sum / data.count / 5) * 100}%`}
                          style={{ backgroundColor: t === "dark" ? colors.yellow[300] : colors.yellow[600] }}
                        />
                      </Row>
                      <Text style={{ width: 30, color: colors.text[t].secondary }}>
                        {(data.sum / data.count).toFixed(1)}
                      </Text>
                    </Row>
                  ))}
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
                style={{ backgroundColor: t === "dark" ? colors.green[900] : colors.green[100] }}
                borderRadius={12}
              >
                <ThumbsUp size="md" color={t === "dark" ? colors.green[300] : colors.green[600]} />
                <Text style={{ color: t === "dark" ? colors.green[300] : colors.green[600] }}>{recommendCount} Recommend</Text>
              </Row>
              <Row
                gap={8}
                align="center"
                paddingHorizontal={12}
                paddingVertical={8}
                style={{ backgroundColor: t === "dark" ? colors.rose[900] : colors.rose[100] }}
                borderRadius={12}
              >
                <ThumbsDown size="md" color={t === "dark" ? colors.rose[300] : colors.rose[600]} />
                <Text style={{ color: t === "dark" ? colors.rose[300] : colors.rose[600] }}>{notRecommendCount} Don't Recommend</Text>
              </Row>
            </Row>
          </Stack>
        </Card>

        {/* Reviews List */}
        <Stack gap={12}>
          <Text style={{ color: colors.text[t].secondary }}>Reviews ({totalReviews})</Text>
          {reviews.map((review: Review) => (
            <Card key={review.id} bordered style={{ backgroundColor: colors.bg[t].subtle }}>
              <Stack gap={12} padding="md">
                <Row justify="space-between" align="flex-start">
                  <Stack gap={4}>
                    <Row gap={8} align="center">
                      <Text style={{ color: colors.text[t].secondary }}>Anonymous Reviewer</Text>
                      <Row
                        gap={4}
                        align="center"
                        paddingHorizontal={8}
                        paddingVertical={2}
                        style={{ backgroundColor: t === "dark" ? colors.blue[900] : colors.blue[100] }}
                        borderRadius={8}
                      >
                        <Shield size="sm" color={t === "dark" ? colors.blue[300] : colors.blue[600]} />
                        <Text style={{ color: t === "dark" ? colors.blue[300] : colors.blue[600] }}>VERIFIED</Text>
                      </Row>
                    </Row>
                  </Stack>
                  <Text style={{ color: colors.text[t].secondary }}>
                    {new Date(review.created_at).toLocaleDateString()}
                  </Text>
                </Row>

                {/* Overall Rating */}
                {review.review_category_ratings &&
                  review.review_category_ratings.length > 0 && (
                    <Row gap={4}>
                      {[...Array(5)].map((_, i) => {
                        const avgRating =
                          review.review_category_ratings.reduce(
                            (sum: number, r: CategoryRating) => sum + r.rating,
                            0
                          ) / review.review_category_ratings.length;
                        return (
                          <Star
                            key={randomUUID()}
                            size="md"
                            color={t === "dark" ? colors.yellow[300] : colors.yellow[600]}
                            fill={
                              i < Math.floor(avgRating)
                                ? (t === "dark" ? colors.yellow[300] : colors.yellow[600])
                                : "transparent"
                            }
                          />
                        );
                      })}
                    </Row>
                  )}

                {/* Comment */}
                {review.comment && (
                  <Text style={{ color: colors.text[t].secondary }}>{review.comment}</Text>
                )}

                {/* Recommendation */}
                {review.reaction !== null && (
                  <Row gap={8} align="center">
                    {review.reaction === 1 ? (
                      <>
                        <ThumbsUp size="md" color={t === "dark" ? colors.green[300] : colors.green[600]} />
                        <Text style={{ color: t === "dark" ? colors.green[300] : colors.green[600] }}>Recommends this person</Text>
                      </>
                    ) : (
                      <>
                        <ThumbsDown size="md" color={t === "dark" ? colors.rose[300] : colors.rose[600]} />
                        <Text style={{ color: t === "dark" ? colors.rose[300] : colors.rose[600] }}>Does not recommend</Text>
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
  );
}
