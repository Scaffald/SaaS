// @ts-nocheck
import { t } from "../../middleware.ts";
import { profileAvatarRouter } from "./avatar.router.ts";
import { profileCertificationsRouter } from "./certifications.router.ts";
import { profileCompletionRouter } from "./completion.router.ts";
import { profileEducationRouter } from "./education.router.ts";
import { profileEmploymentRouter } from "./employment.router.ts";
import { profileExperienceRouter } from "./experience.router.ts";
import { profileGeneralRouter } from "./general.router.ts";
import { profileImportRouter } from "./import.router.ts";
import { profileSkillsRouter } from "./skills.router.ts";
import { skillsMultiTaxonomyRouter } from "./skills-multi-taxonomy.router.ts";
import { profileVanityRouter } from "./vanity.router.ts";
import { profileWidgetsRouter } from "./widgets.router.ts";

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
