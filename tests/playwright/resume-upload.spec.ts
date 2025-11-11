import { test, expect } from '@playwright/test'

const TEST_RESUME_CONTENT = 'Playwright test resume content.'
const TEST_RESUME_NAME = 'playwright-resume.pdf'

function createPdfBuffer(content: string): Buffer {
  const header = '%PDF-1.1\n'
  const body = `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length ${content.length + 73} >>\nstream\nBT /F1 12 Tf 72 120 Td (${content}) Tj ET\nendstream\nendobj\n5 0 obj\n<< /Type /Font /Subtype /Type1 /Name /F1 /BaseFont /Helvetica >>\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000010 00000 n \n0000000060 00000 n \n0000000115 00000 n \n0000000181 00000 n \n0000000290 00000 n \ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n360\n%%EOF`
  return Buffer.from(header + body, 'utf-8')
}

test.describe('Profile resume upload widget', () => {
  test('allows user to upload resume from sidebar widget', async ({ page }) => {
    const resumeBuffer = createPdfBuffer(TEST_RESUME_CONTENT)

    await page.goto('/dashboard/profile/general')

    const uploadButton = page.getByRole('button', { name: /upload resume/i })
    await expect(uploadButton).toBeVisible()

    const fileChooserPromise = page.waitForEvent('filechooser')
    await uploadButton.click()
    const fileChooser = await fileChooserPromise

    await fileChooser.setFiles({
      name: TEST_RESUME_NAME,
      mimeType: 'application/pdf',
      buffer: resumeBuffer,
    })

    await expect(page.getByText(/uploading resume/i)).toBeVisible()
    await expect(page.getByText(/parsing resume/i)).toBeVisible({ timeout: 120_000 })
  })
})
