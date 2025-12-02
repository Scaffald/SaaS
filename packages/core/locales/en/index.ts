import auth from './auth.json.ts'
import common from './common.json.ts'
import errors from './errors.json.ts'
import navigation from './navigation.json.ts'
import routes from './routes.json.ts'
import validation from './validation.json.ts'

const en = {
  auth,
  common,
  errors,
  navigation,
  routes,
  validation,
} as const

export type EnTranslations = typeof en

export default en
