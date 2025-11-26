import { APP_VERSION } from '@app/core/constants/appVersion'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants from 'expo-constants'
import * as Updates from 'expo-updates'
import PostHog, { type PostHogCustomStorage, type PostHogOptions } from 'posthog-react-native'
import { Platform } from 'react-native'
import {
  type AnalyticsEventName,
  type AnalyticsEventProperties,
  validateEventProperties,
} from './events'

type AnalyticsEnvironment = 'development' | 'staging' | 'production'

interface InitAnalyticsOptions {
  hasConsent: boolean
  debug?: boolean
}

const DEFAULT_POSTHOG_HOST = 'https://app.posthog.com'
const EXTRA_CONFIG = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>
const ANALYTICS_EXTRA = ((EXTRA_CONFIG as { analytics?: { posthog?: Record<string, unknown> } })
  .analytics?.posthog ?? {}) as Record<string, unknown>
const APP_ENV: AnalyticsEnvironment =
  (ANALYTICS_EXTRA.env as AnalyticsEnvironment) ??
  (EXTRA_CONFIG.appEnv as AnalyticsEnvironment) ??
  (process.env.APP_ENV as AnalyticsEnvironment) ??
  'development'

// SECURITY: Only use EXPO_PUBLIC variables - non-public env vars should never be in client bundle
// Prioritize EXPO_PUBLIC_POSTHOG_API_KEY directly from process.env, then fall back to config values
const POSTHOG_KEY =
  process.env.EXPO_PUBLIC_POSTHOG_API_KEY ??
  (EXTRA_CONFIG.posthogKey as string | undefined) ??
  (ANALYTICS_EXTRA.key as string | undefined) ??
  ''

// Prioritize EXPO_PUBLIC_POSTHOG_HOST directly from process.env, then fall back to config values
const POSTHOG_HOST =
  process.env.EXPO_PUBLIC_POSTHOG_HOST ??
  (EXTRA_CONFIG.posthogHost as string | undefined) ??
  (ANALYTICS_EXTRA.host as string | undefined) ??
  DEFAULT_POSTHOG_HOST

const CHANNEL = (Updates.channel ||
  (ANALYTICS_EXTRA.channel as AnalyticsEnvironment | undefined) ||
  APP_ENV) as AnalyticsEnvironment
const RUNTIME_VERSION =
  Updates.runtimeVersion ||
  Constants.expoConfig?.runtimeVersion ||
  Constants.expoConfig?.version ||
  'unknown'
const IOS_BUNDLE_IDENTIFIER = Constants.expoConfig?.ios?.bundleIdentifier
const ANDROID_PACKAGE = Constants.expoConfig?.android?.package

const IS_WEB = Platform.OS === 'web'
const isProductionBuild = APP_ENV === 'production'
const isAllowedEnvironment = !isProductionBuild || (CHANNEL === 'production' && !__DEV__)

const CUSTOM_STORAGE: PostHogCustomStorage = {
  getItem: AsyncStorage.getItem,
  setItem: AsyncStorage.setItem,
}

let client: PostHog | null = null
let lastDebugFlag = false

export const isAnalyticsAvailable = () => Boolean(POSTHOG_KEY && POSTHOG_HOST)
export const analyticsEnv = APP_ENV
export const getAnalyticsClient = () => client
export const isAnalyticsInitialized = () => Boolean(client)

type EventProperties = Parameters<PostHog['capture']>[1]
type RegisterProperties = Parameters<PostHog['register']>[0]
type ResetKeepKeys = Parameters<PostHog['reset']>[0]

const buildSuperProperties = (): RegisterProperties => {
  const runtimeVersion =
    typeof RUNTIME_VERSION === 'string'
      ? RUNTIME_VERSION
      : RUNTIME_VERSION
        ? JSON.stringify(RUNTIME_VERSION)
        : 'unknown'

  const properties = {
    env: APP_ENV,
    expo_channel: CHANNEL,
    runtime_version: runtimeVersion,
    app_version: APP_VERSION,
  } as RegisterProperties

  if (IOS_BUNDLE_IDENTIFIER) {
    properties.app_identifier_ios = IOS_BUNDLE_IDENTIFIER
  }

  if (ANDROID_PACKAGE) {
    properties.app_identifier_android = ANDROID_PACKAGE
  }

  return properties
}

const applyDebugFlag = (instance: PostHog, debug: boolean) => {
  if (debug !== lastDebugFlag) {
    instance.debug(debug)
    lastDebugFlag = debug
  }
}

const toggleConsentState = async (instance: PostHog, shouldOptIn: boolean) => {
  if (shouldOptIn && instance.optedOut) {
    await instance.optIn()
  } else if (!shouldOptIn && !instance.optedOut) {
    await instance.optOut()
  }
}

export async function initAnalytics({ hasConsent, debug = __DEV__ }: InitAnalyticsOptions) {
  if (client) {
    applyDebugFlag(client, debug)
    await toggleConsentState(client, hasConsent)
    return
  }

  if (!hasConsent) {
    return
  }

  if (!isAnalyticsAvailable()) {
    console.log('[analytics debug] unavailable', {
      POSTHOG_KEY,
      POSTHOG_HOST,
      APP_ENV,
      CHANNEL,
      IS_WEB,
      isAllowedEnvironment,
    })
    console.warn('[analytics] PostHog key or host not configured; analytics disabled.')
    return
  }

  if (IS_WEB) {
    if (debug) {
      console.info('[analytics] Skipping PostHog init on web platform.')
    }
    return
  }

  if (!isAllowedEnvironment) {
    console.log('[analytics debug] disallowed environment', {
      APP_ENV,
      CHANNEL,
      __DEV__,
    })
    if (debug) {
      console.info(
        `[analytics] Skipping PostHog init for env=${APP_ENV}, channel=${CHANNEL}, dev=${__DEV__} (environment not allowed)`
      )
    }
    return
  }

  const options: PostHogOptions = {
    host: POSTHOG_HOST,
    flushAt: 20,
    flushInterval: 30_000,
    disableGeoip: true,
    captureNativeAppLifecycleEvents: true,
    defaultOptIn: false,
    customStorage: CUSTOM_STORAGE,
  }

  try {
    const instance = new PostHog(POSTHOG_KEY, options)
    applyDebugFlag(instance, debug)
    await instance.ready()
    await instance.register(buildSuperProperties())
    await instance.optIn()

    client = instance
    console.log('[analytics debug] client initialized', Boolean(client))
  } catch (error) {
    console.error('[analytics] Failed to initialize PostHog', error)
    client = null
  }
}

const hasActiveClient = () => Boolean(client && !client.optedOut)

export const identify = (userId: string, properties?: EventProperties) => {
  if (!hasActiveClient() || !client) return
  client.identify(userId, properties)
}

export const alias = (aliasId: string) => {
  if (!hasActiveClient() || !client) return
  client.alias(aliasId)
}

export const capture = (event: string, properties?: EventProperties) => {
  if (!hasActiveClient() || !client) return
  client.capture(event, properties)
}

export const captureEvent = <TName extends AnalyticsEventName>(
  event: TName,
  properties: AnalyticsEventProperties<TName>
) => {
  if (!hasActiveClient() || !client) {
    console.log('[analytics debug] capture aborted', { hasClient: Boolean(client) })
    return false
  }
  const validation = validateEventProperties(event, properties)
  if (!validation.success) {
    console.log('[analytics debug] validation failed', { event, properties, error: validation.error })
    console.warn('[analytics] Invalid event payload', event, validation.error.flatten())
    return false
  }
  try {
    client.capture(event, validation.data)
    return true
  } catch (error) {
    console.error('[analytics] Failed to capture event', event, error)
    return false
  }
}

export const screen = (name: string, properties?: EventProperties) => {
  if (!hasActiveClient() || !client) return
  client.screen(name, properties)
}

export const reset = (propertiesToKeep?: ResetKeepKeys) => {
  if (!client) return
  client.reset(propertiesToKeep)
}

export const flush = async () => {
  if (!client) return
  await client.flush()
}

export const shutdownAnalytics = async (timeoutMs?: number) => {
  if (!client) return
  await client.shutdown(timeoutMs)
  client = null
}
