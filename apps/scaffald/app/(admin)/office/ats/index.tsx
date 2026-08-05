import { ROUTES } from '@scf/core/constants/routes'
import { Redirect } from 'expo-router'

/**
 * `/office/ats` used to render the applications pipeline, which made it a
 * second URL for `/office/applications` — the same screen behind two drawer
 * entries.
 *
 * ATS is a section (background checks, scheduling, ID verifications), not a
 * screen, so its index redirects to the canonical pipeline route.
 */
export default function ATSIndexRoute() {
  return <Redirect href={ROUTES.OFFICE.APPLICATIONS.path} />
}
