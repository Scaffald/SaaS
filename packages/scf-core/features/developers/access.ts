import type { OrganizationRole } from '@scf/core/utils/organization-memberships'

/**
 * Whether someone may create, re-scope, revoke or delete an organization's API
 * keys and webhooks (#1440). The api decides this for real
 * (`functions/api/lib/org-developer-roles.ts`); this is the same rule, so the
 * app offers the controls only to the people the api will accept.
 *
 * An admin is the organization's owner, anyone holding its `admin` role
 * (both arrive as the membership's `role`), or a `team_admin` on any of its
 * teams. Everyone else in the organization may look but not change.
 */
export function canManageOrgDevelopers(
  membershipRole: OrganizationRole | null | undefined,
  teamRoleKeys: ReadonlyArray<string | null | undefined>
): boolean {
  if (membershipRole === 'owner' || membershipRole === 'admin') return true
  return teamRoleKeys.includes('team_admin')
}
