import * as Sentry from '@sentry/react-native'
import {
  ANDROID_PACKAGE,
  APP_ENV,
  APP_VERSION,
  CHANNEL,
  IOS_BUNDLE_IDENTIFIER,
  RUNTIME_VERSION,
  SENTRY_DSN_NATIVE,
  getTraceSampleRate,
} from './config'

let isInitialized = false

export const isSentryAvailable = () => Boolean(SENTRY_DSN_NATIVE)

export const isSentryInitialized = () => isInitialized

export function initSentry() {
  if (isInitialized) {
    console.log('[sentry] Already initialized')
    return
  }

  if (!isSentryAvailable()) {
    console.warn('[sentry] DSN not configured; Sentry disabled.')
    return
  }

  try {
    Sentry.init({
      dsn: SENTRY_DSN_NATIVE,
      environment: APP_ENV,
      release: `${IOS_BUNDLE_IDENTIFIER || ANDROID_PACKAGE}@${APP_VERSION}`,
      dist: RUNTIME_VERSION,

      // Performance Monitoring
      tracesSampleRate: getTraceSampleRate(),
      enableTracing: true,

      // Session Replay - Native not fully supported yet, but prepare for it
      // replaysSessionSampleRate: 0.0, // Disable for now
      // replaysOnErrorSampleRate: 1.0,

      // Profiling (if available in your Sentry plan)
      profilesSampleRate: APP_ENV === 'production' ? 0.1 : 1.0,

      // Default integrations
      integrations: [
        Sentry.mobileReplayIntegration({
          maskAllText: false,
          maskAllImages: false,
        }),
        Sentry.reactNativeTracingIntegration({
          enableUserInteractionTracing: true,
          enableNativeFramesTracking: true,
          routingInstrumentation: undefined, // Will be set up with Expo Router
        }),
      ],

      // Enable in development for testing
      enabled: true,
      debug: __DEV__,

      // Capture context
      beforeSend(event, _hint) {
        // Add custom logic here if needed
        // For example, filter out certain errors
        if (__DEV__) {
          console.log('[sentry] Capturing event:', event.event_id, event.message)
        }
        return event
      },

      // Initial context
      initialScope: {
        tags: {
          channel: CHANNEL,
          platform: 'native',
        },
      },
    })

    isInitialized = true
    console.log('[sentry] Initialized for React Native', {
      environment: APP_ENV,
      version: APP_VERSION,
      channel: CHANNEL,
    })
  } catch (error) {
    console.error('[sentry] Failed to initialize', error)
  }
}

export function setSentryUser(userId: string, email?: string, traits?: Record<string, unknown>) {
  if (!isInitialized) return

  Sentry.setUser({
    id: userId,
    email,
    ...traits,
  })
}

export function clearSentryUser() {
  if (!isInitialized) return

  Sentry.setUser(null)
}

export function captureException(error: Error, context?: Record<string, unknown>) {
  if (!isInitialized) return

  Sentry.captureException(error, {
    contexts: context ? { custom: context } : undefined,
  })
}

export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  if (!isInitialized) return

  Sentry.captureMessage(message, level)
}

export function addBreadcrumb(breadcrumb: Sentry.Breadcrumb) {
  if (!isInitialized) return

  Sentry.addBreadcrumb(breadcrumb)
}

export function setTag(key: string, value: string) {
  if (!isInitialized) return

  Sentry.setTag(key, value)
}

export function setContext(name: string, context: Record<string, unknown>) {
  if (!isInitialized) return

  Sentry.setContext(name, context)
}

// Export Sentry for advanced usage and routing integration
export { Sentry }
