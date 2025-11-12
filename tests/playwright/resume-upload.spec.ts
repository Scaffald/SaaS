import { Buffer } from 'buffer'

import type { Route } from '@playwright/test'
import { expect, test } from '@playwright/test'

const TEST_RESUME_CONTENT = 'Playwright test resume content.'
const TEST_RESUME_NAME = 'playwright-resume.pdf'
const RESUME_ID = 'resume-e2e-playwright'

function buildTrpcResponse<T>(data: T) {
  return [
    {
      result: {
        data,
      },
    },
  ]
}

function fulfillJson(route: Route, data: unknown) {
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(buildTrpcResponse(data)),
  })
}

function createPdfBuffer(content: string): Buffer {
  const header = '%PDF-1.1\n'
  const body = `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length ${content.length + 73} >>\nstream\nBT /F1 12 Tf 72 120 Td (${content}) Tj ET\nendstream\nendobj\n5 0 obj\n<< /Type /Font /Subtype /Type1 /Name /F1 /BaseFont /Helvetica >>\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000010 00000 n \n0000000060 00000 n \n0000000115 00000 n \n0000000181 00000 n \n0000000290 00000 n \ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n360\n%%EOF`
  return Buffer.from(header + body, 'utf-8')
}

test.describe('Profile resume import workflow', () => {
  let hasUploaded = false
  let uploadCalls = 0

  test.beforeEach(async ({ page }) => {
    hasUploaded = false
    uploadCalls = 0

    const now = new Date().toISOString()
    const wizardState = {
      id: 'wizard-e2e',
      resumeId: RESUME_ID,
      userId: 'user-e2e',
      currentStep: 0,
      completedSteps: [],
      parsedData: {},
      errors: [
        { section: 'general', message: 'Resume parsing is disabled because the OpenAI API key is not configured. Please fill in this section manually.' },
        { section: 'experience', message: 'Resume parsing is disabled because the OpenAI API key is not configured. Please fill in this section manually.' },
        { section: 'education', message: 'Resume parsing is disabled because the OpenAI API key is not configured. Please fill in this section manually.' },
        { section: 'skills', message: 'Resume parsing is disabled because the OpenAI API key is not configured. Please fill in this section manually.' },
        { section: 'certifications', message: 'Resume parsing is disabled because the OpenAI API key is not configured. Please fill in this section manually.' },
        { section: 'employment', message: 'Resume parsing is disabled because the OpenAI API key is not configured. Please fill in this section manually.' },
      ],
      startedAt: now,
      updatedAt: now,
      completedAt: null,
    }

    await page.route(/\/trpc\/resume\.hasUploaded/, (route) =>
      fulfillJson(route, { hasUploaded }),
    )

    await page.route(/\/trpc\/resume\.hasUploaded\.invalidate/, (route) =>
      fulfillJson(route, null),
    )

    await page.route(/\/trpc\/resume\.upload/, async (route) => {
      uploadCalls += 1
      const payload = await route.request().postDataJSON()
      const input = (payload?.['0'] ?? {}) as Record<string, unknown>
      hasUploaded = true

      fulfillJson(route, {
        success: true,
        resumeId: RESUME_ID,
        filePath: `resumes/${input?.fileName ?? 'resume.pdf'}`,
      })
    })

    await page.route(/\/trpc\/resume\.parse/, async (route) => {
      fulfillJson(route, {
        success: true,
        parsedData: {},
        errors: wizardState.errors,
      })
    })

    await page.route(/\/trpc\/resume\.getWizardState/, (route) =>
      fulfillJson(route, wizardState),
    )

    await page.route(/\/trpc\/resume\.saveSection/, (route) =>
      fulfillJson(route, { success: true }),
    )

    await page.route(/\/trpc\/resume\.updateProgress/, (route) =>
      fulfillJson(route, { success: true }),
    )

    await page.route(/\/trpc\/profile\.getGeneral/, (route) =>
      fulfillJson(route, {
        first_name: null,
        last_name: null,
        about: null,
        avatar_path: null,
      }),
    )

    await page.route(/\/trpc\/profile\.getExperience/, (route) =>
      fulfillJson(route, []),
    )

    await page.route(/\/trpc\/profile\.getEducation/, (route) =>
      fulfillJson(route, []),
    )

    await page.route(/\/trpc\/profile\.skillsMultiTaxonomy\.getUserSkills/, (route) =>
      fulfillJson(route, { skills: [] }),
    )

    await page.route(/\/trpc\/profile\.certifications\.getUserCertificationTree/, (route) =>
      fulfillJson(route, {
        depth0: [],
        depth1ByParent: {},
        depth2ByParent: {},
      }),
    )

    await page.route(/\/trpc\/profile\.getEmployment/, (route) =>
      fulfillJson(route, null),
    )
  })

  test('uploads a resume, triggers AI parsing, and redirects to review flow', async ({ page }) => {
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
    await expect(page.getByText(/parsing resume/i)).toBeVisible()

    await page.waitForURL(`**/dashboard/profile/resume/review?resumeId=${RESUME_ID}`)

    await page.goto('/dashboard/profile/general')
    await expect(page.getByRole('button', { name: /upload resume/i })).toHaveCount(0)
    expect(uploadCalls).toBe(1)
  })

  test('shows validation error for files larger than 1MB without calling upload', async ({ page }) => {
    await page.goto('/dashboard/profile/general')

    const uploadButton = page.getByRole('button', { name: /upload resume/i })
    const fileChooserPromise = page.waitForEvent('filechooser')
    await uploadButton.click()
    const fileChooser = await fileChooserPromise

    const oversizedBuffer = Buffer.alloc(1024 * 1024 + 1, 0)
    await fileChooser.setFiles({
      name: 'oversized-resume.pdf',
      mimeType: 'application/pdf',
      buffer: oversizedBuffer,
    })

    await expect(
      page.getByText('File size exceeds 1MB limit. Please upload a smaller file.'),
    ).toBeVisible()
    expect(uploadCalls).toBe(0)
  })

  test('rejects unsupported file types with inline error message', async ({ page }) => {
    await page.goto('/dashboard/profile/general')

    const uploadButton = page.getByRole('button', { name: /upload resume/i })
    const fileChooserPromise = page.waitForEvent('filechooser')
    await uploadButton.click()
    const fileChooser = await fileChooserPromise

    await fileChooser.setFiles({
      name: 'resume.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Unsupported resume format.'),
    })

    await expect(
      page.getByText('Please upload a PDF or Word document.'),
    ).toBeVisible()
    expect(uploadCalls).toBe(0)
  })
})
