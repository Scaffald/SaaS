import { AUTH_ROUTES, ROUTES } from '@scf/core/constants/routes'
import { describe, expect, test } from 'vitest'
import {
  resolveRootRoute,
  shouldRenderLanding,
  type RootRouteInput,
} from '../utils/root-route'

/**
 * Routing decisions for `/`.
 *
 * The regression these exist to prevent: unauthenticated *native* users were
 * shown the web marketing landing page instead of the welcome/login flow,
 * because the landing branch was written without a platform check.
 */

const NATIVE_PLATFORMS = ['ios', 'android'] as const

const COMPLETE = { needsOnboarding: false, needsLegalAcceptance: false }
const NEEDS_ONBOARDING = { needsOnboarding: true, needsLegalAcceptance: false }
const NEEDS_LEGAL = { needsOnboarding: false, needsLegalAcceptance: true }

const base: RootRouteInput = {
  platform: 'web',
  isServerRender: false,
  isPending: false,
  hasUser: false,
  prereqs: undefined,
}

const input = (overrides: Partial<RootRouteInput> = {}): RootRouteInput => ({
  ...base,
  ...overrides,
})

describe('resolveRootRoute — logged out', () => {
  test('web renders the marketing landing in place', () => {
    expect(resolveRootRoute(input({ platform: 'web', hasUser: false }))).toEqual({
      type: 'landing',
    })
  })

  test.each(NATIVE_PLATFORMS)('%s redirects to login, never the landing', (platform) => {
    const decision = resolveRootRoute(input({ platform, hasUser: false }))

    expect(decision).toEqual({ type: 'redirect', path: AUTH_ROUTES.LOGIN.path })
    // The actual regression: native must never render marketing.
    expect(decision.type).not.toBe('landing')
  })
})

describe('resolveRootRoute — server rendering', () => {
  test('web serves the landing, since SSR has no session', () => {
    expect(
      resolveRootRoute(input({ isServerRender: true, isPending: true, hasUser: false }))
    ).toEqual({ type: 'landing' })
  })

  test('server render ignores a stale user and still serves the landing', () => {
    // Guards against leaking one visitor's session into a cached document.
    expect(resolveRootRoute(input({ isServerRender: true, hasUser: true }))).toEqual({
      type: 'landing',
    })
  })

  test.each(NATIVE_PLATFORMS)('%s has no server render, so it waits', (platform) => {
    expect(resolveRootRoute(input({ platform, isServerRender: true }))).toEqual({
      type: 'wait',
    })
  })
})

describe('resolveRootRoute — signed in', () => {
  test.each(['web', ...NATIVE_PLATFORMS] as const)(
    '%s sends a complete user to the dashboard',
    (platform) => {
      expect(
        resolveRootRoute(input({ platform, hasUser: true, prereqs: COMPLETE }))
      ).toEqual({ type: 'redirect', path: ROUTES.DASHBOARD.path })
    }
  )

  test.each(['web', ...NATIVE_PLATFORMS] as const)(
    '%s sends an incomplete user to onboarding',
    (platform) => {
      expect(
        resolveRootRoute(input({ platform, hasUser: true, prereqs: NEEDS_ONBOARDING }))
      ).toEqual({ type: 'redirect', path: ROUTES.ONBOARDING.path })
    }
  )

  test.each(['web', ...NATIVE_PLATFORMS] as const)(
    '%s sends an onboarded user with stale legal acceptance to /legal-update',
    (platform) => {
      expect(
        resolveRootRoute(input({ platform, hasUser: true, prereqs: NEEDS_LEGAL }))
      ).toEqual({ type: 'redirect', path: ROUTES.LEGAL_UPDATE.path })
    }
  )

  test('profile gaps outrank legal staleness', () => {
    expect(
      resolveRootRoute(
        input({
          hasUser: true,
          platform: 'ios',
          prereqs: { needsOnboarding: true, needsLegalAcceptance: true },
        })
      )
    ).toEqual({ type: 'redirect', path: ROUTES.ONBOARDING.path })
  })

  test('waits while the prerequisites query is in flight', () => {
    expect(
      resolveRootRoute(input({ hasUser: true, prereqs: undefined }))
    ).toEqual({ type: 'wait' })
  })

  test('never renders marketing to a signed-in user on web', () => {
    for (const prereqs of [COMPLETE, NEEDS_ONBOARDING, NEEDS_LEGAL]) {
      expect(shouldRenderLanding(input({ hasUser: true, prereqs }))).toBe(false)
    }
  })
})

describe('resolveRootRoute — auth still resolving', () => {
  test.each(NATIVE_PLATFORMS)('%s waits rather than guessing', (platform) => {
    // Redirecting here would bounce signed-in users to login on every cold load.
    expect(resolveRootRoute(input({ platform, isPending: true }))).toEqual({ type: 'wait' })
  })

  test('web keeps the landing page it server-rendered', () => {
    // Must match the server's decision exactly — 'wait' here rendered the
    // loading state over server-rendered marketing and broke hydration (#418).
    // Still not a redirect, so signed-in users are not bounced to login.
    expect(resolveRootRoute(input({ platform: 'web', isPending: true }))).toEqual({
      type: 'landing',
    })
  })
})

describe('resolveRootRoute — totality', () => {
  test('every combination yields a valid decision and only web ever lands', () => {
    const platforms = ['web', 'ios', 'android'] as const
    const bools = [true, false]
    const prereqStates = [COMPLETE, NEEDS_ONBOARDING, NEEDS_LEGAL, undefined]
    let cases = 0

    for (const platform of platforms)
      for (const isServerRender of bools)
        for (const isPending of bools)
          for (const hasUser of bools)
            for (const prereqs of prereqStates) {
              const decision = resolveRootRoute({
                platform,
                isServerRender,
                isPending,
                hasUser,
                prereqs,
              })
              cases++

              expect(['landing', 'redirect', 'wait']).toContain(decision.type)
              if (decision.type === 'redirect') expect(decision.path).toMatch(/^\//)
              if (decision.type === 'landing') expect(platform).toBe('web')
            }

    expect(cases).toBe(96)
  })
})
