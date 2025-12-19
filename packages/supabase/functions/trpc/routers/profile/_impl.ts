// @ts-nocheck
/**
 * Profile Router implementation (Deno-specific, runtime-only)
 *
 * This file contains the actual profile router instance used at runtime in Deno Edge Functions.
 * It's marked with @ts-nocheck to suppress errors from ESM imports that are incompatible
 * with the Node.js/Expo environment.
 *
 * The type is separately exported from index.ts to avoid TS4023 "inaccessible names" errors.
 */

import { t } from '../../middleware';
import { profileAvatarRouter } from './avatar.router';
import { profileCertificationsRouter } from './certifications.router';
import { profileCompletionRouter } from './completion.router';
import { profileEducationRouter } from './education.router';
import { profileEmploymentRouter } from './employment.router';
import { profileExperienceRouter } from './experience.router';
import { profileGeneralRouter } from './general.router';
import { profileImportRouter } from './import.router';
import { profileSkillsRouter } from './skills.router';
import { skillsMultiTaxonomyRouter } from './skills-multi-taxonomy.router';
import { profileVanityRouter } from './vanity.router';
import { profileWidgetsRouter } from './widgets.router';

/**
 * Profile router - combines all profile-related sub-routers
 * Note: Using multi-taxonomy skills router (supports both CSI and O*NET)
 *
 * Structure:
 * - Namespaced routers for general, employment, experience, education, avatar, completion
 * - Dedicated routers for certifications, widgets, vanity, import, skills, skillsMultiTaxonomy
 */
export const profileRouter = t.router({
  general: profileGeneralRouter,
  employment: profileEmploymentRouter,
  experience: profileExperienceRouter,
  education: profileEducationRouter,
  avatar: profileAvatarRouter,
  completion: profileCompletionRouter,
  skills: profileSkillsRouter,
  skillsMultiTaxonomy: skillsMultiTaxonomyRouter,
  certifications: profileCertificationsRouter.certifications,
  widgets: profileWidgetsRouter,
  vanity: profileVanityRouter,
  import: profileImportRouter,
});
