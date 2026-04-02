import posthog, { type PostHog } from 'posthog-js'
import { APP_ENV, CHANNEL, isAllowedEnvironment, POSTHOG_HOST, POSTHOG_KEY } from './config'
import {
  type AnalyticsEventName,
  type AnalyticsEventProperties,
  validateEventProperties,
} from './events'
import type { EventProperties, InitAnalyticsOptions } from './types'
import { buildSuperProperties, isAnalyticsAvailable } from './utils'

let client: PostHog | null = null

export { isAnalyticsAvailable }
export const analyticsEnv = APP_ENV

// Wrapper to provide consistent API across platforms
type WrappedPostHogClient = PostHog & {
  getDistinctId: () => string
}

export const getAnalyticsClient = (): WrappedPostHogClient | null => {
  if (!client) return null

  // Add getDistinctId method that matches the native client API
  return Object.assign(client, {
    getDistinctId: () => client?.get_distinct_id() || '',
  })
}

export const isAnalyticsInitialized = () => Boolean(client)

export async function initAnalytics({ hasConsent, debug = __DEV__ }: InitAnalyticsOptions) {
  if (client) {
    // PostHog web handles opt-in/out differently
    if (hasConsent) {
      client.opt_in_capturing()
    } else {
      client.opt_out_capturing()
    }
    return
  }

  if (!hasConsent) {
    return
  }

  if (!isAnalyticsAvailable()) {
    console.log('[analytics debug] unavailable', {
      POSTHOG_KEY: POSTHOG_KEY ? '***' : undefined,
      POSTHOG_HOST,
      APP_ENV,
      CHANNEL,
      isAllowedEnvironment,
    })
    console.warn('[analytics] PostHog key or host not configured; analytics disabled.')
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

  try {
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      debug: debug && __DEV__,
      autocapture: false, // Disable autocapture to match native behavior
      capture_pageview: true,
      capture_pageleave: true,
      persistence: 'localStorage+cookie',
      opt_out_capturing_by_default: false,
      loaded: (posthogInstance) => {
        // Register super properties
        posthogInstance.register(buildSuperProperties())
        client = posthogInstance as unknown as PostHog
        console.log('[analytics] PostHog initialized on web', Boolean(client))
      },
    })
  } catch (error) {
    console.error('[analytics] Failed to initialize PostHog on web', error)
    client = null
  }
}

const hasActiveClient = () => Boolean(client?.has_opted_in_capturing())

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
    console.log('[analytics debug] capture aborted', {
      hasClient: Boolean(client),
    })
    return false
  }
  const validation = validateEventProperties(event, properties)
  if (!validation.success) {
    console.log('[analytics debug] validation failed', {
      event,
      properties,
      error: validation.error,
    })
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
  // In web, we use capture for screen events
  client.capture('$pageview', {
    $current_url: typeof window !== 'undefined' ? window.location.href : undefined,
    screen_name: name,
    ...properties,
  })
}

export const reset = (clearProperties?: boolean) => {
  if (!client) return
  if (clearProperties) {
    client.reset()
  } else {
    // Just clear identity but keep super properties
    client.reset(false)
  }
}

export const flush = async () => {
  // PostHog web doesn't have an explicit flush method
  // Events are sent automatically
  return Promise.resolve()
}

export const shutdownAnalytics = async (_timeoutMs?: number) => {
  if (!client) return
  // Opt out to stop tracking
  client.opt_out_capturing()
  client = null
}
