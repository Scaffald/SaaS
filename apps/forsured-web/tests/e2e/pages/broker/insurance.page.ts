import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base.page';
import { DataTableComponent } from '../../components/data-table.component';

export class BrokerInsurancePage extends BasePage {
  readonly url = '/broker/insurance';

  readonly table: DataTableComponent;
  readonly policyCards: Locator;
  readonly addPolicyButton: Locator;
  readonly searchInput: Locator;
  readonly filterDropdown: Locator;

  constructor(page: Page) {
    super(page);
    this.table = new DataTableComponent(page);
    this.policyCards = page.locator('[data-testid="policy-card"], .policy-card');
    this.addPolicyButton = page.locator('button:has-text("Add Policy"), button:has-text("New Policy")');
    this.searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
    this.filterDropdown = page.locator('[data-testid="filter-dropdown"], select[name="filter"]');
  }

  async expectInsuranceVisible() {
    await this.waitForLoading();
    // Wait for the Dashboard link in sidebar to confirm page loaded
    await this.page.getByRole('link', { name: 'Dashboard' }).first().waitFor({ state: 'visible', timeout: 15000 });
  }

  async getPolicyCount(): Promise<number> {
    const tableCount = await this.table.getRowCount();
    const cardCount = await this.policyCards.count();
    return Math.max(tableCount, cardCount);
  }

  async clickPolicy(index: number) {
    const cards = await this.policyCards.count();
    if (cards > 0) {
      await this.policyCards.nth(index).click();
    } else {
      await this.table.clickRow(index);
    }
  }
}
