import Constants from 'expo-constants'
import * as Updates from 'expo-updates'

export type SentryEnvironment = 'development' | 'staging' | 'production'

const EXTRA_CONFIG = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>
const SENTRY_EXTRA = ((EXTRA_CONFIG as { sentry?: Record<string, unknown> }).sentry ?? {}) as Record<
  string,
  unknown
>

export const APP_ENV: SentryEnvironment =
  (SENTRY_EXTRA.env as SentryEnvironment) ??
  (EXTRA_CONFIG.appEnv as SentryEnvironment) ??
  (process.env.APP_ENV as SentryEnvironment) ??
  'development'

// SECURITY: Only use EXPO_PUBLIC variables - non-public env vars should never be in client bundle
// Separate DSNs for web and native platforms
export const SENTRY_DSN_NATIVE =
  process.env.EXPO_PUBLIC_SENTRY_DSN_NATIVE ??
  (SENTRY_EXTRA.dsnNative as string | undefined) ??
  ''

export const SENTRY_DSN_WEB =
  process.env.EXPO_PUBLIC_SENTRY_DSN_WEB ?? (SENTRY_EXTRA.dsnWeb as string | undefined) ?? ''

export const CHANNEL = (Updates.channel ||
  (SENTRY_EXTRA.channel as SentryEnvironment | undefined) ||
  APP_ENV) as SentryEnvironment

export const RUNTIME_VERSION =
  Updates.runtimeVersion ||
  Constants.expoConfig?.runtimeVersion ||
  Constants.expoConfig?.version ||
  'unknown'

export const APP_VERSION = Constants.expoConfig?.version || 'unknown'

export const IOS_BUNDLE_IDENTIFIER = Constants.expoConfig?.ios?.bundleIdentifier
export const ANDROID_PACKAGE = Constants.expoConfig?.android?.package

// Enable Sentry in all environments (error tracking is critical)
// But use different sample rates per environment
export const getTraceSampleRate = () => {
  switch (APP_ENV) {
    case 'production':
      return 0.2 // 20% in production
    case 'staging':
      return 0.5 // 50% in staging
    default:
      return 1.0 // 100% in development
  }
}

export const getReplaySampleRate = () => {
  switch (APP_ENV) {
    case 'production':
      return 0.1 // 10% in production
    case 'staging':
      return 0.3 // 30% in staging
    default:
      return 1.0 // 100% in development
  }
}

