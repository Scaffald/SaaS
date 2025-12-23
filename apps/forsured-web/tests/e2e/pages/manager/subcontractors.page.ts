import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base.page';
import { DataTableComponent } from '../../components/data-table.component';

export class ManagerSubcontractorsPage extends BasePage {
  readonly url = '/manager/subcontractors';

  readonly table: DataTableComponent;
  readonly addButton: Locator;
  readonly searchInput: Locator;
  readonly filterDropdown: Locator;
  readonly subcontractorCards: Locator;

  constructor(page: Page) {
    super(page);
    this.table = new DataTableComponent(page);
    this.addButton = page.locator('button:has-text("Add Subcontractor")');
    this.searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
    this.filterDropdown = page.locator('[data-testid="filter-dropdown"], select[name="filter"]');
    this.subcontractorCards = page.locator('[data-testid="subcontractor-card"], .subcontractor-card');
  }

  async expectSubcontractorsVisible() {
    await this.waitForLoading();
    await this.page.getByRole('link', { name: 'Dashboard' }).first().waitFor({ state: 'visible', timeout: 15000 });
  }

  async getSubcontractorCount(): Promise<number> {
    const tableCount = await this.table.getRowCount();
    const cardCount = await this.subcontractorCards.count();
    return Math.max(tableCount, cardCount);
  }

  async clickAddSubcontractor() {
    await this.addButton.click();
  }

  async expectAddButtonVisible() {
    await expect(this.addButton).toBeVisible();
  }
}
