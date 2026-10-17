/**
 * What to tell someone when a page fails to load, in words rather than HTTP.
 *
 * Route error branches printed `<Text color="red">` over the raw message —
 * "HTTP 403 error", "Application not found" — with no retry and no way back,
 * and the same application read differently on three screens (#1165). This is
 * the one mapping: the status decides the sentence, and the raw message is
 * never shown.
 */
export type LoadFailureCopy = { title: string; description: string; canRetry: boolean }

/** The HTTP status of a failed load, from an SDK error or a message that names one. */
export const failureStatus = (error: unknown): number | null => {
  if (error && typeof error === 'object') {
    const candidate =
      (error as { statusCode?: unknown; status?: unknown }).statusCode ??
      (error as { status?: unknown }).status
    if (typeof candidate === 'number') return candidate
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string') {
      const match = /\b(?:HTTP\s*)?([45]\d\d)\b/i.exec(message)
      if (match) return Number(match[1])
    }
  }
  return null
}

/**
 * `noun` is what the page shows, as a person would say it: "candidate",
 * "organization", "hire". 403 and 404 read the same on purpose — the API
 * answers 404 for records outside your organisations, and the page should
 * not confirm that an id exists.
 */
export const describeLoadFailure = (error: unknown, noun: string): LoadFailureCopy => {
  const status = failureStatus(error)
  if (status === 403 || status === 404) {
    return {
      title: `You can't open this ${noun}`,
      description: `It may have been removed, or it belongs to an organization you're not part of.`,
      canRetry: false,
    }
  }
  if (status === 401) {
    return {
      title: 'Your session has ended',
      description: 'Sign in again to carry on where you were.',
      canRetry: false,
    }
  }
  return {
    title: `We couldn't load this ${noun}`,
    description: 'Something went wrong on our side. Try again in a moment.',
    canRetry: true,
  }
}
