import { ROUTES } from '@scf/core/constants/routes'

/**
 * The employer's pipeline moved from /office/applications to
 * /hiring/applications (#1312). Old links — notifications already sent,
 * bookmarks, a candidate URL a colleague pasted — still arrive at the old
 * paths, and the people following them are mostly employers *without* the
 * office role. So the redirect cannot sit behind the office gate: the office
 * layout asks this module whether the path is one of these and, if so, skips
 * its role checks and lets the redirect route run.
 */

const LEGACY = ROUTES.OFFICE.LEGACY_APPLICATIONS.path
const CURRENT = ROUTES.HIRING.APPLICATIONS.path

/** Whether `pathname` is the old pipeline or one of its children. */
export function isLegacyHiringPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false
  return pathname === LEGACY || pathname.startsWith(`${LEGACY}/`)
}

/**
 * The new home of an old pipeline path, child segments kept — so
 * `/office/applications/<id>/inquiry` becomes `/hiring/applications/<id>/inquiry`.
 * Null for anything that is not a legacy pipeline path.
 */
export function legacyHiringTarget(pathname: string | null | undefined): string | null {
  if (!pathname || !isLegacyHiringPath(pathname)) return null
  return `${CURRENT}${pathname.slice(LEGACY.length)}`
}
