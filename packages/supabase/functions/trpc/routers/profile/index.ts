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
 * Profile router - combines all profile-related sub-routers
 * Note: Using multi-taxonomy skills router (supports both CSI and O*NET)
 * 
 * Structure:
 * - Flattened procedures from general, employment, experience, education, avatar, completion, certifications
 * - Nested namespaces for widgets, vanity, import, skillsMultiTaxonomy
 */
export const profileRouter = t.router({
  // Flattened routers - procedures accessible directly (e.g., api.profile.getGeneral)
  ...profileGeneralRouter._def.procedures,
  ...profileEmploymentRouter._def.procedures,
  ...profileAvatarRouter._def.procedures,
  ...profileEducationRouter._def.procedures,
  ...profileExperienceRouter._def.procedures,
  ...profileCompletionRouter._def.procedures,
  ...profileCertificationsRouter._def.procedures,
  // Nested routers - procedures accessible via namespace (e.g., api.profile.widgets.getGeneralInfo)
  widgets: profileWidgetsRouter,
  vanity: profileVanityRouter,
  import: profileImportRouter,
  skillsMultiTaxonomy: skillsMultiTaxonomyRouter,
})
