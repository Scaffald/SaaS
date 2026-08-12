import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { invalidateProfileQueries } from '@scf/core/features/profile/utils/profile-sync'
import { useUpdateGeneralInfoMutation } from '@scf/core/utils/profile-general-sdk-hooks'
import { useUpdateEmploymentMutation } from '@scf/core/utils/profile-employment-sdk-hooks'
import { useSaveExperienceMutation } from '@scf/core/utils/profile-experience-sdk-hooks'
import { useSaveEducationMutation } from '@scf/core/utils/profile-education-sdk-hooks'
import type { WizardStepData } from './useProfileWizard'
import {
  buildEducationPayload,
  buildEmploymentPayload,
  buildExperiencePayload,
  buildGeneralPayload,
} from '../utils/wizard-to-profile'

export interface WizardCommitResult {
  /** Sections that were written. */
  committed: string[]
  /** Sections that had data but whose write failed, with the reason. */
  failed: Array<{ section: string; message: string }>
}

/**
 * Write the wizard's collected answers onto the actual profile.
 *
 * Finishing the wizard used to leave the profile untouched:
 * POST /v1/profile-wizard/complete persists wizard progress into
 * core.preferences and nothing else, so six steps of user input never became a
 * profile (#584). This commits them through the same endpoints the profile
 * editors use, rather than giving the server a second write path per section.
 *
 * Sections are written independently and a failure in one does not abort the
 * rest — a user who filled in five steps should not lose all five because the
 * certifications write 500'd. The caller gets both lists back and can report
 * partial success honestly.
 */
export function useCommitWizardToProfile() {
  const queryClient = useQueryClient()
  const updateGeneral = useUpdateGeneralInfoMutation()
  const updateEmployment = useUpdateEmploymentMutation()
  const saveExperience = useSaveExperienceMutation()
  const saveEducation = useSaveEducationMutation()

  return useCallback(
    async (stepData: WizardStepData): Promise<WizardCommitResult> => {
      const committed: string[] = []
      const failed: Array<{ section: string; message: string }> = []

      const run = async (section: string, fn: () => Promise<unknown>) => {
        try {
          await fn()
          committed.push(section)
        } catch (error) {
          failed.push({
            section,
            message: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }

      const general = buildGeneralPayload(stepData)
      if (general) {
        await run('general', () => updateGeneral.mutateAsync(general as never))
      }

      const experience = buildExperiencePayload(stepData)
      if (experience) {
        await run('experience', () => saveExperience.mutateAsync(experience as never))
      }

      const education = buildEducationPayload(stepData)
      if (education) {
        await run('education', () => saveEducation.mutateAsync(education as never))
      }

      const employment = buildEmploymentPayload(stepData)
      if (employment) {
        await run('preferences', () => updateEmployment.mutateAsync(employment as never))
      }

      // Skills and certifications are deliberately not committed here yet: both
      // write paths key off catalog ids, and the wizard's own pickers resolve
      // those against endpoints that are currently broken (#583 for the CSI
      // catalog, #603 for the two 404ing skills endpoints). Writing them from
      // half-resolved ids would put junk in core.user_skills that is harder to
      // clean up than to skip. See #584 for the follow-up.

      await invalidateProfileQueries(queryClient)

      return { committed, failed }
    },
    [queryClient, updateGeneral, updateEmployment, saveExperience, saveEducation]
  )
}
