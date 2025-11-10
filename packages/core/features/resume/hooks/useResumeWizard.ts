import { useEffect, useMemo, useState } from 'react'
import { api } from '@app/core/utils/api'

export type ResumeWizardSection =
  | 'general'
  | 'experience'
  | 'education'
  | 'skills'
  | 'certifications'
  | 'employment'

export interface ResumeWizardStep {
  id: ResumeWizardSection | 'review'
  label: string
}

export type ResumeMergeStrategy = 'replace' | 'append' | 'keepExisting'

const BASE_STEPS: ResumeWizardStep[] = [
  { id: 'general', label: 'General Information' },
  { id: 'experience', label: 'Work Experience' },
  { id: 'education', label: 'Education' },
  { id: 'skills', label: 'Skills' },
  { id: 'certifications', label: 'Certifications' },
  { id: 'employment', label: 'Employment Preferences' },
  { id: 'review', label: 'Review & Confirm' },
]

export function useResumeWizard(resumeId: string) {
  const wizardQuery = api.resume.getWizardState.useQuery({ resumeId }, {
    refetchInterval: false,
    refetchOnWindowFocus: false,
  })

  const saveSectionMutation = api.resume.saveSection.useMutation()
  const updateProgressMutation = api.resume.updateProgress.useMutation()

  const steps = BASE_STEPS

  const initialIndex = useMemo(() => {
    if (!wizardQuery.data) {
      return 0
    }
    const index = wizardQuery.data.currentStep ?? 0
    if (index < 0) return 0
    if (index >= steps.length) return steps.length - 1
    return index
  }, [wizardQuery.data, steps.length])

  const [currentIndex, setCurrentIndex] = useState<number>(initialIndex)

  const parsedData = wizardQuery.data?.parsedData ?? {}
  const errors = wizardQuery.data?.errors ?? []

  const goToStep = (index: number) => {
    const clamped = Math.max(0, Math.min(index, steps.length - 1))
    setCurrentIndex(clamped)
  }

  const goNext = () => {
    goToStep(currentIndex + 1)
  }

  const goPrevious = () => {
    goToStep(currentIndex - 1)
  }

  const handleSaveSection = async (
    section: ResumeWizardSection,
    data: unknown,
    mergeStrategy: ResumeMergeStrategy = 'replace',
  ) => {
    await saveSectionMutation.mutateAsync({
      section,
      data,
      mergeStrategy: { mode: mergeStrategy },
      wizardState: {
        resumeId,
        currentStep: currentIndex,
        completedSteps: wizardQuery.data?.completedSteps ?? [],
      },
    })

    await wizardQuery.refetch()
    goNext()
  }

  const handleSkipSection = async () => {
    const nextIndex = Math.min(currentIndex + 1, steps.length - 1)
    const completed = new Set<number>(wizardQuery.data?.completedSteps ?? [])
    completed.add(currentIndex)

    await updateProgressMutation.mutateAsync({
      resumeId,
      currentStep: nextIndex,
      completedSteps: Array.from(completed).sort((a, b) => a - b),
    })

    await wizardQuery.refetch()
    goToStep(nextIndex)
  }

  useEffect(() => {
    setCurrentIndex(initialIndex)
  }, [initialIndex])

  return {
    steps,
    currentIndex,
    currentStep: steps[currentIndex],
    parsedData,
    errors,
    wizard: wizardQuery.data,
    isLoading: wizardQuery.isLoading,
    isSaving: saveSectionMutation.isLoading || updateProgressMutation.isLoading,
    setCurrentIndex: goToStep,
    goNext,
    goPrevious,
    saveSection: handleSaveSection,
    skipSection: handleSkipSection,
    refetch: wizardQuery.refetch,
  }
}

