import * as Sentry from '@sentry/react'
import {
  APP_ENV,
  APP_VERSION,
  CHANNEL,
  RUNTIME_VERSION,
  SENTRY_DSN_WEB,
  getReplaySampleRate,
  getTraceSampleRate,
} from './config'

let isInitialized = false

export const isSentryAvailable = () => Boolean(SENTRY_DSN_WEB)

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
      dsn: SENTRY_DSN_WEB,
      environment: APP_ENV,
      release: `web@${APP_VERSION}`,
      dist: RUNTIME_VERSION,

      // Performance Monitoring
      tracesSampleRate: getTraceSampleRate(),

      // Session Replay
      replaysSessionSampleRate: getReplaySampleRate(),
      replaysOnErrorSampleRate: 1.0, // Always capture replay on error

      // Default integrations
      integrations: [
        Sentry.replayIntegration({
          maskAllText: false,
          blockAllMedia: false,
        }),
        Sentry.browserTracingIntegration({
          enableInp: true, // Enable Interaction to Next Paint tracking
        }),
        Sentry.feedbackIntegration({
          colorScheme: 'system',
          autoInject: false, // We'll manually trigger feedback
        }),
      ],

      // Enable in development for testing
      enabled: true,
      debug: __DEV__,

      // Capture context
      beforeSend(event, hint) {
        // Add custom logic here if needed
        if (__DEV__) {
          console.log('[sentry] Capturing event:', event.event_id, event.message)
        }
        return event
      },

      // Initial context
      initialScope: {
        tags: {
          channel: CHANNEL,
          platform: 'web',
        },
      },
    })

    isInitialized = true
    console.log('[sentry] Initialized for Web', {
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

// Export Sentry for advanced usage
export { Sentry }

