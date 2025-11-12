import auth from "./auth.json";
import common from "./common.json";
import errors from "./errors.json";
import navigation from "./navigation.json";
import validation from "./validation.json";

const en = {
  auth,
  common,
  errors,
  navigation,
  validation,
} as const;

export type EnTranslations = typeof en;

export default en;

