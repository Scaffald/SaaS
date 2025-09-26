import { useMemo } from 'react'
import { useProfileDetails } from './useProfileDetails'

export type TravelComplianceData = {
  openToTravel: boolean | null
  travelMileage: number | null
  driversLicenseClass: string | null
  certifications: string[]
  educationLevel: string | null
}

export const useTravelCompliance = () => {
  const { user, onboardingProfile, updateProfile, isPending } = useProfileDetails()

  const travelComplianceData = useMemo<TravelComplianceData>(() => {
    const privateProfile = onboardingProfile?.privateProfile

    return {
      openToTravel: privateProfile?.open_to_travel || null,
      travelMileage: privateProfile?.travel_mileage || null,
      driversLicenseClass: privateProfile?.drivers_license_class || null,
      certifications: privateProfile?.certifications || [],
      educationLevel: privateProfile?.education_level || null,
    }
  }, [onboardingProfile?.privateProfile])

  const defaultValues = useMemo(
    () => ({
      openToTravel: travelComplianceData.openToTravel || false,
      travelMileage: travelComplianceData.travelMileage?.toString() || '',
      driversLicenseClass: travelComplianceData.driversLicenseClass || '',
      certifications: travelComplianceData.certifications.join('\n'),
      educationLevel: travelComplianceData.educationLevel || '',
    }),
    [travelComplianceData]
  )

  return {
    user,
    data: travelComplianceData,
    defaultValues,
    updateProfile,
    isPending,
  }
}
