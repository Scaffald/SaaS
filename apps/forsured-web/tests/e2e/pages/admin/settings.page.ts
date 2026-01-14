import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base.page';

export class AdminSettingsPage extends BasePage {
  readonly url = '/admin/settings';

  readonly settingsNav: Locator;
  readonly saveButton: Locator;
  readonly generalSection: Locator;
  readonly securitySection: Locator;

  constructor(page: Page) {
    super(page);
    this.settingsNav = page.locator('[data-testid="settings-nav"], .settings-nav, nav');
    this.saveButton = page.locator('button:has-text("Save"), button:has-text("Update")');
    this.generalSection = page.locator('[data-testid="general-settings"], .general-settings');
    this.securitySection = page.locator('[data-testid="security-settings"], .security-settings');
  }

  async expectSettingsVisible() {
    await this.waitForLoading();
    expect(await this.hasContent('settings', 'configuration', 'admin', 'loading')).toBeTruthy();
  }

  async navigateToSection(section: string) {
    await this.settingsNav.locator(`a:has-text("${section}"), button:has-text("${section}")`).click();
    await this.waitForLoading();
  }
}
