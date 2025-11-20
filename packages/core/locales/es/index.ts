import auth from './auth.json'
import common from './common.json'
import errors from './errors.json'
import navigation from './navigation.json'
import validation from './validation.json'

const es = {
  auth,
  common,
  errors,
  navigation,
  validation,
} as const

export type EsTranslations = typeof es

export default es
