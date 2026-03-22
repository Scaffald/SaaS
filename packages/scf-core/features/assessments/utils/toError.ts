/**
 * Convert a query error (which may have a `message` property) to an Error instance,
 * or return null if there is no error. Used by assessment wizards to pass errors
 * to AssessmentWizard's `error` prop.
 */
export function toError(
  error: { message?: string } | null | undefined,
  fallback = 'Failed to load assessment status.'
): Error | null {
  if (!error) return null
  return new Error(error.message ?? fallback)
}
