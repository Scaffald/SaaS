import { api } from '@app/core/utils/api'
import { useUser } from '@app/core/utils/useUser'
import type { ProfileWizardStepId } from '@app/supabase/client-types'
import { useMemo } from 'react'
import { resolveSectionMetadata } from '../constants/sectionMetadata'

interface RawCompletionSection {
  id: string
  title: string
  completed: boolean
  weight: number
  missingFields?: string[]
}

interface RawCompletionMilestone {
  id: string
  label?: string
  threshold: number
  achieved: boolean
  reachedAt?: string | null
}

interface RawNudgeStatus {
  shouldPrompt: boolean
  lastDismissedAt: string | null
  dismissed?: Record<string, { dismissedAt: string; reason?: string }>
}

interface RawCompletionSummary {
  completedWeight: number
  remainingWeight: number
  nextMilestone: number | null
}

interface RawCompletionStatus {
  sectionProgress: RawCompletionSection[]
  milestoneBadges: RawCompletionMilestone[]
  milestoneHistory?: Record<string, string>
  completionPercentage: number
  incompleteSections: string[]
  summary?: RawCompletionSummary
  updatedAt: string
  nudgeStatus: RawNudgeStatus
}

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
  const {
    data: rawStatus,
    isLoading,
    isError,
    refetch,
  }: {
    data: RawCompletionStatus | undefined
    isLoading: boolean
    isError: boolean
    refetch: () => Promise<unknown>
  } = api.profile.getStatus.useQuery()
  const { user } = useUser()

  const userType: 'worker' | 'employer' =
    (user?.user_metadata?.type as 'worker' | 'employer' | undefined) ?? 'worker'

  const status: CompletionStatus | null = useMemo(() => {
    if (!rawStatus) {
      return null
    }

    const sections: CompletionSection[] = rawStatus.sectionProgress.map(
      (section: RawCompletionSection) => {
        const sectionId = section.id as ProfileWizardStepId
        const metadata = resolveSectionMetadata(sectionId)

        return {
          id: sectionId,
          title: metadata.title ?? section.title,
          description: metadata.description,
          completed: section.completed,
          weight: section.weight,
          missingFields: section.missingFields ?? [],
          actionRoute: metadata.route,
        }
      }
    )

    const milestoneBadges: CompletionMilestone[] = rawStatus.milestoneBadges.map(
      (milestone: RawCompletionMilestone) => ({
        id: milestone.id,
        label: `${milestone.threshold}% Complete`,
        threshold: milestone.threshold,
        achieved: milestone.achieved,
        reachedAt: milestone.reachedAt ?? null,
      })
    )

    const milestoneHistory = rawStatus.milestoneHistory ?? {}
    const lastCompletedAt = milestoneHistory['100'] ?? null
    const normalizedNudgeStatus = {
      dismissed: rawStatus.nudgeStatus.dismissed ?? {},
      lastDismissedAt: rawStatus.nudgeStatus.lastDismissedAt ?? null,
      shouldPrompt: rawStatus.nudgeStatus.shouldPrompt,
    }
    const lastPromptedAt = normalizedNudgeStatus.lastDismissedAt
    const modalMode: 'first-login' | 'progress-reminder' =
      rawStatus.completionPercentage === 0 ? 'first-login' : 'progress-reminder'

    const totalWeight = sections.reduce((total, section) => total + section.weight, 0)
    const completedWeight = sections.reduce(
      (total, section) => (section.completed ? total + section.weight : total),
      0
    )

    return {
      sections,
      completionPercentage: rawStatus.completionPercentage,
      milestoneBadges,
      incompleteSections: rawStatus.incompleteSections as ProfileWizardStepId[],
      lastCompletedAt,
      lastPromptedAt,
      shouldShowWizard: normalizedNudgeStatus.shouldPrompt,
      modalMode,
      milestoneHistory,
      summary: rawStatus.summary ?? {
        completedWeight,
        remainingWeight: Math.max(totalWeight - completedWeight, 0),
        nextMilestone: null,
      },
      updatedAt: rawStatus.updatedAt,
      nudgeStatus: normalizedNudgeStatus,
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
