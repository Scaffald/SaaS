/**
 * Which organisations a person belongs to, and as what (#1312).
 *
 * `useOrganizations` read only `team_members` and called everyone a
 * 'member'. Owning an organisation, or holding a role scoped to it, does not
 * put you on a team — so an organisation's owner and admin, the two people
 * the api lets work its hiring pipeline, came back with no organisations at
 * all and were never offered Employer mode. The seeded orgAdmin persona
 * (reviewer-employer, seeds/010) is exactly that case.
 *
 * Three sources, one row per organisation, the strongest relationship wins.
 */

export type OrganizationRole = 'owner' | 'admin' | 'member'

export type OrganizationMembership = {
  organization_id: string
  organization_name: string
  organization_slug: string
  user_id: string
  role: OrganizationRole
  joined_at: string
}

type OrgRef = { id: string; name: string | null; slug: string | null }

export type TeamMembershipRow = {
  user_id: string
  created_at: string
  teams: { organizations: OrgRef | null } | null
}

export type OwnedOrganizationRow = OrgRef & { created_at: string | null }

export type OrgRoleAssignmentRow = {
  created_at: string | null
  role: { name: string | null } | Array<{ name: string | null }> | null
  organization: OrgRef | OrgRef[] | null
}

const RANK: Record<OrganizationRole, number> = { owner: 3, admin: 2, member: 1 }

/** PostgREST hands a to-one embed back as an object or a one-element array. */
const one = <T>(value: T | T[] | null | undefined): T | null =>
  Array.isArray(value) ? (value[0] ?? null) : (value ?? null)

/**
 * An org-scoped role assignment's name as a membership role. `admin` is the
 * one that admits a person to the hiring pipeline (PIPELINE_ROLES in the api);
 * anything else scoped to the organisation is plain membership.
 */
const roleFromAssignment = (name: string | null | undefined): OrganizationRole =>
  name === 'admin' ? 'admin' : 'member'

export function mergeOrganizationMemberships(
  userId: string,
  sources: {
    teams?: TeamMembershipRow[] | null
    owned?: OwnedOrganizationRow[] | null
    roles?: OrgRoleAssignmentRow[] | null
  }
): OrganizationMembership[] {
  const byOrg = new Map<string, OrganizationMembership>()

  const add = (org: OrgRef | null, role: OrganizationRole, joinedAt: string | null) => {
    if (!org?.id) return
    const candidate: OrganizationMembership = {
      organization_id: org.id,
      organization_name: org.name ?? '',
      organization_slug: org.slug ?? '',
      user_id: userId,
      role,
      joined_at: joinedAt ?? '',
    }
    const existing = byOrg.get(org.id)
    if (!existing) {
      byOrg.set(org.id, candidate)
      return
    }
    // The strongest relationship names the role; the earliest date stays as
    // joined_at so sorts and filters are stable.
    const strongest = RANK[role] > RANK[existing.role] ? role : existing.role
    const joined =
      existing.joined_at && candidate.joined_at
        ? existing.joined_at < candidate.joined_at
          ? existing.joined_at
          : candidate.joined_at
        : existing.joined_at || candidate.joined_at
    byOrg.set(org.id, { ...existing, role: strongest, joined_at: joined })
  }

  for (const row of sources.teams ?? []) {
    add(row.teams?.organizations ?? null, 'member', row.created_at)
  }
  for (const org of sources.owned ?? []) {
    add(org, 'owner', org.created_at)
  }
  for (const row of sources.roles ?? []) {
    add(one(row.organization), roleFromAssignment(one(row.role)?.name), row.created_at)
  }

  return Array.from(byOrg.values()).sort((a, b) =>
    a.organization_name.localeCompare(b.organization_name)
  )
}

/**
 * Whether this membership may work the organisation's hiring pipeline — the
 * api's rule (owner, or the org-scoped `admin` role), so the client offers
 * what the server will allow.
 */
export const canHireFor = (membership: OrganizationMembership): boolean =>
  membership.role === 'owner' || membership.role === 'admin'

/**
 * The organisation an employer screen should show when it can show only one:
 * the first the person can hire for, else the first they belong to.
 */
export const primaryHiringOrganization = (
  memberships: OrganizationMembership[] | null | undefined
): OrganizationMembership | null => memberships?.find(canHireFor) ?? memberships?.[0] ?? null
