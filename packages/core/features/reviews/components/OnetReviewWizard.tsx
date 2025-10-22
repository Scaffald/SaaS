import { useState, useEffect } from 'react'
import { YStack, XStack, Button, Text, Card, H3, Paragraph } from 'tamagui'
import { ChevronLeft, ChevronRight, X } from '@tamagui/lucide-icons'
import { ReviewProgress } from './ReviewProgress'
import { ReviewStep8Recommendation } from './ReviewStep8Recommendation'
import { OnetCategoryStep } from './OnetCategoryStep'
import { OnetSummaryStep } from './OnetSummaryStep'
import { useOnetReviewDraft } from '../hooks/useOnetReviewDraft'
import { REVIEW_CATEGORIES } from '../data/mock-onet-elements'
import { api } from '@app/core/utils/api'

interface Review {
  id: string
  subject_id: string
  subject_type: string
  status: string
  author_user_id: string
}

interface OnetReviewWizardProps {
  subjectId: string
  subjectName: string
  onCancel: () => void
  onComplete: () => void
}

export function OnetReviewWizard({
  subjectId,
  subjectName,
  onCancel,
  onComplete,
}: OnetReviewWizardProps) {
  // Total steps: 4 category steps + 1 summary step + 1 recommendation step = 6 steps
  const totalSteps = 6
  const [reviewId, setReviewId] = useState<string | null>(null)
  const [isCreatingDraft, setIsCreatingDraft] = useState(false)

  // Initialize review draft state
  const reviewDraft = useOnetReviewDraft({ subjectId })

  // tRPC mutations and queries
  const createDraftMutation = api.reviews.createDraft.useMutation()
  const { data: myReviews, isLoading: isLoadingReviews } = api.reviews.getMyReviews.useQuery()

  // Check for existing draft or create new one on mount
  useEffect(() => {
    const initializeDraft = async () => {
      if (reviewId) return
      if (isLoadingReviews) return
      if (!myReviews) return

      setIsCreatingDraft(true)
      try {
        const existingDraft = myReviews.find(
          (review: Review) =>
            review.subject_id === subjectId &&
            review.subject_type === 'user' &&
            review.status === 'draft'
        )

        if (existingDraft) {
          setReviewId(existingDraft.id)
        } else {
          const result = await createDraftMutation.mutateAsync({
            subjectId,
            subjectType: 'user',
          })
          setReviewId(result.id)
        }
      } catch (error) {
        console.error('Failed to initialize review draft:', error)
      } finally {
        setIsCreatingDraft(false)
      }
    }

    initializeDraft()
  }, [subjectId, myReviews, isLoadingReviews, reviewId, createDraftMutation])

  const canGoBack = reviewDraft.currentStep > 1
  const canGoForward = reviewDraft.currentStep < totalSteps
  const isLastStep = reviewDraft.currentStep === totalSteps

  // Get current category (steps 1-4)
  const currentCategory =
    reviewDraft.currentStep <= 4 ? REVIEW_CATEGORIES[reviewDraft.currentStep - 1] : null

  // Get strengths and improvements for summary step
  const { strengths, improvements } = reviewDraft.getStrengthsAndImprovements()

  // Calculate overall progress
  const totalRatings = Object.keys(reviewDraft.onetRatings).length
  const totalElements = REVIEW_CATEGORIES.reduce((sum, cat) => sum + cat.elements.length, 0)
  const overallProgress = totalElements > 0 ? (totalRatings / totalElements) * 100 : 0

  const handleSubmit = async () => {
    if (!reviewId) {
      console.error('Cannot submit: no review ID')
      return
    }

    // In real implementation, would save O*NET ratings to backend
    console.log('Submitting O*NET review:', {
      reviewId,
      ratings: reviewDraft.onetRatings,
      summary: reviewDraft.summary,
      recommendation: reviewDraft.recommendation,
    })

    // For now, just call onComplete
    onComplete()
  }

  if (isCreatingDraft || !reviewId) {
    return (
      <Card elevate bordered>
        <YStack gap="$4" p="$5" minH={600} justify="center" items="center">
          <Text fontSize="$6" color="$color11">
            Preparing review form...
          </Text>
        </YStack>
      </Card>
    )
  }

  return (
    <Card elevate bordered>
      <YStack gap="$4" p="$5">
        {/* Header */}
        <XStack justify="space-between" items="center">
          <YStack gap="$1">
            <H3>O*NET-Based Review</H3>
            <Text fontSize="$5" color="$color11">
              Reviewing {subjectName}
            </Text>
            <Text fontSize="$3" color="$color10">
              {Math.round(overallProgress)}% complete • {totalRatings} of {totalElements} rated
            </Text>
          </YStack>
          <Button size="$3" circular icon={X} onPress={onCancel} chromeless />
        </XStack>

        {/* Progress Indicator */}
        <ReviewProgress currentStep={reviewDraft.currentStep} totalSteps={totalSteps} />

        {/* Step Content */}
        <Card bg="$color2" bordered>
          <YStack p="$5" minH={500} gap="$4">
            {/* Steps 1-4: Category Rating Steps */}
            {reviewDraft.currentStep >= 1 && reviewDraft.currentStep <= 4 && currentCategory && (
              <OnetCategoryStep
                category={currentCategory}
                ratings={reviewDraft.onetRatings}
                onRate={reviewDraft.updateRating}
              />
            )}

            {/* Step 5: Summary */}
            {reviewDraft.currentStep === 5 && (
              <OnetSummaryStep
                strengths={strengths}
                improvements={improvements}
                summary={reviewDraft.summary}
                onSummaryChange={reviewDraft.updateSummary}
              />
            )}

            {/* Step 6: Recommendation */}
            {reviewDraft.currentStep === 6 && (
              <YStack gap="$4" flex={1}>
                <YStack gap="$2">
                  <H3>Final Recommendation</H3>
                  <Paragraph color="$color11" fontSize="$4">
                    Based on your ratings, would you recommend this person?
                  </Paragraph>
                </YStack>

                {/* Show summary of ratings */}
                <YStack gap="$3" bg="$blue2" p="$4" style={{ borderRadius: 12 }}>
                  <Text fontSize="$4" fontWeight="600">
                    📊 Review Summary
                  </Text>
                  <XStack gap="$4">
                    <YStack gap="$1">
                      <Text fontSize="$6" fontWeight="700" color="$green11">
                        {strengths.length}
                      </Text>
                      <Text fontSize="$3" color="$color11">
                        Strengths
                      </Text>
                    </YStack>
                    <YStack gap="$1">
                      <Text fontSize="$6" fontWeight="700" color="$color">
                        {improvements.length}
                      </Text>
                      <Text fontSize="$3" color="$color11">
                        Improvements
                      </Text>
                    </YStack>
                    <YStack gap="$1">
                      <Text fontSize="$6" fontWeight="700" color="$blue11">
                        {totalRatings}
                      </Text>
                      <Text fontSize="$3" color="$color11">
                        Items Rated
                      </Text>
                    </YStack>
                  </XStack>
                </YStack>

                <ReviewStep8Recommendation
                  recommendation={reviewDraft.recommendation}
                  onChange={reviewDraft.updateRecommendation}
                />
              </YStack>
            )}
          </YStack>
        </Card>

        {/* Navigation Buttons */}
        <XStack gap="$3" justify="space-between">
          <Button
            size="$4"
            variant="outlined"
            icon={ChevronLeft}
            onPress={reviewDraft.goToPreviousStep}
            disabled={!canGoBack}
            opacity={canGoBack ? 1 : 0.5}
          >
            Back
          </Button>

          <XStack gap="$2">
            <Button size="$4" variant="outlined" onPress={onCancel}>
              Save & Exit
            </Button>

            {isLastStep ? (
              <Button
                size="$4"
                theme="green"
                onPress={handleSubmit}
                disabled={reviewDraft.recommendation === null}
              >
                Submit Review
              </Button>
            ) : (
              <Button
                size="$4"
                theme="blue"
                iconAfter={ChevronRight}
                onPress={reviewDraft.goToNextStep}
                disabled={!canGoForward}
              >
                Continue
              </Button>
            )}
          </XStack>
        </XStack>

        {/* Status Indicator */}
        <XStack justify="center">
          <Text fontSize="$3" color="$color10">
            {reviewDraft.hasUnsavedChanges ? '💾 Changes pending...' : '✓ All changes saved'}
          </Text>
        </XStack>
      </YStack>
    </Card>
  )
}
