import { i18n } from '@app/core/locales'
import type { ZodErrorMap } from 'zod'
import { z } from 'zod'

const translate = (key: string, params?: Record<string, unknown>) => i18n.t(key, params)

export const zodErrorMap: ZodErrorMap = (issue, ctx) => {
  if (issue.code === 'invalid_type' && issue.received === 'undefined') {
    if (issue.expected === 'string') {
      return { message: translate('validation.string.required') }
    }

    return { message: translate('validation.string.required') }
  }

  if (issue.code === 'invalid_string') {
    if (issue.validation === 'email') {
      return { message: translate('validation.email.invalid') }
    }

    if (issue.validation === 'uuid') {
      return { message: translate('validation.string.required') }
    }
  }

  if (issue.code === 'too_small') {
    if (issue.type === 'string') {
      return {
        message:
          issue.minimum === 1
            ? translate('validation.string.required')
            : translate('validation.string.tooShort', { min: issue.minimum }),
      }
    }
  }

  if (issue.code === 'too_big') {
    if (issue.type === 'string') {
      return {
        message: translate('validation.string.tooLong', { max: issue.maximum }),
      }
    }
  }

  return { message: ctx.defaultError }
}

export const applyZodErrorMap = () => {
  z.setErrorMap(zodErrorMap)
}
