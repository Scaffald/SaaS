import auth from "./auth.json";
import common from "./common.json";
import errors from "./errors.json";
import navigation from "./navigation.json";
import routes from "./routes.json";
import validation from "./validation.json";

const en = {
  auth,
  common,
  errors,
  navigation,
  routes,
  validation,
} as const;

export type EnTranslations = typeof en;

export default en;
