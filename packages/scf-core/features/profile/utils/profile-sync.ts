import type { api } from '@scf/core/utils/api'

export async function invalidateProfileQueries(
  utils: ReturnType<typeof api.useContext>
): Promise<void> {
  const tasks: Array<Promise<unknown>> = [
    utils.profile.general.getGeneral.invalidate(),
    utils.profile.employment.getEmployment.invalidate(),
    utils.profile.education.getEducation.invalidate(),
    utils.profile.education.getEducationLevel.invalidate(),
    utils.profile.experience.getExperience.invalidate(),
    utils.profile.experience.getExperienceSummary.invalidate(),
    utils.profile.skills.getUserSkills.invalidate(), // Legacy path for backward compatibility
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
