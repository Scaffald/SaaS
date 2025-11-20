import type { SupabaseClient } from '@supabase/supabase-js'

import { createAdminClient, createTestClient, loadCachedTokens, TEST_USERS } from '../setup.ts'

interface ProfileDefaults {
  displayName: string
  firstName: string
  lastName: string
}

interface EnsureUserRecordsOptions {
  defaults: ProfileDefaults
}

async function ensureUserRecords(
  admin: SupabaseClient,
  userId: string,
  { defaults }: EnsureUserRecordsOptions
): Promise<void> {
  const now = new Date().toISOString()

  const { data: existingUsers, error: readUsersError } = await admin
    .schema('core')
    .from('users')
    .select('id, display_name')
    .eq('id', userId)
    .limit(1)

  if (readUsersError) {
    throw new Error(`Failed to read core.users for ${userId}: ${readUsersError.message}`)
  }

  const currentUser = existingUsers?.[0]

  if (!currentUser) {
    const username = `integration-${userId.slice(0, 8)}`
    const { error: insertUserError } = await admin.schema('core').from('users').insert({
      id: userId,
      username,
      slug: username,
      display_name: defaults.displayName,
      created_at: now,
      updated_at: now,
    })

    if (insertUserError) {
      throw new Error(`Failed to insert core.users row for ${userId}: ${insertUserError.message}`)
    }
  } else if (!currentUser.display_name) {
    const { error: updateUserError } = await admin
      .schema('core')
      .from('users')
      .update({
        display_name: defaults.displayName,
        updated_at: now,
      })
      .eq('id', userId)

    if (updateUserError) {
      throw new Error(`Failed to update core.users row for ${userId}: ${updateUserError.message}`)
    }
  }

  const { data: existingProfiles, error: readProfileError } = await admin
    .schema('core')
    .from('profile')
    .select('user_id, first_name, last_name')
    .eq('user_id', userId)
    .limit(1)

  if (readProfileError) {
    throw new Error(`Failed to read core.profile for ${userId}: ${readProfileError.message}`)
  }

  const currentProfile = existingProfiles?.[0]

  if (!currentProfile) {
    const { error: insertProfileError } = await admin.schema('core').from('profile').insert({
      user_id: userId,
      first_name: defaults.firstName,
      last_name: defaults.lastName,
      created_at: now,
      updated_at: now,
    })

    if (insertProfileError) {
      throw new Error(
        `Failed to insert core.profile row for ${userId}: ${insertProfileError.message}`
      )
    }
  } else {
    const updates: Record<string, unknown> = {}
    if (!currentProfile.first_name) {
      updates.first_name = defaults.firstName
    }
    if (!currentProfile.last_name) {
      updates.last_name = defaults.lastName
    }

    if (Object.keys(updates).length > 0) {
      updates.updated_at = now

      const { error: updateProfileError } = await admin
        .schema('core')
        .from('profile')
        .update(updates)
        .eq('user_id', userId)

      if (updateProfileError) {
        throw new Error(
          `Failed to update core.profile row for ${userId}: ${updateProfileError.message}`
        )
      }
    }
  }
}

export async function ensurePublicWorker(): Promise<{ userId: string }> {
  const tokens = await loadCachedTokens()
  if (!tokens) {
    throw new Error('Cached auth tokens not found. Run auth tests before calling worker endpoints.')
  }

  const admin = createAdminClient()
  await ensureUserRecords(admin, tokens.regular.userId, {
    defaults: {
      displayName: 'Integration Worker',
      firstName: 'Integration',
      lastName: 'Worker',
    },
  })

  return { userId: tokens.regular.userId }
}

async function getOrCreateOfficeAdminAuth(): Promise<{
  token: string
  userId: string
  email: string
}> {
  const adminClient = createAdminClient()
  const adminEmail = TEST_USERS.admin.email
  const adminPassword = TEST_USERS.admin.password

  const testClient = createTestClient()

  const attemptSignIn = async () => {
    const { data, error } = await testClient.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword,
    })

    if (error) {
      return { token: null, userId: null }
    }

    return {
      token: data.session?.access_token ?? null,
      userId: data.user?.id ?? null,
    }
  }

  let { token, userId } = await attemptSignIn()

  if (!token || !userId) {
    const { data, error } = await adminClient.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        first_name: 'Test',
        last_name: 'Admin',
        name: 'Integration Admin',
      },
    })

    if (error) {
      throw new Error(`Failed to create admin user: ${error.message}`)
    }

    userId = data.user?.id ?? null
    if (!userId) {
      throw new Error('Admin user creation did not return a user id')
    }

    const retry = await attemptSignIn()
    token = retry.token
    userId = retry.userId
  }

  if (!token || !userId) {
    throw new Error('Unable to obtain auth token for admin user')
  }

  return { token, userId, email: adminEmail }
}

export async function ensureOfficeAdminAccess(): Promise<{
  token: string
  userId: string
  email: string
}> {
  const adminClient = createAdminClient()
  const adminAuth = await getOrCreateOfficeAdminAuth()

  await ensureUserRecords(adminClient, adminAuth.userId, {
    defaults: {
      displayName: 'Integration Admin',
      firstName: 'Test',
      lastName: 'Admin',
    },
  })

  const now = new Date().toISOString()

  const { data: existingRoles, error: readRolesError } = await adminClient
    .schema('core')
    .from('roles')
    .select('id')
    .eq('name', 'office')
    .eq('scope', 'platform')
    .limit(1)

  if (readRolesError) {
    throw new Error(`Failed to read office role: ${readRolesError.message}`)
  }

  let roleId = existingRoles?.[0]?.id ?? null

  if (!roleId) {
    const { data, error: insertRoleError } = await adminClient
      .schema('core')
      .from('roles')
      .insert({
        name: 'office',
        scope: 'platform',
        description: 'Platform office administrator',
        created_at: now,
      })
      .select('id')
      .single()

    if (insertRoleError) {
      throw new Error(`Failed to insert office role: ${insertRoleError.message}`)
    }

    roleId = data?.id ?? null
  }

  if (!roleId) {
    throw new Error('Office role id could not be determined')
  }

  const { data: existingAssignments, error: readAssignmentsError } = await adminClient
    .schema('core')
    .from('role_assignments')
    .select('id')
    .eq('role_id', roleId)
    .eq('user_id', adminAuth.userId)
    .limit(1)

  if (readAssignmentsError) {
    throw new Error(`Failed to read existing role assignments: ${readAssignmentsError.message}`)
  }

  if (!existingAssignments?.length) {
    const { error: insertAssignmentError } = await adminClient
      .schema('core')
      .from('role_assignments')
      .insert({
        role_id: roleId,
        user_id: adminAuth.userId,
        created_at: now,
      })

    if (insertAssignmentError && insertAssignmentError.code !== '23505') {
      throw new Error(`Failed to insert office role assignment: ${insertAssignmentError.message}`)
    }
  }

  return adminAuth
}

export interface SeededExternalJob {
  jobId: string
  feedId: string
  cleanup: () => Promise<void>
}

export async function seedExternalJob(): Promise<SeededExternalJob> {
  const adminClient = createAdminClient()
  const feedId = crypto.randomUUID()
  const jobId = crypto.randomUUID()
  const now = new Date().toISOString()
  const feedName = `Integration Feed ${feedId.slice(0, 8)}`

  const { error: feedError } = await adminClient
    .schema('core')
    .from('external_job_feeds')
    .insert({
      id: feedId,
      name: feedName,
      url: `https://example.com/${feedId}`,
      feed_type: 'api',
      is_active: true,
      created_at: now,
      updated_at: now,
    })

  if (feedError && feedError.code !== '23505') {
    throw new Error(`Failed to insert external job feed ${feedId}: ${feedError.message}`)
  }

  const { error: jobError } = await adminClient
    .schema('core')
    .from('external_jobs')
    .insert({
      id: jobId,
      feed_id: feedId,
      external_guid: `integration-${jobId}`,
      title: 'Integration Test Role',
      description: 'Seeded external job for integration tests.',
      company_name: 'Integration Test Co.',
      job_location: 'Test City, TS',
      job_type: 'full-time',
      job_category: 'Construction',
      posted_date: now,
      is_active: true,
      created_at: now,
      updated_at: now,
    })

  if (jobError && jobError.code !== '23505') {
    throw new Error(`Failed to insert external job ${jobId}: ${jobError.message}`)
  }

  return {
    jobId,
    feedId,
    cleanup: async () => {
      await adminClient
        .schema('core')
        .from('external_job_industries')
        .delete()
        .eq('external_job_id', jobId)

      await adminClient
        .schema('core')
        .from('external_job_skills')
        .delete()
        .eq('external_job_id', jobId)

      await adminClient.schema('core').from('external_jobs').delete().eq('id', jobId)

      await adminClient.schema('core').from('external_job_feeds').delete().eq('id', feedId)
    },
  }
}

interface TeamRoleRecord {
  id: string
  key: string
  name: string
  isDefault: boolean
}

interface TeamFixtureUser {
  client: SupabaseClient
  token: string
  email: string
  userId: string
}

export interface TeamFixtureResult {
  organization: {
    id: string
    slug: string
    name: string
  }
  team: {
    id: string
    slug: string
    name: string
    defaultRoleId: string
    defaultRoleKey: string
  }
  owner: TeamFixtureUser
  member: TeamFixtureUser
  roles: Record<string, TeamRoleRecord>
}

export interface TeamFixtureOptions {
  organizationName?: string
  organizationVisibility?: 'public' | 'private'
  teamName?: string
  defaultTeamRoleKey?:
    | 'member'
    | 'recruiter'
    | 'reviewer'
    | 'admin'
    | 'lead'
    | 'team_lead'
    | 'team_admin'
  purpose?: string
  description?: Record<string, unknown>
  settings?: Record<string, unknown>
  metadata?: Record<string, unknown>
  ownerProfileDefaults?: Partial<ProfileDefaults>
  memberProfileDefaults?: Partial<ProfileDefaults>
}

interface CreateOrganizationParams {
  client: SupabaseClient
  ownerUserId: string
  name: string
  visibility: 'public' | 'private'
}

interface CreateTeamParams {
  client: SupabaseClient
  organizationId: string
  createdBy: string
  name: string
  defaultRole: TeamRoleRecord
  purpose?: string
  description?: Record<string, unknown>
  settings?: Record<string, unknown>
  metadata?: Record<string, unknown>
}

interface TeamMemberParams {
  client: SupabaseClient
  teamId: string
  userId: string
  role: TeamRoleRecord
  addedBy: string
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

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function normalizeTeamRoleKey(key: string): string {
  switch (key) {
    case 'team_admin':
      return 'admin'
    case 'team_lead':
      return 'lead'
    default:
      return key
  }
}

async function ensureOrganizationRoleAssignment(
  client: SupabaseClient,
  organizationId: string,
  userId: string
): Promise<void> {
  const now = new Date().toISOString()

  // First, ensure the organization admin role exists
  const { data: existingRole, error: readRoleError } = await client
    .schema('core')
    .from('roles')
    .select('id')
    .eq('scope', 'organization')
    .eq('name', 'admin')
    .maybeSingle()

  if (readRoleError) {
    throw new Error(`Failed to load organization admin role: ${readRoleError.message}`)
  }

  let roleId = existingRole?.id ?? null

  // Create the role if it doesn't exist
  if (!roleId) {
    const { data: newRole, error: insertRoleError } = await client
      .schema('core')
      .from('roles')
      .insert({
        name: 'admin',
        scope: 'organization',
        description: 'Organization administrator',
        created_at: now,
      })
      .select('id')
      .single()

    if (insertRoleError) {
      throw new Error(`Failed to create organization admin role: ${insertRoleError.message}`)
    }

    roleId = newRole?.id ?? null
  }

  if (!roleId) {
    throw new Error('Organization admin role ID could not be determined.')
  }

  // Check if assignment already exists
  const { data: existingAssignment, error: checkError } = await client
    .schema('core')
    .from('role_assignments')
    .select('id')
    .eq('role_id', roleId)
    .eq('user_id', userId)
    .eq('scope_org_id', organizationId)
    .maybeSingle()

  if (checkError) {
    throw new Error(`Failed to check existing role assignment: ${checkError.message}`)
  }

  // Only insert if it doesn't exist
  if (!existingAssignment) {
    const { error: insertError } = await client.schema('core').from('role_assignments').insert({
      role_id: roleId,
      user_id: userId,
      scope_org_id: organizationId,
    })

    if (insertError) {
      throw new Error(`Failed to insert organization role assignment: ${insertError.message}`)
    }
  }
}

async function createOrganizationRecord(
  params: CreateOrganizationParams
): Promise<{ id: string; slug: string; name: string }> {
  const { client, name, ownerUserId, visibility } = params
  const baseSlug = slugify(name) || 'team-org'
  const slug = `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`

  const now = new Date().toISOString()
  const { data, error } = await client
    .schema('core')
    .from('organizations')
    .insert({
      name,
      slug,
      owner_user_id: ownerUserId,
      visibility,
      description: { type: 'doc', content: [] },
      address: null,
      updated_at: now,
    })
    .select('id, slug, name')
    .single()

  if (error || !data) {
    throw new Error(
      `Failed to create organization fixture: ${error?.message ?? 'No record returned'}`
    )
  }

  await ensureOrganizationRoleAssignment(client, data.id, ownerUserId)

  return data
}

async function ensureOrganizationTeamRoles(
  client: SupabaseClient,
  organizationId: string
): Promise<Record<string, TeamRoleRecord>> {
  const { data, error } = await client
    .schema('core')
    .from('team_roles')
    .select('id, key, name, is_default')
    .eq('organization_id', organizationId)

  if (error) {
    throw new Error(`Failed to load existing team roles: ${error.message}`)
  }

  const existingRoles = new Map<string, TeamRoleRecord>()
  for (const role of data ?? []) {
    existingRoles.set(role.key, {
      id: role.id,
      key: role.key,
      name: role.name,
      isDefault: role.is_default,
    })
  }

  const missingRoles = BASE_TEAM_ROLES.filter((role) => !existingRoles.has(role.key))
  if (missingRoles.length > 0) {
    const insertPayload = missingRoles.map((role) => ({
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
      .select('id, key, name, is_default')

    if (insertError) {
      throw new Error(`Failed to seed organization team roles: ${insertError.message}`)
    }

    for (const role of inserted ?? []) {
      existingRoles.set(role.key, {
        id: role.id,
        key: role.key,
        name: role.name,
        isDefault: role.is_default,
      })
    }
  }

  const roleIds = Array.from(existingRoles.values()).map((role) => role.id)
  if (roleIds.length > 0) {
    const { data: existingPermissions, error: permissionsError } = await client
      .schema('core')
      .from('team_role_permissions')
      .select('role_id, permission_key')
      .in('role_id', roleIds)

    if (permissionsError) {
      throw new Error(
        `Failed to load organization team role permissions: ${permissionsError.message}`
      )
    }

    const permissionMap = new Map<string, Set<string>>()
    for (const record of existingPermissions ?? []) {
      const roleId = record.role_id as string
      const permission = record.permission_key as string
      const set = permissionMap.get(roleId) ?? new Set<string>()
      set.add(permission)
      permissionMap.set(roleId, set)
    }

    const inserts: Array<{ role_id: string; permission_key: string }> = []
    for (const [roleKey, permissions] of Object.entries(ROLE_PERMISSIONS)) {
      const role = existingRoles.get(roleKey)
      if (!role || permissions.length === 0) {
        continue
      }

      const existing = permissionMap.get(role.id) ?? new Set<string>()
      for (const permission of permissions) {
        if (!existing.has(permission)) {
          inserts.push({ role_id: role.id, permission_key: permission })
        }
      }
    }

    if (inserts.length > 0) {
      const { error: insertPermissionsError } = await client
        .schema('core')
        .from('team_role_permissions')
        .insert(inserts)

      if (insertPermissionsError) {
        throw new Error(
          `Failed to seed organization team role permissions: ${insertPermissionsError.message}`
        )
      }
    }
  }

  return Object.fromEntries(existingRoles.entries())
}

async function createTeamRecord(params: CreateTeamParams): Promise<{
  id: string
  slug: string
  name: string
  defaultRoleId: string
  defaultRoleKey: string
}> {
  const {
    client,
    organizationId,
    createdBy,
    name,
    defaultRole,
    purpose,
    description,
    settings,
    metadata,
  } = params

  const baseSlug = slugify(name) || 'team'
  const slug = `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`
  const now = new Date().toISOString()

  const { data, error } = await client
    .schema('core')
    .from('teams')
    .insert({
      organization_id: organizationId,
      name,
      slug,
      created_by: createdBy,
      default_role_id: defaultRole.id,
      default_role_key: defaultRole.key,
      description: description ?? { type: 'doc', content: [] },
      purpose: purpose ?? 'integration-test',
      visibility: 'organization',
      invitation_policy: 'invite_only',
      invitation_expiration_days: 7,
      allow_self_join: false,
      auto_assign_jobs: false,
      metadata: metadata ?? {},
      settings: settings ?? {},
      updated_by: createdBy,
      updated_at: now,
    })
    .select('id, slug, name, default_role_id, default_role_key')
    .single()

  if (error || !data) {
    throw new Error(`Failed to create team fixture: ${error?.message ?? 'No record returned'}`)
  }

  return {
    id: data.id,
    slug: data.slug,
    name: data.name,
    defaultRoleId: data.default_role_id,
    defaultRoleKey: data.default_role_key,
  }
}

async function upsertTeamMemberRecord(params: TeamMemberParams): Promise<void> {
  const { client, teamId, userId, role, addedBy } = params

  const { error } = await client.schema('core').from('team_members').upsert(
    {
      team_id: teamId,
      user_id: userId,
      role_id: role.id,
      status: 'active',
      added_by: addedBy,
      joined_at: new Date().toISOString(),
      metadata: {},
      permissions_override: {},
    },
    { onConflict: 'team_id,user_id' }
  )

  if (error) {
    throw new Error(`Failed to upsert team member fixture: ${error.message}`)
  }
}

export async function setupTeamManagementFixture(
  options: TeamFixtureOptions = {}
): Promise<TeamFixtureResult> {
  const tokens = await loadCachedTokens()
  if (!tokens) {
    throw new Error(
      'Cached auth tokens not found. Run auth.test.ts to generate tokens before running team management tests.'
    )
  }

  const adminClient = createAdminClient()

  const ownerProfile: ProfileDefaults = {
    displayName: 'Team Owner',
    firstName: 'Team',
    lastName: 'Owner',
    ...options.ownerProfileDefaults,
  }

  const memberProfile: ProfileDefaults = {
    displayName: 'Team Member',
    firstName: 'Team',
    lastName: 'Member',
    ...options.memberProfileDefaults,
  }

  await ensureUserRecords(adminClient, tokens.admin.userId, {
    defaults: ownerProfile,
  })

  await ensureUserRecords(adminClient, tokens.regular.userId, {
    defaults: memberProfile,
  })

  const ownerClient = createTestClient(tokens.admin.token)
  const memberClient = createTestClient(tokens.regular.token)

  const organization = await createOrganizationRecord({
    client: adminClient,
    ownerUserId: tokens.admin.userId,
    name: options.organizationName ?? `Integration Org ${crypto.randomUUID().slice(0, 8)}`,
    visibility: options.organizationVisibility ?? 'private',
  })

  const organizationTeamRoles = await ensureOrganizationTeamRoles(adminClient, organization.id)

  const normalizedDefaultKey = normalizeTeamRoleKey(options.defaultTeamRoleKey ?? 'member')
  const defaultRole = organizationTeamRoles[normalizedDefaultKey]

  if (!defaultRole) {
    throw new Error(
      `Requested default team role "${normalizedDefaultKey}" is not available for organization fixtures.`
    )
  }

  const ownerTeamRole = organizationTeamRoles['admin']
  if (!ownerTeamRole) {
    throw new Error('Organization team role "admin" is required for team management fixtures.')
  }

  const memberRole = organizationTeamRoles['member']
  if (!memberRole) {
    throw new Error('Organization team role "member" is required for team management fixtures.')
  }

  const team = await createTeamRecord({
    client: adminClient,
    organizationId: organization.id,
    createdBy: tokens.admin.userId,
    name: options.teamName ?? `Integration Team ${crypto.randomUUID().slice(0, 6)}`,
    defaultRole,
    purpose: options.purpose,
    description: options.description,
    settings: options.settings,
    metadata: options.metadata,
  })

  await upsertTeamMemberRecord({
    client: adminClient,
    teamId: team.id,
    userId: tokens.admin.userId,
    role: ownerTeamRole,
    addedBy: tokens.admin.userId,
  })

  await upsertTeamMemberRecord({
    client: adminClient,
    teamId: team.id,
    userId: tokens.regular.userId,
    role: memberRole,
    addedBy: tokens.admin.userId,
  })

  return {
    organization,
    team,
    owner: {
      client: ownerClient,
      token: tokens.admin.token,
      email: tokens.admin.email,
      userId: tokens.admin.userId,
    },
    member: {
      client: memberClient,
      token: tokens.regular.token,
      email: tokens.regular.email,
      userId: tokens.regular.userId,
    },
    roles: organizationTeamRoles,
  }
}

export async function ensureTeamUserRecords(
  adminClient: SupabaseClient,
  userId: string,
  defaults: { displayName?: string; firstName?: string; lastName?: string } = {}
): Promise<void> {
  await ensureUserRecords(adminClient, userId, {
    defaults: {
      displayName: defaults.displayName ?? 'Team User',
      firstName: defaults.firstName ?? 'Team',
      lastName: defaults.lastName ?? 'User',
    },
  })
}
