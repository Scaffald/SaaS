import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base.page';
import { DataTableComponent } from '../../components/data-table.component';

export class AdminUsersPage extends BasePage {
  readonly url = '/admin/users';

  readonly table: DataTableComponent;
  readonly addUserButton: Locator;
  readonly searchInput: Locator;

  constructor(page: Page) {
    super(page);
    this.table = new DataTableComponent(page);
    this.addUserButton = page.locator('button:has-text("Add User"), button:has-text("Create User")');
    this.searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
  }

  async expectUsersVisible() {
    await this.waitForLoading();
    expect(await this.hasContent('users', 'user', 'management', 'loading')).toBeTruthy();
  }

  async getUserCount(): Promise<number> {
    return await this.table.getRowCount();
  }
}
