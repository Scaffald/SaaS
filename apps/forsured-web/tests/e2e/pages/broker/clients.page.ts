import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base.page';
import { DataTableComponent } from '../../components/data-table.component';

export class BrokerClientsPage extends BasePage {
  readonly url = '/broker/clients';

  readonly table: DataTableComponent;
  readonly addClientButton: Locator;
  readonly searchInput: Locator;
  readonly filterDropdown: Locator;

  constructor(page: Page) {
    super(page);
    this.table = new DataTableComponent(page);
    this.addClientButton = page.locator('button:has-text("Add Client"), button:has-text("New Client")');
    this.searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
    this.filterDropdown = page.locator('[data-testid="filter-dropdown"], select[name="filter"]');
  }

  async expectClientsVisible() {
    await this.waitForLoading();
    expect(await this.hasContent('clients', 'client', 'companies', 'loading')).toBeTruthy();
  }

  async getClientCount(): Promise<number> {
    return await this.table.getRowCount();
  }

  async clickAddClient() {
    await this.addClientButton.click();
  }

  async clickClient(index: number) {
    await this.table.clickRow(index);
  }

  async searchClients(query: string) {
    await this.table.search(query);
  }
}
