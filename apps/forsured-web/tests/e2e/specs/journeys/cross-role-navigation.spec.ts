import { test, expect } from '../../fixtures/base';
import { ManagerDashboardPage } from '../../pages/manager';
import { BrokerDashboardPage } from '../../pages/broker';
import { ContractorDashboardPage } from '../../pages/contractor';
import { SidebarComponent } from '../../components';

/**
 * Cross-Role Navigation Journey
 *
 * Tests that each user role can access their specific dashboard
 * and that navigation works correctly for each role type.
 */
test.describe('Cross-Role Navigation Journey', () => {

  test('Manager can navigate all primary sections', async ({ page, setupAuthAs }) => {
    await setupAuthAs(page, 'active.gc@test.forsured.com');
    const sidebar = new SidebarComponent(page);

    // Start at dashboard
    const dashboard = new ManagerDashboardPage(page);
    await dashboard.goto();
    await dashboard.expectDashboardVisible();

    // Navigate through all primary sections
    await sidebar.navigateTo('Tasks');
    expect(page.url()).toContain('/tasks');

    await sidebar.navigateTo('Projects');
    expect(page.url()).toContain('/projects');

    await sidebar.navigateTo('Subs');
    expect(page.url()).toContain('/subcontractors');

    await sidebar.navigateTo('Documents');
    expect(page.url()).toContain('/documents');

    await sidebar.navigateTo('Dashboard');
    expect(page.url()).toContain('/dashboard');
  });

  test('Broker can navigate all primary sections', async ({ page, setupAuthAs }) => {
    await setupAuthAs(page, 'active.broker@test.forsured.com');
    const sidebar = new SidebarComponent(page);

    // Start at dashboard
    const dashboard = new BrokerDashboardPage(page);
    await dashboard.goto();
    await dashboard.expectDashboardVisible();

    // Navigate through all primary sections
    await sidebar.navigateTo('Tasks');
    expect(page.url()).toContain('/tasks');

    await sidebar.navigateTo('Clients');
    expect(page.url()).toContain('/clients');

    await sidebar.navigateTo('Documents');
    expect(page.url()).toContain('/documents');

    await sidebar.navigateTo('Dashboard');
    expect(page.url()).toContain('/dashboard');
  });

  test('Contractor can navigate all primary sections', async ({ page, setupAuthAs }) => {
    await setupAuthAs(page, 'active.contractor@test.forsured.com');
    const sidebar = new SidebarComponent(page);

    // Start at dashboard
    const dashboard = new ContractorDashboardPage(page);
    await dashboard.goto();
    await dashboard.expectDashboardVisible();

    // Navigate through all primary sections
    await sidebar.navigateTo('Projects');
    expect(page.url()).toContain('/projects');

    await sidebar.navigateTo('Managers');
    expect(page.url()).toContain('/relationships');

    await sidebar.navigateTo('Documents');
    expect(page.url()).toContain('/documents');

    await sidebar.navigateTo('Dashboard');
    expect(page.url()).toContain('/dashboard');
  });
});
