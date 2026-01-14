import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base.page';

export class BrokerDashboardPage extends BasePage {
  readonly url = '/broker/dashboard';

  readonly statsCards: Locator;
  readonly clientList: Locator;
  readonly policyAlerts: Locator;
  readonly taskWidget: Locator;

  constructor(page: Page) {
    super(page);
    this.statsCards = page.locator('[data-testid="stat-card"], .stat-card, .metric-card');
    this.clientList = page.locator('[data-testid="client-list"], .client-list');
    this.policyAlerts = page.locator('[data-testid="policy-alerts"], .policy-alerts');
    this.taskWidget = page.locator('[data-testid="task-widget"], .task-widget');
  }

  async expectDashboardVisible() {
    await this.waitForLoading();
    // Wait for the Dashboard link in sidebar to be visible (confirms React rendered and layout loaded)
    await this.page.getByRole('link', { name: 'Dashboard' }).first().waitFor({ state: 'visible', timeout: 15000 });
  }

  async getStatsCount(): Promise<number> {
    await this.waitForLoading();
    return await this.statsCards.count();
  }
}
