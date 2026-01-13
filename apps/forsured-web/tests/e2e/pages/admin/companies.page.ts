import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base.page';
import { DataTableComponent } from '../../components/data-table.component';

export class AdminCompaniesPage extends BasePage {
  readonly url = '/admin/companies';

  readonly table: DataTableComponent;
  readonly addCompanyButton: Locator;
  readonly searchInput: Locator;

  constructor(page: Page) {
    super(page);
    this.table = new DataTableComponent(page);
    this.addCompanyButton = page.locator('button:has-text("Add Company"), button:has-text("Create Company")');
    this.searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
  }

  async expectCompaniesVisible() {
    await this.waitForLoading();
    expect(await this.hasContent('companies', 'company', 'organization', 'loading')).toBeTruthy();
  }

  async getCompanyCount(): Promise<number> {
    return await this.table.getRowCount();
  }
}
