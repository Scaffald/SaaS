import { t } from '../../middleware.ts'
import { profileAvatarRouter } from './avatar.router.ts'
import { profileCertificationsRouter } from './certifications.router.ts'
import { profileCompletionRouter } from './completion.router.ts'
import { profileEducationRouter } from './education.router.ts'
import { profileEmploymentRouter } from './employment.router.ts'
import { profileExperienceRouter } from './experience.router.ts'
import { profileGeneralRouter } from './general.router.ts'
import { profileImportRouter } from './import.router.ts'
import { skillsMultiTaxonomyRouter } from './skills-multi-taxonomy.router.ts'
import { profileVanityRouter } from './vanity.router.ts'
import { profileWidgetsRouter } from './widgets.router.ts'

/**
 * Profile router - merges all profile-related sub-routers
 * Note: Using multi-taxonomy skills router (supports both CSI and O*NET)
 */
export const profileRouter = t.mergeRouters(
  profileGeneralRouter,
  profileEmploymentRouter,
  t.router({ skillsMultiTaxonomy: skillsMultiTaxonomyRouter }),
  profileAvatarRouter,
  profileCertificationsRouter,
  profileEducationRouter,
  profileExperienceRouter,
  profileCompletionRouter,
  t.router({ vanity: profileVanityRouter }),
  t.router({ widgets: profileWidgetsRouter }),
  t.router({ import: profileImportRouter })
)
