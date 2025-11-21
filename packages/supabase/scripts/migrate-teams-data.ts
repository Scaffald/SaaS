/**
 * Backfill data for enhanced team management schema (REQ-91).
 *
 * This script is intended to be executed after applying the SQL migration
 * `098_migrate_existing_teams_data.sql`. It guarantees that each organization
 * has the expected team roles, updates `core.teams.default_role_id`, and
 * assigns sensible defaults to legacy `core.team_members` rows.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

type CoreClient = SupabaseClient

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'http://127.0.0.1:54321'
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

interface TeamRoleRecord {
  id: string
  key: string
}

const BASE_TEAM_ROLES: ReadonlyArray<{
  key: string
  name: string
  description: string
}> = [
  {
    key: 'admin',
    name: 'Team Admin',
    description: 'Full access to manage the team, members, roles, and invitations.',
  },
  {
    key: 'lead',
    name: 'Team Lead',
    description: 'Manage day-to-day team operations and collaborate on hiring activities.',
  },
  {
    key: 'recruiter',
    name: 'Recruiter',
    description: 'Manage applications, communication, and scheduling with candidates.',
  },
  {
    key: 'reviewer',
    name: 'Reviewer',
    description: 'Review applications and provide structured feedback.',
  },
  {
    key: 'member',
    name: 'Member',
    description: 'Collaborate on evaluations with read access to shared resources.',
  },
]

const ROLE_PERMISSIONS: Record<string, ReadonlyArray<string>> = {
  admin: [
    'team.view',
    'team.manage',
    'team.members.manage',
    'team.roles.manage',
    'team.invitations.manage',
    'team.analytics.view',
    'applications.manage',
    'applications.review',
    'team.applications.view',
    'team.discussion.participate',
  ],
  lead: [
    'team.view',
    'team.members.manage',
    'team.invitations.manage',
    'team.analytics.view',
    'applications.manage',
    'applications.review',
    'team.applications.view',
    'team.discussion.participate',
  ],
  recruiter: [
    'team.view',
    'applications.manage',
    'applications.review',
    'team.applications.view',
    'team.discussion.participate',
  ],
  reviewer: [
    'team.view',
    'applications.review',
    'team.applications.view',
    'team.discussion.participate',
  ],
  member: ['team.view', 'team.applications.view', 'team.discussion.participate'],
}

const ROLE_KEY_ALIASES: Record<string, string> = {
  team_admin: 'admin',
  admin: 'admin',
  team_lead: 'lead',
  lead: 'lead',
  team_recruiter: 'recruiter',
  recruiter: 'recruiter',
  team_reviewer: 'reviewer',
  reviewer: 'reviewer',
  team_member: 'member',
  member: 'member',
}

function normalizeRoleKey(key: string | null | undefined): string | null {
  if (!key) return null
  return ROLE_KEY_ALIASES[key] ?? key
}

async function ensureOrganizationTeamRoles(
  client: CoreClient,
  organizationId: string
): Promise<Record<string, TeamRoleRecord>> {
  const { data, error } = await client
    .schema('core')
    .from('team_roles')
    .select('id, key, name, is_default')
    .eq('organization_id', organizationId)

  if (error) {
    throw new Error(
      `Failed to load existing team roles for org ${organizationId}: ${error.message}`
    )
  }

  const roles = new Map<string, TeamRoleRecord>()
  for (const role of data ?? []) {
    roles.set(role.key, { id: role.id, key: role.key })
  }

  const missing = BASE_TEAM_ROLES.filter((role) => !roles.has(role.key))
  if (missing.length > 0) {
    const insertPayload = missing.map((role) => ({
      organization_id: organizationId,
      key: role.key,
      name: role.name,
      description: role.description,
      is_default: role.key === 'member',
      is_system: true,
    }))

    const { data: inserted, error: insertError } = await client
      .schema('core')
      .from('team_roles')
      .insert(insertPayload)
      .select('id, key')

    if (insertError) {
      throw new Error(`Failed to seed team roles for org ${organizationId}: ${insertError.message}`)
    }

    for (const role of inserted ?? []) {
      roles.set(role.key, { id: role.id, key: role.key })
    }
  }

  const roleIds = Array.from(roles.values()).map((role) => role.id)
  if (roleIds.length > 0) {
    const { data: existingPerms, error: permsError } = await client
      .schema('core')
      .from('team_role_permissions')
      .select('role_id, permission_key')
      .in('role_id', roleIds)

    if (permsError) {
      throw new Error(
        `Failed to load team role permissions for org ${organizationId}: ${permsError.message}`
      )
    }

    const permissionMap = new Map<string, Set<string>>()
    for (const record of existingPerms ?? []) {
      const set = permissionMap.get(record.role_id) ?? new Set<string>()
      set.add(record.permission_key)
      permissionMap.set(record.role_id, set)
    }

    const inserts: Array<{ role_id: string; permission_key: string }> = []
    for (const [roleKey, permissions] of Object.entries(ROLE_PERMISSIONS)) {
      const role = roles.get(roleKey)
      if (!role) continue
      const existing = permissionMap.get(role.id) ?? new Set<string>()
      for (const permission of permissions) {
        if (!existing.has(permission)) {
          inserts.push({ role_id: role.id, permission_key: permission })
        }
      }
    }

    if (inserts.length > 0) {
      const { error: insertPermsError } = await client
        .schema('core')
        .from('team_role_permissions')
        .insert(inserts)

      if (insertPermsError) {
        throw new Error(
          `Failed to seed role permissions for org ${organizationId}: ${insertPermsError.message}`
        )
      }
    }
  }

  return Object.fromEntries(roles.entries())
}

async function backfillTeamDefaults(
  client: CoreClient,
  organizationId: string,
  roles: Record<string, TeamRoleRecord>
): Promise<{ updatedTeams: number }> {
  const memberRole = roles.member
  if (!memberRole) {
    return { updatedTeams: 0 }
  }

  const { data, error } = await client
    .schema('core')
    .from('teams')
    .update({
      default_role_id: memberRole.id,
      default_role_key: 'member',
    })
    .eq('organization_id', organizationId)
    .is('default_role_id', null)
    .select('id')

  if (error) {
    throw new Error(
      `Failed to backfill default_role_id for org ${organizationId}: ${error.message}`
    )
  }

  const { error: keyError } = await client
    .schema('core')
    .from('teams')
    .update({ default_role_key: 'member' })
    .eq('organization_id', organizationId)
    .or("default_role_key.is.null,default_role_key.eq.''")

  if (keyError) {
    throw new Error(
      `Failed to normalize default_role_key for org ${organizationId}: ${keyError.message}`
    )
  }

  return { updatedTeams: data?.length ?? 0 }
}

async function loadRoleAssignments(): Promise<Map<string, string>> {
  const { data, error } = await supabase
    .schema('core')
    .from('role_assignments')
    .select('user_id, scope_team_id, role:roles(name)')
    .not('scope_team_id', 'is', null)

  if (error) {
    throw new Error(`Failed to load role assignments: ${error.message}`)
  }

  const map = new Map<string, string>()
  for (const assignment of data ?? []) {
    const teamId = assignment.scope_team_id as string | null
    const userId = assignment.user_id as string | null
    const rawRole = assignment.role?.name as string | null
    const normalized = normalizeRoleKey(rawRole)

    if (!teamId || !userId || !normalized) {
      continue
    }

    map.set(`${teamId}:${userId}`, normalized)
  }

  return map
}

async function backfillTeamMembers(
  client: CoreClient,
  members: Array<{ id: string; team_id: string; user_id: string }>,
  teamToOrg: Map<string, string>,
  orgRoleMap: Map<string, Record<string, TeamRoleRecord>>,
  assignmentMap: Map<string, string>
): Promise<{ updatedMembers: number }> {
  let updates = 0

  for (const member of members) {
    const orgId = teamToOrg.get(member.team_id)
    if (!orgId) continue

    const roles = orgRoleMap.get(orgId)
    if (!roles) continue

    const assignmentKey = `${member.team_id}:${member.user_id}`
    const assignedRoleKey = assignmentMap.get(assignmentKey) ?? 'member'
    const resolvedRole = roles[assignedRoleKey] ?? roles.member
    if (!resolvedRole) continue

    const { error } = await client
      .schema('core')
      .from('team_members')
      .update({ role_id: resolvedRole.id })
      .eq('id', member.id)

    if (error) {
      throw new Error(`Failed to update team member ${member.id}: ${error.message}`)
    }

    updates += 1
  }

  return { updatedMembers: updates }
}

async function main() {
  console.log('🔄 Starting REQ-91 team data migration helper\n')

  const { data: organizations, error: orgError } = await supabase
    .schema('core')
    .from('organizations')
    .select('id')

  if (orgError) {
    throw new Error(`Failed to load organizations: ${orgError.message}`)
  }

  const orgRoleMap = new Map<string, Record<string, TeamRoleRecord>>()
  let totalTeamsUpdated = 0

  for (const org of organizations ?? []) {
    const orgId = org.id as string
    const roles = await ensureOrganizationTeamRoles(supabase, orgId)
    orgRoleMap.set(orgId, roles)

    const { updatedTeams } = await backfillTeamDefaults(supabase, orgId, roles)
    totalTeamsUpdated += updatedTeams
  }

  console.log(`✅ Team defaults backfilled for ${totalTeamsUpdated} teams`)

  const { data: teams, error: teamsError } = await supabase
    .schema('core')
    .from('teams')
    .select('id, organization_id')

  if (teamsError) {
    throw new Error(`Failed to load teams: ${teamsError.message}`)
  }

  const teamToOrg = new Map<string, string>()
  for (const team of teams ?? []) {
    teamToOrg.set(team.id, team.organization_id)
  }

  const assignmentMap = await loadRoleAssignments()

  const { data: members, error: membersError } = await supabase
    .schema('core')
    .from('team_members')
    .select('id, team_id, user_id')
    .is('role_id', null)

  if (membersError) {
    throw new Error(`Failed to load team members requiring role_id: ${membersError.message}`)
  }

  if ((members ?? []).length === 0) {
    console.log('ℹ️  No team members required role backfill')
  } else {
    const { updatedMembers } = await backfillTeamMembers(
      supabase,
      members ?? [],
      teamToOrg,
      orgRoleMap,
      assignmentMap
    )
    console.log(`✅ Assigned roles to ${updatedMembers} legacy team members`)
  }

  console.log('\n🎉 Migration helper completed successfully\n')
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Migration helper failed:', error)
    process.exit(1)
  })
