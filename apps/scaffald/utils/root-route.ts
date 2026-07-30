import { AUTH_ROUTES, ROUTES } from '@scf/core/constants/routes'

/**
 * Routing decisions for `/` (app/index.tsx), extracted as pure functions.
 *
 * This lived inline in the route component, tangled with hooks and effects,
 * which made it untestable — and a platform assumption slipped through: the
 * marketing landing was served to unauthenticated *native* users, who should
 * get the welcome/login flow instead. Keeping the decision separate from the
 * rendering lets the whole matrix be asserted directly.
 */

export type RootRouteInput = {
  platform: 'web' | 'ios' | 'android'
  /** True while rendering on the server, where there is never a session. */
  isServerRender: boolean
  /** Auth state is still resolving. */
  isPending: boolean
  hasUser: boolean
  /** Undefined while the prerequisites query is in flight. */
  prerequisitesComplete?: boolean
}

export type RootRouteDecision =
  /** Render the marketing landing page in place (web, logged out). */
  | { type: 'landing' }
  /** Navigate elsewhere. */
  | { type: 'redirect'; path: string }
  /** Not enough information yet — show the loading state and re-evaluate. */
  | { type: 'wait' }

/**
 * What `/` should navigate to, if anywhere.
 *
 * Note the asymmetry: on web, logged-out is a terminal state (the landing page
 * *is* the destination). On native it's a redirect, because the app has no
 * marketing surface.
 */
export function resolveRootRoute(input: RootRouteInput): RootRouteDecision {
  const { platform, isServerRender, isPending, hasUser, prerequisitesComplete } = input
  const isWeb = platform === 'web'

  // Web hydrates the server-rendered document, so this decision has to come out
  // the same on the server and on the client's first pass. Keying it on
  // `isServerRender` did not: the server rendered the landing page and the
  // client immediately rendered the loading state, a hydration mismatch (React
  // #418) that made React discard the whole SSR tree. Neither side has a
  // session at that point — the server never does, the client hasn't resolved
  // one yet — so both render the landing page, and a signed-in visitor is
  // redirected below once auth resolves.
  if (isWeb && (isServerRender || isPending || !hasUser)) {
    return { type: 'landing' }
  }

  // Native has no server render, and no marketing surface to fall back to.
  if (isServerRender || isPending) return { type: 'wait' }

  if (!hasUser) return { type: 'redirect', path: AUTH_ROUTES.LOGIN.path }

  // Signed in: hold until prerequisites resolve, then route by completeness.
  if (prerequisitesComplete === undefined) return { type: 'wait' }

  return {
    type: 'redirect',
    path: prerequisitesComplete ? ROUTES.DASHBOARD.path : ROUTES.ONBOARDING.path,
  }
}

/**
 * Whether `/` should render the marketing landing rather than the app shell.
 * Mirrors `resolveRootRoute` so the component has a single source of truth.
 */
export function shouldRenderLanding(input: RootRouteInput): boolean {
  return resolveRootRoute(input).type === 'landing'
}
