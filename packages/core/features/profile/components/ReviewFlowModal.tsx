'use client'

import {
  Button,
  Chip,
  FilterChip,
  Input,
  Paragraph,
  SizableText,
  Switch,
  TextArea,
  XStack,
  YStack,
  useToastController,
} from '@app/ui'
import { useQueryClient } from '@tanstack/react-query'
import type { ComponentProps } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, ThumbsDown, ThumbsUp, X } from '@tamagui/lucide-icons'
import { Dialog, Label, ScrollView, Separator, Theme } from 'tamagui'

import { api } from '../../../utils/api'

const SOFT_SKILL_OPTIONS = [
  'Communication',
  'Collaboration',
  'Adaptability',
  'Problem Solving',
  'Leadership',
  'Creativity',
  'Time Management',
  'Attention to Detail',
  'Empathy',
  'Accountability',
] as const

type SkillEvaluation = 'strength' | 'improve' | null

type ReviewDraftState = {
  currentStep: number
  skillEvaluations: Record<string, SkillEvaluation>
  selectedSoftSkills: string[]
  recommendedSkills: string[]
  comment: string
  isPublic: boolean
}

type ReviewFlowModalProps = Omit<ComponentProps<typeof Dialog>, 'children'> & {
  reviewId: string
  subjectId: string
  subjectName: string
  subjectSkills: string[]
  onClose?: () => void
  onSubmitted?: () => void
}

const totalSteps = 4

const createInitialState = (skills: string[]): ReviewDraftState => ({
  currentStep: 0,
  skillEvaluations: skills.reduce<Record<string, SkillEvaluation>>((acc, skill) => {
    acc[skill] = acc[skill] ?? null
    return acc
  }, {}),
  selectedSoftSkills: [],
  recommendedSkills: [],
  comment: '',
  isPublic: true,
})

export const ReviewFlowModal = ({
  open,
  onOpenChange,
  reviewId,
  subjectId,
  subjectName,
  subjectSkills,
  onClose,
  onSubmitted,
  ...dialogProps
}: ReviewFlowModalProps) => {
  const queryClient = useQueryClient()
  const toast = useToastController()
  const draftKey = useMemo(() => ['review-flow-draft', reviewId] as const, [reviewId])
  const allSkills = useMemo(() => {
    const unique = new Set<string>(
      [...subjectSkills, ...SOFT_SKILL_OPTIONS].map((skill) => skill.trim())
    )
    return Array.from(unique).filter(Boolean).sort((a, b) => a.localeCompare(b))
  }, [subjectSkills])

  const initialState = useMemo(() => createInitialState(allSkills), [allSkills])

  const [draftState, setDraftState] = useState<ReviewDraftState>(() => {
    const cached = queryClient.getQueryData<ReviewDraftState>(draftKey)
    return cached ?? initialState
  })
  const [validationError, setValidationError] = useState<string | null>(null)
  const [pendingRecommendation, setPendingRecommendation] = useState('')
  const saveDraftMutation = api.reviews.saveDraft.useMutation()
  const submitMutation = api.reviews.submit.useMutation()

  useEffect(() => {
    const cached = queryClient.getQueryData<ReviewDraftState>(draftKey)
    if (cached) {
      setDraftState(cached)
      return
    }
    setDraftState(initialState)
  }, [draftKey, initialState, queryClient])

  useEffect(() => {
    queryClient.setQueryData(draftKey, draftState)
  }, [draftKey, draftState, queryClient])

  useEffect(() => {
    if (!open) {
      return
    }
    const cached = queryClient.getQueryData<ReviewDraftState>(draftKey)
    if (cached) {
      setDraftState(cached)
    }
  }, [draftKey, open, queryClient])

  useEffect(() => {
    setValidationError(null)
  }, [draftState.currentStep])

  const strengths = useMemo(
    () =>
      Object.entries(draftState.skillEvaluations)
        .filter(([, value]) => value === 'strength')
        .map(([skill]) => skill),
    [draftState.skillEvaluations]
  )

  const areasToImprove = useMemo(
    () =>
      Object.entries(draftState.skillEvaluations)
        .filter(([, value]) => value === 'improve')
        .map(([skill]) => skill),
    [draftState.skillEvaluations]
  )

  const handleReset = useCallback(() => {
    queryClient.removeQueries({ queryKey: draftKey })
    setDraftState(initialState)
    setPendingRecommendation('')
    setValidationError(null)
  }, [draftKey, initialState, queryClient])

  const handleCancel = useCallback(() => {
    handleReset()
    onClose?.()
    onOpenChange?.(false)
  }, [handleReset, onClose, onOpenChange])

  const handleSelectSkill = useCallback((skill: string, value: SkillEvaluation) => {
    setDraftState((prev) => {
      const current = prev.skillEvaluations[skill] ?? null
      const nextValue = current === value ? null : value
      return {
        ...prev,
        skillEvaluations: {
          ...prev.skillEvaluations,
          [skill]: nextValue,
        },
      }
    })
  }, [])

  const toggleSoftSkill = useCallback((softSkill: string) => {
    setDraftState((prev) => {
      const exists = prev.selectedSoftSkills.includes(softSkill)
      return {
        ...prev,
        selectedSoftSkills: exists
          ? prev.selectedSoftSkills.filter((item) => item !== softSkill)
          : [...prev.selectedSoftSkills, softSkill],
      }
    })
  }, [])

  const handleAddRecommendation = useCallback(() => {
    const trimmed = pendingRecommendation.trim()
    if (!trimmed) {
      setValidationError('Enter a skill before adding it to recommendations.')
      return
    }
    if (
      draftState.recommendedSkills.some(
        (skill) => skill.toLowerCase() === trimmed.toLowerCase()
      )
    ) {
      setValidationError('That skill is already recommended.')
      return
    }
    setDraftState((prev) => ({
      ...prev,
      recommendedSkills: [...prev.recommendedSkills, trimmed],
    }))
    setPendingRecommendation('')
    setValidationError(null)
  }, [draftState.recommendedSkills, pendingRecommendation])

  const handleRemoveRecommendation = useCallback((skill: string) => {
    setDraftState((prev) => ({
      ...prev,
      recommendedSkills: prev.recommendedSkills.filter((item) => item !== skill),
    }))
  }, [])

  const goToStep = useCallback((step: number) => {
    setDraftState((prev) => ({
      ...prev,
      currentStep: step,
    }))
  }, [])

  const handleNext = useCallback(() => {
    if (draftState.currentStep === 0) {
      const hasSelection = Object.values(draftState.skillEvaluations).some((value) => value)
      if (!hasSelection) {
        setValidationError('Mark at least one skill as a strength or an area to improve.')
        return
      }
    }

    if (draftState.currentStep === 1) {
      if (draftState.selectedSoftSkills.length === 0) {
        setValidationError('Select at least one soft skill to continue.')
        return
      }
    }

    if (draftState.currentStep === 2 && pendingRecommendation.trim().length > 0) {
      setValidationError('Add or clear the skill in the input before continuing.')
      return
    }

    goToStep(Math.min(draftState.currentStep + 1, totalSteps - 1))
  }, [draftState, goToStep, pendingRecommendation])

  const handleBack = useCallback(() => {
    goToStep(Math.max(draftState.currentStep - 1, 0))
  }, [draftState.currentStep, goToStep])

  const handleSubmit = useCallback(async () => {
    if (!draftState.comment.trim()) {
      setValidationError('Add a brief comment before submitting your review.')
      return
    }

    const payload = {
      reviewId,
      subjectId,
      strengths,
      areasToImprove,
      softSkills: draftState.selectedSoftSkills,
      recommendedSkills: draftState.recommendedSkills,
      comment: draftState.comment.trim(),
      isPublic: draftState.isPublic,
    }

    try {
      await saveDraftMutation.mutateAsync(payload)
      await submitMutation.mutateAsync(payload)
      toast.show('Review submitted!')
      handleReset()
      onSubmitted?.()
      onOpenChange?.(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to submit review.'
      setValidationError(message)
    }
  }, [
    areasToImprove,
    draftState.comment,
    draftState.isPublic,
    draftState.recommendedSkills,
    draftState.selectedSoftSkills,
    handleReset,
    onOpenChange,
    onSubmitted,
    reviewId,
    saveDraftMutation,
    strengths,
    subjectId,
    submitMutation,
    toast,
  ])

  const stepTitles = useMemo(
    () => [
      'Skill ratings',
      'Soft-skill evaluation',
      'Skill recommendations',
      'Summary & submit',
    ],
    []
  )

  const renderSkillEvaluationStep = () => (
    <YStack gap="$3">
      <Paragraph size="$3" color="$gray11">
        Tell us where {subjectName} shines and where they could grow.
      </Paragraph>
      <ScrollView maxHeight={300} showsVerticalScrollIndicator>
        <YStack gap="$2" pr="$1">
          {allSkills.map((skill) => {
            const selection = draftState.skillEvaluations[skill] ?? null
            return (
              <YStack
                key={skill}
                borderWidth={1}
                borderColor="$color4"
                br="$5"
                px="$3"
                py="$3"
                gap="$2"
              >
                <SizableText size="$4" fontWeight="600">
                  {skill}
                </SizableText>
                <XStack gap="$2">
                  <Button
                    size="$3"
                    theme={selection === 'strength' ? 'green' : 'gray'}
                    onPress={() => handleSelectSkill(skill, 'strength')}
                    icon={<ThumbsUp size={18} />}
                  >
                    Strength
                  </Button>
                  <Button
                    size="$3"
                    theme={selection === 'improve' ? 'red' : 'gray'}
                    onPress={() => handleSelectSkill(skill, 'improve')}
                    icon={<ThumbsDown size={18} />}
                  >
                    To improve
                  </Button>
                </XStack>
              </YStack>
            )
          })}
        </YStack>
      </ScrollView>
    </YStack>
  )

  const renderSoftSkillStep = () => (
    <YStack gap="$3">
      <Paragraph size="$3" color="$gray11">
        Select the soft skills that best describe {subjectName}'s working style.
      </Paragraph>
      <XStack gap="$2" flexWrap="wrap">
        {SOFT_SKILL_OPTIONS.map((softSkill) => {
          const isSelected = draftState.selectedSoftSkills.includes(softSkill)
          return (
            <Chip
              key={softSkill}
              pressable
              size="$3"
              onPress={() => toggleSoftSkill(softSkill)}
              backgroundColor={isSelected ? '$blue5' : '$color3'}
              borderWidth={1}
              borderColor={isSelected ? '$blue8' : '$color5'}
            >
              <Chip.Text color={isSelected ? '$blue11' : '$color11'}>{softSkill}</Chip.Text>
              {isSelected && (
                <Chip.Icon>
                  <Check size={14} />
                </Chip.Icon>
              )}
            </Chip>
          )
        })}
      </XStack>
    </YStack>
  )

  const renderRecommendationsStep = () => (
    <YStack gap="$3">
      <Paragraph size="$3" color="$gray11">
        Recommend any additional skills that {subjectName} should highlight.
      </Paragraph>
      <YStack gap="$2">
        <Label htmlFor="recommendedSkillInput">Skill name</Label>
        <XStack gap="$2" ai="center">
          <Input
            id="recommendedSkillInput"
            flex={1}
            size="$3"
            placeholder="e.g. Motion design"
            value={pendingRecommendation}
            onChangeText={setPendingRecommendation}
          />
          <Button size="$3" onPress={handleAddRecommendation}>
            Add
          </Button>
        </XStack>
      </YStack>
      {draftState.recommendedSkills.length > 0 && (
        <YStack gap="$2">
          <Paragraph size="$3" fontWeight="600">
            Suggested skills
          </Paragraph>
          <XStack gap="$2" flexWrap="wrap">
            {draftState.recommendedSkills.map((skill) => (
              <FilterChip key={skill} label={skill} onRemove={() => handleRemoveRecommendation(skill)} />
            ))}
          </XStack>
        </YStack>
      )}
    </YStack>
  )

  const renderSummaryStep = () => (
    <YStack gap="$4">
      <YStack gap="$2">
        <Label htmlFor="reviewComment">Share your experience</Label>
        <TextArea
          id="reviewComment"
          size="$3"
          minHeight={140}
          value={draftState.comment}
          onChangeText={(text) =>
            setDraftState((prev) => ({
              ...prev,
              comment: text,
            }))
          }
          placeholder={`What was it like collaborating with ${subjectName}?`}
        />
      </YStack>
      <XStack ai="center" gap="$3">
        <Switch
          checked={draftState.isPublic}
          onCheckedChange={(value) =>
            setDraftState((prev) => ({
              ...prev,
              isPublic: Boolean(value),
            }))
          }
        >
          <Switch.Thumb animation="100ms" />
        </Switch>
        <Paragraph size="$3" color="$gray11">
          Make this review visible on {subjectName}'s public profile
        </Paragraph>
      </XStack>
      <Separator borderColor="$color4" />
      <YStack gap="$2">
        <SizableText size="$4" fontWeight="700">
          Summary
        </SizableText>
        <SummarySection title="Strengths" items={strengths} emptyLabel="No strengths marked." />
        <SummarySection
          title="Areas to improve"
          items={areasToImprove}
          emptyLabel="No improvement areas selected."
        />
        <SummarySection
          title="Soft skills"
          items={draftState.selectedSoftSkills}
          emptyLabel="No soft skills selected."
        />
        <SummarySection
          title="Recommended skills"
          items={draftState.recommendedSkills}
          emptyLabel="No additional skills suggested."
        />
      </YStack>
      <Theme inverse>
        <Button
          size="$4"
          onPress={handleSubmit}
          disabled={saveDraftMutation.isLoading || submitMutation.isLoading}
          iconAfter={<Check size={18} />}
        >
          {submitMutation.isLoading ? 'Submitting…' : 'Submit review'}
        </Button>
      </Theme>
    </YStack>
  )

  const renderCurrentStep = () => {
    switch (draftState.currentStep) {
      case 0:
        return renderSkillEvaluationStep()
      case 1:
        return renderSoftSkillStep()
      case 2:
        return renderRecommendationsStep()
      case 3:
      default:
        return renderSummaryStep()
    }
  }

  return (
    <Dialog modal open={open} onOpenChange={onOpenChange} {...dialogProps}>
      <Dialog.Portal>
        <Dialog.Overlay animation="medium" backgroundColor="rgba(0,0,0,0.6)" />
        <Dialog.Content
          animation="medium"
          backgroundColor="$color1"
          px="$5"
          py="$4"
          br="$6"
          maw={620}
          w="92%"
          gap="$4"
        >
          <XStack jc="space-between" ai="center">
            <YStack>
              <SizableText size="$6" fontWeight="700">
                Review {subjectName}
              </SizableText>
              <Paragraph size="$3" color="$gray11">
                Step {draftState.currentStep + 1} of {totalSteps}: {stepTitles[draftState.currentStep]}
              </Paragraph>
            </YStack>
            <Dialog.Close asChild>
              <Button size="$2" chromeless onPress={() => onClose?.()} icon={<X size={18} />} />
            </Dialog.Close>
          </XStack>
          {validationError && (
            <Paragraph size="$3" color="$red10">
              {validationError}
            </Paragraph>
          )}
          {renderCurrentStep()}
          <XStack jc="space-between" ai="center">
            <Button
              size="$3"
              chromeless
              disabled={draftState.currentStep === 0}
              onPress={handleBack}
            >
              Back
            </Button>
            <XStack gap="$2">
              <Button size="$3" chromeless onPress={handleCancel}>
                Cancel
              </Button>
              {draftState.currentStep < totalSteps - 1 && (
                <Button size="$3" onPress={handleNext}>
                  Next
                </Button>
              )}
            </XStack>
          </XStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}

type SummarySectionProps = {
  title: string
  items: string[]
  emptyLabel: string
}

const SummarySection = ({ title, items, emptyLabel }: SummarySectionProps) => (
  <YStack gap="$1">
    <Paragraph size="$3" fontWeight="600">
      {title}
    </Paragraph>
    {items.length > 0 ? (
      <XStack gap="$2" flexWrap="wrap">
        {items.map((item) => (
          <Chip key={item} size="$2" backgroundColor="$color3" borderRadius="$3" px="$2" py="$1">
            <Chip.Text>{item}</Chip.Text>
          </Chip>
        ))}
      </XStack>
    ) : (
      <Paragraph size="$2" color="$gray10">
        {emptyLabel}
      </Paragraph>
    )}
  </YStack>
)

