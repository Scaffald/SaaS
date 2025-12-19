import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base.page';

export class SignupPage extends BasePage {
  readonly url = '/signup';

  readonly userTypeButtons: Locator;
  readonly emailInput: Locator;
  readonly nameInput: Locator;
  readonly companyInput: Locator;
  readonly submitButton: Locator;
  readonly loginLink: Locator;

  constructor(page: Page) {
    super(page);
    this.userTypeButtons = page.locator('[data-testid="user-type-button"], button[data-user-type]');
    this.emailInput = page.locator('input[type="email"], input[name="email"]');
    this.nameInput = page.locator('input[name="name"], input[placeholder*="name" i]');
    this.companyInput = page.locator('input[name="company"], input[placeholder*="company" i]');
    this.submitButton = page.locator('button[type="submit"], button:has-text("Sign Up"), button:has-text("Create")');
    this.loginLink = page.locator('a:has-text("Login"), a:has-text("Sign In")');
  }

  async expectSignupVisible() {
    await this.waitForLoading();
    expect(await this.hasContent('sign', 'create', 'account', 'register', 'loading')).toBeTruthy();
  }

  async selectUserType(type: 'gc' | 'contractor' | 'broker') {
    await this.userTypeButtons.locator(`[data-user-type="${type}"], :has-text("${type}")`).first().click();
  }

  async fillSignupForm(email: string, name: string, company?: string) {
    if (await this.emailInput.isVisible()) {
      await this.emailInput.fill(email);
    }
    if (await this.nameInput.isVisible()) {
      await this.nameInput.fill(name);
    }
    if (company && await this.companyInput.isVisible()) {
      await this.companyInput.fill(company);
    }
  }

  async submit() {
    await this.submitButton.click();
  }
}
