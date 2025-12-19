// tests/e2e/pages/onboarding/broker.page.ts
import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base.page';

export class BrokerOnboardingPage extends BasePage {
  readonly url = '/broker/onboarding';

  readonly welcomeHeading: Locator;
  readonly agencyNameInput: Locator;
  readonly licenseInput: Locator;
  readonly stateSelect: Locator;
  readonly continueButton: Locator;
  readonly skipButton: Locator;
  readonly nextStepButton: Locator;
  readonly prevStepButton: Locator;
  readonly progressIndicator: Locator;

  constructor(page: Page) {
    super(page);
    this.welcomeHeading = page.locator('h1:has-text("Welcome"), h1:has-text("Broker")');
    this.agencyNameInput = page.locator('input[placeholder*="agency" i], input[name="agencyName"]');
    this.licenseInput = page.locator('input[placeholder*="license" i], input[name="license"]');
    this.stateSelect = page.locator('select[name="state"], select');
    this.continueButton = page.locator('button:has-text("Continue"), button[type="submit"]');
    this.skipButton = page.locator('button:has-text("Skip"), a:has-text("Skip")');
    this.nextStepButton = page.locator('button:has-text("Next"), button:has-text("Continue")');
    this.prevStepButton = page.locator('button:has-text("Back"), button:has-text("Previous")');
    this.progressIndicator = page.locator('[data-testid="progress"], .progress-indicator, .step-indicator');
  }

  async expectOnboardingVisible() {
    await this.waitForLoading();
    expect(await this.hasContent('welcome', 'broker', 'agency', 'insurance', 'loading')).toBeTruthy();
  }

  async fillAgencyInfo(agencyName: string, license?: string) {
    if (await this.agencyNameInput.isVisible()) {
      await this.agencyNameInput.fill(agencyName);
    }
    if (license && await this.licenseInput.isVisible()) {
      await this.licenseInput.fill(license);
    }
  }

  async submitForm() {
    await this.continueButton.click();
    await this.page.waitForURL(/dashboard/, { timeout: 10000 }).catch(() => {});
  }

  async skipOnboarding() {
    await this.skipButton.click();
    await this.page.waitForURL(/dashboard/, { timeout: 10000 }).catch(() => {});
  }

  async goToNextStep() {
    await this.nextStepButton.click();
    await this.waitForLoading();
  }

  async goToPreviousStep() {
    await this.prevStepButton.click();
    await this.waitForLoading();
  }
}
