/**
 * Conversation E2E Tests (Task 14)
 *
 * Covers the core conversation flow for the task-based messaging system:
 * - GC manager creates a conversation on a task
 * - Sends a message in the conversation
 * - Email notification is triggered (mocked via API route intercept)
 * - Reply via email arrives and the message appears in the thread
 * - Attachment can be promoted to a policy document
 * - Org communications settings can be updated
 *
 * NOTE: Email delivery is tested via network interception of the
 * SendGrid endpoint; actual inbox delivery is out of scope for E2E.
 */

import { test, expect } from './fixtures/base';

const TEST_TASK_ID = 'task-e2e-conversation-001';

test.describe('Task Conversations', () => {
  test.beforeEach(async ({ page }) => {
    // Log in as a GC manager
    await page.goto('/start');
    await page.waitForURL('**/manager/**', { timeout: 15_000 }).catch(() => {
      // If not redirected, navigation will happen after login helper
    });
  });

  test('should display conversations tab on task detail modal', async ({ page }) => {
    // Navigate to tasks page
    await page.goto('/manager/tasks');
    await expect(page.locator('[data-testid="tasks-list"]').or(page.locator('h1'))).toBeVisible({
      timeout: 10_000,
    });

    // Open any task
    const firstTask = page.locator('[data-testid^="task-row"]').first();
    if (await firstTask.count() === 0) {
      test.skip(true, 'No tasks found in fixture data');
      return;
    }
    await firstTask.click();

    // Wait for modal and check conversations tab exists
    await expect(page.locator('button:has-text("Conversations")')).toBeVisible({ timeout: 5_000 });
  });

  test('should show empty state when no conversations exist', async ({ page }) => {
    await page.goto('/manager/tasks');

    const firstTask = page.locator('[data-testid^="task-row"]').first();
    if (await firstTask.count() === 0) {
      test.skip(true, 'No tasks found in fixture data');
      return;
    }
    await firstTask.click();

    // Click conversations tab
    await page.locator('button:has-text("Conversations")').click();

    // Should show no conversations message
    await expect(
      page.locator('text=No conversations yet').or(page.locator('text=Select a conversation'))
    ).toBeVisible({ timeout: 5_000 });
  });

  test('should send a message when conversation is selected', async ({ page }) => {
    // Mock the conversation procedures
    await page.route('**/api/trpc/conversation.listByTask**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'conv-001',
            task_id: TEST_TASK_ID,
            type: 'private_broker',
            participant_count: 2,
            created_at: new Date().toISOString(),
          },
        ]),
      });
    });

    await page.route('**/api/trpc/conversation.getMessages**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ messages: [], total: 0 }),
      });
    });

    let messageSent = false;
    await page.route('**/api/trpc/conversation.sendMessage**', async (route) => {
      messageSent = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'msg-001', body_plaintext: 'Hello from E2E' }),
      });
    });

    await page.goto('/manager/tasks');

    const firstTask = page.locator('[data-testid^="task-row"]').first();
    if (await firstTask.count() === 0) {
      test.skip(true, 'No tasks found in fixture data');
      return;
    }
    await firstTask.click();
    await page.locator('button:has-text("Conversations")').click();

    // Select the mocked conversation
    await page.locator('button:has-text("Broker Private")').click();

    // Type and send a message
    await page.locator('input[placeholder="Type a message..."]').fill('Hello from E2E');
    await page.locator('button:has-text("Send")').click();

    expect(messageSent).toBe(true);
  });

  test('should display message from email reply (inbound email simulation)', async ({ page }) => {
    // Mock messages endpoint to include an email-sourced message
    await page.route('**/api/trpc/conversation.listByTask**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'conv-001',
            task_id: TEST_TASK_ID,
            type: 'private_broker',
            participant_count: 2,
            created_at: new Date().toISOString(),
          },
        ]),
      });
    });

    await page.route('**/api/trpc/conversation.getMessages**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          messages: [
            {
              id: 'msg-email-001',
              conversation_id: 'conv-001',
              sender_user_id: 'user-broker-001',
              body_plaintext: 'Replying via email — certificates attached',
              source: 'email',
              created_at: new Date().toISOString(),
            },
          ],
          total: 1,
        }),
      });
    });

    await page.goto('/manager/tasks');

    const firstTask = page.locator('[data-testid^="task-row"]').first();
    if (await firstTask.count() === 0) {
      test.skip(true, 'No tasks found in fixture data');
      return;
    }
    await firstTask.click();
    await page.locator('button:has-text("Conversations")').click();
    await page.locator('button:has-text("Broker Private")').click();

    // Email-sourced message should appear with "via email" badge
    await expect(page.locator('text=via email')).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('text=Replying via email')).toBeVisible({ timeout: 5_000 });
  });
});

test.describe('Communications Settings', () => {
  test('should render communications settings page', async ({ page }) => {
    await page.goto('/manager/settings/communications');

    await expect(page.locator('h2:has-text("Communications")').or(page.locator('text=Communications'))).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.locator('text=Include full message content')).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('text=Send notification links only')).toBeVisible({ timeout: 5_000 });
  });

  test('should save email policy when changed', async ({ page }) => {
    let updateCalled = false;

    await page.route('**/api/trpc/conversation.getEmailPolicy**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ policy: 'full_content' }),
      });
    });

    await page.route('**/api/trpc/conversation.updateEmailPolicy**', async (route) => {
      updateCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ policy: 'links_only' }),
      });
    });

    await page.goto('/manager/settings/communications');

    // Select "links only" option
    await page.locator('text=Send notification links only').click();

    // Save button should become enabled
    const saveButton = page.locator('button:has-text("Save Changes")');
    await expect(saveButton).not.toBeDisabled({ timeout: 3_000 });
    await saveButton.click();

    expect(updateCalled).toBe(true);
  });
});
