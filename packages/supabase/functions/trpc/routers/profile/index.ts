import { t } from "../../middleware.ts";
import { profileAvatarRouter } from "./avatar.router.ts";
import { profileCompletionRouter } from "./completion.router.ts";
import { profileEmploymentRouter } from "./employment.router.ts";
import { profileGeneralRouter } from "./general.router.ts";
import { profileSkillsRouter } from "./skills.router.ts";

/**
 * Profile router - merges all profile-related sub-routers
 */
export const profileRouter = t.mergeRouters(
  profileGeneralRouter,
  profileEmploymentRouter,
  profileSkillsRouter,
  profileAvatarRouter,
  profileCompletionRouter,
);
