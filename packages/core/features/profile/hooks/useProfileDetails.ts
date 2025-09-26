import { useMemo } from 'react'

import { useUser } from '@app/core/utils/useUser'
import {
  createOnboardingValuesFromProfile,
  onboardingDefaultValues,
  type OnboardingFormValues,
} from '../../onboarding/screen'
import { useOnboardingProfile } from '../../onboarding/hooks/useOnboardingProfile'

export const useProfileDetails = () => {
  const { user, profile, avatarUrl, updateProfile, isPending: isUserPending } = useUser()

  const userId = user?.id
  const { data: onboardingProfile, isPending: isOnboardingPending } = useOnboardingProfile(userId)

  const formValues = useMemo<OnboardingFormValues>(() => {
    if (!profile || !userId) {
      return onboardingDefaultValues
    }

    return createOnboardingValuesFromProfile({ onboardingProfile, profile })
  }, [onboardingProfile, profile, userId])

  const isPending = isUserPending || isOnboardingPending

  return {
    user,
    profile,
    avatarUrl,
    onboardingProfile,
    formValues,
    updateProfile,
    isPending,
  }
}
