import { ROUTES } from '@scf/core/constants/routes'

/**
 * Where /support should send this visitor, if anywhere (#1213).
 *
 * A signed-in user belongs in the app shell's Support screen; a visitor
 * without a session — or one whose session is still loading, which on the
 * server it always is — stays on the public page, so crawlers and the first
 * paint get the indexed copy.
 */
export function supportRedirectFor(state: {
  hasSession: boolean
  isLoadingSession: boolean
}): string | null {
  if (state.isLoadingSession || !state.hasSession) return null
  return ROUTES.DASHBOARD.SUPPORT.path
}
