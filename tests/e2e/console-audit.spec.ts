/**
 * Console Audit Spec – Browser Console and Network Error Collection
 *
 * Visits main app routes, captures console messages (errors, warnings) and network
 * errors, then writes results to docs/console-audit-YYYY-MM-DD.json and docs/console-audit.md.
 *
 * Run: pnpm exec playwright test tests/e2e/console-audit.spec.ts
 * Requires: Dev server running (pnpm web → http://localhost:8081).
 * Optional: tests/.auth/admin.json for protected routes (run auth setup first).
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'
import { test, expect } from '@playwright/test'
import { signInAsAdmin } from '../infrastructure/playwright/playwright-helpers/playwright-helpers/auth'

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8081'

/** Public routes – no auth */
const PUBLIC_ROUTES = ['/', '/auth', '/auth/verify', '/auth/success']

/** Dashboard routes – require auth. Covers all static dashboard pages. */
const DASHBOARD_ROUTES = [
  '/dashboard',
  '/workers/map',
  '/profile',
  '/profile/general',
  '/profile/education',
  '/profile/experience',
  '/profile/employment',
  '/profile/skills',
  '/profile/certifications',
  '/profile/resume',
  '/profile/background-check',
  '/workers',
  '/jobs',
  '/employers',
  '/employers/create',
  '/employers/logs',
  '/employers/logs/create',
  '/assessments',
  '/assessments/pulse',
  '/assessments/ipip',
  '/assessments/riasec',
  '/assessments/occupation',
  '/dashboard/settings',
  '/employers/teams',
  '/dashboard/news',
  '/org',
  '/org/invitations',
  '/communities',
  '/communities/connections',
]

/** Dynamic dashboard routes (require valid IDs). Audit manually with real IDs or add test fixture IDs. */
// const DASHBOARD_DYNAMIC_ROUTES = ['/workers/[id]', '/employers/[id]', '/employers/logs/[workLogId]', '/dashboard/users/[id]']

/** Office routes – require admin */
const OFFICE_ROUTES = ['/office', '/office/jobs', '/office/applications', '/office/cms']

interface ConsoleEntry {
  type: string
  text: string
  location?: string
  timestamp: number
}

interface NetworkError {
  status: number
  url: string
  method: string
}

interface RouteAudit {
  path: string
  group: 'public' | 'dashboard' | 'office'
  errors: ConsoleEntry[]
  warnings: ConsoleEntry[]
  networkErrors: NetworkError[]
  ok: boolean
}

function isLikelyNoise(msg: ConsoleEntry): boolean {
  const t = msg.text
  if (msg.type !== 'error' && msg.type !== 'warning') return true
  if (/React DevTools|HMR|\[vite\]|\[webpack\]/i.test(t)) return true
  if (/supabase.*not configured|Missing Supabase/i.test(t)) return true
  if (/does not recognize the.*prop on a DOM element/i.test(t)) return true
  if (/\[TEST AUTH\]/i.test(t)) return true
  // Browser logs failed fetches as console.error; allowlist so we only count JS/React errors
  if (/Failed to load resource:.*status of \d+/.test(t)) return true
  if (/\[sentry\] DSN not configured/i.test(t)) return true
  if (/Animated:.*useNativeDriver.*not supported/i.test(t)) return true
  if (/Route.*missing the required default export/i.test(t)) return true
  if (/shadow\*.*deprecated.*boxShadow/i.test(t)) return true
  if (/props\.pointerEvents is deprecated/i.test(t)) return true
  if (/Image: style\.resizeMode is deprecated/i.test(t)) return true
  if (/Error fetching profiles.*PGRST002|Could not query the database for the schema cache/i.test(t)) return true
  return false
}

test.describe('Console audit', () => {
  test('collect console and network output for all main routes', async ({ page }) => {
    test.setTimeout(10 * 60 * 1000) // 10 min – many routes (public + dashboard + office)
    const routeLogs: ConsoleEntry[] = []
    const routeNetwork: NetworkError[] = []

    const pushLog = (entry: ConsoleEntry) => {
      if (!isLikelyNoise(entry)) routeLogs.push(entry)
    }

    page.on('console', (msg) => {
      const loc = msg.location()
      pushLog({
        type: msg.type(),
        text: msg.text(),
        location: loc ? `${loc.url}:${loc.lineNumber}:${loc.columnNumber}` : undefined,
        timestamp: Date.now(),
      })
    })

    page.on('pageerror', (err) => {
      pushLog({
        type: 'EXCEPTION',
        text: `${err.name}: ${err.message}`,
        location: err.stack,
        timestamp: Date.now(),
      })
    })

    page.on('response', (response) => {
      const status = response.status()
      if (status >= 400) {
        const url = response.url()
        if (!url.startsWith('data:') && !url.includes('favicon')) {
          routeNetwork.push({
            status,
            url,
            method: response.request().method(),
          })
        }
      }
    })

    const audits: RouteAudit[] = []

    async function auditRoute(path: string, group: RouteAudit['group']) {
      routeLogs.length = 0
      routeNetwork.length = 0

      await page.goto(`${BASE_URL}${path}`, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {})
      await page.waitForTimeout(1500)

      const errors = routeLogs.filter((e) => e.type === 'error' || e.type === 'EXCEPTION')
      const warnings = routeLogs.filter((e) => e.type === 'warning')

      audits.push({
        path,
        group,
        errors: [...errors],
        warnings: [...warnings],
        networkErrors: [...routeNetwork],
        ok: errors.length === 0,
      })
    }

    for (const path of PUBLIC_ROUTES) {
      await auditRoute(path, 'public')
    }

    const adminAuthExists = existsSync('tests/.auth/admin.json')
    if (adminAuthExists) {
      try {
        await signInAsAdmin(page)
        await page.waitForTimeout(1000)
      } catch {
        // continue without auth; protected routes may redirect to login
      }
    }

    for (const path of DASHBOARD_ROUTES) {
      await auditRoute(path, 'dashboard')
    }

    for (const path of OFFICE_ROUTES) {
      await auditRoute(path, 'office')
    }

    const date = new Date().toISOString().slice(0, 10)
    const docsDir = join(process.cwd(), 'docs')
    if (!existsSync(docsDir)) {
      mkdirSync(docsDir, { recursive: true })
    }

    const jsonPath = join(docsDir, `console-audit-${date}.json`)
    writeFileSync(jsonPath, JSON.stringify({ date, audits }, null, 2), 'utf-8')

    const totalErrors = audits.reduce((s, a) => s + a.errors.length, 0)
    const totalWarnings = audits.reduce((s, a) => s + a.warnings.length, 0)
    const routesWithErrors = audits.filter((a) => a.errors.length > 0)

    let md = `# Console Audit – ${date}\n\n`
    md += `- **Total routes audited:** ${audits.length}\n`
    md += `- **Routes with console errors:** ${routesWithErrors.length}\n`
    md += `- **Total console errors:** ${totalErrors}\n`
    md += `- **Total console warnings:** ${totalWarnings}\n\n`
    md += '## Per-route summary\n\n'
    md += '| Route | Group | Errors | Warnings | Network 4xx/5xx | OK |\n'
    md += '|-------|-------|--------|----------|----------------|----|\n'
    for (const a of audits) {
      md += `| ${a.path} | ${a.group} | ${a.errors.length} | ${a.warnings.length} | ${a.networkErrors.length} | ${a.ok ? 'Yes' : 'No'} |\n`
    }
    md += '\n## Errors by route\n\n'
    for (const a of audits) {
      if (a.errors.length === 0) continue
      md += `### ${a.path}\n\n`
      for (const e of a.errors) {
        md += `- **${e.type}:** ${e.text.replace(/\n/g, ' ').slice(0, 200)}\n`
        if (e.location) md += '  - `' + e.location + '`\n'
      }
      md += '\n'
    }
    md += '\n## Warnings by route\n\n'
    for (const a of audits) {
      if (a.warnings.length === 0) continue
      md += `### ${a.path}\n\n`
      for (const w of a.warnings) {
        md += `- ${w.text.replace(/\n/g, ' ').slice(0, 200)}\n`
      }
      md += '\n'
    }

    const mdPath = join(docsDir, 'console-audit.md')
    writeFileSync(mdPath, md, 'utf-8')

    // Append static triage/fixes section (not overwritten by next run)
    const triageSection = `

## Triage and allowlist

- **Allowlisted (not reported as errors):** Failed to load resource (browser network errors), Sentry DSN not configured, useNativeDriver on web, Route missing default export, shadow*/pointerEvents/resizeMode deprecations, PGRST002 schema cache errors.
- **Fixes applied:** Expo route default exports (\`_FloatingToggles.tsx\`, \`_LegalDocumentLayout.tsx\`); Lucide icon size tokens replaced with \`getIconSize('md'|'lg')\` in discover (InternalJobCard, EmployerCard, discover-workers-right, OrganizationCard, JobCard, AddOrganizationWidget). Dashboard audit 2026-03-06: profile education tRPC → \`useSearchUniversities\` (office-universities-sdk-hooks); profile skills SVG size → \`getIconSize('lg')\` in SkillCompletionProgress. Console cleanup: Sentry no log when DSN not configured in \`__DEV__\`; Card/Chip/SaaSNavigation/SaaSSectionHeader use \`boxShadow\` only on web (no shadow*); \`pointerEvents\` moved to \`style.pointerEvents\` in Slider, DatePickerDay, NavIconButton, LoadingOverlay, ToastContainer, SliderTooltip, NotificationListItem, discover-worker-profile-screen.
`
    writeFileSync(mdPath, md + triageSection, 'utf-8')

    expect(audits.length).toBeGreaterThan(0)
  })
})
