import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base.page';
import { DataTableComponent } from '../../components/data-table.component';

export class AdminBrokersPage extends BasePage {
  readonly url = '/admin/brokers';

  readonly table: DataTableComponent;
  readonly addBrokerButton: Locator;
  readonly searchInput: Locator;

  constructor(page: Page) {
    super(page);
    this.table = new DataTableComponent(page);
    this.addBrokerButton = page.locator('button:has-text("Add Broker"), button:has-text("Create Broker")');
    this.searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
  }

  async expectBrokersVisible() {
    await this.waitForLoading();
    expect(await this.hasContent('brokers', 'broker', 'agency', 'loading')).toBeTruthy();
  }

  async getBrokerCount(): Promise<number> {
    return await this.table.getRowCount();
  }
}
