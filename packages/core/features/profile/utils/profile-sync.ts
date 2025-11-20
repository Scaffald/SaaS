import type { api } from '@app/core/utils/api'

export async function invalidateProfileQueries(
  utils: ReturnType<typeof api.useContext>
): Promise<void> {
  const tasks: Array<Promise<unknown>> = [
    utils.profile.getGeneral.invalidate(),
    utils.profile.getEmployment.invalidate(),
    utils.profile.getEducation.invalidate(),
    utils.profile.getEducationLevel.invalidate(),
    utils.profile.getExperience.invalidate(),
    utils.profile.getExperienceSummary.invalidate(),
    utils.profile.getUserSkills.invalidate(), // Legacy path for backward compatibility
    utils.profile.skillsMultiTaxonomy.getUserSkills.invalidate(), // Current path
    utils.profile.certifications.getUserCertificationTree.invalidate(),
    utils.profile.certifications.getTopLevelCertifications.invalidate(),
    utils.userProfile.getUserProfile.invalidate(),
    utils.userProfile.getUserSkills.invalidate(),
    utils.userProfile.getUserCertifications.invalidate(),
    utils.userProfile.getUserExperience.invalidate(),
    utils.userProfile.getUserEducation.invalidate(),
  ]

  await Promise.allSettled(tasks)
}
