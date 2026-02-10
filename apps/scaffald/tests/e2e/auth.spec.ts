/**
 * Authentication E2E Tests
 *
 * Tests the complete authentication flow in the browser
 * Uses real Supabase (no mocking)
 */

import { expect, test } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto("/");
  });

  test("displays login screen on initial load", async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState("networkidle");

    // Check for login-related elements
    // Adjust selectors based on your actual app structure
    const heading = page.locator("h1, h2").first();
    await expect(heading).toBeVisible();

    // Example: Check for login button or form
    // const loginButton = page.getByRole('button', { name: /sign in|login/i });
    // await expect(loginButton).toBeVisible();
  });

  test.skip("can sign in with email and password", async ({ page }) => {
    // This is a template - uncomment and customize based on your auth flow

    // Fill in email
    // await page.getByLabel(/email/i).fill('test@example.com');

    // Fill in password
    // await page.getByLabel(/password/i).fill('TestPassword123!');

    // Click sign in button
    // await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for redirect after successful login
    // await page.waitForURL('/dashboard', { timeout: 10000 });

    // Verify we're logged in
    // const userMenu = page.getByRole('button', { name: /profile|account/i });
    // await expect(userMenu).toBeVisible();
  });

  test.skip("shows error for invalid credentials", async ({ page }) => {
    // This is a template - uncomment and customize

    // Fill in invalid credentials
    // await page.getByLabel(/email/i).fill('invalid@example.com');
    // await page.getByLabel(/password/i).fill('WrongPassword');

    // Click sign in
    // await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for error message
    // const errorMessage = page.getByText(/invalid credentials|incorrect/i);
    // await expect(errorMessage).toBeVisible();
  });

  test.skip("can sign out", async ({ page }) => {
    // This is a template - uncomment and customize

    // First sign in (you might want to use a helper function)
    // await signIn(page, 'test@example.com', 'TestPassword123!');

    // Click user menu
    // await page.getByRole('button', { name: /profile|account/i }).click();

    // Click sign out
    // await page.getByRole('button', { name: /sign out|logout/i }).click();

    // Verify we're back on login page
    // await page.waitForURL('/', { timeout: 5000 });
    // const loginButton = page.getByRole('button', { name: /sign in/i });
    // await expect(loginButton).toBeVisible();
  });
});

/**
 * Helper function to sign in (customize based on your app)
 */
async function signIn(page: any, email: string, password: string) {
  // await page.goto('/');
  // await page.getByLabel(/email/i).fill(email);
  // await page.getByLabel(/password/i).fill(password);
  // await page.getByRole('button', { name: /sign in/i }).click();
  // await page.waitForURL('/dashboard', { timeout: 10000 });
}
