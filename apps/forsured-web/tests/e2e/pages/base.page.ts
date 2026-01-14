import { Page, Locator, expect } from '@playwright/test';

export abstract class BasePage {
  readonly page: Page;
  abstract readonly url: string;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto(this.url);
    // Use domcontentloaded instead of networkidle to avoid timeouts from ongoing requests
    await this.page.waitForLoadState('domcontentloaded');
    // Wait for the page to settle
    await this.page.waitForTimeout(500);
  }

  async hasContent(...keywords: string[]): Promise<boolean> {
    const content = await this.page.content();
    const lowerContent = content.toLowerCase();
    return keywords.some(kw => lowerContent.includes(kw.toLowerCase()));
  }

  async waitForContent(...keywords: string[]): Promise<boolean> {
    const timeout = 10000;
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const content = await this.page.content();
      const lowerContent = content.toLowerCase();
      if (keywords.some(kw => lowerContent.includes(kw.toLowerCase()))) {
        return true;
      }
      await this.page.waitForTimeout(200);
    }
    return false;
  }

  async waitForPageContent(minLength: number, timeout = 10000): Promise<boolean> {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const content = await this.page.content();
      if (content.length >= minLength) {
        return true;
      }
      await this.page.waitForTimeout(200);
    }
    return false;
  }

  async clickButton(text: string) {
    await this.page.locator(`button:has-text("${text}")`).first().click();
  }

  async fillField(name: string, value: string) {
    await this.page.locator(`input[name="${name}"], textarea[name="${name}"]`).fill(value);
  }

  async waitForLoading() {
    await this.page.waitForTimeout(1000);
    const spinner = this.page.locator('[data-testid="loading"], .loading-spinner, .animate-spin');
    if (await spinner.count() > 0) {
      await spinner.first().waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
    }
  }

  async getTableRowCount(): Promise<number> {
    await this.waitForLoading();
    return await this.page.locator('tbody tr, [data-testid="table-row"]').count();
  }

  async expectPageVisible() {
    await this.waitForLoading();
    const pageContent = await this.page.content();
    expect(pageContent.length).toBeGreaterThan(100);
  }
}
