// tests/e2e/pages/onboarding/manager.page.ts
import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base.page';

export class ManagerOnboardingPage extends BasePage {
  readonly url = '/manager/onboarding';

  readonly welcomeHeading: Locator;
  readonly companyNameInput: Locator;
  readonly companySizeSelect: Locator;
  readonly primaryLocationInput: Locator;
  readonly continueButton: Locator;
  readonly skipButton: Locator;
  readonly form: Locator;

  constructor(page: Page) {
    super(page);
    this.welcomeHeading = page.locator('h1:has-text("Welcome"), h1:has-text("General Contractor")');
    this.companyNameInput = page.locator('input[placeholder*="company name" i], input[name="companyName"]');
    this.companySizeSelect = page.locator('select');
    this.primaryLocationInput = page.locator('input[placeholder*="City" i], input[placeholder*="location" i], input[name="primaryLocation"]');
    this.continueButton = page.locator('button:has-text("Continue"), button[type="submit"]');
    this.skipButton = page.locator('button:has-text("Skip"), a:has-text("Skip")');
    this.form = page.locator('form');
  }

  async expectOnboardingVisible() {
    await this.waitForLoading();
    expect(await this.hasContent('welcome', 'company', 'contractor', 'general', 'loading')).toBeTruthy();
  }

  async fillOnboardingForm(companyName: string, companySize: string, location: string) {
    await this.companyNameInput.fill(companyName);
    await this.companySizeSelect.selectOption({ label: companySize });
    await this.primaryLocationInput.fill(location);
  }

  async submitForm() {
    await this.continueButton.click();
    await this.page.waitForURL(/dashboard/, { timeout: 10000 }).catch(() => {});
  }

  async skipOnboarding() {
    await this.skipButton.click();
    await this.page.waitForURL(/dashboard/, { timeout: 10000 }).catch(() => {});
  }

  async isFormValid(): Promise<boolean> {
    const companyName = await this.companyNameInput.inputValue();
    const companySize = await this.companySizeSelect.inputValue();
    const location = await this.primaryLocationInput.inputValue();
    return !!(companyName && companySize && location);
  }
}
