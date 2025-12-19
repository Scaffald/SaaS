import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base.page';
import { DataTableComponent } from '../../components/data-table.component';

export class AdminAuditLogPage extends BasePage {
  readonly url = '/admin/audit-log';

  readonly table: DataTableComponent;
  readonly filterDropdown: Locator;
  readonly dateRangePicker: Locator;
  readonly searchInput: Locator;

  constructor(page: Page) {
    super(page);
    this.table = new DataTableComponent(page);
    this.filterDropdown = page.locator('[data-testid="filter-dropdown"], select, .filter-dropdown');
    this.dateRangePicker = page.locator('[data-testid="date-range"], .date-picker, input[type="date"]');
    this.searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
  }

  async expectAuditLogVisible() {
    await this.waitForLoading();
    expect(await this.hasContent('audit', 'log', 'activity', 'event', 'loading')).toBeTruthy();
  }

  async getLogEntryCount(): Promise<number> {
    return await this.table.getRowCount();
  }
}
