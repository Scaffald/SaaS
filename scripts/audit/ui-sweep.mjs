#!/usr/bin/env node
/**
 * iOS-viewport UI audit via Playwright.
 *
 * Walks every route in apps/scaffald/app/ at 390x844 (iPhone 14) on the
 * Expo Web dev server, screenshots each, writes a manifest. Auth is
 * programmatic via @supabase/supabase-js — no UI driving for login.
 *
 * Prereqs:
 *   - Dev server running: pnpm expo start --port 8081 (separate terminal)
 *   - .env.dev present with EXPO_PUBLIC_SUPABASE_URL + ANON_KEY
 *   - Run from the parent worktree where node_modules is installed:
 *       cd /Users/clay/Development/UNI-Construct
 *       node .claude/worktrees/<wt>/scripts/audit/ui-sweep.mjs
 *
 * Output:
 *   docs/agents/audits/2026-05-26-ui-audit/{group}/{route}.png
 *   docs/agents/audits/2026-05-26-ui-audit/manifest.json
 */

import { chromium, devices } from 'playwright'
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '..')

// ---------- Config ----------
const BASE_URL = process.env.AUDIT_BASE_URL || 'http://localhost:8081'
const OUT_DIR =
  process.env.AUDIT_OUT ||
  resolve(REPO_ROOT, 'docs/agents/audits/2026-05-26-ui-audit')
const HEADLESS = process.env.AUDIT_HEADFUL !== '1'
const EMAIL = process.env.AUDIT_EMAIL || 'clay@unicorn.love'
const PASSWORD = process.env.AUDIT_PASSWORD || 'password123'
// Cold Metro web compile on a freshly-started dev server can take 60-90s
// before the login form renders. Generous default; override for slow machines.
const LOGIN_TIMEOUT = Number(process.env.AUDIT_LOGIN_TIMEOUT) || 90000
// Repo root (this file lives at scripts/audit/, so two levels up).
const PROJECT_ROOT = resolve(__dirname, '..', '..')

// iPhone 14 — 390x844, dpr 3.
const IPHONE = devices['iPhone 14'] || {
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  userAgent:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
}

// Whatever auth-token storage format the app uses is captured by driving the
// login UI once and saving Playwright's storageState. No need to know the
// internal key shape.

// ---------- Route inventory ----------
// Hand-curated from `apps/scaffald/app/`. Route groups (parens) are stripped
// from the URL by expo-router. Dynamic routes are listed separately and
// resolved at runtime by clicking through.
const ROUTES = [
  // root
  { group: 'root', path: '/', name: 'index' },

  // auth (public)
  { group: 'auth', path: '/auth', name: 'login' },
  { group: 'auth', path: '/auth/terms', name: 'terms' },
  { group: 'auth', path: '/auth/privacy', name: 'privacy' },
  { group: 'auth', path: '/auth/success', name: 'success' },
  { group: 'auth', path: '/auth/verify', name: 'verify' },

  // public
  { group: 'public', path: '/teams/invitations/accept', name: 'team-invitation' },

  // protected — top level
  { group: 'protected', path: '/dashboard', name: 'dashboard' },
  { group: 'protected', path: '/search', name: 'search' },
  { group: 'protected', path: '/assessments', name: 'assessments' },
  { group: 'protected', path: '/onboarding', name: 'onboarding' },

  // protected — employers
  { group: 'employers', path: '/employers', name: 'list' },
  { group: 'employers', path: '/employers/create', name: 'create' },
  { group: 'employers', path: '/employers/invitations', name: 'invitations' },

  // protected — workers
  { group: 'workers', path: '/workers', name: 'list' },
  { group: 'workers', path: '/workers/map', name: 'map' },

  // protected — jobs
  { group: 'jobs', path: '/jobs', name: 'list' },

  // protected — communities
  { group: 'communities', path: '/communities', name: 'list' },
  { group: 'communities', path: '/communities/reputation', name: 'reputation' },
  { group: 'communities', path: '/communities/bookmarks', name: 'bookmarks' },

  // protected — profile (deep tree)
  { group: 'profile', path: '/profile', name: 'overview' },
  { group: 'profile', path: '/profile/general', name: 'general' },
  { group: 'profile', path: '/profile/verification', name: 'verification' },
  { group: 'profile', path: '/profile/id-verification', name: 'id-verification' },
  { group: 'profile', path: '/profile/import-review', name: 'import-review' },
  { group: 'profile', path: '/profile/experience', name: 'experience' },
  { group: 'profile', path: '/profile/employment', name: 'employment' },
  { group: 'profile', path: '/profile/education', name: 'education' },
  { group: 'profile', path: '/profile/certifications', name: 'certifications' },
  { group: 'profile', path: '/profile/skills', name: 'skills' },
  { group: 'profile', path: '/profile/resume', name: 'resume' },
  { group: 'profile', path: '/profile/resume/review', name: 'resume-review' },
  { group: 'profile', path: '/profile/background-check', name: 'background-check' },
  { group: 'profile', path: '/profile/background-check/initiate', name: 'background-check-initiate' },

  // admin
  { group: 'admin', path: '/office', name: 'office' },
]

// Dynamic routes are visited via click-through after their parent list loads.
// Each one names a parent path (which must be in ROUTES above) and a selector
// to click. The fallback if no element matches is to skip.
const DYNAMIC_ROUTES = [
  {
    group: 'jobs',
    parentPath: '/jobs',
    name: 'detail-first',
    waitForSelector: '[data-testid="job-card"], a[href^="/jobs/"]',
    clickFirst: '[data-testid="job-card"] a, a[href^="/jobs/"]',
  },
]

// ---------- Auth ----------
// Drive the login form at a DESKTOP viewport (bypasses small-screen
// WelcomeScreen onboarding), save storageState including auth tokens AND
// cookie-consent flag, then reuse it for the iPhone audit pass.
async function performLoginAndSaveState(browser) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    baseURL: BASE_URL,
  })
  const page = await context.newPage()
  await page.goto(`${BASE_URL}/auth`, { waitUntil: 'commit', timeout: 60000 })
  await page.waitForLoadState('domcontentloaded')

  // Accept cookies if banner appears.
  const acceptCookies = page.locator(
    'button:has-text("Accept"), [role="button"]:has-text("Accept")',
  ).first()
  try {
    await acceptCookies.waitFor({ timeout: 3000 })
    await acceptCookies.click()
    await page.waitForTimeout(300)
  } catch {}

  // Login UI is magic-link by default. Toggle to password, check Terms, submit.
  // The first request to a freshly-started Expo Web dev server triggers a cold
  // Metro compile (8k+ modules, can take 60-90s) before anything renders — so
  // this first waitFor doubles as "wait for the bundle to compile." Override
  // with AUDIT_LOGIN_TIMEOUT if your machine is slower.
  const emailInput = page.locator(
    'input[type="email"], input[autocomplete="email"], input[placeholder*="mail" i]',
  ).first()
  await emailInput.waitFor({ timeout: LOGIN_TIMEOUT })
  await emailInput.fill(EMAIL)

  // Toggle to password mode (Pressable with text "Sign in with password").
  await page.getByText('Sign in with password', { exact: true }).first().click()

  const passwordInput = page.locator('input[type="password"]').first()
  await passwordInput.waitFor({ timeout: 5000 })
  await passwordInput.fill(PASSWORD)

  // Accept Terms by clicking the wrapping Pressable (text "I agree to the…").
  await page.getByText('I agree to the').first().click()

  // After toggle the link below now reads "Use email link instead", so the
  // only remaining "Sign in" text is the submit button.
  await page.getByText('Sign in', { exact: true }).first().click()

  // Race the post-login redirect against a visible auth error. The common
  // failure is "Failed to fetch" — the app can't reach its Supabase backend
  // (EXPO_PUBLIC_SUPABASE_URL points at local 54321 but `pnpm supa start`
  // isn't running, or the creds don't exist in the target project). Detecting
  // it surfaces an actionable message instead of a 30s "did not redirect".
  const authError = page
    .getByText(/failed to fetch|invalid login|invalid credentials|unable to|network error/i)
    .first()
  const redirected = await Promise.race([
    page
      .waitForURL((url) => !url.pathname.startsWith('/auth'), { timeout: 30000 })
      .then(() => true)
      .catch(() => false),
    authError
      .waitFor({ timeout: 30000 })
      .then(() => 'error')
      .catch(() => false),
  ])
  if (redirected !== true) {
    const stuckPath = join(OUT_DIR, '_login-stuck.png')
    ensureDir(dirname(stuckPath))
    await page.screenshot({ path: stuckPath, fullPage: true })
    const hint =
      redirected === 'error'
        ? `auth backend error visible on page. Is \`pnpm supa start\` running and does ${EMAIL} exist in the target project? (app uses EXPO_PUBLIC_SUPABASE_URL)`
        : `login did not redirect off /auth within 30s`
    throw new Error(`Login failed: ${hint}. Screenshot: ${stuckPath}`)
  }
  const state = await context.storageState()
  await context.close()
  return state
}

// ---------- Capture ----------
function ensureDir(p) {
  if (!existsSync(p)) mkdirSync(p, { recursive: true })
}

async function settle(page) {
  await page.waitForLoadState('domcontentloaded')
  try {
    await page.waitForLoadState('networkidle', { timeout: 5000 })
  } catch {}
  // Wait for the app's "Loading..." indicator to go away — it appears on
  // initial mount and on every protected-route resolution while auth state
  // hydrates. Without this, screenshots fire mid-load.
  try {
    await page.waitForFunction(
      () => !document.body.innerText.includes('Loading...'),
      null,
      { timeout: 25000 },
    )
  } catch {
    // Loading never went away — capture anyway so we can see what got stuck.
  }
  // Let URL settle if app does post-mount redirects.
  let lastUrl = page.url()
  for (let i = 0; i < 8; i++) {
    await page.waitForTimeout(250)
    const now = page.url()
    if (now === lastUrl) break
    lastUrl = now
  }
  // Give data fetches time to resolve so skeletons clear. Capped — pages
  // with genuinely-stuck skeletons get captured as a finding.
  await page.waitForTimeout(3000)
}

async function captureRoute(page, route, manifest) {
  const outFile = join(OUT_DIR, route.group, `${route.name}.png`)
  ensureDir(dirname(outFile))
  const url = `${BASE_URL}${route.path}`
  console.log(`  → ${route.path}`)
  let error = null
  try {
    const res = await page.goto(url, { waitUntil: 'commit', timeout: 30000 })
    await settle(page)
    await page.screenshot({ path: outFile, fullPage: true })
    manifest.push({
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
    error = err.message
    manifest.push({
      group: route.group,
      name: route.name,
      path: route.path,
      url,
      error,
      capturedAt: new Date().toISOString(),
    })
    console.error(`    ✗ ${error}`)
  }
}

async function captureDynamicRoute(page, dyn, manifest) {
  console.log(`  → ${dyn.parentPath} → click first ${dyn.name}`)
  try {
    await page.goto(`${BASE_URL}${dyn.parentPath}`, { waitUntil: 'commit', timeout: 30000 })
    await settle(page)
    await page.waitForSelector(dyn.waitForSelector, { timeout: 5000 })
    const target = await page.$(dyn.clickFirst)
    if (!target) {
      console.error(`    ⤵ no target matched ${dyn.clickFirst}, skipping`)
      return
    }
    await target.click()
    await settle(page)
    const outFile = join(OUT_DIR, dyn.group, `${dyn.name}.png`)
    ensureDir(dirname(outFile))
    await page.screenshot({ path: outFile, fullPage: true })
    manifest.push({
      group: dyn.group,
      name: dyn.name,
      path: dyn.parentPath + ' → click',
      finalUrl: page.url(),
      screenshot: outFile.replace(OUT_DIR + '/', ''),
      dynamic: true,
      capturedAt: new Date().toISOString(),
    })
  } catch (err) {
    console.error(`    ✗ ${err.message}`)
  }
}

// ---------- Preflight ----------
// Read a var from process.env, falling back to the repo-root .env file the app
// loads (EXPO_PUBLIC_SUPABASE_URL / _ANON_KEY). Avoids a hard dep on the env
// being exported into this script's shell.
function envVar(name) {
  if (process.env[name]) return process.env[name]
  const envPath = resolve(PROJECT_ROOT, '.env')
  if (!existsSync(envPath)) return undefined
  const line = readFileSync(envPath, 'utf8')
    .split('\n')
    .find((l) => l.startsWith(`${name}=`))
  return line ? line.slice(name.length + 1).replace(/^["']|["']$/g, '').trim() : undefined
}

// The app's data layer is the `api` edge function. If it's down, login still
// works (that's core auth) but every protected route's prerequisites check
// fails and the guard redirects to /onboarding — so the sweep silently
// captures the onboarding gate everywhere instead of the real screens. Fail
// fast with the fix instead.
async function preflightApi() {
  const url = process.env.AUDIT_API_URL || envVar('EXPO_PUBLIC_SUPABASE_URL') || 'http://localhost:54321'
  const anon = envVar('EXPO_PUBLIC_SUPABASE_ANON_KEY')
  const healthUrl = `${url.replace(/\/$/, '')}/functions/v1/api/v1/health`
  let status = 0
  try {
    const res = await fetch(healthUrl, {
      headers: anon ? { apikey: anon } : {},
      signal: AbortSignal.timeout(8000),
    })
    status = res.status
  } catch (err) {
    throw new Error(
      `api edge function unreachable at ${healthUrl} (${err.message}). ` +
        `Run \`pnpm supa functions serve api\` in a separate terminal — without ` +
        `it, every protected route redirects to /onboarding and the sweep only ` +
        `captures the onboarding gate.`,
    )
  }
  if (status !== 200) {
    throw new Error(
      `api edge function returned ${status} at ${healthUrl} (expected 200). ` +
        `Run \`pnpm supa functions serve api\` — data calls (incl. the ` +
        `prerequisites check) are failing, so protected routes redirect to ` +
        `/onboarding.`,
    )
  }
  console.log(`  ✓ api edge function healthy (${healthUrl})`)
}

// ---------- Main ----------
async function main() {
  console.log(`  iOS-viewport UI audit`)
  console.log(`  base: ${BASE_URL}`)
  console.log(`  out:  ${OUT_DIR}`)
  console.log(`  user: ${EMAIL}\n`)
  ensureDir(OUT_DIR)

  await preflightApi()

  const browser = await chromium.launch({ headless: HEADLESS })

  console.log('  signing in via UI...')
  const storageState = await performLoginAndSaveState(browser)
  console.log(`  ✓ logged in, storageState captured`)

  const context = await browser.newContext({
    ...IPHONE,
    baseURL: BASE_URL,
    storageState,
  })

  const page = await context.newPage()
  const manifest = []
  const startedAt = new Date().toISOString()

  console.log(`\n  capturing ${ROUTES.length} static routes...\n`)
  for (const route of ROUTES) {
    await captureRoute(page, route, manifest)
  }

  console.log(`\n  capturing ${DYNAMIC_ROUTES.length} dynamic routes...\n`)
  for (const dyn of DYNAMIC_ROUTES) {
    await captureDynamicRoute(page, dyn, manifest)
  }

  // ---- Unauthenticated pass for /auth/* + root ----
  console.log(`\n  capturing unauth pass (login, terms, privacy, welcome)...\n`)
  const unauthContext = await browser.newContext({
    ...IPHONE,
    baseURL: BASE_URL,
  })
  const unauthPage = await unauthContext.newPage()
  const UNAUTH_ROUTES = [
    { group: 'unauth', path: '/', name: 'welcome-or-redirect' },
    { group: 'unauth', path: '/auth', name: 'login' },
    { group: 'unauth', path: '/auth/terms', name: 'terms' },
    { group: 'unauth', path: '/auth/privacy', name: 'privacy' },
    { group: 'unauth', path: '/auth/verify', name: 'verify' },
  ]
  for (const route of UNAUTH_ROUTES) {
    await captureRoute(unauthPage, route, manifest)
  }
  await unauthContext.close()

  const manifestPath = join(OUT_DIR, 'manifest.json')
  writeFileSync(
    manifestPath,
    JSON.stringify(
      {
        baseUrl: BASE_URL,
        startedAt,
        finishedAt: new Date().toISOString(),
        viewport: IPHONE.viewport,
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
