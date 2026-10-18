import { screeningLanding } from '@scf/core/features/drawer/config'
import { useUserRoles } from '@scf/core/utils/auth/useUserRoles'
import { Redirect } from 'expo-router'

/**
 * `/office/ats` used to render the applications pipeline, which made it a
 * second URL for `/office/applications` — the same screen behind two drawer
 * entries.
 *
 * ATS is a section (background checks, scheduling, ID verifications), not a
 * screen. It redirected to the pipeline, but the pipeline is the employer's
 * now and lives outside Office (#1312), so the index lands where the Office
 * Screening tab does.
 */
export default function ATSIndexRoute() {
  const { hasRole, isLoading } = useUserRoles()
  // Wait for the roles: the review queue is only for check admins, and
  // guessing early would land an admin on the wrong screen.
  if (isLoading) return null
  return <Redirect href={screeningLanding(hasRole('background_check_admin'))} />
}
