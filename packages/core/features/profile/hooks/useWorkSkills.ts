import { useMemo } from 'react'
import { useProfileDetails } from './useProfileDetails'

export type WorkSkillsData = {
  yearsExperience: number | null
  headline: string | null
  jobTitle: string | null
  primarySkills: string[]
  industryId: string | null
  bio: string | null
}

export const useWorkSkills = () => {
  const { user, onboardingProfile, formValues, updateProfile, isPending } = useProfileDetails()

  const workSkillsData = useMemo<WorkSkillsData>(() => {
    const userRow = onboardingProfile?.user

    return {
      yearsExperience: userRow?.years_of_experience || null,
      headline: userRow?.headline || null,
      jobTitle: formValues.jobTitle || '',
      primarySkills: formValues.primarySkills || [],
      industryId: userRow?.industry_id || null,
      bio: userRow?.bio || null,
    }
  }, [onboardingProfile?.user, formValues])

  const defaultValues = useMemo(
    () => ({
      yearsExperience: workSkillsData.yearsExperience?.toString() || '',
      headline: workSkillsData.headline || '',
      jobTitle: workSkillsData.jobTitle || '',
      primarySkills: workSkillsData.primarySkills,
      industryId: workSkillsData.industryId || '',
      bio: workSkillsData.bio || '',
    }),
    [workSkillsData]
  )

  return {
    user,
    data: workSkillsData,
    defaultValues,
    updateProfile,
    isPending,
  }
}
