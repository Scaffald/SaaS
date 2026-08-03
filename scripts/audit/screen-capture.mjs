#!/usr/bin/env node
/**
 * Point-in-time screen capture of scaffald.com (or a local dev server)
 * at BOTH desktop and mobile viewports. Walks every route, screenshots each
 * full page, writes a manifest. Auth is driven once through the login UI and
 * the resulting storageState is reused for both viewport passes.
 *
 * Adapted from scripts/audit/ui-sweep.mjs.
 *
 * Usage (from repo root, where node_modules is installed):
 *
 *   # against production (default) — set the account password:
 *   AUDIT_PASSWORD='your-password' node scripts/audit/screen-capture.mjs
 *
 *   # against a local Expo Web dev server:
 *   AUDIT_BASE_URL=http://localhost:8081 AUDIT_PASSWORD='password123' \
 *     node scripts/audit/screen-capture.mjs
 *
 *   # watch it run (non-headless):
 *   AUDIT_HEADFUL=1 AUDIT_PASSWORD='...' node scripts/audit/screen-capture.mjs
 *
 * Output:
 *   screenshots/2026-06-11-app-scaffald/desktop/{group}/{name}.png
 *   screenshots/2026-06-11-app-scaffald/mobile/{group}/{name}.png
 *   screenshots/2026-06-11-app-scaffald/manifest.json
 */

import { chromium, devices } from 'playwright'
import { existsSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import { dirname, resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { homedir } from 'node:os'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '..', '..')

// ---------- Config ----------
const BASE_URL = process.env.AUDIT_BASE_URL || 'https://scaffald.com'
const OUT_DIR =
  process.env.AUDIT_OUT ||
  resolve(REPO_ROOT, 'screenshots/2026-06-11-app-scaffald')
const HEADLESS = process.env.AUDIT_HEADFUL === '1' // default headful (interactive login)
const EMAIL = process.env.AUDIT_EMAIL || 'clay@unicorn.love'
const PASSWORD = process.env.AUDIT_PASSWORD || '' // set to use password login instead of interactive
// Cached session so re-runs skip login. Delete this file to force a fresh sign-in.
const STATE_FILE =
  process.env.AUDIT_STORAGE_STATE || join(OUT_DIR, '.auth-state.json')

// Which browser engine to drive. All are Chromium-based so rendering matches.
//   brave  (default) → /Applications/Brave Browser.app  (falls back to bundled Chromium if absent)
//   chrome           → /Applications/Google Chrome.app
//   chromium         → Playwright's bundled Chromium
const BROWSER = (process.env.AUDIT_BROWSER || 'brave').toLowerCase()

// Optional: reuse an EXISTING browser profile that's already logged into
// Scaffald, so no sign-in is needed. Set AUDIT_BRAVE_PROFILE to the profile's
// user-data dir, or to "default"/"1" for Brave's standard macOS location.
// NOTE: the chosen browser must be fully QUIT first (the profile is locked
// while it's running).
let BRAVE_PROFILE_DIR = process.env.AUDIT_BRAVE_PROFILE || ''
if (BRAVE_PROFILE_DIR === '1' || BRAVE_PROFILE_DIR.toLowerCase() === 'default') {
  BRAVE_PROFILE_DIR = join(
    homedir(),
    'Library/Application Support/BraveSoftware/Brave-Browser',
  )
}

// Resolve the browser executable for the chosen engine (undefined = bundled).
function resolveExecutablePath() {
  if (BROWSER === 'chromium') return undefined
  const candidates = {
    brave: [
      '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
      join(homedir(), 'Applications/Brave Browser.app/Contents/MacOS/Brave Browser'),
    ],
    chrome: ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'],
  }[BROWSER] || []
  for (const p of candidates) if (existsSync(p)) return p
  console.log(`  ⚠ ${BROWSER} binary not found — using Playwright's bundled Chromium.`)
  return undefined
}
const EXECUTABLE_PATH = resolveExecutablePath()

// ---------- Viewport profiles ----------
const DESKTOP = {
  label: 'desktop',
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
  isMobile: false,
  hasTouch: false,
}

const IPHONE = {
  label: 'mobile',
  ...(devices['iPhone 14'] || {
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  }),
}

// ---------- Route inventory ----------
// Derived from apps/scaffald/app/ (expo-router; group folders in parens are
// stripped from the URL). Covers every STATIC screen including the full admin
// /office tree. Dynamic routes ([id]/[slug]/[token]) are resolved separately
// via click-through below. Auth /callback is a redirect handler, not a screen,
// so it's intentionally omitted.
const ROUTES = [
  { group: 'root', path: '/', name: 'index' },

  // auth (public)
  { group: 'auth', path: '/auth', name: 'login' },
  { group: 'auth', path: '/auth/terms', name: 'terms' },
  { group: 'auth', path: '/auth/privacy', name: 'privacy' },
  { group: 'auth', path: '/auth/success', name: 'success' },
  { group: 'auth', path: '/auth/verify', name: 'verify' },

  // protected — top level
  { group: 'protected', path: '/search', name: 'search' },
  { group: 'protected', path: '/onboarding', name: 'onboarding' },

  // dashboard
  { group: 'dashboard', path: '/dashboard', name: 'home' },
  { group: 'dashboard', path: '/dashboard/news', name: 'news' },
  { group: 'dashboard', path: '/dashboard/notifications', name: 'notifications' },
  { group: 'dashboard', path: '/dashboard/settings', name: 'settings' },
  { group: 'dashboard', path: '/dashboard/analytics', name: 'analytics' },
  { group: 'dashboard', path: '/dashboard/analytics/engagement', name: 'analytics-engagement' },
  { group: 'dashboard', path: '/dashboard/analytics/search', name: 'analytics-search' },
  { group: 'dashboard', path: '/dashboard/analytics/visibility', name: 'analytics-visibility' },

  // assessments
  { group: 'assessments', path: '/assessments', name: 'overview' },
  { group: 'assessments', path: '/assessments/pulse', name: 'pulse' },
  { group: 'assessments', path: '/assessments/ipip', name: 'personality-ipip' },
  { group: 'assessments', path: '/assessments/ipip/results', name: 'personality-results' },
  { group: 'assessments', path: '/assessments/riasec', name: 'career-interests-riasec' },
  { group: 'assessments', path: '/assessments/occupation', name: 'occupation-preferences' },
  { group: 'assessments', path: '/assessments/career-explorer', name: 'career-explorer' },

  // communities
  { group: 'communities', path: '/communities', name: 'list' },
  { group: 'communities', path: '/communities/connections', name: 'connections' },
  { group: 'communities', path: '/communities/bookmarks', name: 'bookmarks' },
  { group: 'communities', path: '/communities/reputation', name: 'reputation' },

  // workers
  { group: 'workers', path: '/workers', name: 'list' },
  { group: 'workers', path: '/workers/map', name: 'map' },

  // jobs
  { group: 'jobs', path: '/jobs', name: 'list' },
  { group: 'jobs', path: '/jobs/applications', name: 'applications' },
  { group: 'jobs', path: '/jobs/my-listings', name: 'my-listings' },

  // employers
  { group: 'employers', path: '/employers', name: 'list' },
  { group: 'employers', path: '/employers/create', name: 'create' },
  { group: 'employers', path: '/employers/invitations', name: 'invitations' },
  { group: 'employers', path: '/employers/org', name: 'org' },
  { group: 'employers', path: '/employers/organizations', name: 'organizations' },
  { group: 'employers', path: '/employers/organizations/create', name: 'organizations-create' },
  { group: 'employers', path: '/employers/logs', name: 'logs' },
  { group: 'employers', path: '/employers/logs/create', name: 'logs-create' },
  { group: 'employers', path: '/employers/teams', name: 'teams' },
  { group: 'employers', path: '/employers/teams/invitations', name: 'teams-invitations' },

  // profile (deep tree)
  { group: 'profile', path: '/profile', name: 'overview' },
  { group: 'profile', path: '/profile/general', name: 'general' },
  { group: 'profile', path: '/profile/experience', name: 'experience' },
  { group: 'profile', path: '/profile/employment', name: 'employment' },
  { group: 'profile', path: '/profile/education', name: 'education' },
  { group: 'profile', path: '/profile/certifications', name: 'certifications' },
  { group: 'profile', path: '/profile/skills', name: 'skills' },
  { group: 'profile', path: '/profile/resume', name: 'resume' },
  { group: 'profile', path: '/profile/resume/review', name: 'resume-review' },
  { group: 'profile', path: '/profile/verification', name: 'verification' },
  { group: 'profile', path: '/profile/id-verification', name: 'id-verification' },
  { group: 'profile', path: '/profile/import-review', name: 'import-review' },
  { group: 'profile', path: '/profile/background-check', name: 'background-check' },
  { group: 'profile', path: '/profile/background-check/initiate', name: 'background-check-initiate' },

  // public
  { group: 'public', path: '/teams/invitations/accept', name: 'team-invitation-accept' },

  // ── admin (require an admin/staff account — may redirect or stay on a
  //    Loading state for non-admin users) ──
  { group: 'admin', path: '/developers/register', name: 'developers-register' },
  { group: 'admin', path: '/oauth/consent', name: 'oauth-consent' },

  // admin — office
  { group: 'office', path: '/office', name: 'home' },
  { group: 'office', path: '/office/api-keys', name: 'api-keys' },
  { group: 'office', path: '/office/applications', name: 'applications' },
  { group: 'office', path: '/office/payments', name: 'payments' },
  { group: 'office', path: '/office/transactions', name: 'transactions' },
  { group: 'office', path: '/office/violations', name: 'violations' },
  { group: 'office', path: '/office/storage', name: 'storage' },
  { group: 'office', path: '/office/webhooks', name: 'webhooks' },
  { group: 'office', path: '/office/webhooks/create', name: 'webhooks-create' },
  { group: 'office', path: '/office/oauth-apps', name: 'oauth-apps' },
  { group: 'office', path: '/office/communities/verification', name: 'communities-verification' },

  // admin — office / ATS
  { group: 'office-ats', path: '/office/ats', name: 'index' },
  { group: 'office-ats', path: '/office/ats/admin', name: 'admin' },
  { group: 'office-ats', path: '/office/ats/checks', name: 'checks' },
  { group: 'office-ats', path: '/office/ats/id-verifications', name: 'id-verifications' },
  { group: 'office-ats', path: '/office/ats/metrics', name: 'metrics' },
  { group: 'office-ats', path: '/office/ats/request', name: 'request' },
  { group: 'office-ats', path: '/office/ats/scheduling', name: 'scheduling' },
  { group: 'office-ats', path: '/office/ats/self-schedule', name: 'self-schedule' },

  // admin — office / CMS
  { group: 'office-cms', path: '/office/cms', name: 'index' },
  { group: 'office-cms', path: '/office/cms/jobs', name: 'jobs' },
  { group: 'office-cms', path: '/office/cms/jobs/create', name: 'jobs-create' },
  { group: 'office-cms', path: '/office/cms/organizations', name: 'organizations' },
  { group: 'office-cms', path: '/office/cms/organizations/create', name: 'organizations-create' },
  { group: 'office-cms', path: '/office/cms/projects', name: 'projects' },
  { group: 'office-cms', path: '/office/cms/projects/create', name: 'projects-create' },
  { group: 'office-cms', path: '/office/cms/teams', name: 'teams' },
  { group: 'office-cms', path: '/office/cms/teams/create', name: 'teams-create' },
  { group: 'office-cms', path: '/office/cms/universities', name: 'universities' },
  { group: 'office-cms', path: '/office/cms/universities/create', name: 'universities-create' },
  { group: 'office-cms', path: '/office/cms/workers', name: 'workers' },

  // admin — office / compliance, integrations, settings
  { group: 'office-misc', path: '/office/compliance/eeo-reports', name: 'compliance-eeo-reports' },
  { group: 'office-misc', path: '/office/compliance/project-hiring', name: 'compliance-project-hiring' },
  { group: 'office-misc', path: '/office/integrations/background-checks', name: 'integrations-background-checks' },
  { group: 'office-misc', path: '/office/integrations/hris', name: 'integrations-hris' },
  { group: 'office-misc', path: '/office/settings/geographic', name: 'settings-geographic' },
  { group: 'office-misc', path: '/office/settings/stripe', name: 'settings-stripe' },
]

// Dynamic routes are visited via click-through after their parent list loads.
// Skipped automatically if the list is empty (no element to click).
const DYNAMIC_ROUTES = [
  {
    group: 'workers',
    parentPath: '/workers',
    name: 'detail-first',
    waitForSelector: 'a[href^="/workers/"], [data-testid="worker-card"]',
    clickFirst: 'a[href^="/workers/"], [data-testid="worker-card"] a, [data-testid="worker-card"]',
  },
  {
    group: 'jobs',
    parentPath: '/jobs',
    name: 'detail-first',
    waitForSelector: '[data-testid="job-card"], a[href^="/jobs/"]',
    clickFirst: '[data-testid="job-card"] a, a[href^="/jobs/"]',
  },
]

// ---------- Helpers ----------
function ensureDir(p) {
  if (!existsSync(p)) mkdirSync(p, { recursive: true })
}

async function settle(page) {
  await page.waitForLoadState('domcontentloaded')
  try {
    await page.waitForLoadState('networkidle', { timeout: 5000 })
  } catch {}
  // Wait for the app's "Loading..." indicator to clear (auth hydration / route
  // resolution). Without this, screenshots can fire mid-load.
  try {
    await page.waitForFunction(
      () => !document.body.innerText.includes('Loading...'),
      null,
      { timeout: 25000 },
    )
  } catch {}
  // Let URL settle if the app does post-mount redirects.
  let lastUrl = page.url()
  for (let i = 0; i < 8; i++) {
    await page.waitForTimeout(250)
    const now = page.url()
    if (now === lastUrl) break
    lastUrl = now
  }
  // Give data fetches time to resolve so skeletons clear.
  await page.waitForTimeout(3000)
}

// ---------- Auth ----------
// A storageState is only "authed" if it carries the Supabase auth-token (with
// an access_token) for the app origin. Anything else (cookie-consent only,
// mid-OAuth state, etc.) means we are NOT logged in and every protected route
// will bounce to /auth — which is the failure we explicitly guard against.
function stateHasAuth(state) {
  try {
    for (const o of state.origins || []) {
      for (const e of o.localStorage || []) {
        if (/auth-token/i.test(e.name) && e.value && e.value.includes('access_token')) {
          return true
        }
      }
    }
  } catch {}
  return false
}

// Poll the live page until a real Supabase session exists on the app origin.
// This is the ONLY reliable "logged in" signal: waiting for the URL to leave
// /auth is wrong because OAuth detours through accounts.google.com (whose path
// isn't /auth) and would falsely report success mid-redirect.
async function waitForRealSession(page, timeoutMs) {
  const appHost = new URL(BASE_URL).host
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    await page.waitForTimeout(1000)
    let onApp = false
    try {
      onApp = new URL(page.url()).host === appHost
    } catch {}
    if (!onApp) continue // still on the OAuth provider / elsewhere
    let authed = false
    try {
      authed = await page.evaluate(() => {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i)
          if (/auth-token/i.test(k)) {
            const v = localStorage.getItem(k)
            if (v && v.includes('access_token')) return true
          }
        }
        return false
      })
    } catch {}
    if (authed) return true
  }
  return false
}

// Resolve a Playwright storageState, in priority order:
//   1. Reuse a cached state file from a previous run — only if it's really authed.
//   2. Password login, if AUDIT_PASSWORD is set.
//   3. Interactive: open a real browser window, let the user sign in (Google
//      OAuth, magic link, whatever), then capture the session.
// The resolved state is written to STATE_FILE so subsequent runs are instant.
async function resolveStorageState(browser) {
  if (existsSync(STATE_FILE)) {
    try {
      const cached = JSON.parse(readFileSync(STATE_FILE, 'utf8'))
      if (stateHasAuth(cached)) {
        console.log(`  ✓ reusing cached session: ${STATE_FILE}`)
        return cached
      }
      console.log('  ⚠ cached session has no auth token — discarding and signing in again.')
    } catch {
      console.log('  ⚠ cached session unreadable — discarding and signing in again.')
    }
    rmSync(STATE_FILE, { force: true })
  }

  // Profile-reuse: open the user's existing (already-logged-in) browser profile
  // and lift its session — no sign-in needed. The browser must be quit first.
  if (BRAVE_PROFILE_DIR) {
    console.log(`  using existing browser profile: ${BRAVE_PROFILE_DIR}`)
    let ctx
    try {
      ctx = await chromium.launchPersistentContext(BRAVE_PROFILE_DIR, {
        headless: false,
        executablePath: EXECUTABLE_PATH,
        viewport: { width: 1280, height: 800 },
        baseURL: BASE_URL,
      })
    } catch (err) {
      throw new Error(
        `Could not open profile ${BRAVE_PROFILE_DIR}: ${err.message}\n` +
          '  → Make sure the browser is fully QUIT (the profile is locked while it runs).',
      )
    }
    const page = ctx.pages()[0] || (await ctx.newPage())
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'commit', timeout: 30000 })
    await settle(page)
    if (new URL(page.url()).pathname.startsWith('/auth')) {
      console.log('  this profile is not signed in — complete sign-in in the window...')
      const ok = await waitForRealSession(page, 300000)
      if (!ok) {
        await ctx.close()
        throw new Error('Sign-in not detected in the profile window. Nothing captured.')
      }
    }
    const state = await ctx.storageState()
    await ctx.close()
    if (!stateHasAuth(state)) {
      throw new Error('Profile carried no Supabase session — aborting.')
    }
    ensureDir(dirname(STATE_FILE))
    writeFileSync(STATE_FILE, JSON.stringify(state))
    console.log(`  ✓ session lifted from profile → ${STATE_FILE}`)
    return state
  }

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    baseURL: BASE_URL,
  })
  const page = await context.newPage()
  await page.goto(`${BASE_URL}/auth`, { waitUntil: 'commit', timeout: 30000 })
  await page.waitForLoadState('domcontentloaded')

  // Accept cookies if a banner appears.
  try {
    const acceptCookies = page
      .locator('button:has-text("Accept"), [role="button"]:has-text("Accept")')
      .first()
    await acceptCookies.waitFor({ timeout: 3000 })
    await acceptCookies.click()
    await page.waitForTimeout(300)
  } catch {}

  if (PASSWORD) {
    console.log('  signing in with password...')
    const emailInput = page
      .locator('input[type="email"], input[autocomplete="email"], input[placeholder*="mail" i]')
      .first()
    await emailInput.waitFor({ timeout: 15000 })
    await emailInput.fill(EMAIL)
    await page.getByText('Sign in with password', { exact: true }).first().click()
    const passwordInput = page.locator('input[type="password"]').first()
    await passwordInput.waitFor({ timeout: 5000 })
    await passwordInput.fill(PASSWORD)
    await page.getByText('I agree to the').first().click()
    await page.getByText('Sign in', { exact: true }).first().click()
  } else {
    console.log(
      '\n  ┌──────────────────────────────────────────────────────────────┐\n' +
        '  │  Please sign in in the browser window that just opened.        │\n' +
        '  │  (Google sign-in, magic link, whatever you normally use.)      │\n' +
        '  │  Capture starts automatically once you reach the app.          │\n' +
        '  └──────────────────────────────────────────────────────────────┘\n',
    )
  }

  // Wait for a REAL session (Supabase token on the app origin), not just a URL
  // change. Interactive sign-in gets 5 minutes; password login 60s.
  const ok = await waitForRealSession(page, PASSWORD ? 60000 : 300000)
  if (!ok) {
    await context.close()
    throw new Error(
      'Sign-in not detected — no Supabase session on ' +
        new URL(BASE_URL).host +
        '. Nothing was captured. Re-run and complete the login in the opened window.',
    )
  }
  await settle(page)
  const state = await context.storageState()
  await context.close()

  if (!stateHasAuth(state)) {
    throw new Error('Captured a session but it has no auth token — aborting so we do not screenshot the login page for every route.')
  }

  ensureDir(dirname(STATE_FILE))
  writeFileSync(STATE_FILE, JSON.stringify(state))
  console.log(`  ✓ session captured → ${STATE_FILE}`)
  return state
}

// ---------- Capture ----------
async function captureRoute(page, route, device, manifest) {
  const outFile = join(OUT_DIR, device.label, route.group, `${route.name}.png`)
  ensureDir(dirname(outFile))
  const url = `${BASE_URL}${route.path}`
  console.log(`    → [${device.label}] ${route.path}`)
  try {
    const res = await page.goto(url, { waitUntil: 'commit', timeout: 30000 })
    await settle(page)
    await page.screenshot({ path: outFile, fullPage: true })
    manifest.push({
      viewport: device.label,
      group: route.group,
      name: route.name,
      path: route.path,
      url,
      screenshot: outFile.replace(OUT_DIR + '/', ''),
      finalUrl: page.url(),
      status: res?.status() ?? null,
      capturedAt: new Date().toISOString(),
    })
  } catch (err) {
    manifest.push({
      viewport: device.label,
      group: route.group,
      name: route.name,
      path: route.path,
      url,
      error: err.message,
      capturedAt: new Date().toISOString(),
    })
    console.error(`      ✗ ${err.message}`)
  }
}

async function captureDynamicRoute(page, dyn, device, manifest) {
  console.log(`    → [${device.label}] ${dyn.parentPath} → click first ${dyn.name}`)
  try {
    await page.goto(`${BASE_URL}${dyn.parentPath}`, { waitUntil: 'commit', timeout: 30000 })
    await settle(page)
    await page.waitForSelector(dyn.waitForSelector, { timeout: 5000 })
    const target = await page.$(dyn.clickFirst)
    if (!target) {
      console.error(`      ⤵ no target matched ${dyn.clickFirst}, skipping`)
      return
    }
    await target.click()
    await settle(page)
    const outFile = join(OUT_DIR, device.label, dyn.group, `${dyn.name}.png`)
    ensureDir(dirname(outFile))
    await page.screenshot({ path: outFile, fullPage: true })
    manifest.push({
      viewport: device.label,
      group: dyn.group,
      name: dyn.name,
      path: dyn.parentPath + ' → click',
      finalUrl: page.url(),
      screenshot: outFile.replace(OUT_DIR + '/', ''),
      dynamic: true,
      capturedAt: new Date().toISOString(),
    })
  } catch (err) {
    console.error(`      ✗ ${err.message}`)
  }
}

async function runPass(browser, device, storageState, manifest) {
  console.log(`\n  ── ${device.label} pass (${device.viewport.width}×${device.viewport.height}) ──`)

  // Authenticated context.
  const context = await browser.newContext({ ...device, baseURL: BASE_URL, storageState })
  const page = await context.newPage()
  for (const route of ROUTES) await captureRoute(page, route, device, manifest)
  for (const dyn of DYNAMIC_ROUTES) await captureDynamicRoute(page, dyn, device, manifest)
  await context.close()

  // Unauthenticated pass for auth/public screens as a signed-out visitor sees them.
  const unauthContext = await browser.newContext({ ...device, baseURL: BASE_URL })
  const unauthPage = await unauthContext.newPage()
  const UNAUTH_ROUTES = [
    { group: 'unauth', path: '/', name: 'welcome-or-redirect' },
    { group: 'unauth', path: '/auth', name: 'login' },
    { group: 'unauth', path: '/auth/terms', name: 'terms' },
    { group: 'unauth', path: '/auth/privacy', name: 'privacy' },
    { group: 'unauth', path: '/auth/verify', name: 'verify' },
  ]
  for (const route of UNAUTH_ROUTES) await captureRoute(unauthPage, route, device, manifest)
  await unauthContext.close()
}

// ---------- Main ----------
async function main() {
  console.log(`  Scaffald screen capture`)
  console.log(`  base: ${BASE_URL}`)
  console.log(`  out:  ${OUT_DIR}`)
  console.log(`  user: ${EMAIL}`)
  ensureDir(OUT_DIR)

  // A cached session only counts if it actually carries an auth token.
  let hasValidCache = false
  if (existsSync(STATE_FILE)) {
    try {
      hasValidCache = stateHasAuth(JSON.parse(readFileSync(STATE_FILE, 'utf8')))
    } catch {}
  }
  // Interactive sign-in (or profile reuse) needs a visible window.
  const needsInteractive = !hasValidCache && !PASSWORD
  const browser = await chromium.launch({
    headless: HEADLESS && !needsInteractive && !BRAVE_PROFILE_DIR,
    executablePath: EXECUTABLE_PATH,
  })

  const storageState = await resolveStorageState(browser)

  // Pre-flight: confirm the session really reaches the app before sweeping, so
  // we never silently screenshot the login page for every route.
  {
    const probe = await browser.newContext({ ...DESKTOP, baseURL: BASE_URL, storageState })
    const probePage = await probe.newPage()
    await probePage.goto(`${BASE_URL}/dashboard`, { waitUntil: 'commit', timeout: 30000 })
    await settle(probePage)
    const landedOnAuth = new URL(probePage.url()).pathname.startsWith('/auth')
    await probe.close()
    if (landedOnAuth) {
      rmSync(STATE_FILE, { force: true })
      throw new Error(
        '/dashboard redirected to /auth — the session is not valid. Cleared the cached ' +
          'session; re-run and complete the sign-in so capture can proceed.',
      )
    }
  }

  const manifest = []
  const startedAt = new Date().toISOString()

  await runPass(browser, DESKTOP, storageState, manifest)
  await runPass(browser, IPHONE, storageState, manifest)

  const manifestPath = join(OUT_DIR, 'manifest.json')
  writeFileSync(
    manifestPath,
    JSON.stringify(
      {
        baseUrl: BASE_URL,
        startedAt,
        finishedAt: new Date().toISOString(),
        viewports: { desktop: DESKTOP.viewport, mobile: IPHONE.viewport },
        user: EMAIL,
        captures: manifest,
      },
      null,
      2,
    ),
  )

  await browser.close()
  const ok = manifest.filter((m) => !m.error).length
  const failed = manifest.filter((m) => m.error).length
  console.log(`\n  done: ${ok} captured, ${failed} failed.`)
  console.log(`  manifest: ${manifestPath}`)
}

main().catch((err) => {
  console.error(`✗ ${err.message}`)
  console.error(err.stack)
  process.exit(1)
})
