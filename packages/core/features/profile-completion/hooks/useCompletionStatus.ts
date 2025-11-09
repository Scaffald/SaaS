import { useMemo } from 'react'
import { api } from '@app/core/utils/api'
import { useUser } from '@app/core/utils/useUser'

export interface CompletionSection {
  id: string
  title: string
  description: string
  completed: boolean
  actionRoute?: string
}

export interface CompletionMilestone {
  id: string
  label: string
  threshold: number
  achieved: boolean
}

export interface CompletionStatus {
  sections: CompletionSection[]
  completionPercentage: number
  milestoneBadges: CompletionMilestone[]
  incompleteSections: string[]
  lastCompletedAt?: string | null
  lastPromptedAt?: string | null
  shouldShowWizard: boolean
  modalMode: 'first-login' | 'progress-reminder' | null
}

const MILESTONE_THRESHOLDS: Array<{ id: string; label: string; threshold: number }> = [
  { id: 'milestone-25', label: '25% Complete', threshold: 25 },
  { id: 'milestone-50', label: '50% Complete', threshold: 50 },
  { id: 'milestone-75', label: '75% Complete', threshold: 75 },
  { id: 'milestone-100', label: 'Profile Complete', threshold: 100 },
]

export function useCompletionStatus() {
  const { data: rawStatus, isLoading, isError, refetch } = api.profile.getCompletionStatus.useQuery()
  const { user } = useUser()

  const userType: 'worker' | 'employer' =
    (user?.user_metadata?.type as 'worker' | 'employer' | undefined) ?? 'worker'

  const status: CompletionStatus | null = useMemo(() => {
    if (!rawStatus) {
      return null
    }

    const sections: CompletionSection[] = [
      {
        id: 'general',
        title: 'Basic Information',
        description: 'Add your name and contact information',
        completed: Boolean(rawStatus.first_name && rawStatus.last_name),
        actionRoute: '/dashboard/profile/general',
      },
      {
        id: 'employment',
        title: 'Employment Preferences',
        description: 'Set your work location, rate, and availability',
        completed: Boolean(
          rawStatus.user_private?.location ||
            rawStatus.user_private?.availability?.length ||
            rawStatus.user_private?.address,
        ),
        actionRoute: '/dashboard/profile/employment',
      },
      {
        id: 'skills',
        title: 'Skills & Expertise',
        description: 'Highlight what you do best',
        completed: Boolean(rawStatus.user_skills?.length),
        actionRoute: '/dashboard/profile/skills',
      },
      {
        id: 'experience',
        title: 'Work Experience',
        description: 'Share your recent roles',
        completed: Boolean(
          rawStatus.user_experience?.length &&
            rawStatus.user_experience.some(
              (exp: unknown) =>
                exp &&
                typeof exp === 'object' &&
                'job_title' in exp &&
                'company_name' in exp &&
                Boolean(exp.job_title) &&
                Boolean(exp.company_name),
            ),
        ),
        actionRoute: '/dashboard/profile/experience',
      },
      {
        id: 'certifications',
        title: 'Certifications & Licenses',
        description: 'Show employers your credentials',
        completed: Boolean(
          rawStatus.user_certifications?.length &&
            rawStatus.user_certifications.some(
              (cert: unknown) =>
                cert &&
                typeof cert === 'object' &&
                'name' in cert &&
                'issuing_organization' in cert &&
                Boolean(cert.name) &&
                Boolean(cert.issuing_organization),
            ),
        ),
        actionRoute: '/dashboard/profile/certifications',
      },
      {
        id: 'education',
        title: 'Education',
        description: 'List your training and education',
        completed: Boolean(
          rawStatus.user_education?.length &&
            rawStatus.user_education.some(
              (edu: unknown) =>
                edu &&
                typeof edu === 'object' &&
                'institution_name' in edu &&
                Boolean(edu.institution_name),
            ),
        ),
        actionRoute: '/dashboard/profile/education',
      },
    ]

    const totalComplete = sections.filter((section) => section.completed).length
    const totalSections = sections.length
    const completionPercentage = Math.round((totalComplete / totalSections) * 100)

    const milestoneBadges: CompletionMilestone[] = MILESTONE_THRESHOLDS.map((milestone) => ({
      ...milestone,
      achieved: completionPercentage >= milestone.threshold,
    }))

    const incompleteSections = sections.filter((section) => !section.completed).map((section) => section.id)

    const wizardStatus = (rawStatus as Record<string, unknown>).wizard_status as
      | {
          should_show_modal?: boolean
          modal_mode?: 'first-login' | 'progress-reminder'
          last_completed_at?: string | null
          last_prompted_at?: string | null
        }
      | undefined

    const shouldShowWizard =
      wizardStatus?.should_show_modal ?? (completionPercentage < 50 && incompleteSections.length > 0)

    return {
      sections,
      completionPercentage,
      milestoneBadges,
      incompleteSections,
      lastCompletedAt: wizardStatus?.last_completed_at ?? null,
      lastPromptedAt: wizardStatus?.last_prompted_at ?? null,
      shouldShowWizard,
      modalMode: wizardStatus?.modal_mode ?? (completionPercentage === 0 ? 'first-login' : 'progress-reminder'),
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


