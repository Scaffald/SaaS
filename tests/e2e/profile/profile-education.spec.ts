import type { Route } from '@playwright/test'
import { expect, test } from '@playwright/test'

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

test.describe('Profile education management', () => {
  test.beforeEach(async ({ page }) => {
    let educationEntries = [
      {
        id: 'entry-1',
        institution_name: 'Catalog University',
        university_id: 'univ-1',
        is_verified: true,
        degree_type: 'Bachelor Degree',
        field_of_study: 'Mechanical Engineering',
        start_date: '2018-01-01',
        end_date: '2022-05-01',
        is_current: false,
        gpa: 3.6,
        description: 'Existing catalog education entry',
      },
    ]

    await page.route(/\/trpc\/profile\.getEducation(\?|$)/, (route) => {
      fulfillJson(route, educationEntries)
    })

    await page.route(/\/trpc\/profile\.getEducationLevel(\?|$)/, (route) => {
      fulfillJson(route, { education_level: 'Bachelor Degree' })
    })

    await page.route(/\/trpc\/profile\.getEducation\.invalidate/, (route) => {
      fulfillJson(route, null)
    })

    await page.route(/\/trpc\/profile\.getEducationLevel\.invalidate/, (route) => {
      fulfillJson(route, null)
    })

    await page.route(/\/trpc\/profile\.saveEducation/, async (route) => {
      const payload = await route.request().postDataJSON()
      const input = (payload?.['0'] ?? {}) as {
        education_entries?: Array<Record<string, unknown>>
      }

      const normalizedEntries =
        input.education_entries?.map((entry, index) => {
          const hasCatalog = typeof entry.university_id === 'string' && entry.university_id.length > 0
          const id =
            typeof entry.id === 'string' && entry.id.length > 0
              ? entry.id
              : `entry-${index + 1}`
          const degreeType =
            entry.degree_type === 'Other'
              ? (entry.custom_degree_type as string | undefined) ?? 'Other'
              : (entry.degree_type as string | undefined) ?? null

          return {
            ...entry,
            id,
            degree_type: degreeType,
            is_verified: hasCatalog,
          }
        }) ?? []

      educationEntries = normalizedEntries as typeof educationEntries

      fulfillJson(route, {
        success: true,
        education_entries: educationEntries,
      })
    })

    await page.route(/\/trpc\/profile\.saveEducation\.invalidate/, (route) => {
      fulfillJson(route, null)
    })

    await page.route(/\/trpc\/profile\.deleteEducation/, (route) => {
      fulfillJson(route, { success: true })
    })

    await page.route(/\/trpc\/profile\.deleteEducation\.invalidate/, (route) => {
      fulfillJson(route, null)
    })

    await page.route(/\/trpc\/office\.universities\.searchUniversities/, (route) => {
      fulfillJson(route, {
        universities: [
          {
            id: 'univ-1',
            name: 'Catalog University',
            country: 'United States',
            alpha_two_code: 'US',
            slug: 'catalog-university',
          },
          {
            id: 'univ-2',
            name: 'Playwright Technical Institute',
            country: 'United States',
            alpha_two_code: 'US',
            slug: 'playwright-technical-institute',
          },
        ],
      })
    })
  })

  test('edits catalog entry to manual with custom degree and saves', async ({ page }) => {
    await page.goto('/dashboard/profile/education')

    await expect(
      page.getByRole('heading', { name: 'Education Background', exact: true }),
    ).toBeVisible()

    await page.getByText("Can't find your institution? Enter it manually").click()

    const institutionInput = page.getByPlaceholder('Enter institution name')
    await institutionInput.fill('Manual Arts Academy')

    await page.getByRole('button', { name: 'Bachelor Degree' }).click()
    await page.getByRole('button', { name: 'Other' }).click()

    const customDegreeInput = page.getByPlaceholder('Specify degree type')
    await customDegreeInput.fill('International Diploma')

    await page.getByRole('checkbox', { name: 'Currently enrolled' }).check()

    await page.getByRole('button', { name: 'Save Changes' }).click()

    await expect(page.getByText('Education Saved')).toBeVisible()

    await expect(page.getByText('Manual Arts Academy')).toBeVisible()
    await expect(page.getByText('International Diploma')).toBeVisible()
    await expect(page.getByText('Pending verification')).toBeVisible()
    await expect(page.getByText('Current')).toBeVisible()
  })

  test('shows validation summary when attempting to save empty entry', async ({ page }) => {
    await page.goto('/dashboard/profile/education')

    await page.getByRole('button', { name: 'Add Education' }).click()
    await page.getByRole('button', { name: 'Save Changes' }).click()

    await expect(page.getByText('Please resolve the following issues:')).toBeVisible()
    await expect(page.getByText(/Institution name is required/)).toBeVisible()
    await expect(page.getByText(/Start date is required/)).toBeVisible()
  })
})

