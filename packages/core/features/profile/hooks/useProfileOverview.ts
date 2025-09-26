import { useMemo } from 'react'
import { useProfileDetails } from './useProfileDetails'

export type ProfileOverviewData = {
  displayName: string | null
  headline: string | null
  bio: string | null
  avatarUrl: string | null
  location: string | null
  openToWork: boolean | null
  completionPercentage: number
}

export const useProfileOverview = () => {
  const { user, profile, onboardingProfile, avatarUrl, updateProfile, isPending } =
    useProfileDetails()

  const overviewData = useMemo<ProfileOverviewData>(() => {
    const userRow = onboardingProfile?.user
    const privateProfile = onboardingProfile?.privateProfile

    // Calculate completion percentage based on filled fields
    const totalFields = 10 // Adjust based on required fields
    let filledFields = 0

    if (privateProfile?.first_name) filledFields++
    if (privateProfile?.last_name) filledFields++
    if (privateProfile?.phone) filledFields++
    if (privateProfile?.location) filledFields++
    if (userRow?.headline) filledFields++
    if (userRow?.bio) filledFields++
    if (userRow?.years_of_experience) filledFields++
    if (userRow?.industry_id) filledFields++
    if (privateProfile?.hourly_rate_cents) filledFields++
    if (avatarUrl && !avatarUrl.includes('ui-avatars.com')) filledFields++

    const completionPercentage = Math.round((filledFields / totalFields) * 100)

    return {
      displayName: userRow?.display_name || null,
      headline: userRow?.headline || null,
      bio: userRow?.bio || null,
      avatarUrl,
      location: privateProfile?.location || null,
      openToWork: userRow?.open_to_work || null,
      completionPercentage,
    }
  }, [onboardingProfile, avatarUrl])

  return {
    user,
    profile,
    data: overviewData,
    updateProfile,
    isPending,
  }
}
