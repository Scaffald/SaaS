import { test } from '@playwright/test'

import { assertA11y } from '../infrastructure/playwright/helpers/accessibility'

test.describe('Accessibility smoke', () => {
  test('verifies basic page with axe', async ({ page }) => {
    await page.setContent(`
      <html lang="en">
        <head>
          <title>Accessibility smoke page</title>
        </head>
        <body>
          <main>
            <h1>Accessibility smoke page</h1>
            <p>Ensures axe checks are wired up in CI.</p>
            <form aria-label="Demo form">
              <label for="email">Email</label>
              <input id="email" name="email" type="email" aria-describedby="email-help" />
              <div id="email-help">We will not share your email.</div>
              <button type="submit">Submit</button>
            </form>
            <img
              alt="Placeholder graphic"
              src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="
            />
          </main>
        </body>
      </html>
    `)

    await assertA11y(page, { level: 'AA' })
  })
})
