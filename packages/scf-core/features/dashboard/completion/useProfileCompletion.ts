import { useCompletionStatus } from '@scf/core/utils/profile-completion-sdk-hooks'
import type { ProfileWizardStepId } from '@scf/supabase/client-types'
import { useMemo } from 'react'
import { resolveSectionMetadata } from '../../profile-completion/constants/sectionMetadata'

type SectionProgressSummary = {
  id: string
  title: string
  completed: boolean
  weight?: number
  missingFields?: string[]
}

interface ChecklistItem {
  id: ProfileWizardStepId
  title: string
  description: string
  complete: boolean
  actionRoute?: string
  actionLabel?: string
  /** Section weight from the backend — higher means more impact on overall score. */
  weight: number
  /** Specific field paths the backend says are still empty. */
  missingFields: string[]
}

export interface ProfileCompletionData {
  items: ChecklistItem[]
  completionPercentage: number
  totalComplete: number
  totalItems: number
}

export const useProfileCompletion = () => {
  const { data: status, isLoading, isError, error } = useCompletionStatus()

  const completionData = useMemo((): ProfileCompletionData | null => {
    if (!status) return null

    const items: ChecklistItem[] = status.sectionProgress.map(
      (section: SectionProgressSummary): ChecklistItem => {
        const sectionId = section.id as ProfileWizardStepId
        const metadata = resolveSectionMetadata(sectionId)

        return {
          id: sectionId,
          title: section.title,
          description: metadata.description,
          complete: section.completed,
          actionRoute: metadata.route,
          weight: section.weight ?? 0,
          missingFields: section.missingFields ?? [],
        }
      }
    )

    const totalComplete = status.sectionProgress.filter(
      (section: SectionProgressSummary) => section.completed
    ).length
    const totalItems = status.sectionProgress.length

    return {
      items,
      completionPercentage: status.completionPercentage ?? 0,
      totalComplete,
      totalItems,
    }
  }, [status])

  return {
    completionData,
    isLoading,
    isError,
    error,
  }
}
