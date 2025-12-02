import { APP_VERSION } from '@app/core/constants/appVersion'
import {
  ANDROID_PACKAGE,
  APP_ENV,
  CHANNEL,
  IOS_BUNDLE_IDENTIFIER,
  POSTHOG_HOST,
  POSTHOG_KEY,
  RUNTIME_VERSION,
} from './config.ts'
import type { SuperProperties } from './types.ts'

export const isAnalyticsAvailable = () => Boolean(POSTHOG_KEY && POSTHOG_HOST)

export const buildSuperProperties = (): SuperProperties => {
  const runtimeVersion =
    typeof RUNTIME_VERSION === 'string'
      ? RUNTIME_VERSION
      : RUNTIME_VERSION
        ? JSON.stringify(RUNTIME_VERSION)
        : 'unknown'

  const properties: SuperProperties = {
    env: APP_ENV,
    expo_channel: CHANNEL,
    runtime_version: runtimeVersion,
    app_version: APP_VERSION,
  }

  if (IOS_BUNDLE_IDENTIFIER) {
    properties.app_identifier_ios = IOS_BUNDLE_IDENTIFIER
  }

  if (ANDROID_PACKAGE) {
    properties.app_identifier_android = ANDROID_PACKAGE
  }

  return properties
}

