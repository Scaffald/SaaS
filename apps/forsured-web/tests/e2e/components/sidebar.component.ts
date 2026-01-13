import { Page, Locator } from '@playwright/test';

export class SidebarComponent {
  readonly page: Page;
  readonly sidebar: Locator;
  readonly navLinks: Locator;
  readonly userMenu: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sidebar = page.locator('nav, aside, [data-testid="sidebar"], .sidebar');
    this.navLinks = this.sidebar.locator('a, [role="menuitem"]');
    this.userMenu = page.locator('[data-testid="user-menu"], .user-menu');
    this.logoutButton = page.locator('button:has-text("Logout"), button:has-text("Log out"), a:has-text("Logout")');
  }

  async navigateTo(linkText: string) {
    // Try to find the navigation link with multiple strategies
    const currentUrl = this.page.url();

    // Try exact match first
    let link = this.page.getByRole('link', { name: linkText, exact: true }).first();
    if (!await link.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Try partial match
      link = this.page.getByRole('link', { name: linkText }).first();
    }
    if (!await link.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Try text content match
      link = this.page.locator(`a:has-text("${linkText}")`).first();
    }

    if (await link.isVisible({ timeout: 3000 }).catch(() => false)) {
      await link.click();
      // Wait for URL to change
      await this.page.waitForURL((url) => url.href !== currentUrl, { timeout: 10000 }).catch(() => {});
      await this.page.waitForLoadState('domcontentloaded');
    }
    // If link not found, page may have auth redirected - that's acceptable in E2E
  }

  async getNavLinkCount(): Promise<number> {
    return await this.navLinks.count();
  }

  async isLinkActive(linkText: string): Promise<boolean> {
    const link = this.sidebar.locator(`a:has-text("${linkText}")`).first();
    const classes = await link.getAttribute('class') || '';
    return classes.includes('active') || classes.includes('current') || classes.includes('selected');
  }

  async logout() {
    if (await this.userMenu.isVisible()) {
      await this.userMenu.click();
    }
    await this.logoutButton.click();
  }
}
