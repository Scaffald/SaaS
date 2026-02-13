/**
 * Teams REST API
 * Manages teams, members, invitations, and job assignments
 * Migrated from: packages/supabase/functions/trpc/routers/teams.router.ts
 */

import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { authMiddleware } from '../middleware/auth.ts'

const app = new OpenAPIHono()

app.use('*', authMiddleware)

// ============================================================================
// Schemas
// ============================================================================

const errorResponseSchema = z
  .object({
    error: z.string(),
    message: z.string().optional(),
  })
  .openapi('ErrorResponse')

const teamSchema = z
  .object({
    id: z.string().uuid(),
    organization_id: z.string().uuid(),
    name: z.string(),
    purpose: z.string().nullable(),
    description: z.string().nullable(),
    visibility: z.enum(['organization', 'public', 'private']),
    invitation_policy: z.enum(['invite_only', 'self_join', 'approval_required']),
    allow_self_join: z.boolean(),
    is_archived: z.boolean(),
    created_at: z.string(),
    updated_at: z.string(),
  })
  .openapi('Team')

const teamMemberSchema = z
  .object({
    id: z.string().uuid(),
    team_id: z.string().uuid(),
    user_id: z.string().uuid(),
    role_key: z.string(),
    status: z.enum(['active', 'inactive']),
    joined_at: z.string(),
  })
  .openapi('TeamMember')

const teamInvitationSchema = z
  .object({
    id: z.string().uuid(),
    team_id: z.string().uuid(),
    email: z.string().email(),
    role_key: z.string(),
    status: z.enum(['pending', 'accepted', 'declined', 'cancelled']),
    expires_at: z.string(),
    created_at: z.string(),
  })
  .openapi('TeamInvitation')

const teamJobAssignmentSchema = z
  .object({
    id: z.string().uuid(),
    team_id: z.string().uuid(),
    job_id: z.string().uuid(),
    assigned_at: z.string(),
  })
  .openapi('TeamJobAssignment')

// Request schemas
const listTeamsQuerySchema = z.object({
  organizationId: z.string().uuid().optional(),
  includeArchived: z
    .string()
    .transform((v) => v === 'true')
    .optional(),
})

const createTeamSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1),
  purpose: z.string().optional(),
  description: z.string().optional(),
  visibility: z.enum(['organization', 'public', 'private']).default('organization'),
  invitationPolicy: z
    .enum(['invite_only', 'self_join', 'approval_required'])
    .default('invite_only'),
  allowSelfJoin: z.boolean().default(false),
})

const updateTeamSchema = z.object({
  name: z.string().min(1).optional(),
  purpose: z.string().optional(),
  description: z.string().optional(),
  visibility: z.enum(['organization', 'public', 'private']).optional(),
  invitationPolicy: z.enum(['invite_only', 'self_join', 'approval_required']).optional(),
  allowSelfJoin: z.boolean().optional(),
})

const archiveTeamSchema = z.object({
  reason: z.string().optional(),
})

const addMemberSchema = z.object({
  userId: z.string().uuid(),
  roleKey: z.string().default('member'),
})

const updateMemberSchema = z.object({
  roleKey: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
})

const inviteMemberSchema = z.object({
  email: z.string().email(),
  roleKey: z.string().default('member'),
})

const _respondToInvitationSchema = z.object({
  accept: z.boolean(),
})

const _respondToInvitationWithTokenSchema = z.object({
  token: z.string(),
  accept: z.boolean(),
})

const createJobAssignmentSchema = z.object({
  jobId: z.string().uuid(),
})

// Response schemas
const teamsListResponseSchema = z
  .object({
    teams: z.array(teamSchema),
  })
  .openapi('TeamsListResponse')

const teamResponseSchema = z
  .object({
    team: teamSchema,
  })
  .openapi('TeamResponse')

const teamMembersListResponseSchema = z
  .object({
    members: z.array(teamMemberSchema),
  })
  .openapi('TeamMembersListResponse')

const teamMemberResponseSchema = z
  .object({
    member: teamMemberSchema,
  })
  .openapi('TeamMemberResponse')

const teamInvitationsListResponseSchema = z
  .object({
    invitations: z.array(teamInvitationSchema),
  })
  .openapi('TeamInvitationsListResponse')

const teamInvitationResponseSchema = z
  .object({
    invitation: teamInvitationSchema,
  })
  .openapi('TeamInvitationResponse')

const teamJobAssignmentsListResponseSchema = z
  .object({
    assignments: z.array(teamJobAssignmentSchema),
  })
  .openapi('TeamJobAssignmentsListResponse')

const teamJobAssignmentResponseSchema = z
  .object({
    assignment: teamJobAssignmentSchema,
  })
  .openapi('TeamJobAssignmentResponse')

const deleteResponseSchema = z
  .object({
    success: z.boolean(),
  })
  .openapi('DeleteResponse')

const _rolesListResponseSchema = z
  .object({
    roles: z.array(
      z.object({
        key: z.string(),
        name: z.string(),
        description: z.string().nullable(),
      })
    ),
  })
  .openapi('RolesListResponse')

// ============================================================================
// Core Team Routes
// ============================================================================

// GET / - List teams
const listRoute = createRoute({
  method: 'get',
  path: '/',
  summary: 'List teams',
  request: {
    query: listTeamsQuerySchema,
  },
  responses: {
    200: {
      content: { 'application/json': { schema: teamsListResponseSchema } },
      description: 'List of teams',
    },
    401: {
      content: { 'application/json': { schema: errorResponseSchema } },
      description: 'Unauthorized',
    },
  },
})

app.openapi(listRoute, async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')
  const { organizationId, includeArchived } = c.req.valid('query')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    let query = supabase
      .schema('core')
      .from('teams')
      .select('*')
      .order('created_at', { ascending: false })

    if (organizationId) {
      query = query.eq('organization_id', organizationId)
    }

    if (!includeArchived) {
      query = query.eq('is_archived', false)
    }

    const { data, error } = await query

    if (error) {
      return c.json({ error: 'Failed to fetch teams', message: error.message }, 500)
    }

    return c.json({ teams: data || [] })
  } catch (error) {
    console.error('Error listing teams:', error)
    return c.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

// GET /:id - Get team by ID
const getByIdRoute = createRoute({
  method: 'get',
  path: '/{id}',
  summary: 'Get team by ID',
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: teamResponseSchema } },
      description: 'Team details',
    },
    404: {
      content: { 'application/json': { schema: errorResponseSchema } },
      description: 'Team not found',
    },
  },
})

app.openapi(getByIdRoute, async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')
  const { id } = c.req.valid('param')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const { data, error } = await supabase
      .schema('core')
      .from('teams')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return c.json({ error: 'Team not found' }, 404)
    }

    return c.json({ team: data })
  } catch (error) {
    console.error('Error fetching team:', error)
    return c.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

// POST / - Create team
const createTeamRoute = createRoute({
  method: 'post',
  path: '/',
  summary: 'Create a new team',
  request: {
    body: {
      content: { 'application/json': { schema: createTeamSchema } },
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: teamResponseSchema } },
      description: 'Created team',
    },
  },
})

app.openapi(createTeamRoute, async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')
  const body = await c.req.json()

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const result = createTeamSchema.safeParse(body)
  if (!result.success) {
    return c.json({ error: 'Validation error', message: result.error.message }, 400)
  }

  const {
    organizationId,
    name,
    purpose,
    description,
    visibility,
    invitationPolicy,
    allowSelfJoin,
  } = result.data

  try {
    const { data, error } = await supabase
      .schema('core')
      .from('teams')
      .insert({
        organization_id: organizationId,
        name,
        purpose: purpose || null,
        description: description || null,
        visibility,
        invitation_policy: invitationPolicy,
        allow_self_join: allowSelfJoin,
      })
      .select()
      .single()

    if (error || !data) {
      return c.json({ error: 'Failed to create team', message: error?.message }, 500)
    }

    // Add creator as team owner
    await supabase.schema('core').from('team_members').insert({
      team_id: data.id,
      user_id: user.id,
      role_key: 'owner',
      status: 'active',
    })

    return c.json({ team: data })
  } catch (error) {
    console.error('Error creating team:', error)
    return c.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

// PATCH /:id - Update team
const updateRoute = createRoute({
  method: 'patch',
  path: '/{id}',
  summary: 'Update a team',
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: { 'application/json': { schema: updateTeamSchema } },
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: teamResponseSchema } },
      description: 'Updated team',
    },
  },
})

app.openapi(updateRoute, async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')
  const { id } = c.req.valid('param')
  const body = await c.req.json()

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const result = updateTeamSchema.safeParse(body)
  if (!result.success) {
    return c.json({ error: 'Validation error', message: result.error.message }, 400)
  }

  try {
    const updateData: Record<string, unknown> = {}
    if (result.data.name) updateData.name = result.data.name
    if (result.data.purpose !== undefined) updateData.purpose = result.data.purpose
    if (result.data.description !== undefined) updateData.description = result.data.description
    if (result.data.visibility) updateData.visibility = result.data.visibility
    if (result.data.invitationPolicy) updateData.invitation_policy = result.data.invitationPolicy
    if (result.data.allowSelfJoin !== undefined)
      updateData.allow_self_join = result.data.allowSelfJoin

    const { data, error } = await supabase
      .schema('core')
      .from('teams')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error || !data) {
      return c.json({ error: 'Failed to update team', message: error?.message }, 500)
    }

    return c.json({ team: data })
  } catch (error) {
    console.error('Error updating team:', error)
    return c.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

// POST /:id/archive - Archive team
const archiveRoute = createRoute({
  method: 'post',
  path: '/{id}/archive',
  summary: 'Archive a team',
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: { 'application/json': { schema: archiveTeamSchema } },
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: teamResponseSchema } },
      description: 'Archived team',
    },
  },
})

app.openapi(archiveRoute, async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')
  const { id } = c.req.valid('param')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const { data, error } = await supabase
      .schema('core')
      .from('teams')
      .update({ is_archived: true })
      .eq('id', id)
      .select()
      .single()

    if (error || !data) {
      return c.json({ error: 'Failed to archive team', message: error?.message }, 500)
    }

    return c.json({ team: data })
  } catch (error) {
    console.error('Error archiving team:', error)
    return c.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

// ============================================================================
// Member Management Routes
// ============================================================================

// GET /:id/members - List team members
const listMembersRoute = createRoute({
  method: 'get',
  path: '/{id}/members',
  summary: 'List team members',
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: teamMembersListResponseSchema } },
      description: 'List of team members',
    },
  },
})

app.openapi(listMembersRoute, async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')
  const { id } = c.req.valid('param')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const { data, error } = await supabase
      .schema('core')
      .from('team_members')
      .select('*')
      .eq('team_id', id)
      .order('joined_at', { ascending: false })

    if (error) {
      return c.json({ error: 'Failed to fetch members', message: error.message }, 500)
    }

    return c.json({ members: data || [] })
  } catch (error) {
    console.error('Error listing members:', error)
    return c.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

// POST /:id/members - Add team member
const addMemberRoute = createRoute({
  method: 'post',
  path: '/{id}/members',
  summary: 'Add a member to the team',
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: { 'application/json': { schema: addMemberSchema } },
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: teamMemberResponseSchema } },
      description: 'Added team member',
    },
  },
})

app.openapi(addMemberRoute, async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')
  const { id } = c.req.valid('param')
  const body = await c.req.json()

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const result = addMemberSchema.safeParse(body)
  if (!result.success) {
    return c.json({ error: 'Validation error', message: result.error.message }, 400)
  }

  try {
    const { data, error } = await supabase
      .schema('core')
      .from('team_members')
      .insert({
        team_id: id,
        user_id: result.data.userId,
        role_key: result.data.roleKey,
        status: 'active',
      })
      .select()
      .single()

    if (error || !data) {
      return c.json({ error: 'Failed to add member', message: error?.message }, 500)
    }

    return c.json({ member: data })
  } catch (error) {
    console.error('Error adding member:', error)
    return c.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

// PATCH /:id/members/:userId - Update team member
const updateMemberRoute = createRoute({
  method: 'patch',
  path: '/{id}/members/{userId}',
  summary: 'Update a team member',
  request: {
    params: z.object({
      id: z.string().uuid(),
      userId: z.string().uuid(),
    }),
    body: {
      content: { 'application/json': { schema: updateMemberSchema } },
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: teamMemberResponseSchema } },
      description: 'Updated team member',
    },
  },
})

app.openapi(updateMemberRoute, async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')
  const { id, userId } = c.req.valid('param')
  const body = await c.req.json()

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const result = updateMemberSchema.safeParse(body)
  if (!result.success) {
    return c.json({ error: 'Validation error', message: result.error.message }, 400)
  }

  try {
    const updateData: Record<string, unknown> = {}
    if (result.data.roleKey) updateData.role_key = result.data.roleKey
    if (result.data.status) updateData.status = result.data.status

    const { data, error } = await supabase
      .schema('core')
      .from('team_members')
      .update(updateData)
      .eq('team_id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error || !data) {
      return c.json({ error: 'Failed to update member', message: error?.message }, 500)
    }

    return c.json({ member: data })
  } catch (error) {
    console.error('Error updating member:', error)
    return c.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

// DELETE /:id/members/:userId - Remove team member
const removeMemberRoute = createRoute({
  method: 'delete',
  path: '/{id}/members/{userId}',
  summary: 'Remove a team member',
  request: {
    params: z.object({
      id: z.string().uuid(),
      userId: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: deleteResponseSchema } },
      description: 'Member removed',
    },
  },
})

app.openapi(removeMemberRoute, async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')
  const { id, userId } = c.req.valid('param')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const { error } = await supabase
      .schema('core')
      .from('team_members')
      .delete()
      .eq('team_id', id)
      .eq('user_id', userId)

    if (error) {
      return c.json({ error: 'Failed to remove member', message: error.message }, 500)
    }

    return c.json({ success: true })
  } catch (error) {
    console.error('Error removing member:', error)
    return c.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

// ============================================================================
// Invitation Routes
// ============================================================================

// GET /:id/invitations - List team invitations
const listInvitationsRoute = createRoute({
  method: 'get',
  path: '/{id}/invitations',
  summary: 'List team invitations',
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: teamInvitationsListResponseSchema } },
      description: 'List of team invitations',
    },
  },
})

app.openapi(listInvitationsRoute, async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')
  const { id } = c.req.valid('param')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const { data, error } = await supabase
      .schema('core')
      .from('team_invitations')
      .select('*')
      .eq('team_id', id)
      .order('created_at', { ascending: false })

    if (error) {
      return c.json({ error: 'Failed to fetch invitations', message: error.message }, 500)
    }

    return c.json({ invitations: data || [] })
  } catch (error) {
    console.error('Error listing invitations:', error)
    return c.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

// POST /:id/invitations - Invite member
const inviteMemberRoute = createRoute({
  method: 'post',
  path: '/{id}/invitations',
  summary: 'Invite a member to the team',
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: { 'application/json': { schema: inviteMemberSchema } },
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: teamInvitationResponseSchema } },
      description: 'Created invitation',
    },
  },
})

app.openapi(inviteMemberRoute, async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')
  const { id } = c.req.valid('param')
  const body = await c.req.json()

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const result = inviteMemberSchema.safeParse(body)
  if (!result.success) {
    return c.json({ error: 'Validation error', message: result.error.message }, 400)
  }

  try {
    // Set expiration to 7 days from now
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const { data, error } = await supabase
      .schema('core')
      .from('team_invitations')
      .insert({
        team_id: id,
        email: result.data.email,
        role_key: result.data.roleKey,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (error || !data) {
      return c.json({ error: 'Failed to create invitation', message: error?.message }, 500)
    }

    // TODO: Send invitation email

    return c.json({ invitation: data })
  } catch (error) {
    console.error('Error creating invitation:', error)
    return c.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

// DELETE /:id/invitations/:invitationId - Cancel invitation
const cancelInvitationRoute = createRoute({
  method: 'delete',
  path: '/{id}/invitations/{invitationId}',
  summary: 'Cancel a team invitation',
  request: {
    params: z.object({
      id: z.string().uuid(),
      invitationId: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: deleteResponseSchema } },
      description: 'Invitation cancelled',
    },
  },
})

app.openapi(cancelInvitationRoute, async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')
  const { invitationId } = c.req.valid('param')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const { error } = await supabase
      .schema('core')
      .from('team_invitations')
      .update({ status: 'cancelled' })
      .eq('id', invitationId)

    if (error) {
      return c.json({ error: 'Failed to cancel invitation', message: error.message }, 500)
    }

    return c.json({ success: true })
  } catch (error) {
    console.error('Error cancelling invitation:', error)
    return c.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

// ============================================================================
// Job Assignment Routes
// ============================================================================

// GET /:id/job-assignments - List job assignments
const listJobAssignmentsRoute = createRoute({
  method: 'get',
  path: '/{id}/job-assignments',
  summary: 'List team job assignments',
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: teamJobAssignmentsListResponseSchema } },
      description: 'List of job assignments',
    },
  },
})

app.openapi(listJobAssignmentsRoute, async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')
  const { id } = c.req.valid('param')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const { data, error } = await supabase
      .schema('core')
      .from('team_job_assignments')
      .select('*')
      .eq('team_id', id)
      .order('assigned_at', { ascending: false })

    if (error) {
      return c.json({ error: 'Failed to fetch job assignments', message: error.message }, 500)
    }

    return c.json({ assignments: data || [] })
  } catch (error) {
    console.error('Error listing job assignments:', error)
    return c.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

// POST /:id/job-assignments - Create job assignment
const createJobAssignmentRoute = createRoute({
  method: 'post',
  path: '/{id}/job-assignments',
  summary: 'Assign a job to the team',
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: { 'application/json': { schema: createJobAssignmentSchema } },
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: teamJobAssignmentResponseSchema } },
      description: 'Created job assignment',
    },
  },
})

app.openapi(createJobAssignmentRoute, async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')
  const { id } = c.req.valid('param')
  const body = await c.req.json()

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const result = createJobAssignmentSchema.safeParse(body)
  if (!result.success) {
    return c.json({ error: 'Validation error', message: result.error.message }, 400)
  }

  try {
    const { data, error } = await supabase
      .schema('core')
      .from('team_job_assignments')
      .insert({
        team_id: id,
        job_id: result.data.jobId,
      })
      .select()
      .single()

    if (error || !data) {
      return c.json({ error: 'Failed to create job assignment', message: error?.message }, 500)
    }

    return c.json({ assignment: data })
  } catch (error) {
    console.error('Error creating job assignment:', error)
    return c.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

// DELETE /:id/job-assignments/:assignmentId - Delete job assignment
const deleteJobAssignmentRoute = createRoute({
  method: 'delete',
  path: '/{id}/job-assignments/{assignmentId}',
  summary: 'Remove a job assignment',
  request: {
    params: z.object({
      id: z.string().uuid(),
      assignmentId: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: deleteResponseSchema } },
      description: 'Job assignment removed',
    },
  },
})

app.openapi(deleteJobAssignmentRoute, async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')
  const { assignmentId } = c.req.valid('param')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const { error } = await supabase
      .schema('core')
      .from('team_job_assignments')
      .delete()
      .eq('id', assignmentId)

    if (error) {
      return c.json({ error: 'Failed to delete job assignment', message: error.message }, 500)
    }

    return c.json({ success: true })
  } catch (error) {
    console.error('Error deleting job assignment:', error)
    return c.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

export default app
