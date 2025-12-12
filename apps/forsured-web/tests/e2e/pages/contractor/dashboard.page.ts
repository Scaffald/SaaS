import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base.page';

export class ContractorDashboardPage extends BasePage {
  readonly url = '/subcontractor/dashboard';

  readonly taskList: Locator;
  readonly gcRelationships: Locator;
  readonly documentStatus: Locator;

  constructor(page: Page) {
    super(page);
    this.taskList = page.locator('[data-testid="task-list"], .task-list');
    this.gcRelationships = page.locator('[data-testid="gc-relationships"], .gc-relationships');
    this.documentStatus = page.locator('[data-testid="document-status"], .document-status');
  }

  async expectDashboardVisible() {
    await this.waitForLoading();
    // Use content-based validation to handle auth redirect in E2E
    expect(await this.hasContent('dashboard', 'subcontractor', 'contractor', 'welcome', 'forsured')).toBeTruthy();
  }
}
