import { useCallback, useEffect, useRef, useState } from 'react'

type AccountType = 'personal' | 'business'

type SignupFormValues = {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmedPassword: string
  postalCode: string
  accountType: AccountType
}

type SignupFormField = keyof SignupFormValues

type SignupFormErrors = Partial<Record<SignupFormField, string>>

type SignupFormTouched = Record<SignupFormField, boolean>

type UseSignupFormStateOptions = {
  initialValues?: Partial<SignupFormValues>
}

const DEFAULT_VALUES: SignupFormValues = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmedPassword: '',
  postalCode: '',
  accountType: 'business',
}

const SIGNUP_FIELDS = Object.keys(DEFAULT_VALUES) as SignupFormField[]

const FIELD_DEPENDENCIES: Partial<Record<SignupFormField, SignupFormField[]>> = {
  password: ['confirmedPassword'],
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const createTouchedMap = (value: boolean): SignupFormTouched =>
  SIGNUP_FIELDS.reduce((acc, field) => {
    acc[field] = value
    return acc
  }, {} as SignupFormTouched)

const updateErrorState = (
  errors: SignupFormErrors,
  field: SignupFormField,
  message?: string
): SignupFormErrors => {
  if (message) {
    if (errors[field] === message) {
      return errors
    }
    return {
      ...errors,
      [field]: message,
    }
  }

  if (!(field in errors)) {
    return errors
  }

  const { [field]: _removed, ...rest } = errors
  return rest
}

export const useSignupFormState = (options: UseSignupFormStateOptions = {}) => {
  const { initialValues } = options

  const initialRef = useRef<SignupFormValues>({
    ...DEFAULT_VALUES,
    ...initialValues,
  })

  const [values, setValues] = useState<SignupFormValues>(initialRef.current)
  const [errors, setErrors] = useState<SignupFormErrors>({})
  const [touched, setTouched] = useState<SignupFormTouched>(() => createTouchedMap(false))

  useEffect(() => {
    if (initialValues) {
      initialRef.current = {
        ...DEFAULT_VALUES,
        ...initialValues,
      }
    }
  }, [initialValues])

  const validateField = useCallback(
    (field: SignupFormField, nextValues: SignupFormValues): string | undefined => {
      const value = nextValues[field]

      switch (field) {
        case 'firstName':
          return value.trim() ? undefined : 'First name is required'
        case 'lastName':
          return value.trim() ? undefined : 'Last name is required'
        case 'email': {
          const trimmed = value.trim()
          if (!trimmed) {
            return 'Email is required'
          }
          return EMAIL_REGEX.test(trimmed) ? undefined : 'Invalid email format'
        }
        case 'password':
          return value.trim().length >= 6 ? undefined : 'Password must be at least 6 characters'
        case 'confirmedPassword': {
          const trimmed = value.trim()
          if (trimmed.length < 6) {
            return 'Confirm password must be at least 6 characters'
          }
          return trimmed === nextValues.password.trim() ? undefined : 'Passwords do not match'
        }
        case 'postalCode': {
          const trimmed = value.trim()
          if (!trimmed) {
            return 'Postal code is required'
          }
          return trimmed.length >= 4 ? undefined : 'Invalid postal code format'
        }
        case 'accountType':
          return nextValues.accountType ? undefined : 'Account type is required'
        default:
          return undefined
      }
    },
    []
  )

  const validateAll = useCallback(
    (nextValues: SignupFormValues) => {
      return SIGNUP_FIELDS.reduce<SignupFormErrors>((acc, field) => {
        const message = validateField(field, nextValues)
        if (message) {
          acc[field] = message
        }
        return acc
      }, {})
    },
    [validateField]
  )

  const setFieldValue = useCallback(
    (field: SignupFormField, value: SignupFormValues[SignupFormField]) => {
      setValues((prev) => {
        const next = {
          ...prev,
          [field]: value,
        } as SignupFormValues

        setErrors((prevErrors) => {
          let updated = updateErrorState(prevErrors, field, validateField(field, next))

          const dependencies = FIELD_DEPENDENCIES[field]
          if (dependencies) {
            dependencies.forEach((dependency) => {
              if (touched[dependency]) {
                updated = updateErrorState(updated, dependency, validateField(dependency, next))
              }
            })
          }

          return updated
        })

        return next
      })
    },
    [touched, validateField]
  )

  const handleBlur = useCallback(
    (field: SignupFormField) => {
      setTouched((prev) => {
        if (prev[field]) {
          return prev
        }
        return {
          ...prev,
          [field]: true,
        }
      })

      setErrors((prev) => updateErrorState(prev, field, validateField(field, values)))
    },
    [validateField, values]
  )

  const attemptSubmit = useCallback(() => {
    const nextErrors = validateAll(values)
    setErrors(nextErrors)

    const isValid = Object.keys(nextErrors).length === 0

    if (!isValid) {
      setTouched(createTouchedMap(true))
    }

    return {
      isValid,
      errors: nextErrors,
      values,
    }
  }, [validateAll, values])

  const reset = useCallback(() => {
    setValues(initialRef.current)
    setErrors({})
    setTouched(createTouchedMap(false))
  }, [])

  return {
    values,
    errors,
    touched,
    setFieldValue,
    handleBlur,
    attemptSubmit,
    reset,
  }
}

export type { SignupFormErrors, SignupFormField, SignupFormValues }
