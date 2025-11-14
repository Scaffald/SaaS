const POSTHOG_API_KEY = Deno.env.get("POSTHOG_KEY_SERVER") ??
  Deno.env.get("POSTHOG_KEY") ??
  "";
const POSTHOG_HOST = Deno.env.get("POSTHOG_HOST") ?? "https://app.posthog.com";
const APP_ENV = Deno.env.get("APP_ENV") ?? "development";

// Define PostHog type for proper typing
type PostHogInstance = {
  capture: (data: {
    distinctId: string;
    event: string;
    properties?: Record<string, unknown>;
  }) => void;
  flush: () => Promise<void>;
};

// Lazy-loaded PostHog instance - only loaded when actually needed
let posthogInstance: PostHogInstance | null = null;

async function getPostHogInstance(): Promise<PostHogInstance | null> {
  if (!POSTHOG_API_KEY) {
    return null;
  }

  if (posthogInstance !== null) {
    return posthogInstance;
  }

  try {
    // Dynamically import posthog-node only when needed
    const { PostHog } = await import("npm:posthog-node");
    posthogInstance = new PostHog(POSTHOG_API_KEY, {
      host: POSTHOG_HOST,
      flushAt: 1,
      flushInterval: 0,
    });
    return posthogInstance;
  } catch (error) {
    console.error("[analytics] Failed to load PostHog", error);
    posthogInstance = null;
    return null;
  }
}

export async function trackServerEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>,
) {
  const posthog = await getPostHogInstance();

  if (!posthog) {
    return;
  }

  try {
    posthog.capture({
      distinctId,
      event,
      properties: {
        ...properties,
        env: APP_ENV,
        source: "server",
      },
    });

    await posthog.flush();
  } catch (error) {
    console.error("[analytics] Failed to capture server event", error);
  }
}
