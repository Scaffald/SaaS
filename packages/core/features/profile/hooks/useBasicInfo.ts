import { useMemo } from 'react'
import { useProfileDetails } from './useProfileDetails'

export type BasicInfoData = {
  firstName: string
  lastName: string
  phone: string | null
  location: string | null
  usResident: boolean | null
  usPassport: boolean | null
  veteran: boolean | null
}

export const useBasicInfo = () => {
  const { user, onboardingProfile, updateProfile, isPending } = useProfileDetails()

  const basicInfoData = useMemo<BasicInfoData>(() => {
    const privateProfile = onboardingProfile?.privateProfile

    return {
      firstName: privateProfile?.first_name || '',
      lastName: privateProfile?.last_name || '',
      phone: privateProfile?.phone || null,
      location: privateProfile?.location || null,
      usResident: privateProfile?.us_resident || null,
      usPassport: privateProfile?.us_passport || null,
      veteran: privateProfile?.veteran || null,
    }
  }, [onboardingProfile?.privateProfile])

  const defaultValues = useMemo(
    () => ({
      firstName: basicInfoData.firstName,
      lastName: basicInfoData.lastName,
      phone: basicInfoData.phone || '',
      location: basicInfoData.location || '',
      usResident: basicInfoData.usResident || false,
      usPassport: basicInfoData.usPassport || false,
      veteran: basicInfoData.veteran || false,
    }),
    [basicInfoData]
  )

  return {
    user,
    data: basicInfoData,
    defaultValues,
    updateProfile,
    isPending,
  }
}
