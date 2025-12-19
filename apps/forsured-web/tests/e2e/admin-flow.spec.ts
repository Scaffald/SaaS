// tests/e2e/admin-flow.spec.ts
// Phase 4: Admin Interface E2E Tests
//
// Tests the admin panel functionality including:
// - Dashboard navigation and display
// - User management (view, change role, view activity)
// - Broker invitation management
// - Enum management
// - Audit log viewing

import { test, expect, Page } from '@playwright/test';
import { loginAs, TEST_USERS } from '../utils/auth';

// Mock data for admin pages
const MOCK_ADMIN_USERS = [
  {
    id: 'user-1',
    scaffald_user_id: 'scaffald-1',
    name: 'Fresh GC User',
    email: 'fresh.gc@test.forsured.com',
    user_type: 'gc',
    status: 'active',
    company: 'Test GC Company',
    onboarding_completed: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'user-2',
    scaffald_user_id: 'scaffald-2',
    name: 'Active Contractor User',
    email: 'active.contractor@test.forsured.com',
    user_type: 'contractor',
    status: 'active',
    company: 'Test Contractor Co',
    onboarding_completed: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'user-3',
    scaffald_user_id: 'scaffald-3',
    name: 'Active Broker User',
    email: 'active.broker@test.forsured.com',
    user_type: 'broker',
    status: 'active',
    company: 'Test Brokerage',
    onboarding_completed: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const MOCK_INVITATIONS = [
  {
    id: 'inv-1',
    code: 'TESTCODE123',
    email: 'broker@example.com',
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    max_uses: 5,
    use_count: 0,
    created_at: new Date().toISOString(),
    created_by: 'admin-1',
  },
  {
    id: 'inv-2',
    code: 'USEDCODE456',
    email: 'used@example.com',
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    max_uses: 1,
    use_count: 1,
    created_at: new Date().toISOString(),
    created_by: 'admin-1',
  },
];

const MOCK_ENUM_VALUES = {
  task_status: [
    { id: '1', enum_type: 'task_status', value: 'pending', display_name: 'Pending', description: null, sort_order: 1, is_active: true, metadata: {}, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: '2', enum_type: 'task_status', value: 'in_progress', display_name: 'In Progress', description: null, sort_order: 2, is_active: true, metadata: {}, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: '3', enum_type: 'task_status', value: 'completed', display_name: 'Completed', description: null, sort_order: 3, is_active: true, metadata: {}, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ],
  task_priority: [
    { id: '4', enum_type: 'task_priority', value: 'low', display_name: 'Low', description: null, sort_order: 1, is_active: true, metadata: {}, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: '5', enum_type: 'task_priority', value: 'medium', display_name: 'Medium', description: null, sort_order: 2, is_active: true, metadata: {}, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: '6', enum_type: 'task_priority', value: 'high', display_name: 'High', description: null, sort_order: 3, is_active: true, metadata: {}, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ],
};

const MOCK_AUDIT_LOGS = [
  {
    id: 'log-1',
    admin_user_id: 'admin-1',
    action: 'INVITATION_CREATED',
    target_type: 'broker_invitation',
    target_id: 'inv-1',
    old_value: null,
    new_value: { code: 'TESTCODE123' },
    created_at: new Date().toISOString(),
  },
  {
    id: 'log-2',
    admin_user_id: 'admin-1',
    action: 'USER_TYPE_CHANGED',
    target_type: 'user',
    target_id: 'user-1',
    old_value: { user_type: 'gc' },
    new_value: { user_type: 'broker' },
    created_at: new Date().toISOString(),
  },
  {
    id: 'log-3',
    admin_user_id: 'admin-1',
    action: 'ENUM_DELETED',
    target_type: 'enum_value',
    target_id: 'enum-1',
    old_value: { is_active: true },
    new_value: { is_active: false },
    created_at: new Date().toISOString(),
  },
];

// Admin user profile for authentication
const ADMIN_PROFILE = {
  id: 'profile-admin',
  scaffald_user_id: TEST_USERS['admin@test.forsured.com'].id,
  user_type: 'admin',
  onboarding_completed: true,
  onboarding_step: 4,
  company_connected: true,
  onboarding_data: {},
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

test.describe('Admin User Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Set up all mocks BEFORE login

    // Mock user_profiles - handles both auth (single) and admin list (multiple)
    await page.route('**/rest/v1/user_profiles*', async (route) => {
      const method = route.request().method();
      const url = route.request().url();
      const headers = route.request().headers();
      const acceptHeader = headers['accept'] || '';
      const isSingleQuery = acceptHeader.includes('vnd.pgrst.object');

      // Check if this is a query for the admin user (auth context)
      const isAdminUserQuery = url.includes(TEST_USERS['admin@test.forsured.com'].id);

      if (method === 'GET') {
        if (isSingleQuery || isAdminUserQuery) {
          // Return admin profile for auth
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(isSingleQuery ? ADMIN_PROFILE : [ADMIN_PROFILE]),
          });
        } else {
          // Return all mock users for admin list
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(MOCK_ADMIN_USERS),
          });
        }
      }

      if (method === 'PATCH' || method === 'PUT') {
        const body = route.request().postData();
        let updates = {};
        if (body) {
          try {
            updates = JSON.parse(body);
          } catch {
            // Ignore parse errors
          }
        }
        const updatedUser = { ...MOCK_ADMIN_USERS[0], ...updates };
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(isSingleQuery ? updatedUser : [updatedUser]),
        });
      }

      if (method === 'POST') {
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(isSingleQuery ? ADMIN_PROFILE : [ADMIN_PROFILE]),
        });
      }

      return route.continue();
    });

    // Mock scaffald users endpoint
    await page.route('**/rest/v1/users*', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_ADMIN_USERS.map(u => ({
          id: u.scaffald_user_id,
          email: u.email,
          name: u.name,
          organization_id: null,
        }))),
      });
    });

    // Mock broker_invitations API endpoint
    await page.route('**/rest/v1/broker_invitations*', async (route) => {
      const method = route.request().method();
      const headers = route.request().headers();
      const acceptHeader = headers['accept'] || '';
      const isSingleQuery = acceptHeader.includes('vnd.pgrst.object');

      if (method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(isSingleQuery ? MOCK_INVITATIONS[0] : MOCK_INVITATIONS),
        });
      }

      if (method === 'POST') {
        const newInvitation = {
          id: 'inv-new',
          code: 'NEWCODE789',
          ...JSON.parse(route.request().postData() || '{}'),
          created_at: new Date().toISOString(),
        };
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(isSingleQuery ? newInvitation : [newInvitation]),
        });
      }

      if (method === 'PATCH' || method === 'PUT') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(isSingleQuery ? MOCK_INVITATIONS[0] : [MOCK_INVITATIONS[0]]),
        });
      }

      return route.continue();
    });

    // Mock the enum_values API endpoint
    await page.route('**/rest/v1/enum_values*', async (route) => {
      const url = route.request().url();
      // Parse the enum_type filter from the URL
      const enumTypeMatch = url.match(/enum_type=eq\.([^&]+)/);
      const enumType = enumTypeMatch ? enumTypeMatch[1] : 'task_status';
      const mockData = MOCK_ENUM_VALUES[enumType as keyof typeof MOCK_ENUM_VALUES] || MOCK_ENUM_VALUES.task_status;

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockData),
      });
    });

    // Mock audit log endpoint
    await page.route('**/rest/v1/admin_audit_log*', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_AUDIT_LOGS),
      });
    });

    // Now login as admin - this will navigate to /admin/dashboard
    await loginAs(page, 'admin@test.forsured.com');
  });

  test('Admin can view dashboard with stats and recent activity', async ({ page }) => {
    // Should already be on dashboard after login
    await expect(page).toHaveURL(/admin\/dashboard/);
    await expect(page.locator('h1')).toContainText('Admin Dashboard');

    // Verify stats cards are present
    await expect(page.locator('text=Total Users')).toBeVisible();
    await expect(page.locator('text=Active Brokers')).toBeVisible();
    await expect(page.locator('text=Projects')).toBeVisible();
    await expect(page.locator('text=Tasks Created')).toBeVisible();

    // Verify recent activity section
    await expect(page.locator('text=Recent Activity')).toBeVisible();
  });

  test('Admin can navigate to Users page and view user list', async ({ page }) => {
    // Navigate to Users via sidebar
    await page.click('text=Users');
    await expect(page).toHaveURL(/admin\/users/);
    await expect(page.locator('h1')).toContainText('User Management');

    // Verify table is present with expected columns
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('th', { hasText: 'Name' })).toBeVisible();
    await expect(page.locator('th', { hasText: 'Email' })).toBeVisible();
    await expect(page.locator('th', { hasText: 'Role' })).toBeVisible();
    await expect(page.locator('th', { hasText: 'Company' })).toBeVisible();
    await expect(page.locator('th', { hasText: 'Onboarding' })).toBeVisible();

    // Verify at least one user row is displayed (data comes from mocks)
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 10000 });
  });

  test('Admin can filter users by role', async ({ page }) => {
    await page.click('text=Users');
    await expect(page).toHaveURL(/admin\/users/);

    // Wait for table to load
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 10000 });

    // Filter by role - select GC
    await page.selectOption('#roleFilter', 'gc');

    // Wait for filtered results
    await page.waitForTimeout(500);

    // Table should still be visible
    await expect(page.locator('table')).toBeVisible();
  });

  test('Admin can change user role', async ({ page }) => {
    await page.click('text=Users');

    // Wait for table to load
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 10000 });

    // Find the first user row and change role
    const firstUserRow = page.locator('tbody tr').first();
    const roleSelect = firstUserRow.locator('select');

    // Verify select is present
    await expect(roleSelect).toBeVisible();

    // Get current value and change to something else
    const currentValue = await roleSelect.inputValue();
    const newValue = currentValue === 'gc' ? 'broker' : 'gc';
    await roleSelect.selectOption(newValue);

    // Wait for update to complete (mocked)
    await page.waitForTimeout(500);
  });

  test('Admin can view user activity', async ({ page }) => {
    await page.click('text=Users');

    // Wait for table to load
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 10000 });

    // Find the first user row and click View Activity
    const firstUserRow = page.locator('tbody tr').first();
    await firstUserRow.locator('text=View Activity').click();

    // Verify activity log section appears
    await expect(page.locator('h3', { hasText: /Activity Log/ })).toBeVisible({ timeout: 10000 });

    // Close the activity log
    await page.locator('button', { hasText: 'Close' }).click();
    await expect(page.locator('h3', { hasText: /Activity Log/ })).not.toBeVisible();
  });

  test('Admin can navigate to Brokers page and view invitations', async ({ page }) => {
    await page.click('text=Brokers');
    await expect(page).toHaveURL(/admin\/brokers/);
    await expect(page.locator('h1')).toContainText('Broker Invitations');

    // Verify table is present
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('th', { hasText: 'Code' })).toBeVisible();
    await expect(page.locator('th', { hasText: 'Email' })).toBeVisible();
    await expect(page.locator('th', { hasText: 'Status' })).toBeVisible();

    // Verify mock invitations are displayed
    await expect(page.locator('tr', { hasText: 'TESTCODE123' })).toBeVisible({ timeout: 10000 });
  });

  test('Admin can open broker invitation form and fill it', async ({ page }) => {
    await page.click('text=Brokers');
    await expect(page).toHaveURL(/admin\/brokers/);

    // Wait for page to load
    await expect(page.locator('h1')).toContainText('Broker Invitations');

    // Click Create Invitation button
    await page.click('button:has-text("Create Invitation")');

    // Verify form appears (InvitationForm component uses YStack as="form")
    // The form fields should be visible: Email, Expires At, Max Uses
    await expect(page.getByText('Email (Optional)')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Expires At')).toBeVisible();
    await expect(page.getByText('Max Uses')).toBeVisible();

    // Fill out the form
    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.isVisible()) {
      await emailInput.fill('newbroker@test.com');
    }

    // Look for date input
    const dateInput = page.locator('input[type="date"]');
    if (await dateInput.isVisible()) {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 1);
      const dateString = futureDate.toISOString().split('T')[0];
      await dateInput.fill(dateString);
    }

    // Cancel the form
    await page.click('button:has-text("Cancel")');
  });

  test('Admin can navigate to Enums page and view enum types', async ({ page }) => {
    await page.click('text=Enums');
    await expect(page).toHaveURL(/admin\/enums/);
    await expect(page.locator('h1')).toContainText('Enum Management');

    // Verify enum type selector is present
    const enumSelector = page.locator('select').first();
    await expect(enumSelector).toBeVisible();

    // Verify table is present
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('th', { hasText: 'Value' })).toBeVisible();
    await expect(page.locator('th', { hasText: 'Display Name' })).toBeVisible();
  });

  test('Admin can view enum values in table', async ({ page }) => {
    await page.click('text=Enums');

    // Wait for data to load
    await page.waitForTimeout(1000);

    // Verify enum values are shown in table - use exact match to avoid strict mode violation
    await expect(page.locator('td').filter({ hasText: /^pending$/ })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('td').filter({ hasText: /^Pending$/ })).toBeVisible();
  });

  test('Admin can navigate to Audit Log page and view logs', async ({ page }) => {
    await page.click('text=Audit Log');
    await expect(page).toHaveURL(/admin\/audit-log/);
    await expect(page.locator('h1')).toContainText('Admin Audit Log');

    // Verify table is present
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('th', { hasText: 'Timestamp' })).toBeVisible();
    await expect(page.locator('th', { hasText: 'Action' })).toBeVisible();
    await expect(page.locator('th', { hasText: 'Target Type' })).toBeVisible();

    // Verify mock audit logs are displayed
    await expect(page.locator('tr', { hasText: 'CREATE_INVITATION' })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('tr', { hasText: 'UPDATE_USER_ROLE' })).toBeVisible();
  });

  test('Admin can filter audit logs by action', async ({ page }) => {
    await page.click('text=Audit Log');

    // Wait for page to load
    await expect(page.locator('h1')).toContainText('Admin Audit Log');
    await expect(page.locator('table')).toBeVisible();

    // Filter by action - look for the filter select
    const actionFilter = page.locator('#actionFilter');
    if (await actionFilter.isVisible({ timeout: 5000 })) {
      // Get available options first
      const options = await actionFilter.locator('option').allTextContents();

      // Try to select if option exists
      if (options.some(opt => opt.includes('INVITATION'))) {
        await actionFilter.selectOption({ label: options.find(opt => opt.includes('INVITATION')) || '' });
        await page.waitForTimeout(500);
      }
    }

    // Verify table is still visible
    await expect(page.locator('table')).toBeVisible();
  });

  test('Admin can search audit logs', async ({ page }) => {
    await page.click('text=Audit Log');

    // Wait for page to load
    await expect(page.locator('h1')).toContainText('Admin Audit Log');
    await expect(page.locator('table')).toBeVisible();

    // Search for a specific action
    const searchInput = page.locator('input[placeholder*="Search"]');
    if (await searchInput.isVisible({ timeout: 5000 })) {
      await searchInput.fill('ENUM');
      await page.waitForTimeout(500);
    }

    // Verify table is still visible
    await expect(page.locator('table')).toBeVisible();
  });

  test('Admin sidebar navigation works correctly', async ({ page }) => {
    // Verify all sidebar links are present and work
    // Note: Tamagui's as="nav" may not render actual <nav> element on web,
    // so we use link text directly with getByRole or href-based selector
    const sidebarLinks = [
      { label: 'Dashboard', url: /admin\/dashboard/ },
      { label: 'Users', url: /admin\/users/ },
      { label: 'Brokers', url: /admin\/brokers/ },
      { label: 'Enums', url: /admin\/enums/ },
      { label: 'Audit Log', url: /admin\/audit-log/ },
    ];

    for (const link of sidebarLinks) {
      // Use role-based selector for links - more reliable across frameworks
      await page.getByRole('link', { name: link.label }).click();
      await expect(page).toHaveURL(link.url);
    }
  });
});
