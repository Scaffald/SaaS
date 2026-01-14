import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base.page';

export class AdminEnumsPage extends BasePage {
  readonly url = '/admin/enums';

  readonly enumList: Locator;
  readonly addEnumButton: Locator;
  readonly enumEditor: Locator;

  constructor(page: Page) {
    super(page);
    this.enumList = page.locator('[data-testid="enum-list"], .enum-list, table');
    this.addEnumButton = page.locator('button:has-text("Add"), button:has-text("Create")');
    this.enumEditor = page.locator('[data-testid="enum-editor"], .enum-editor, form');
  }

  async expectEnumsVisible() {
    await this.waitForLoading();
    expect(await this.hasContent('enum', 'enums', 'values', 'type', 'loading')).toBeTruthy();
  }
}
