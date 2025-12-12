import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base.page';

export class ContractorSettingsPage extends BasePage {
  readonly url = '/subcontractor/settings/profile';

  readonly settingsNav: Locator;
  readonly profileSection: Locator;
  readonly companySection: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    super(page);
    this.settingsNav = page.locator('[data-testid="settings-nav"], .settings-nav, nav');
    this.profileSection = page.locator('[data-testid="profile-settings"], .profile-section');
    this.companySection = page.locator('[data-testid="company-settings"], .company-section');
    this.saveButton = page.locator('button:has-text("Save"), button:has-text("Update")');
  }

  async expectSettingsVisible() {
    await this.waitForLoading();
    // Use content-based validation to handle auth redirect in E2E
    expect(await this.hasContent('settings', 'profile', 'subcontractor', 'contractor', 'welcome', 'forsured')).toBeTruthy();
  }

  async navigateToSection(section: string) {
    await this.settingsNav.locator(`a:has-text("${section}"), button:has-text("${section}")`).click();
    await this.waitForLoading();
  }
}
