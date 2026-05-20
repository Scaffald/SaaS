/**
 * Shared helpers for normalizing OAuth handler errors across providers
 * (Google native, Google web, Apple native, Apple web). Keeping the error
 * extraction in one place makes it easier to ensure analytics and toast
 * decisions stay in sync — and was a known gap during SC-60 triage.
 */

import { statusCodes } from '@react-native-google-signin/google-signin'

export type NormalizedOAuthError = {
  /** Stable identifier for analytics / debugging. Never user-facing. */
  errorCode: string
  /** Best-effort short reason from the upstream SDK. May be null. */
  message: string | null
  /** True if the user dismissed the flow themselves — do not toast. */
  isCancelled: boolean
  /** True if a flow is already in progress — silent no-op (double-tap). */
  isInProgress: boolean
}

const APPLE_CANCELLED_CODE = 'ERR_REQUEST_CANCELED'

export function normalizeOAuthError(
  error: unknown,
  provider: 'google' | 'apple'
): NormalizedOAuthError {
  const errorCode = extractErrorCode(error)
  const message = error instanceof Error ? error.message : null

  if (provider === 'google') {
    return {
      errorCode,
      message,
      isCancelled: errorCode === String(statusCodes.SIGN_IN_CANCELLED),
      isInProgress: errorCode === String(statusCodes.IN_PROGRESS),
    }
  }

  return {
    errorCode,
    message,
    isCancelled: errorCode === APPLE_CANCELLED_CODE,
    isInProgress: false,
  }
}

function extractErrorCode(error: unknown): string {
  if (typeof error === 'object' && error && 'code' in error) {
    return String((error as { code: unknown }).code)
  }
  if (error instanceof Error) return error.name
  return 'unknown'
}
