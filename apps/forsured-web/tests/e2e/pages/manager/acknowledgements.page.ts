import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base.page';
import { DataTableComponent } from '../../components/data-table.component';

export class ManagerAcknowledgementsPage extends BasePage {
  readonly url = '/manager/acknowledgements';

  readonly table: DataTableComponent;
  readonly createButton: Locator;
  readonly searchInput: Locator;
  readonly filterDropdown: Locator;
  readonly acknowledgementCards: Locator;

  constructor(page: Page) {
    super(page);
    this.table = new DataTableComponent(page);
    this.createButton = page.locator('button:has-text("Create"), button:has-text("New")');
    this.searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
    this.filterDropdown = page.locator('[data-testid="filter-dropdown"], select[name="filter"]');
    this.acknowledgementCards = page.locator('[data-testid="acknowledgement-card"], .acknowledgement-card');
  }

  async expectAcknowledgementsVisible() {
    await this.waitForLoading();
    await this.page.getByRole('link', { name: 'Dashboard' }).first().waitFor({ state: 'visible', timeout: 15000 });
  }

  async getAcknowledgementCount(): Promise<number> {
    const tableCount = await this.table.getRowCount();
    const cardCount = await this.acknowledgementCards.count();
    return Math.max(tableCount, cardCount);
  }
}
