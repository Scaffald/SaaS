import { describe, expect, it, vi } from 'vitest'
import { invalidateProfileQueries } from '../profile-sync'

const createInvalidateMock = () => vi.fn().mockResolvedValue(undefined)

const createUtilsMock = () => {
  const makeSection = () => ({ invalidate: createInvalidateMock() })

  return {
    profile: {
      getGeneral: makeSection(),
      getEmployment: makeSection(),
      getEducation: makeSection(),
      getEducationLevel: makeSection(),
      getExperience: makeSection(),
      getExperienceSummary: makeSection(),
      getUserSkills: makeSection(),
      skillsMultiTaxonomy: {
        getUserSkills: makeSection(),
      },
      certifications: {
        getUserCertificationTree: makeSection(),
        getTopLevelCertifications: makeSection(),
      },
    },
    userProfile: {
      getUserProfile: makeSection(),
      getUserSkills: makeSection(),
      getUserCertifications: makeSection(),
      getUserExperience: makeSection(),
      getUserEducation: makeSection(),
    },
  }
}

const collectInvalidateSpies = (utils: ReturnType<typeof createUtilsMock>) => [
  utils.profile.getGeneral.invalidate,
  utils.profile.getEmployment.invalidate,
  utils.profile.getEducation.invalidate,
  utils.profile.getEducationLevel.invalidate,
  utils.profile.getExperience.invalidate,
  utils.profile.getExperienceSummary.invalidate,
  utils.profile.getUserSkills.invalidate,
  utils.profile.certifications.getUserCertificationTree.invalidate,
  utils.profile.certifications.getTopLevelCertifications.invalidate,
  utils.userProfile.getUserProfile.invalidate,
  utils.userProfile.getUserSkills.invalidate,
  utils.userProfile.getUserCertifications.invalidate,
  utils.userProfile.getUserExperience.invalidate,
  utils.userProfile.getUserEducation.invalidate,
]

describe('invalidateProfileQueries', () => {
  it('invokes all invalidate hooks successfully', async () => {
    const utils = createUtilsMock()

    await invalidateProfileQueries(utils as never)

    for (const spy of collectInvalidateSpies(utils)) {
      expect(spy).toHaveBeenCalledTimes(1)
    }
  })

  it('still resolves when some invalidations reject', async () => {
    const utils = createUtilsMock()
    const [first, , third] = collectInvalidateSpies(utils)
    
    // Suppress unhandled rejection warnings since Promise.allSettled handles them
    const originalConsoleError = console.error
    console.error = vi.fn()
    
    first.mockRejectedValueOnce(new Error('network'))
    third.mockRejectedValueOnce(new Error('timeout'))

    await expect(invalidateProfileQueries(utils as never)).resolves.toBeUndefined()

    for (const spy of collectInvalidateSpies(utils)) {
      expect(spy).toHaveBeenCalledTimes(1)
    }
    
    // Restore console.error
    console.error = originalConsoleError
  })
})
