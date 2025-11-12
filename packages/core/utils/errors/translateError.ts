export function translateError(error: unknown): string {
  if (!error) return 'Something went wrong. Please try again.'

  if (typeof error === 'string') {
    return error
  }

  if (error instanceof Error) {
    return error.message || 'An unexpected error occurred. Please try again.'
  }

  if (typeof error === 'object' && 'message' in (error as Record<string, unknown>)) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string' && message.trim().length > 0) {
      return message
    }
  }

  return 'An unexpected error occurred. Please try again.'
}
