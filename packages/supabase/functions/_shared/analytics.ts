import { PostHog } from "npm:posthog-node";

const POSTHOG_API_KEY =
  Deno.env.get("POSTHOG_KEY_SERVER") ??
  Deno.env.get("POSTHOG_KEY") ??
  "";
const POSTHOG_HOST = Deno.env.get("POSTHOG_HOST") ?? "https://app.posthog.com";
const APP_ENV = Deno.env.get("APP_ENV") ?? "development";

const posthog = POSTHOG_API_KEY
  ? new PostHog(POSTHOG_API_KEY, {
      host: POSTHOG_HOST,
      flushAt: 1,
      flushInterval: 0,
    })
  : null;

export async function trackServerEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>,
) {
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

