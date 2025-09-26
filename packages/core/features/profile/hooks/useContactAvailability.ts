import { useMemo } from 'react'
import { useProfileDetails } from './useProfileDetails'

export type ContactAvailabilityData = {
  contactMethods: string[]
  phoneOs: string | null
  availability: string[]
  hourlyRateCents: number | null
}

export const useContactAvailability = () => {
  const { user, onboardingProfile, updateProfile, isPending } = useProfileDetails()

  const contactAvailabilityData = useMemo<ContactAvailabilityData>(() => {
    const privateProfile = onboardingProfile?.privateProfile

    return {
      contactMethods: privateProfile?.contact_prefs || [],
      phoneOs: privateProfile?.phone_os || null,
      availability: privateProfile?.availability || [],
      hourlyRateCents: privateProfile?.hourly_rate_cents || null,
    }
  }, [onboardingProfile?.privateProfile])

  const defaultValues = useMemo(
    () => ({
      contactMethods: contactAvailabilityData.contactMethods,
      phoneOs: contactAvailabilityData.phoneOs || '',
      availability: contactAvailabilityData.availability,
      hourlyRate: contactAvailabilityData.hourlyRateCents
        ? (contactAvailabilityData.hourlyRateCents / 100).toString()
        : '',
    }),
    [contactAvailabilityData]
  )

  return {
    user,
    data: contactAvailabilityData,
    defaultValues,
    updateProfile,
    isPending,
  }
}
