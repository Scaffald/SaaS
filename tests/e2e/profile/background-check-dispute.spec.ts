import type { Route } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { Buffer } from 'buffer'

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

test.describe('Background check dispute workflow', () => {
  test('allows worker to dispute a completed background check', async ({ page }) => {
    const checkId = 'playwright-check-id'
    const packageId = 'playwright-package-id'
    const now = new Date()
    const createdAt = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString()
    const completedAt = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
    let checkStatus: string = 'completed_not_clear'
    const statusHistory: Array<Record<string, unknown>> = [
      {
        status: checkStatus,
        occurred_at: completedAt,
        actor: 'provider',
      },
    ]
    const disputes: Array<Record<string, unknown>> = []

    await page.route(/backgroundChecks\.listPackages/, (route) =>
      fulfillJson(route, [
        {
          id: packageId,
          slug: 'executive',
          display_name: 'Executive',
          description: null,
          provider_package_code: 'EXEC',
          platform_cost_cents: 5000,
          retail_cost_cents: 8500,
          estimated_completion_days: 5,
          metadata: {},
          components: [],
        },
      ])
    )

    await page.route(/backgroundChecks\.listChecks/, (route) =>
      fulfillJson(route, [
        {
          id: checkId,
          status: checkStatus,
          package: {
            id: packageId,
            display_name: 'Executive',
            slug: 'executive',
          },
          completed_at: completedAt,
          created_at: createdAt,
          expires_at: null,
          invited_at: null,
          provider_check_id: 'provider-check-123',
          findings: null,
          metadata: {},
        },
      ])
    )

    await page.route(/backgroundChecks\.getCheck/, (route) => {
      const url = new URL(route.request().url())
      const inputParam = url.searchParams.get('input')
      let requestedId: string | null = null
      if (inputParam) {
        try {
          const parsed = JSON.parse(decodeURIComponent(inputParam))
          requestedId = parsed?.['0']?.background_check_id ?? null
        } catch {
          requestedId = null
        }
      }

      if (requestedId !== checkId) {
        return fulfillJson(route, {
          check: null,
          documents: [],
        })
      }

      return fulfillJson(route, {
        check: {
          id: checkId,
          status: checkStatus,
          status_history: statusHistory,
          package_id: packageId,
          check_type_ids: [],
          provider_check_id: 'provider-check-123',
          summary: null,
          findings: null,
          component_statuses: [],
          metadata: {},
          created_at: createdAt,
          updated_at: new Date().toISOString(),
          expires_at: null,
          estimated_completion_date: null,
        },
        documents: [],
      })
    })

    await page.route(/backgroundChecks\.listDisputesForCheck/, (route) =>
      fulfillJson(route, disputes)
    )

    await page.route(/backgroundChecks\.createUploadUrl/, async (route) => {
      fulfillJson(route, {
        bucket: 'background-check-documents',
        storagePath: `${checkId}/evidence.pdf`,
        token: 'signed-upload-token',
        uploadUrl: 'https://storage.example.com/upload',
        expiresIn: 300,
      })
    })

    await page.route(/backgroundChecks\.submitDispute/, async (route) => {
      const payload = await route.request().postDataJSON()
      const input = (payload?.['0'] ?? {}) as Record<string, unknown>
      const disputeId = `dispute-${disputes.length + 1}`
      const created = new Date().toISOString()

      const requestData = {
        id: disputeId,
        dispute_reason: input.dispute_reason,
        dispute_details: input.dispute_details,
        supporting_documents: input.supporting_documents ?? [],
        status: 'pending',
        created_at: created,
        updated_at: created,
        resolved_at: null,
        resolution: null,
        resolution_notes: null,
      }

      disputes.unshift(requestData)
      checkStatus = 'disputed'
      statusHistory.push({
        status: 'disputed',
        occurred_at: created,
        actor: 'worker',
        notes: input.dispute_reason ?? null,
      })

      fulfillJson(route, {
        id: disputeId,
        status: 'pending',
        created_at: created,
      })
    })

    await page.route(/storage\/v1\/object\//, (route) =>
      route.fulfill({
        status: 200,
        body: '',
      })
    )

    await page.goto('/dashboard/profile/background-check')

    await expect(page.getByText(/background check dashboard/i)).toBeVisible()
    await expect(page.getByText(/executive/i)).toBeVisible()

    await page
      .getByRole('button', { name: /dispute/i })
      .first()
      .click()

    const dialog = page.getByRole('dialog', { name: /dispute background check/i })
    await expect(dialog).toBeVisible()

    await dialog.getByLabel(/what needs review/i).click()
    await page.getByRole('option', { name: /records contain inaccurate findings/i }).click()

    await dialog
      .getByLabel(/explain what’s incorrect/i)
      .fill('Automated test dispute describing inaccurate county records and requesting review.')

    const fileChooserPromise = page.waitForEvent('filechooser')
    await dialog.getByRole('button', { name: /choose file/i }).click()
    const fileChooser = await fileChooserPromise
    await fileChooser.setFiles({
      name: 'dispute-evidence.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 automated test evidence'),
    })

    await expect(dialog.getByText('dispute-evidence.pdf')).toBeVisible()

    await dialog.getByRole('button', { name: /submit dispute/i }).click()

    await expect(page.getByText(/dispute submitted/i)).toBeVisible()
    await expect(dialog.getByText(/waiting for review/i)).toBeVisible()
  })
})
