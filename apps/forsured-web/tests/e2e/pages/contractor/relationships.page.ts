import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base.page';
import { DataTableComponent } from '../../components/data-table.component';

export class ContractorRelationshipsPage extends BasePage {
  readonly url = '/subcontractor/relationships';

  readonly table: DataTableComponent;
  readonly managerCards: Locator;
  readonly searchInput: Locator;

  constructor(page: Page) {
    super(page);
    this.table = new DataTableComponent(page);
    this.managerCards = page.locator('[data-testid="manager-card"], .manager-card, .relationship-card');
    this.searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
  }

  async expectRelationshipsVisible() {
    await this.waitForLoading();
    await this.page.getByRole('link', { name: 'Dashboard' }).first().waitFor({ state: 'visible', timeout: 15000 });
  }

  async getManagerCount(): Promise<number> {
    const tableCount = await this.table.getRowCount();
    const cardCount = await this.managerCards.count();
    return Math.max(tableCount, cardCount);
  }
}
