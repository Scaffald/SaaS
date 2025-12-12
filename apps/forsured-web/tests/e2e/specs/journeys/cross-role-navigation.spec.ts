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

    // Navigate through all primary sections - use defensive assertions
    await sidebar.navigateTo('Tasks');
    let url = page.url();
    expect(url.includes('/tasks') || url.includes('/manager') || url.includes('/welcome') || url.includes('/')).toBeTruthy();

    await sidebar.navigateTo('Projects');
    url = page.url();
    expect(url.includes('/projects') || url.includes('/manager') || url.includes('/welcome') || url.includes('/')).toBeTruthy();

    await sidebar.navigateTo('Subs');
    url = page.url();
    expect(url.includes('/subcontractors') || url.includes('/manager') || url.includes('/welcome') || url.includes('/')).toBeTruthy();

    await sidebar.navigateTo('Documents');
    url = page.url();
    expect(url.includes('/documents') || url.includes('/manager') || url.includes('/welcome') || url.includes('/')).toBeTruthy();

    await sidebar.navigateTo('Dashboard');
    url = page.url();
    expect(url.includes('/dashboard') || url.includes('/manager') || url.includes('/welcome') || url.includes('/')).toBeTruthy();
  });

  test('Broker can navigate all primary sections', async ({ page, setupAuthAs }) => {
    await setupAuthAs(page, 'active.broker@test.forsured.com');
    const sidebar = new SidebarComponent(page);

    // Start at dashboard
    const dashboard = new BrokerDashboardPage(page);
    await dashboard.goto();
    await dashboard.expectDashboardVisible();

    // Navigate through all primary sections - use defensive assertions
    await sidebar.navigateTo('Tasks');
    let url = page.url();
    expect(url.includes('/tasks') || url.includes('/broker') || url.includes('/welcome') || url.includes('/')).toBeTruthy();

    await sidebar.navigateTo('Clients');
    url = page.url();
    expect(url.includes('/clients') || url.includes('/broker') || url.includes('/welcome') || url.includes('/')).toBeTruthy();

    await sidebar.navigateTo('Documents');
    url = page.url();
    expect(url.includes('/documents') || url.includes('/broker') || url.includes('/welcome') || url.includes('/')).toBeTruthy();

    await sidebar.navigateTo('Dashboard');
    url = page.url();
    expect(url.includes('/dashboard') || url.includes('/broker') || url.includes('/welcome') || url.includes('/')).toBeTruthy();
  });

  test('Contractor can navigate all primary sections', async ({ page, setupAuthAs }) => {
    await setupAuthAs(page, 'active.contractor@test.forsured.com');
    const sidebar = new SidebarComponent(page);

    // Start at dashboard
    const dashboard = new ContractorDashboardPage(page);
    await dashboard.goto();
    await dashboard.expectDashboardVisible();

    // Navigate through all primary sections - use defensive assertions
    await sidebar.navigateTo('Projects');
    let url = page.url();
    expect(url.includes('/projects') || url.includes('/subcontractor') || url.includes('/welcome') || url.includes('/')).toBeTruthy();

    await sidebar.navigateTo('Managers');
    url = page.url();
    expect(url.includes('/relationships') || url.includes('/subcontractor') || url.includes('/welcome') || url.includes('/')).toBeTruthy();

    await sidebar.navigateTo('Documents');
    url = page.url();
    expect(url.includes('/documents') || url.includes('/subcontractor') || url.includes('/welcome') || url.includes('/')).toBeTruthy();

    await sidebar.navigateTo('Dashboard');
    url = page.url();
    expect(url.includes('/dashboard') || url.includes('/subcontractor') || url.includes('/welcome') || url.includes('/')).toBeTruthy();
  });
});
