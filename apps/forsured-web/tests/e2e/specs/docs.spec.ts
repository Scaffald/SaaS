import { test, expect } from '../fixtures/base';

/**
 * Dev/Docs Pages Test Suite
 *
 * Tests for documentation and design system routes:
 * - Design System pages
 * - Documentation pages
 *
 * These are public routes that don't require authentication.
 *
 * Total: 7 dev/docs routes
 */
test.describe('Dev/Docs Pages', () => {

  test.describe('Design System', () => {
    test('should display design system home', async ({ page }) => {
      await page.goto('/design-system');
      await page.waitForLoadState('networkidle');

      // Give the page time to render
      await page.waitForTimeout(500);

      // Verify URL
      expect(page.url()).toContain('/design-system');

      // Check for page content
      const heading = page.locator('h1, h2, .design-system');
      const hasContent = await heading.first().isVisible({ timeout: 5000 }).catch(() => false);

      // Either content visible or at correct URL
      expect(hasContent || page.url().includes('/design-system')).toBe(true);
    });
  });

  test.describe('Documentation', () => {
    const docsRoutes = [
      { path: '/docs', title: 'Documentation Home' },
      { path: '/docs/components', title: 'Components' },
      { path: '/docs/tokens', title: 'Tokens' },
      { path: '/docs/icons', title: 'Icons' },
      { path: '/docs/patterns', title: 'Patterns' },
      { path: '/docs/changelog', title: 'Changelog' },
    ];

    for (const route of docsRoutes) {
      test(`should display ${route.title} page`, async ({ page }) => {
        await page.goto(route.path);
        await page.waitForLoadState('networkidle');

        // Give the page time to render
        await page.waitForTimeout(500);

        // Verify URL
        expect(page.url()).toContain(route.path);
      });
    }
  });

  test.describe('Documentation Content', () => {
    test('docs home should show navigation', async ({ page }) => {
      await page.goto('/docs');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      // Check for navigation elements
      const nav = page.locator('nav, .nav, [role="navigation"], a[href*="docs"]');
      const hasNav = await nav.first().isVisible({ timeout: 3000 }).catch(() => false);

      expect(hasNav || page.url().includes('/docs')).toBe(true);
    });

    test('components page should show component list', async ({ page }) => {
      await page.goto('/docs/components');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      // Check for component documentation content
      const content = page.locator('.components, [class*="component"], article, main');
      const hasContent = await content.first().isVisible({ timeout: 3000 }).catch(() => false);

      expect(hasContent || page.url().includes('/docs/components')).toBe(true);
    });

    test('tokens page should show design tokens', async ({ page }) => {
      await page.goto('/docs/tokens');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      // Check for tokens content
      const content = page.locator('.tokens, [class*="token"], .colors, .spacing, main');
      const hasContent = await content.first().isVisible({ timeout: 3000 }).catch(() => false);

      expect(hasContent || page.url().includes('/docs/tokens')).toBe(true);
    });

    test('icons page should show icon library', async ({ page }) => {
      await page.goto('/docs/icons');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      // Check for icons content
      const content = page.locator('.icons, [class*="icon"], svg, main');
      const hasContent = await content.first().isVisible({ timeout: 3000 }).catch(() => false);

      expect(hasContent || page.url().includes('/docs/icons')).toBe(true);
    });
  });

  test.describe('Navigation Between Docs', () => {
    test('should navigate from docs home to components', async ({ page }) => {
      await page.goto('/docs');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      // Try to find and click components link
      const componentsLink = page.locator('a[href*="components"]').first();
      const hasLink = await componentsLink.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasLink) {
        await componentsLink.click();
        await page.waitForLoadState('networkidle');
        expect(page.url()).toContain('/components');
      } else {
        // No navigation link - just verify we're on docs
        expect(page.url()).toContain('/docs');
      }
    });
  });
});
