import AsyncStorage from '@react-native-async-storage/async-storage';
import PostHog, {
  type PostHogCustomStorage,
  type PostHogOptions,
} from 'posthog-react-native';
import {
  APP_ENV,
  CHANNEL,
  isAllowedEnvironment,
  POSTHOG_HOST,
  POSTHOG_KEY,
} from './config';
import {
  type AnalyticsEventName,
  type AnalyticsEventProperties,
  validateEventProperties,
} from './events';
import type { EventProperties, InitAnalyticsOptions } from './types';
import { buildSuperProperties, isAnalyticsAvailable } from './utils';

const CUSTOM_STORAGE: PostHogCustomStorage = {
  getItem: AsyncStorage.getItem,
  setItem: AsyncStorage.setItem,
};

let client: PostHog | null = null;
let lastDebugFlag = false;

export { isAnalyticsAvailable };
export const analyticsEnv = APP_ENV;

// Type for the client with guaranteed getDistinctId method
type WrappedPostHogClient = PostHog & {
  getDistinctId: () => string;
};

export const getAnalyticsClient = (): WrappedPostHogClient | null => {
  if (!client) return null;

  // Ensure getDistinctId is available (it should already be on the native client)
  return client as WrappedPostHogClient;
};

export const isAnalyticsInitialized = () => Boolean(client);

type RegisterProperties = Parameters<PostHog["register"]>[0];
type ResetKeepKeys = Parameters<PostHog["reset"]>[0];

const applyDebugFlag = (instance: PostHog, debug: boolean) => {
  if (debug !== lastDebugFlag) {
    instance.debug(debug);
    lastDebugFlag = debug;
  }
};

const toggleConsentState = async (instance: PostHog, shouldOptIn: boolean) => {
  if (shouldOptIn && instance.optedOut) {
    await instance.optIn();
  } else if (!shouldOptIn && !instance.optedOut) {
    await instance.optOut();
  }
};

export async function initAnalytics(
  { hasConsent, debug = __DEV__ }: InitAnalyticsOptions,
) {
  if (client) {
    applyDebugFlag(client, debug);
    await toggleConsentState(client, hasConsent);
    return;
  }

  if (!hasConsent) {
    return;
  }

  if (!isAnalyticsAvailable()) {
    console.log("[analytics debug] unavailable", {
      POSTHOG_KEY: POSTHOG_KEY ? "***" : undefined,
      POSTHOG_HOST,
      APP_ENV,
      CHANNEL,
      isAllowedEnvironment,
    });
    console.warn(
      "[analytics] PostHog key or host not configured; analytics disabled.",
    );
    return;
  }

  if (!isAllowedEnvironment) {
    console.log("[analytics debug] disallowed environment", {
      APP_ENV,
      CHANNEL,
      __DEV__,
    });
    if (debug) {
      console.info(
        `[analytics] Skipping PostHog init for env=${APP_ENV}, channel=${CHANNEL}, dev=${__DEV__} (environment not allowed)`,
      );
    }
    return;
  }

  const options: PostHogOptions = {
    host: POSTHOG_HOST,
    flushAt: 20,
    flushInterval: 30_000,
    disableGeoip: true,
    captureNativeAppLifecycleEvents: true,
    defaultOptIn: false,
    customStorage: CUSTOM_STORAGE,
  };

  try {
    const instance = new PostHog(POSTHOG_KEY, options);
    applyDebugFlag(instance, debug);
    await instance.ready();
    await instance.register(buildSuperProperties() as RegisterProperties);
    await instance.optIn();

    client = instance;
    console.log("[analytics debug] client initialized", Boolean(client));
  } catch (error) {
    console.error("[analytics] Failed to initialize PostHog", error);
    client = null;
  }
}

const hasActiveClient = () => Boolean(client && !client.optedOut);

export const identify = (userId: string, properties?: EventProperties) => {
  if (!hasActiveClient() || !client) return;
  client.identify(userId, properties);
};

export const alias = (aliasId: string) => {
  if (!hasActiveClient() || !client) return;
  client.alias(aliasId);
};

export const capture = (event: string, properties?: EventProperties) => {
  if (!hasActiveClient() || !client) return;
  client.capture(event, properties);
};

export const captureEvent = <TName extends AnalyticsEventName>(
  event: TName,
  properties: AnalyticsEventProperties<TName>,
) => {
  if (!hasActiveClient() || !client) {
    console.log("[analytics debug] capture aborted", {
      hasClient: Boolean(client),
    });
    return false;
  }
  const validation = validateEventProperties(event, properties);
  if (!validation.success) {
    console.log("[analytics debug] validation failed", {
      event,
      properties,
      error: validation.error,
    });
    console.warn(
      "[analytics] Invalid event payload",
      event,
      validation.error.flatten(),
    );
    return false;
  }
  try {
    client.capture(event, validation.data);
    return true;
  } catch (error) {
    console.error("[analytics] Failed to capture event", event, error);
    return false;
  }
};

export const screen = (name: string, properties?: EventProperties) => {
  if (!hasActiveClient() || !client) return;
  client.screen(name, properties);
};

export const reset = (propertiesToKeep?: ResetKeepKeys) => {
  if (!client) return;
  client.reset(propertiesToKeep);
};

export const flush = async () => {
  if (!client) return;
  await client.flush();
};

export const shutdownAnalytics = async (timeoutMs?: number) => {
  if (!client) return;
  await client.shutdown(timeoutMs);
  client = null;
};
