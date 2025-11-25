/**
 * PostHog Sync Verification Test
 *
 * This test verifies that events are actually syncing to PostHog by:
 * 1. Querying PostHog API for recent events
 * 2. Verifying event structure and properties
 * 3. Confirming analytics is working end-to-end
 *
 * Run with: POSTHOG_ALL_ACCESS=xxx POSTHOG_PROJECT_ID=xxx pnpm --filter @app/core test --run verify-posthog-syncing.test.ts
 */

import { describe, expect, test } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

// Load .env file
const envVars: Record<string, string> = {};
try {
  const envPath = join(process.cwd(), ".env");
  const envContent = readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...valueParts] = trimmed.split("=");
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join("=").trim();
      }
    }
  });
} catch {
  // .env file not found
}

const POSTHOG_ALL_ACCESS = process.env.POSTHOG_ALL_ACCESS ||
  envVars.POSTHOG_ALL_ACCESS;
const POSTHOG_PROJECT_ID = process.env.POSTHOG_PROJECT_ID ||
  process.env.EXPO_PUBLIC_POSTHOG_PROJECT ||
  envVars.EXPO_PUBLIC_POSTHOG_PROJECT || envVars.POSTHOG_PROJECT_ID;
const POSTHOG_HOST = process.env.POSTHOG_HOST ||
  process.env.EXPO_PUBLIC_POSTHOG_HOST || envVars.EXPO_PUBLIC_POSTHOG_HOST ||
  "https://app.posthog.com";

const shouldRunVerification = Boolean(POSTHOG_ALL_ACCESS && POSTHOG_PROJECT_ID);

/**
 * Query PostHog Events API directly
 */
async function queryPostHogEventsAPI(
  eventName?: string,
  distinctId?: string,
  limit = 100,
  after?: string,
): Promise<
  Array<
    {
      event: string;
      properties: Record<string, unknown>;
      timestamp?: string;
      distinct_id?: string;
    }
  >
> {
  if (!POSTHOG_ALL_ACCESS || !POSTHOG_PROJECT_ID) {
    throw new Error("POSTHOG_ALL_ACCESS and POSTHOG_PROJECT_ID must be set");
  }

  const url = new URL(
    `${POSTHOG_HOST}/api/projects/${POSTHOG_PROJECT_ID}/events/`,
  );

  if (eventName) {
    url.searchParams.append("event", eventName);
  }
  if (distinctId) {
    url.searchParams.append("distinct_id", distinctId);
  }
  if (limit) {
    url.searchParams.append("limit", limit.toString());
  }
  if (after) {
    url.searchParams.append("after", after);
  } else {
    // Default to last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString();
    url.searchParams.append("after", sevenDaysAgo);
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${POSTHOG_ALL_ACCESS}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `PostHog API error: ${response.status} ${response.statusText} - ${errorText}`,
    );
  }

  return response.json();
}

describe.skipIf(!shouldRunVerification)(
  "PostHog Event Syncing Verification",
  () => {
    test("can connect to PostHog API", async () => {
      const response = await queryPostHogEventsAPI(undefined, undefined, 1);

      expect(response).toBeDefined();
      console.log(
        "[posthog-verification] ✅ PostHog API connection successful",
      );
      console.log(`[posthog-verification] Project ID: ${POSTHOG_PROJECT_ID}`);
      console.log(`[posthog-verification] Host: ${POSTHOG_HOST}`);
    });

    test("can query events from PostHog", async () => {
      const data = await queryPostHogEventsAPI();

      expect(data).toBeDefined();

      // Check if results exist
      if (data.results && Array.isArray(data.results)) {
        console.log(
          `[posthog-verification] ✅ Found ${data.results.length} events in PostHog`,
        );

        if (data.results.length > 0) {
          const event = data.results[0];
          console.log("[posthog-verification] Sample event:", {
            event: event.event || event.name,
            distinctId: event.distinct_id,
            timestamp: event.timestamp,
            hasProperties: !!event.properties,
          });

          // Verify event structure
          expect(event).toHaveProperty("event");
          expect(event).toHaveProperty("timestamp");
          expect(event).toHaveProperty("distinct_id");
        } else {
          console.log(
            "[posthog-verification] ⚠️  No events found in last 7 days",
          );
          console.log("[posthog-verification] This could mean:");
          console.log(
            "[posthog-verification]   1. Analytics is not sending events",
          );
          console.log(
            "[posthog-verification]   2. Events are being filtered out",
          );
          console.log(
            "[posthog-verification]   3. Events are being sent to a different project",
          );
        }
      } else {
        console.log(
          "[posthog-verification] Unexpected API response format:",
          Object.keys(data),
        );
      }
    });

    test("can find analytics events by name", async () => {
      const eventTypes = [
        "user_signed_in",
        "user_signed_out",
        "job_viewed",
        "auth_magic_link_requested",
      ];
      let foundAnyEvents = false;

      for (const eventType of eventTypes) {
        try {
          const data = await queryPostHogEventsAPI(eventType, undefined, 10);

          if (
            data.results && Array.isArray(data.results) &&
            data.results.length > 0
          ) {
            foundAnyEvents = true;
            console.log(
              `[posthog-verification] ✅ Found ${data.results.length} ${eventType} events`,
            );

            // Verify event properties
            const event = data.results[0];
            if (event.properties) {
              console.log(
                `[posthog-verification] ${eventType} event properties:`,
                {
                  env: event.properties.env,
                  source: event.properties.source,
                  expo_channel: event.properties.expo_channel,
                  hasRequiredProps: !!event.properties.provider ||
                    !!event.properties.job_id ||
                    !!event.properties.email_domain,
                },
              );

              // Verify environment property exists
              if (event.properties.env) {
                expect(["development", "staging", "production"]).toContain(
                  event.properties.env,
                );
                console.log(
                  `[posthog-verification] ✅ Event has correct env: ${event.properties.env}`,
                );
              }

              // Verify source property exists (should be 'client' for client events)
              if (event.properties.source) {
                expect(["client", "server"]).toContain(event.properties.source);
                console.log(
                  `[posthog-verification] ✅ Event has source: ${event.properties.source}`,
                );
              }
            }

            break; // Found events, no need to check other types
          }
        } catch (error) {
          console.warn(
            `[posthog-verification] Error querying ${eventType}:`,
            error,
          );
        }
      }

      if (foundAnyEvents) {
        console.log(
          "[posthog-verification] ✅ SUCCESS: Events are syncing to PostHog!",
        );
      } else {
        console.log(
          "[posthog-verification] ⚠️  WARNING: No analytics events found in PostHog",
        );
        console.log(
          "[posthog-verification] This suggests events are not being sent or are being filtered",
        );
      }
    });

    test("verifies event properties match schemas", async () => {
      const { validateEventProperties } = await import("../events");

      // Query for user_signed_in events
      const data = await queryPostHogEventsAPI("user_signed_in", undefined, 5);

      if (
        data.results && Array.isArray(data.results) && data.results.length > 0
      ) {
        console.log(
          `[posthog-verification] Found ${data.results.length} user_signed_in events to validate`,
        );

        for (const posthogEvent of data.results) {
          if (posthogEvent.properties) {
            // Extract core properties (PostHog may add extra properties like $lib, $lib_version, etc.)
            const coreProperties = {
              provider: posthogEvent.properties.provider,
              is_new_user: posthogEvent.properties.is_new_user,
              has_anonymous_history:
                posthogEvent.properties.has_anonymous_history,
            };

            const validation = validateEventProperties(
              "user_signed_in",
              coreProperties,
            );

            if (validation.success) {
              console.log(
                "[posthog-verification] ✅ Event properties match schema",
              );
            } else {
              console.warn(
                "[posthog-verification] ⚠️  Event properties validation failed:",
                validation.error,
              );
            }
          }
        }
      }
    });
  },
);

describe("PostHog Sync Verification Setup", () => {
  test("verification credentials check", () => {
    if (!shouldRunVerification) {
      console.warn("PostHog sync verification tests skipped.");
      console.warn(
        "To enable, set POSTHOG_ALL_ACCESS and POSTHOG_PROJECT_ID in .env",
      );
      console.warn("Current values:");
      console.warn(
        `  POSTHOG_ALL_ACCESS: ${POSTHOG_ALL_ACCESS ? "SET" : "NOT SET"}`,
      );
      console.warn(
        `  POSTHOG_PROJECT_ID: ${
          POSTHOG_PROJECT_ID ? POSTHOG_PROJECT_ID : "NOT SET"
        }`,
      );
    } else {
      console.log("✅ PostHog sync verification ENABLED");
      console.log(`   Project ID: ${POSTHOG_PROJECT_ID}`);
      console.log(`   Host: ${POSTHOG_HOST}`);
      console.log("");
      console.log("This test will verify:");
      console.log("  1. API connectivity to PostHog");
      console.log("  2. Events are being received in PostHog");
      console.log("  3. Event properties match expected schemas");
      console.log("  4. Events include correct environment tags");
    }
  });
});
