import type { ZodErrorMap } from 'zod'
import { z } from 'zod'

const translate = (key: string, params?: Record<string, unknown>) => {
  switch (key) {
    case 'validation.string.required':
      return 'This field is required'
    case 'validation.email.invalid':
      return 'Please enter a valid email address'
    case 'validation.string.tooShort':
      return `Must be at least ${params?.min ?? 0} characters`
    case 'validation.string.tooLong':
      return `Must be ${params?.max ?? 0} characters or fewer`
    default:
      return key
  }
}

export const zodErrorMap: ZodErrorMap = (issue, ctx) => {
  if (issue.code === 'invalid_type' && issue.received === 'undefined') {
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

  if (issue.code === 'too_small' && issue.type === 'string') {
    return {
      message:
        issue.minimum === 1
          ? translate('validation.string.required')
          : translate('validation.string.tooShort', { min: issue.minimum }),
    }
  }

  if (issue.code === 'too_big' && issue.type === 'string') {
    return {
      message: translate('validation.string.tooLong', { max: issue.maximum }),
    }
  }

  return { message: ctx.defaultError }
}

export const applyZodErrorMap = () => {
  z.setErrorMap(zodErrorMap)
}
