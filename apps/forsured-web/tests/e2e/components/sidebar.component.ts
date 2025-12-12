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
    // Use getByRole to find the navigation link reliably
    await this.page.getByRole('link', { name: linkText }).first().click();
    await this.page.waitForLoadState('networkidle');
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
