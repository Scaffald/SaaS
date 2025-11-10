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

type NativeModule = typeof SentryExpo.Native

type ForwardedNativeMethods = Pick<
  NativeModule,
  | 'captureException'
  | 'configureScope'
  | 'getCurrentHub'
  | 'setContext'
  | 'setUser'
  | 'startTransaction'
  | 'withScope'
>

const isDevEnvironment = process.env.NODE_ENV !== 'production'

const resolveSentryBridge = (): ForwardedNativeMethods | undefined => {
  if (SentryExpo.Native) {
    return SentryExpo.Native
  }

  const browserCandidate = (SentryExpo as {
    Browser?: unknown
  }).Browser as ForwardedNativeMethods | undefined

  if (browserCandidate) {
    return browserCandidate
  }

  return undefined
}

const fallbackBridge: ForwardedNativeMethods = {
  captureException: (...args: Parameters<ForwardedNativeMethods['captureException']>) => {
    if (isDevEnvironment) {
      console.warn('[Sentry] captureException called without an available Sentry bridge', args[0])
    }
    return undefined as unknown as ReturnType<ForwardedNativeMethods['captureException']>
  },
  configureScope: (..._args: Parameters<ForwardedNativeMethods['configureScope']>) => {
    if (isDevEnvironment) {
      console.warn('[Sentry] configureScope called without an available Sentry bridge')
    }
    return undefined as unknown as ReturnType<ForwardedNativeMethods['configureScope']>
  },
  getCurrentHub: (..._args: Parameters<ForwardedNativeMethods['getCurrentHub']>) => {
    if (isDevEnvironment) {
      console.warn('[Sentry] getCurrentHub called without an available Sentry bridge')
    }
    return undefined as unknown as ReturnType<ForwardedNativeMethods['getCurrentHub']>
  },
  setContext: (...args: Parameters<ForwardedNativeMethods['setContext']>) => {
    if (isDevEnvironment) {
      console.warn('[Sentry] setContext called without an available Sentry bridge', args[0], args[1])
    }
    return undefined as unknown as ReturnType<ForwardedNativeMethods['setContext']>
  },
  setUser: (...args: Parameters<ForwardedNativeMethods['setUser']>) => {
    if (isDevEnvironment) {
      console.warn('[Sentry] setUser called without an available Sentry bridge', args[0])
    }
    return undefined as unknown as ReturnType<ForwardedNativeMethods['setUser']>
  },
  startTransaction: (...args: Parameters<ForwardedNativeMethods['startTransaction']>) => {
    if (isDevEnvironment) {
      console.warn('[Sentry] startTransaction called without an available Sentry bridge', args[0])
    }
    return undefined as unknown as ReturnType<ForwardedNativeMethods['startTransaction']>
  },
  withScope: (..._args: Parameters<ForwardedNativeMethods['withScope']>) => {
    if (isDevEnvironment) {
      console.warn('[Sentry] withScope called without an available Sentry bridge')
    }
    return undefined as unknown as ReturnType<ForwardedNativeMethods['withScope']>
  },
}

const sentryBridge = resolveSentryBridge() ?? fallbackBridge

export const Sentry: ForwardedNativeMethods & {
  init: typeof SentryExpo.init
  Native: ForwardedNativeMethods
} = {
  captureException: (...args) => sentryBridge.captureException(...args),
  configureScope: (...args) => sentryBridge.configureScope(...args),
  getCurrentHub: (...args) => sentryBridge.getCurrentHub(...args),
  setContext: (...args) => sentryBridge.setContext(...args),
  setUser: (...args) => sentryBridge.setUser(...args),
  startTransaction: (...args) => sentryBridge.startTransaction(...args),
  withScope: (...args) => sentryBridge.withScope(...args),
  init: (options) => {
    SentryExpo.init(options)
  },
  Native: sentryBridge,
}

