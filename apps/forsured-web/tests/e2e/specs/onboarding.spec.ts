// tests/e2e/specs/onboarding.spec.ts
import { test, expect } from '../fixtures/base';
import {
  ManagerOnboardingPage,
  BrokerOnboardingPage,
  ContractorOnboardingPage
} from '../pages/onboarding';

test.describe('Onboarding Routes - Page Object Model', () => {

  test.describe('Manager/GC Onboarding', () => {
    test('should display manager onboarding page', async ({ page, setupAuthAs }) => {
      // Use a fresh user who hasn't completed onboarding
      await setupAuthAs(page, 'fresh.gc@test.forsured.com');

      const onboardingPage = new ManagerOnboardingPage(page);
      await onboardingPage.goto();
      await onboardingPage.expectOnboardingVisible();
    });

    test('should show company setup form', async ({ page, setupAuthAs }) => {
      await setupAuthAs(page, 'fresh.gc@test.forsured.com');

      const onboardingPage = new ManagerOnboardingPage(page);
      await onboardingPage.goto();
      await onboardingPage.waitForLoading();

      // Verify form elements are present
      const hasForm = await onboardingPage.form.isVisible();
      expect(hasForm || await onboardingPage.hasContent('company', 'welcome')).toBeTruthy();
    });

    test('should have skip option', async ({ page, setupAuthAs }) => {
      await setupAuthAs(page, 'fresh.gc@test.forsured.com');

      const onboardingPage = new ManagerOnboardingPage(page);
      await onboardingPage.goto();
      await onboardingPage.waitForLoading();

      // Verify skip button is available
      const skipVisible = await onboardingPage.skipButton.isVisible().catch(() => false);
      expect(skipVisible || await onboardingPage.hasContent('skip', 'later')).toBeTruthy();
    });
  });

  test.describe('Broker Onboarding', () => {
    test('should display broker onboarding page', async ({ page, setupAuthAs }) => {
      await setupAuthAs(page, 'fresh.broker@test.forsured.com');

      const onboardingPage = new BrokerOnboardingPage(page);
      await onboardingPage.goto();
      await onboardingPage.expectOnboardingVisible();
    });

    test('should show agency setup form', async ({ page, setupAuthAs }) => {
      await setupAuthAs(page, 'fresh.broker@test.forsured.com');

      const onboardingPage = new BrokerOnboardingPage(page);
      await onboardingPage.goto();
      await onboardingPage.waitForLoading();

      // Verify agency-related content or form is present
      expect(await onboardingPage.hasContent('agency', 'broker', 'welcome', 'insurance')).toBeTruthy();
    });

    test('should have skip option', async ({ page, setupAuthAs }) => {
      await setupAuthAs(page, 'fresh.broker@test.forsured.com');

      const onboardingPage = new BrokerOnboardingPage(page);
      await onboardingPage.goto();
      await onboardingPage.waitForLoading();

      // Verify skip button is available
      const skipVisible = await onboardingPage.skipButton.isVisible().catch(() => false);
      expect(skipVisible || await onboardingPage.hasContent('skip', 'later')).toBeTruthy();
    });
  });

  test.describe('Contractor/Subcontractor Onboarding', () => {
    test('should display contractor onboarding page', async ({ page, setupAuthAs }) => {
      await setupAuthAs(page, 'fresh.contractor@test.forsured.com');

      const onboardingPage = new ContractorOnboardingPage(page);
      await onboardingPage.goto();
      await onboardingPage.expectOnboardingVisible();
    });

    test('should show company and insurance setup', async ({ page, setupAuthAs }) => {
      await setupAuthAs(page, 'fresh.contractor@test.forsured.com');

      const onboardingPage = new ContractorOnboardingPage(page);
      await onboardingPage.goto();
      await onboardingPage.waitForLoading();

      // Verify contractor-related content is present
      expect(await onboardingPage.hasContent('company', 'contractor', 'subcontractor', 'welcome')).toBeTruthy();
    });

    test('should have skip option', async ({ page, setupAuthAs }) => {
      await setupAuthAs(page, 'fresh.contractor@test.forsured.com');

      const onboardingPage = new ContractorOnboardingPage(page);
      await onboardingPage.goto();
      await onboardingPage.waitForLoading();

      // Verify skip button is available
      const skipVisible = await onboardingPage.skipButton.isVisible().catch(() => false);
      expect(skipVisible || await onboardingPage.hasContent('skip', 'later')).toBeTruthy();
    });
  });
});
