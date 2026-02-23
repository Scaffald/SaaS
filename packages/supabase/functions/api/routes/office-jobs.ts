/**
 * Office Jobs REST API
 * Office role required. Migrated from tRPC office.listJobs.
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { authMiddleware, requireRole } from '../middleware/auth.ts'
import { loadUserRoleAssignments, isSuperAdmin } from '../../_shared/permissions/team-permissions.ts'

const listJobsQuerySchema = z.object({
  organization_id: z.string().uuid().optional(),
  status: z.enum(['draft', 'open', 'paused', 'closed']).optional(),
  team_id: z.string().uuid().optional(),
  myTeamsOnly: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

const app = new Hono()
app.use('*', authMiddleware)
app.use('*', requireRole('office', 'platform'))

app.get('/', zValidator('query', listJobsQuerySchema), async (c) => {
  const supabaseAdmin = c.get('supabaseAdmin')
  const user = c.get('user')

  if (!supabaseAdmin || !user?.id) {
    return c.json({ error: 'Unauthorized', message: 'User not authenticated' }, 401)
  }

  const input = c.req.valid('query')

  const assignments = await loadUserRoleAssignments(supabaseAdmin, user.id)
  const superAdmin = isSuperAdmin(assignments)

  let organizationIds: Set<string> | null = null
  if (!superAdmin) {
    organizationIds = new Set<string>()

    const { data: ownedOrgs, error: ownedError } = await supabaseAdmin
      .schema('core')
      .from('organizations')
      .select('id')
      .eq('owner_user_id', user.id)

    if (ownedError) {
      return c.json({
        error: 'Internal Server Error',
        message: `Failed to fetch owned organizations: ${ownedError.message}`,
      }, 500)
    }

    for (const org of ownedOrgs ?? []) {
      if (org.id) organizationIds.add(org.id as string)
    }

    const { data: teamMemberships, error: membershipsError } = await supabaseAdmin
      .schema('core')
      .from('team_members')
      .select('teams!inner(organization_id)')
      .eq('user_id', user.id)
      .neq('status', 'removed')

    if (membershipsError) {
      return c.json({
        error: 'Internal Server Error',
        message: `Failed to load team memberships: ${membershipsError.message}`,
      }, 500)
    }

    for (const membership of teamMemberships ?? []) {
      const orgId = (membership as { teams?: { organization_id?: string } })?.teams?.organization_id
      if (orgId && typeof orgId === 'string') organizationIds.add(orgId)
    }

    if (organizationIds.size === 0) {
      return c.json({ data: { jobs: [], total: 0 } })
    }

    if (input.organization_id) {
      if (!organizationIds.has(input.organization_id)) {
        return c.json({ error: 'Forbidden', message: 'You do not have access to this organization' }, 403)
      }
      organizationIds.clear()
      organizationIds.add(input.organization_id)
    }
  }

  const jobTeamsRelationship =
    input.team_id || input.myTeamsOnly ? 'job_team_assignments!inner' : 'job_team_assignments'
  const selectClause = `
    id,
    title,
    description,
    status,
    employment_type,
    remote_option,
    location,
    pay_range_min_cents,
    pay_range_max_cents,
    pay_range_type,
    posted_at,
    created_at,
    updated_at,
    organization:organizations!organization_id(id, name, slug),
    team:teams(id, name, organization_id),
    team_assignments:${jobTeamsRelationship}(
      team_id,
      is_primary,
      role_key,
      assigned_at,
      team:teams(id, name, organization_id)
    ),
    created_by:users!created_by_user_id(id, username, display_name)
  `

  let query = supabaseAdmin
    .schema('core')
    .from('jobs')
    .select(selectClause, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(input.offset, input.offset + input.limit - 1)

  if (!superAdmin && organizationIds && organizationIds.size > 0) {
    query = query.in('organization_id', Array.from(organizationIds))
  } else if (input.organization_id) {
    query = query.eq('organization_id', input.organization_id)
  }

  if (input.status) query = query.eq('status', input.status)
  if (input.team_id) query = query.eq('team_assignments.team_id', input.team_id)

  if (input.myTeamsOnly) {
    const { data: memberships, error: membershipsError } = await supabaseAdmin
      .schema('core')
      .from('team_members')
      .select('team_id')
      .eq('user_id', user.id)
      .neq('status', 'removed')

    if (membershipsError) {
      return c.json({
        error: 'Internal Server Error',
        message: `Failed to load team memberships: ${membershipsError.message}`,
      }, 500)
    }

    const teamIds = (memberships ?? [])
      .map((m: { team_id?: string | null }) => m.team_id as string | null)
      .filter((id: string | null): id is string => Boolean(id))

    if (teamIds.length === 0) {
      return c.json({ data: { jobs: [], total: 0 } })
    }
    query = query.in('team_assignments.team_id', teamIds)
  }

  const { data, error, count } = await query

  if (error) {
    return c.json({
      error: 'Internal Server Error',
      message: `Failed to fetch jobs: ${error.message}`,
    }, 500)
  }

  const jobs = (data ?? []).map((job: Record<string, unknown>) => {
    const { team_assignments: jobTeamsRaw, ...rest } = job
    const teamAssignments =
      (jobTeamsRaw as Array<Record<string, unknown>> | null)?.map((assignment: Record<string, unknown>) => ({
        teamId: assignment.team_id as string,
        isPrimary: Boolean(assignment.is_primary),
        roleKey: assignment.role_key as string,
        assignedAt: assignment.assigned_at as string,
        team: assignment.team
          ? {
              id: (assignment.team as Record<string, unknown>).id as string,
              name: (assignment.team as Record<string, unknown>).name as string | null,
              organization_id: (assignment.team as Record<string, unknown>).organization_id as string,
            }
          : null,
      })) ?? []

    const primaryAssignment = teamAssignments.find((a) => a.isPrimary) ?? null

    return {
      ...rest,
      teamAssignments,
      team_ids: teamAssignments.map((a) => a.teamId),
      primary_team_id: primaryAssignment?.teamId ?? null,
      team: primaryAssignment?.team ?? null,
    }
  })

  return c.json({ data: { jobs, total: count ?? 0 } })
})

export default app
