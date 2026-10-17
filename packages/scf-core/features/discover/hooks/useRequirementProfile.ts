import { useMemo } from 'react'
import {
  useEducationWidget,
  useExperienceWidget,
  usePreferencesWidget,
} from '@scf/core/utils/profile-widgets-sdk-hooks'
import type { RequirementInputs } from '../job-requirements'

/**
 * The viewer's own record in the shape `job-requirements.ts` scores against,
 * fetched once for a whole job list (#1180) — the same three widgets the job
 * detail screen reads, so a row and its detail agree.
 *
 * Undefined until all three have answered: an empty field before then means
 * "still loading", and scoring it would flash a wrong count.
 */
export function useRequirementProfile(signedIn: boolean): RequirementInputs['profile'] {
  const { data: education } = useEducationWidget(undefined, { enabled: signedIn })
  const { data: experience } = useExperienceWidget(undefined, { enabled: signedIn })
  const { data: preferences } = usePreferencesWidget({ enabled: signedIn })

  return useMemo(() => {
    if (!signedIn || !education || !experience || !preferences) return undefined
    return {
      education,
      experience,
      driversLicenseClasses: preferences.drivers_license_classes,
    }
  }, [signedIn, education, experience, preferences])
}
