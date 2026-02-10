/**
 * App Launch E2E Tests (Detox)
 *
 * Tests that the native app launches and displays correctly
 * Uses real Supabase (no mocking)
 */

import { by, device, element, expect as detoxExpect } from "detox";

describe("App Launch (Native)", () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { notifications: "YES" },
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it("should launch the app successfully", async () => {
    // Wait for the app to load
    await detoxExpect(element(by.id("root"))).toBeVisible();
  });

  it("should display the main screen", async () => {
    // Adjust these test IDs based on your actual app structure
    // You'll need to add testID props to your React Native components

    // Example: Check for a heading or logo
    // await detoxExpect(element(by.id('app-logo'))).toBeVisible();

    // For now, just verify the app loaded
    await detoxExpect(element(by.id("root"))).toExist();
  });

  it.skip("should navigate to login screen", async () => {
    // This is a template - customize based on your app

    // Example: Tap a login button
    // await element(by.id('login-button')).tap();

    // Verify we're on the login screen
    // await detoxExpect(element(by.id('login-screen'))).toBeVisible();
  });
});
