import Constants from 'expo-constants'
import * as Updates from 'expo-updates'

export type AnalyticsEnvironment = 'development' | 'staging' | 'production'

const DEFAULT_POSTHOG_HOST = 'https://app.posthog.com'
const EXTRA_CONFIG = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>
const ANALYTICS_EXTRA = ((EXTRA_CONFIG as { analytics?: { posthog?: Record<string, unknown> } })
  .analytics?.posthog ?? {}) as Record<string, unknown>

export const APP_ENV: AnalyticsEnvironment =
  (ANALYTICS_EXTRA.env as AnalyticsEnvironment) ??
  (EXTRA_CONFIG.appEnv as AnalyticsEnvironment) ??
  (process.env.APP_ENV as AnalyticsEnvironment) ??
  'development'

// SECURITY: Only use EXPO_PUBLIC variables - non-public env vars should never be in client bundle
// Prioritize EXPO_PUBLIC_POSTHOG_API_KEY directly from process.env, then fall back to config values
export const POSTHOG_KEY =
  process.env.EXPO_PUBLIC_POSTHOG_API_KEY ??
  (EXTRA_CONFIG.posthogKey as string | undefined) ??
  (ANALYTICS_EXTRA.key as string | undefined) ??
  ''

// Prioritize EXPO_PUBLIC_POSTHOG_HOST directly from process.env, then fall back to config values
export const POSTHOG_HOST =
  process.env.EXPO_PUBLIC_POSTHOG_HOST ??
  (EXTRA_CONFIG.posthogHost as string | undefined) ??
  (ANALYTICS_EXTRA.host as string | undefined) ??
  DEFAULT_POSTHOG_HOST

export const CHANNEL = (Updates.channel ||
  (ANALYTICS_EXTRA.channel as AnalyticsEnvironment | undefined) ||
  APP_ENV) as AnalyticsEnvironment

export const RUNTIME_VERSION =
  Updates.runtimeVersion ||
  Constants.expoConfig?.runtimeVersion ||
  Constants.expoConfig?.version ||
  'unknown'

export const IOS_BUNDLE_IDENTIFIER = Constants.expoConfig?.ios?.bundleIdentifier
export const ANDROID_PACKAGE = Constants.expoConfig?.android?.package

const isProductionBuild = APP_ENV === 'production'
export const isAllowedEnvironment = !isProductionBuild || (CHANNEL === 'production' && !__DEV__)
