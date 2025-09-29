import { useMemo } from 'react'
import { api } from '@app/core/utils/api'
import type { ChecklistItem } from '@app/ui'

export interface ProfileCompletionData {
  items: ChecklistItem[]
  completionPercentage: number
  totalComplete: number
  totalItems: number
}

export const useProfileCompletion = () => {
  const { data: profileData, isLoading } = api.profile.getCompletionStatus.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  })

  const completionData = useMemo((): ProfileCompletionData | null => {
    if (!profileData) return null

    const items: ChecklistItem[] = [
      {
        id: 'general',
        title: 'Basic Information',
        description: 'Add your name and contact information',
        complete: !!(profileData.first_name && profileData.last_name),
        actionRoute: '/dashboard/profile/general',
      },
      {
        id: 'employment',
        title: 'Employment Preferences',
        description: 'Set your work location preferences and availability',
        complete: !!(
          profileData.user_private?.address ||
          profileData.user_private?.preferred_work_locations?.length > 0 ||
          profileData.user_private?.availability?.length > 0
        ),
        actionRoute: '/dashboard/profile/employment',
      },
      {
        id: 'skills',
        title: 'Skills & Expertise',
        description: 'Add your skills and industry focus',
        complete: !!(profileData.user_skills?.length > 0),
        actionRoute: '/dashboard/profile/skills',
      },
      {
        id: 'education',
        title: 'Education',
        description: 'Add your educational background',
        complete: !!(
          profileData.user_private?.education_level || profileData.user_education?.length > 0
        ),
        actionRoute: '/dashboard/profile/education',
      },
      {
        id: 'certifications',
        title: 'Certifications',
        description: 'Add professional certifications and licenses',
        complete: !!(
          profileData.user_certifications?.length > 0 &&
          profileData.user_certifications.some((cert) => cert.name && cert.issuing_organization)
        ),
        actionRoute: '/dashboard/profile/certifications',
      },
      {
        id: 'experience',
        title: 'Work Experience',
        description: 'Add your work history and experience',
        complete: !!(
          profileData.user_experience?.length > 0 &&
          profileData.user_experience.some((exp) => exp.job_title && exp.company_name)
        ),
        actionRoute: '/dashboard/profile/experience',
      },
    ]

    const totalComplete = items.filter((item) => item.complete).length
    const totalItems = items.length
    const completionPercentage = Math.round((totalComplete / totalItems) * 100)

    return {
      items,
      completionPercentage,
      totalComplete,
      totalItems,
    }
  }, [profileData])

  return {
    completionData,
    isLoading,
  }
}
