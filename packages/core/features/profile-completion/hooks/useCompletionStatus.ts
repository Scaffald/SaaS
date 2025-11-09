import { useMemo } from 'react'
import { api } from '@app/core/utils/api'
import { useUser } from '@app/core/utils/useUser'
import type { ProfileWizardStepId } from '@app/supabase/client-types'
import { resolveSectionMetadata } from '../constants/sectionMetadata'

export interface CompletionSection {
  id: ProfileWizardStepId
  title: string
  description: string
  completed: boolean
  weight: number
  missingFields: string[]
  actionRoute: string
}

export interface CompletionMilestone {
  id: string
  label: string
  threshold: number
  achieved: boolean
  reachedAt: string | null
}

export interface CompletionStatus {
  sections: CompletionSection[]
  completionPercentage: number
  milestoneBadges: CompletionMilestone[]
  incompleteSections: ProfileWizardStepId[]
  lastCompletedAt: string | null
  lastPromptedAt: string | null
  shouldShowWizard: boolean
  modalMode: 'first-login' | 'progress-reminder'
  milestoneHistory: Record<string, string>
  summary: {
    completedWeight: number
    remainingWeight: number
    nextMilestone: number | null
  }
  updatedAt: string
  nudgeStatus: {
    dismissed: Record<string, { dismissedAt: string; reason?: string }>
    lastDismissedAt: string | null
    shouldPrompt: boolean
  }
}

export function useCompletionStatus() {
  const { data: rawStatus, isLoading, isError, refetch } = api.profile.getStatus.useQuery()
  const { user } = useUser()

  const userType: 'worker' | 'employer' =
    (user?.user_metadata?.type as 'worker' | 'employer' | undefined) ?? 'worker'

  const status: CompletionStatus | null = useMemo(() => {
    if (!rawStatus) {
      return null
    }

    const sections: CompletionSection[] = rawStatus.sectionProgress.map((section) => {
      const sectionId = section.id as ProfileWizardStepId
      const metadata = resolveSectionMetadata(sectionId)

      return {
        id: sectionId,
        title: section.title,
        description: metadata.description,
        completed: section.completed,
        weight: section.weight,
        missingFields: section.missingFields ?? [],
        actionRoute: metadata.route,
      }
    })

    const milestoneBadges: CompletionMilestone[] = rawStatus.milestoneBadges.map((milestone) => ({
      id: milestone.id,
      label: `${milestone.threshold}% Complete`,
      threshold: milestone.threshold,
      achieved: milestone.achieved,
      reachedAt: milestone.reachedAt ?? null,
    }))

    const milestoneHistory = rawStatus.milestoneHistory ?? {}
    const lastCompletedAt = milestoneHistory['100'] ?? null
    const lastPromptedAt = rawStatus.nudgeStatus.lastDismissedAt ?? null
    const modalMode: 'first-login' | 'progress-reminder' =
      rawStatus.completionPercentage === 0 ? 'first-login' : 'progress-reminder'

    const totalWeight = sections.reduce((total, section) => total + section.weight, 0)
    const completedWeight = sections.reduce(
      (total, section) => (section.completed ? total + section.weight : total),
      0,
    )

    return {
      sections,
      completionPercentage: rawStatus.completionPercentage,
      milestoneBadges,
      incompleteSections: rawStatus.incompleteSections as ProfileWizardStepId[],
      lastCompletedAt,
      lastPromptedAt,
      shouldShowWizard: rawStatus.nudgeStatus.shouldPrompt,
      modalMode,
      milestoneHistory,
      summary: rawStatus.summary ?? {
        completedWeight,
        remainingWeight: Math.max(totalWeight - completedWeight, 0),
        nextMilestone: null,
      },
      updatedAt: rawStatus.updatedAt,
      nudgeStatus: rawStatus.nudgeStatus,
    }
  }, [rawStatus])

  return {
    status,
    isLoading,
    isError,
    refetch,
    userType,
  }
}
