import { t } from "../../middleware.ts";
import { profileAvatarRouter } from "./avatar.router.ts";
import { profileCertificationsRouter } from "./certifications.router.ts";
import { profileCompletionRouter } from "./completion.router.ts";
import { profileEducationRouter } from "./education.router.ts";
import { profileEmploymentRouter } from "./employment.router.ts";
import { profileExperienceRouter } from "./experience.router.ts";
import { profileGeneralRouter } from "./general.router.ts";
import { skillsMultiTaxonomyRouter } from "./skills-multi-taxonomy.router.ts";
import { profileWidgetsRouter } from "./widgets.router.ts";

/**
 * Profile router - merges all profile-related sub-routers
 * Note: Using multi-taxonomy skills router (supports both CSI and O*NET)
 */
export const profileRouter = t.mergeRouters(
  profileGeneralRouter,
  profileEmploymentRouter,
  skillsMultiTaxonomyRouter,
  profileAvatarRouter,
  profileCertificationsRouter,
  profileEducationRouter,
  profileExperienceRouter,
  profileCompletionRouter,
  t.router({ widgets: profileWidgetsRouter }),
);
