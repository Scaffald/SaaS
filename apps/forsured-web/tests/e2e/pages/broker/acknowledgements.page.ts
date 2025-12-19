// tests/e2e/pages/broker/acknowledgements.page.ts
import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base.page';
import { DataTableComponent } from '../../components/data-table.component';

export class BrokerAcknowledgementsPage extends BasePage {
  readonly url = '/broker/acknowledgements';

  readonly table: DataTableComponent;
  readonly createButton: Locator;
  readonly filterTabs: Locator;
  readonly searchInput: Locator;
  readonly pendingSection: Locator;
  readonly completedSection: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    super(page);
    this.table = new DataTableComponent(page);
    this.createButton = page.locator('button:has-text("Create"), button:has-text("New Acknowledgement")');
    this.filterTabs = page.locator('[role="tablist"], .filter-tabs');
    this.searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
    this.pendingSection = page.locator('[data-testid="pending-acknowledgements"], .pending-section');
    this.completedSection = page.locator('[data-testid="completed-acknowledgements"], .completed-section');
    this.emptyState = page.locator('[data-testid="empty-state"], .empty-state');
  }

  async expectAcknowledgementsVisible() {
    await this.waitForLoading();
    expect(await this.hasContent('acknowledgement', 'form', 'pending', 'loading')).toBeTruthy();
  }

  async getAcknowledgementCount(): Promise<number> {
    return await this.table.getRowCount();
  }

  async clickCreate() {
    await this.createButton.click();
    await this.waitForLoading();
  }

  async clickAcknowledgement(index: number) {
    await this.table.clickRow(index);
    await this.waitForLoading();
  }

  async filterByStatus(status: string) {
    await this.filterTabs.locator(`button:has-text("${status}")`).click();
    await this.waitForLoading();
  }

  async search(query: string) {
    await this.table.search(query);
  }
}
