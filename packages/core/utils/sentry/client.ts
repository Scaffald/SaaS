import Constants from 'expo-constants'
import type { Event } from '@sentry/types'
import * as SentryExpo from 'sentry-expo'

const APP_ENV = process.env.APP_ENV ?? 'development'
const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN
const TRACE_SAMPLE_RATE = 0.1
const SLOW_OPERATION_THRESHOLD_MS = 2000

let initialized = false

const shouldEnableSentry = () => {
  return APP_ENV !== 'development' && Boolean(SENTRY_DSN)
}

const resolveReleaseInfo = () => {
  const expoConfig = Constants?.expoConfig
  const release =
    expoConfig?.extra?.sentryRelease ??
    `scf-neue@${expoConfig?.version ?? APP_ENV}`
  const dist =
    expoConfig?.ios?.buildNumber ??
    (typeof expoConfig?.android?.versionCode === 'number'
      ? String(expoConfig.android.versionCode)
      : undefined)

  return { release, dist }
}

const tagSlowOperations = (event: Event) => {
  const duration = event.contexts?.trace?.duration
  if (typeof duration === 'number' && duration > SLOW_OPERATION_THRESHOLD_MS) {
    event.tags = {
      ...event.tags,
      slow_operation: 'true',
    }
  }
  return event
}

export const initSentry = () => {
  if (initialized) {
    return
  }

  if (!shouldEnableSentry()) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Sentry] Disabled in development')
    }
    initialized = true
    return
  }

  SentryExpo.init({
    dsn: SENTRY_DSN,
    environment: APP_ENV,
    enableInExpoDevelopment: false,
    debug: false,
    enableAutoPerformanceTracing: true,
    tracesSampleRate: TRACE_SAMPLE_RATE,
    ...resolveReleaseInfo(),
    beforeSend(event) {
      return tagSlowOperations(event)
    },
  })

  initialized = true
}

const sentryNative = SentryExpo.Native

type ForwardedNativeMethods = Pick<
  typeof sentryNative,
  | 'captureException'
  | 'configureScope'
  | 'getCurrentHub'
  | 'setContext'
  | 'setUser'
  | 'startTransaction'
  | 'withScope'
>

export const Sentry: ForwardedNativeMethods & {
  init: typeof SentryExpo.init
  Native: typeof sentryNative
} = {
  captureException: sentryNative.captureException,
  configureScope: sentryNative.configureScope,
  getCurrentHub: sentryNative.getCurrentHub,
  setContext: sentryNative.setContext,
  setUser: sentryNative.setUser,
  startTransaction: sentryNative.startTransaction,
  withScope: sentryNative.withScope,
  init: (options) => {
    SentryExpo.init(options)
  },
  Native: sentryNative,
}

