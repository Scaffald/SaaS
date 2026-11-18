import { ROUTES, buildPath } from '@scf/core/constants/routes'
import { useUserRoles } from '@scf/core/utils/auth/useUserRoles'
import { canHireFor } from '@scf/core/utils/organization-memberships'
import { useOrganizations } from '@scf/core/utils/useOrganizations'

/**
 * Where "Post a job" and "Edit" go from My Listings, or null when this person
 * can do neither (#1351). Someone who can hire for an organisation (owner or
 * org admin) gets the employer's own form; office staff who cannot get the
 * Office CMS form; anyone else gets no button. Both were office-only, so an
 * employer had no way to post at all.
 */
export function useJobPostingRoutes(): {
  create: string
  edit: (jobId: string) => string
} | null {
  const { data: memberships } = useOrganizations()
  const { hasOfficeRole } = useUserRoles()

  if ((memberships ?? []).some(canHireFor)) {
    return {
      create: ROUTES.JOBS.MY_LISTINGS.CREATE.path,
      edit: (id) => buildPath(ROUTES.JOBS.MY_LISTINGS.EDIT, { id }),
    }
  }
  if (hasOfficeRole) {
    return {
      create: ROUTES.OFFICE.CMS.JOBS.CREATE.path,
      edit: (id) => buildPath(ROUTES.OFFICE.CMS.JOBS.EDIT, { id }),
    }
  }
  return null
}
