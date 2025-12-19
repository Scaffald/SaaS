import { Page, Locator } from '@playwright/test';

export class DataTableComponent {
  readonly page: Page;
  readonly table: Locator;
  readonly rows: Locator;
  readonly headers: Locator;
  readonly searchInput: Locator;
  readonly filterButtons: Locator;

  constructor(page: Page, tableSelector?: string) {
    this.page = page;
    this.table = tableSelector
      ? page.locator(tableSelector)
      : page.locator('table, [data-testid="data-table"], .data-table');
    this.rows = this.table.locator('tbody tr, [data-testid="table-row"]');
    this.headers = this.table.locator('thead th, [data-testid="table-header"]');
    this.searchInput = page.locator('input[type="search"], input[placeholder*="search" i], [data-testid="search-input"]');
    this.filterButtons = page.locator('[data-testid="filter-button"], button:has-text("Filter")');
  }

  async getRowCount(): Promise<number> {
    await this.page.waitForTimeout(500);
    return await this.rows.count();
  }

  async getHeaderCount(): Promise<number> {
    return await this.headers.count();
  }

  async clickRow(index: number) {
    await this.rows.nth(index).click();
  }

  async clickFirstRow() {
    await this.rows.first().click();
  }

  async search(query: string) {
    if (await this.searchInput.isVisible()) {
      await this.searchInput.fill(query);
      await this.page.waitForTimeout(500);
    }
  }

  async hasEmptyState(): Promise<boolean> {
    const emptyIndicators = this.page.locator('text=/no .* found|empty|no results|no data/i');
    return await emptyIndicators.count() > 0;
  }

  async getRowText(index: number): Promise<string> {
    return await this.rows.nth(index).textContent() || '';
  }
}
