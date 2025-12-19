import { test, expect } from '../../fixtures/base';
import { ManagerDashboardPage, ManagerTasksPage } from '../../pages/manager';
import { TaskModalComponent } from '../../components';

test.describe('Task Lifecycle Journey', () => {

  test('Manager views dashboard and navigates to tasks page', async ({ page, setupAuthAs }) => {
    await setupAuthAs(page, 'active.gc@test.forsured.com');

    // Start at dashboard
    const dashboard = new ManagerDashboardPage(page);
    await dashboard.goto();
    await dashboard.expectDashboardVisible();

    // Navigate to tasks page (create task flow may not exist if no projects)
    const tasksPage = new ManagerTasksPage(page);
    await tasksPage.goto();
    await tasksPage.expectTasksVisible();

    // Verify we're on tasks page
    expect(page.url()).toContain('/tasks');
  });

  test('Manager navigates through multiple pages', async ({ page, setupAuthAs }) => {
    await setupAuthAs(page, 'active.gc@test.forsured.com');

    const dashboard = new ManagerDashboardPage(page);
    const tasksPage = new ManagerTasksPage(page);

    // Dashboard -> Tasks -> Dashboard flow
    await dashboard.goto();
    await dashboard.expectDashboardVisible();

    await tasksPage.goto();
    await tasksPage.expectTasksVisible();

    await dashboard.goto();
    await dashboard.expectDashboardVisible();

    expect(page.url()).toContain('/dashboard');
  });
});
