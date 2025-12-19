import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base.page';

export class AdminDashboardPage extends BasePage {
  readonly url = '/admin/dashboard';

  readonly statsOverview: Locator;
  readonly userCount: Locator;
  readonly recentActivity: Locator;

  constructor(page: Page) {
    super(page);
    this.statsOverview = page.locator('[data-testid="stats-overview"], .stats-overview');
    this.userCount = page.locator('[data-testid="user-count"], .user-count');
    this.recentActivity = page.locator('[data-testid="recent-activity"], .recent-activity');
  }

  async expectDashboardVisible() {
    await this.waitForLoading();
    expect(await this.hasContent('admin', 'dashboard', 'users', 'system', 'loading')).toBeTruthy();
  }
}
