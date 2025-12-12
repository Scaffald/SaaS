import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base.page';

export class LandingPage extends BasePage {
  readonly url = '/start';

  readonly loginButton: Locator;
  readonly signupLink: Locator;
  readonly heroSection: Locator;

  constructor(page: Page) {
    super(page);
    this.loginButton = page.locator('button:has-text("Login"), button:has-text("Sign In"), a:has-text("Login")');
    this.signupLink = page.locator('a:has-text("Sign Up"), a:has-text("Create Account")');
    this.heroSection = page.locator('[data-testid="hero"], .hero, main');
  }

  async expectLandingVisible() {
    await this.waitForLoading();
    expect(await this.hasContent('forsured', 'login', 'sign', 'insurance', 'compliance', 'loading')).toBeTruthy();
  }

  async clickLogin() {
    await this.loginButton.click();
  }

  async clickSignup() {
    await this.signupLink.click();
  }
}
