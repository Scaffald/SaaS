// Export all Sentry functions from platform-specific clients
export {
  Sentry,
  addBreadcrumb,
  captureException,
  captureMessage,
  clearSentryUser,
  initSentry,
  isSentryAvailable,
  isSentryInitialized,
  setContext,
  setSentryUser,
  setTag,
} from './client'

// Export config for advanced usage
export { APP_ENV, CHANNEL, getReplaySampleRate, getTraceSampleRate } from './config'
export type { SentryEnvironment } from './config'
