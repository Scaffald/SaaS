import {
  useCreateReviewDraftMutation,
  useSaveDraftMutation,
  useSubmitReviewMutation,
  useMyReviews,
  useSoftSkillsByCategory,
} from '@scf/core/utils/reviews-sdk-hooks'
import { useUserSkills } from '@scf/core/utils/user-profiles-sdk-hooks'
import { LoadFailure } from '@scf/core/components/ui'
import { useTrackEngagementMutation } from '@scf/core/utils/engagement-sdk-hooks'
import { ChevronLeft, ChevronRight } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Button, Card, Text, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { useReviewAutoSave } from '../hooks/useReviewAutoSave'
import { useReviewDraft } from '../hooks/useReviewDraft'
import { ratableSkillsFromSubject, softSkillsInCategory } from '../lib/review-skill-options'
import { ReviewProgress } from './ReviewProgress'
import { ReviewStep1Skills } from './ReviewStep1Skills'
import { ReviewStep7Summary } from './ReviewStep7Summary'
import { ReviewStep8Recommendation } from './ReviewStep8Recommendation'
import { ReviewStepCategoryRating } from './ReviewStepCategoryRating'
import { ReviewStepCategoryTags } from './ReviewStepCategoryTags'

interface ReviewWizardProps {
  subjectId: string
  subjectName: string
  onCancel: () => void
  onComplete: (reviewId: string) => void
}

export function ReviewWizard({ subjectId, subjectName, onCancel, onComplete }: ReviewWizardProps) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const totalSteps = 8
  const [reviewId, setReviewId] = useState<string | null>(null)
  const [isCreatingDraft, setIsCreatingDraft] = useState(false)

  // Initialize review draft state
  const reviewDraft = useReviewDraft({
    subjectId,
  })

  // SDK mutations and queries
  const createDraftMutation = useCreateReviewDraftMutation()
  const saveDraftMutation = useSaveDraftMutation()
  const submitReviewMutation = useSubmitReviewMutation()
  const { data: myReviews, isLoading: isLoadingReviews } = useMyReviews()

  // What the steps rate and tag: the subject's own skills and the soft-skill
  // catalog. These were hardcoded lists with made-up ids, the same for
  // everyone reviewed (#1247).
  const subjectSkillsQuery = useUserSkills(subjectId)
  const softSkillsQuery = useSoftSkillsByCategory()
  const ratableSkills = ratableSkillsFromSubject(subjectSkillsQuery.data)
  const softSkills = softSkillsQuery.data

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
          (review) => review.subject_id === subjectId && review.subject_type === 'user'
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
  }, [
    subjectId,
    myReviews,
    isLoadingReviews,
    createDraftMutation.mutateAsync,
    reviewId,
    createDraftMutation,
  ]) // Run when subjectId, myReviews, or loading state changes

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

      onComplete(reviewId)
    } catch (error) {
      console.error('Failed to submit review:', error)
    }
  }

  const optionsError = subjectSkillsQuery.error ?? softSkillsQuery.error
  if (optionsError) {
    return (
      <LoadFailure
        error={optionsError}
        noun="review form"
        retry={() => {
          void subjectSkillsQuery.refetch()
          void softSkillsQuery.refetch()
        }}
      />
    )
  }

  // Show loading state while creating draft and loading what it asks about
  if (isCreatingDraft || !reviewId || subjectSkillsQuery.isLoading || softSkillsQuery.isLoading) {
    return (
      <Card elevate bordered>
        <Stack gap={16} padding="lg" minHeight={600} justify="center" align="center">
          <Text style={{ color: colors.text[t].secondary }}>Preparing review form...</Text>
        </Stack>
      </Card>
    )
  }

  return (
    <Stack gap={16} padding="lg">
      {/* Progress Indicator */}
      <ReviewProgress currentStep={reviewDraft.currentStep} totalSteps={totalSteps} />
      <Text style={{ color: colors.text[t].secondary }}>Reviewing {subjectName}</Text>

      {/* Step Content */}
      <Card backgroundColor={colors.bg[t].muted} bordered>
        <Stack padding="lg" minHeight={400} gap={16}>
          {/* Step 1: Technical Skills Rating */}
          {reviewDraft.currentStep === 1 && (
            <ReviewStep1Skills
              skills={ratableSkills}
              subjectName={subjectName}
              ratings={reviewDraft.skillsRatings}
              onChange={reviewDraft.updateSkillRating}
            />
          )}

          {/* Step 2: Skills Tags */}
          {reviewDraft.currentStep === 2 && (
            <ReviewStepCategoryTags
              title="Technical Skills - Details"
              description="Select their key strengths and areas to improve"
              skills={softSkillsInCategory(softSkills, 'technical')}
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
              skills={softSkillsInCategory(softSkills, 'reliability')}
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
              skills={softSkillsInCategory(softSkills, 'collaboration')}
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
      <Row gap={12} justify="space-between">
        <Button
          size="md"
          variant="outline"
          iconStart={ChevronLeft}
          onPress={handleBack}
          disabled={!canGoBack}
          style={{ opacity: canGoBack ? 1 : 0.5 }}
        >
          Back
        </Button>

        <Row gap={8}>
          <Button size="md" variant="outline" onPress={onCancel}>
            Save & Exit
          </Button>

          {isLastStep ? (
            <Button size="md" color="success" onPress={handleSubmit}>
              Submit Review
            </Button>
          ) : (
            <Button
              size="md"
              color="primary"
              iconEnd={ChevronRight}
              onPress={handleNext}
              disabled={!canGoForward}
            >
              Continue
            </Button>
          )}
        </Row>
      </Row>

      {/* Auto-save Indicator */}
      <Row justify="center">
        <Text style={{ color: colors.text[t].secondary }}>
          {reviewDraft.hasUnsavedChanges ? '💾 Saving...' : '✓ All changes saved'}
        </Text>
      </Row>
    </Stack>
  )
}
