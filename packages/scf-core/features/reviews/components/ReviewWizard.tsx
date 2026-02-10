import { api } from '@scf/core/utils/api'
import { useTrackEngagementMutation } from '@scf/core/utils/engagement-sdk-hooks'
import { ChevronLeft, ChevronRight } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Button, Card, Text, Row, Stack } from '@unicornlove/beyond-ui'
import { useReviewAutoSave } from '../hooks/useReviewAutoSave'
import { useReviewDraft } from '../hooks/useReviewDraft'
import { ReviewProgress } from './ReviewProgress'
import { ReviewStep1Skills } from './ReviewStep1Skills'
import { ReviewStep2SkillsTags } from './ReviewStep2SkillsTags'
import { ReviewStep7Summary } from './ReviewStep7Summary'
import { ReviewStep8Recommendation } from './ReviewStep8Recommendation'
import { ReviewStepCategoryRating } from './ReviewStepCategoryRating'
import { ReviewStepCategoryTags } from './ReviewStepCategoryTags'

interface Review {
  id: string
  subject_id: string
  subject_type: string
  status: string
  author_user_id: string
}

interface ReviewWizardProps {
  subjectId: string
  subjectName: string
  onCancel: () => void
  onComplete: () => void
}

// Mock soft skills - will be replaced with API data
const MOCK_RELIABILITY_SKILLS = [
  { id: 'rel1', name: 'Deadline management', category: 'reliability' },
  { id: 'rel2', name: 'Prioritization', category: 'reliability' },
  { id: 'rel3', name: 'Time management', category: 'reliability' },
  { id: 'rel4', name: 'Task delegation', category: 'reliability' },
]

const MOCK_COLLABORATION_SKILLS = [
  { id: 'col1', name: 'Communication', category: 'collaboration' },
  { id: 'col2', name: 'Teamwork', category: 'collaboration' },
  { id: 'col3', name: 'Active listening', category: 'collaboration' },
  { id: 'col4', name: 'Conflict resolution', category: 'collaboration' },
]

export function ReviewWizard({ subjectId, subjectName, onCancel, onComplete }: ReviewWizardProps) {
  const totalSteps = 8
  const [reviewId, setReviewId] = useState<string | null>(null)
  const [isCreatingDraft, setIsCreatingDraft] = useState(false)

  // Initialize review draft state
  const reviewDraft = useReviewDraft({
    subjectId,
  })

  // tRPC mutations and queries
  const createDraftMutation = api.reviews.createDraft.useMutation()
  const saveDraftMutation = api.reviews.saveDraft.useMutation()
  const submitReviewMutation = api.reviews.submitReview.useMutation()
  const { data: myReviews, isLoading: isLoadingReviews } = api.reviews.getMyReviews.useQuery()

  // Check for existing draft or create new one on mount
  useEffect(() => {
    const initializeDraft = async () => {
      if (reviewId) return // Already initialized
      if (isLoadingReviews) return // Wait for reviews to finish loading
      if (!myReviews) return // Wait for reviews data

      setIsCreatingDraft(true)
      try {
        // Check if a draft already exists
        const existingDraft = myReviews.find(
          (review: Review) =>
            review.subject_id === subjectId &&
            review.subject_type === 'user' &&
            review.status === 'draft'
        )

        if (existingDraft) {
          // Resume existing draft
          setReviewId(existingDraft.id)
          console.log('Resuming existing draft:', existingDraft.id)
        } else {
          // Create new draft
          const result = await createDraftMutation.mutateAsync({
            subjectId,
            subjectType: 'user',
          })
          setReviewId(result.id)
          console.log('Created new draft:', result.id)
        }
      } catch (error) {
        console.error('Failed to initialize review draft:', error)
      } finally {
        setIsCreatingDraft(false)
      }
    }

    initializeDraft()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId, myReviews, isLoadingReviews, createDraftMutation.mutateAsync, reviewId, createDraftMutation]) // Run when subjectId, myReviews, or loading state changes

  // Setup auto-save - only enabled when we have a reviewId
  useReviewAutoSave({
    draft: reviewDraft.getDraft(),
    enabled: !!reviewId && reviewDraft.hasUnsavedChanges,
    onSave: async (draft) => {
      if (!reviewId) return

      await saveDraftMutation.mutateAsync({
        reviewId,
        draft: {
          subjectId: draft.subjectId,
          skillsRatings: draft.skillsRatings,
          skillsStrengths: draft.skillsStrengths,
          skillsImprovements: draft.skillsImprovements,
          reliabilityRating: draft.reliabilityRating,
          reliabilityStrengths: draft.reliabilityStrengths,
          reliabilityImprovements: draft.reliabilityImprovements,
          collaborationRating: draft.collaborationRating,
          collaborationStrengths: draft.collaborationStrengths,
          collaborationImprovements: draft.collaborationImprovements,
          summary: draft.summary,
          recommendation: draft.recommendation,
          currentStep: draft.currentStep,
        },
      })
    },
    onSaveSuccess: () => {
      reviewDraft.markAsSaved()
    },
    onSaveError: (error) => {
      console.error('Failed to auto-save:', error)
    },
  })

  const canGoBack = reviewDraft.currentStep > 1
  const canGoForward = reviewDraft.currentStep < totalSteps
  const isLastStep = reviewDraft.currentStep === totalSteps

  const handleBack = () => {
    reviewDraft.goToPreviousStep()
  }

  const handleNext = () => {
    reviewDraft.goToNextStep()
  }

  // Track review submission for engagement analytics
  const trackEventMutation = useTrackEngagementMutation()

  const handleSubmit = async () => {
    if (!reviewId) {
      console.error('Cannot submit: no review ID')
      return
    }

    try {
      const draft = reviewDraft.getDraft()
      await submitReviewMutation.mutateAsync({
        reviewId,
        recommendation: draft.recommendation ? 1 : -1,
      })

      // Track review submission after successful submit
      try {
        trackEventMutation.mutate({
          eventType: 'review.submitted',
          targetType: 'user',
          targetId: subjectId,
          metadata: {
            review_id: reviewId,
            recommendation: draft.recommendation ? 1 : -1,
          },
        })
      } catch (error) {
        // Silent error handling - don't impact review submission
        console.warn('Failed to track review submission:', error)
      }

      onComplete()
    } catch (error) {
      console.error('Failed to submit review:', error)
    }
  }

  // Show loading state while creating draft
  if (isCreatingDraft || !reviewId) {
    return (
      <Card elevate bordered>
        <Stack gap="$4" padding="$5" minHeight={600} justifyContent="center" alignItems="center">
          <Text fontSize="$6" color="$color11">
            Preparing review form...
          </Text>
        </Stack>
      </Card>
    )
  }

  return (
    <Stack gap="$4" padding="$5">
      {/* Progress Indicator */}
      <ReviewProgress currentStep={reviewDraft.currentStep} totalSteps={totalSteps} />
      <Text fontSize="$6" fontWeight="700" color="$color12">
        Reviewing {subjectName}
      </Text>

      {/* Step Content */}
      <Card backgroundColor="$color2" bordered>
        <Stack padding="$5" minHeight={400} gap="$4">
          {/* Step 1: Technical Skills Rating */}
          {reviewDraft.currentStep === 1 && (
            <ReviewStep1Skills
              ratings={reviewDraft.skillsRatings}
              onChange={reviewDraft.updateSkillRating}
            />
          )}

          {/* Step 2: Skills Tags */}
          {reviewDraft.currentStep === 2 && (
            <ReviewStep2SkillsTags
              strengths={reviewDraft.skillsStrengths}
              improvements={reviewDraft.skillsImprovements}
              onToggleStrength={reviewDraft.toggleSkillStrength}
              onToggleImprovement={reviewDraft.toggleSkillImprovement}
            />
          )}

          {/* Step 3: Reliability Rating */}
          {reviewDraft.currentStep === 3 && (
            <ReviewStepCategoryRating
              title="Reliability"
              description="How reliable were they in meeting deadlines and commitments?"
              category="Reliability"
              rating={reviewDraft.reliabilityRating}
              onChange={reviewDraft.updateReliabilityRating}
            />
          )}

          {/* Step 4: Reliability Tags */}
          {reviewDraft.currentStep === 4 && (
            <ReviewStepCategoryTags
              title="Reliability - Details"
              description="What are their reliability strengths and areas to improve?"
              skills={MOCK_RELIABILITY_SKILLS}
              strengths={reviewDraft.reliabilityStrengths}
              improvements={reviewDraft.reliabilityImprovements}
              onToggleStrength={reviewDraft.toggleReliabilityStrength}
              onToggleImprovement={reviewDraft.toggleReliabilityImprovement}
            />
          )}

          {/* Step 5: Collaboration Rating */}
          {reviewDraft.currentStep === 5 && (
            <ReviewStepCategoryRating
              title="Collaboration"
              description="How well did they collaborate with others?"
              category="Collaboration"
              rating={reviewDraft.collaborationRating}
              onChange={reviewDraft.updateCollaborationRating}
            />
          )}

          {/* Step 6: Collaboration Tags */}
          {reviewDraft.currentStep === 6 && (
            <ReviewStepCategoryTags
              title="Collaboration - Details"
              description="What are their collaboration strengths and areas to improve?"
              skills={MOCK_COLLABORATION_SKILLS}
              strengths={reviewDraft.collaborationStrengths}
              improvements={reviewDraft.collaborationImprovements}
              onToggleStrength={reviewDraft.toggleCollaborationStrength}
              onToggleImprovement={reviewDraft.toggleCollaborationImprovement}
            />
          )}

          {/* Step 7: Summary */}
          {reviewDraft.currentStep === 7 && (
            <ReviewStep7Summary
              comment={reviewDraft.summary}
              onChange={reviewDraft.updateSummary}
            />
          )}

          {/* Step 8: Recommendation */}
          {reviewDraft.currentStep === 8 && (
            <ReviewStep8Recommendation
              recommendation={reviewDraft.recommendation}
              onChange={reviewDraft.updateRecommendation}
            />
          )}
        </Stack>
      </Card>

      {/* Navigation Buttons */}
      <Row gap="$3" justifyContent="space-between">
        <Button
          size="$4"
          variant="outlined"
          icon={ChevronLeft}
          onPress={handleBack}
          disabled={!canGoBack}
          opacity={canGoBack ? 1 : 0.5}
        >
          Back
        </Button>

        <Row gap="$2">
          <Button size="$4" variant="outlined" onPress={onCancel}>
            Save & Exit
          </Button>

          {isLastStep ? (
            <Button size="$4" theme="success" onPress={handleSubmit}>
              Submit Review
            </Button>
          ) : (
            <Button
              size="$4"
              theme="info"
              iconAfter={ChevronRight}
              onPress={handleNext}
              disabled={!canGoForward}
            >
              Continue
            </Button>
          )}
        </Row>
      </Row>

      {/* Auto-save Indicator */}
      <Row justifyContent="center">
        <Text fontSize="$3" color="$color10">
          {reviewDraft.hasUnsavedChanges ? '💾 Saving...' : '✓ All changes saved'}
        </Text>
      </Row>
    </Stack>
  )
}
