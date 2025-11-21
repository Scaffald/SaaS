import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { jobCreateSchema, jobUpdateSchema } from '../../_shared/job-schemas.ts'
import { employmentProfileSchema, generalProfileSchema } from '../../_shared/profile-schemas.ts'
import { transformJobSkills } from '../../_shared/skill-helpers.ts'
import { officeProcedure, t } from '../middleware.ts'
import { officeProfilesRouter } from './office/profiles.router.ts'
import { officeStorageRouter } from './office/storage.router.ts'
import { officeUniversitiesRouter } from './office/universities.router.ts'
import { officeTeamsRouter } from './teams.router.ts'

const RESERVED_ORGANIZATION_SLUGS = new Set([
  'admin',
  'api',
  'auth',
  'dashboard',
  'office',
  'settings',
  'profile',
  'user',
  'users',
  'org',
  'organization',
  'organizations',
  'job',
  'jobs',
  'about',
  'contact',
  'help',
  'support',
  'terms',
  'privacy',
  'legal',
  'login',
  'logout',
  'signup',
  'sign-in',
  'sign-up',
  'register',
  'forgot-password',
  'reset-password',
])

const ORGANIZATION_SLUG_PATTERN = /^[a-z0-9-]+$/
const MAX_ORGANIZATION_SLUG_LENGTH = 120

type OrganizationSlugValidationReason = 'format' | 'reserved'

/**
 * Office router - super admin only operations
 */
export const officeRouter = t.router({
  universities: officeUniversitiesRouter,
  profiles: officeProfilesRouter,
  teams: officeTeamsRouter,
  storage: officeStorageRouter,
  /**
   * Check organization slug availability before creation/update.
   */
  checkOrganizationSlug: officeProcedure
    .input(
      z.object({
        slug: z.string().min(1, 'Vanity URL is required').max(120, 'Vanity URL must be 120 characters or fewer'),
        organizationId: z.string().uuid().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const normalizedSlug = normalizeOrganizationSlugInput(input.slug)
      const validation = validateOrganizationSlug(normalizedSlug)

      if (!validation.valid) {
        return {
          available: false,
          reason: validation.reason ?? 'format',
          message:
            validation.reason === 'reserved'
              ? 'This vanity URL is reserved for internal routes.'
              : 'Vanity URL must be 3-120 characters, lowercase letters, numbers, and single hyphens.',
          suggestions: [],
          slug: normalizedSlug,
        }
      }

      const {
        data: existing,
        error: existingError,
      } = await ctx.supabaseAdmin
        .schema('core')
        .from('organizations')
        .select('id')
        .eq('slug', normalizedSlug)
        .maybeSingle()

      if (existingError && existingError.code !== 'PGRST116') {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to check slug availability: ${existingError.message}`,
        })
      }

      if (existing && existing.id !== input.organizationId) {
        const { data: similar } = await ctx.supabaseAdmin
          .schema('core')
          .from('organizations')
          .select('slug')
          .like('slug', `${normalizedSlug}%`)
          .limit(10)

        const suggestions = getOrganizationSlugSuggestions(
          normalizedSlug,
          (similar || []).map((org) => org.slug || '').filter((slug): slug is string => Boolean(slug))
        )

        return {
          available: false,
          reason: 'taken' as const,
          message: 'An organization with this vanity URL already exists.',
          suggestions,
          slug: normalizedSlug,
        }
      }

      return {
        available: true,
        slug: normalizedSlug,
      }
    }),
  /**
   * List all users
   * Returns paginated list of users with basic profile info
   */
  listUsers: officeProcedure.query(async ({ ctx }) => {
    // Get public user data
    const {
      data: usersData,
      error: usersError,
      count,
    } = await ctx.supabaseAdmin
      .schema('core')
      .from('users')
      .select('id, username, display_name, avatar_path, created_at, updated_at', {
        count: 'exact',
      })
      .order('created_at', { ascending: false })
      .limit(50)

    if (usersError) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: usersError.message,
      })
    }

    // Get private profile data for all users
    const userIds = usersData?.map((u) => u.id) || []
    const { data: profilesData } = await ctx.supabaseAdmin
      .schema('core')
      .from('profile')
      .select('user_id, first_name, last_name')
      .in('user_id', userIds)

    // Create a map for quick lookup
    const profilesMap = new Map(profilesData?.map((p) => [p.user_id, p]) || [])

    // Combine the data
    const users = (usersData ?? []).map((user) => {
      const profile = profilesMap.get(user.id)
      return {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        first_name: profile?.first_name || '',
        last_name: profile?.last_name || '',
        avatar_path: user.avatar_path,
        created_at: user.created_at,
        updated_at: user.updated_at,
      }
    })

    return { users, total: count ?? 0 }
  }),

  /**
   * Get user details
   */
  getUser: officeProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Get profile data
      const { data: profile, error: profileError } = await ctx.supabaseAdmin
        .schema('core')
        .from('users')
        .select('*')
        .eq('id', input.id)
        .single()

      if (profileError) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `User not found: ${profileError.message}`,
        })
      }

      // Get private data
      const { data: privateData, error: privateError } = await ctx.supabaseAdmin
        .schema('core')
        .from('profile')
        .select('*')
        .eq('user_id', input.id)
        .single()

      if (privateError && privateError.code !== 'PGRST116') {
        // PGRST116 is "no rows returned", which is acceptable
        console.error('Error fetching private data:', privateError)
      }

      return {
        profile,
        privateData: privateData || null,
      }
    }),

  /**
   * Update user profile and private data
   */
  updateUser: officeProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        profile: z
          .object({
            first_name: z.string().optional(),
            last_name: z.string().optional(),
            display_name: z.string().optional(),
            bio: z.string().optional(),
          })
          .optional(),
        privateData: z
          .object({
            birth_date: z.string().optional(),
            location: z.string().optional(),
            employment_status: z.string().optional(),
            job_search_status: z.string().optional(),
            years_of_experience: z.number().optional(),
            current_title: z.string().optional(),
            current_employer: z.string().optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, profile, privateData } = input

      // Update profile if data provided
      if (profile) {
        const { error: profileError } = await ctx.supabaseAdmin
          .schema('core')
          .from('users')
          .update(profile)
          .eq('id', id)

        if (profileError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to update profile: ${profileError.message}`,
          })
        }
      }

      // Update private data if provided
      if (privateData) {
        const { error: privateError } = await ctx.supabaseAdmin
          .schema('core')
          .from('profile')
          .update(privateData)
          .eq('user_id', id)

        if (privateError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to update private data: ${privateError.message}`,
          })
        }
      }

      return { success: true }
    }),

  /**
   * List all jobs (admin view)
   * Returns jobs with optional filters
   */
  listJobs: officeProcedure
    .input(
      z.object({
        organization_id: z.string().uuid().optional(),
        status: z.enum(['draft', 'open', 'paused', 'closed']).optional(),
        team_id: z.string().uuid().optional(),
        myTeamsOnly: z.boolean().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const { supabaseAdmin, user } = ctx

      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        })
      }

      // Check if user is super admin
      const { loadUserRoleAssignments, isSuperAdmin } = await import(
        '../../_shared/permissions/team-permissions.ts'
      )
      const assignments = await loadUserRoleAssignments(supabaseAdmin, user.id)
      const superAdmin = isSuperAdmin(assignments)

      // Get user's accessible organization IDs (unless super admin)
      let organizationIds: Set<string> | null = null
      if (!superAdmin) {
        organizationIds = new Set<string>()

        // 1. Organizations owned by user
        const { data: ownedOrgs, error: ownedError } = await supabaseAdmin
          .schema('core')
          .from('organizations')
          .select('id')
          .eq('owner_user_id', user.id)

        if (ownedError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to fetch owned organizations: ${ownedError.message}`,
          })
        }

        // Add owned organizations
        for (const org of ownedOrgs ?? []) {
          if (org.id) {
            organizationIds.add(org.id as string)
          }
        }

        // 2. Organizations where user is a team member
        const { data: teamMemberships, error: membershipsError } = await supabaseAdmin
          .schema('core')
          .from('team_members')
          .select('teams!inner(organization_id)')
          .eq('user_id', user.id)
          .neq('status', 'removed')

        if (membershipsError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to load team memberships: ${membershipsError.message}`,
          })
        }

        // Add organizations from team memberships
        for (const membership of teamMemberships ?? []) {
          const orgId = membership.teams?.organization_id
          if (orgId && typeof orgId === 'string') {
            organizationIds.add(orgId)
          }
        }

        // If user has no organization access, return empty result
        if (organizationIds.size === 0) {
          return {
            jobs: [],
            total: 0,
          }
        }

        // If organization_id filter is provided, verify user has access
        if (input.organization_id) {
          if (!organizationIds.has(input.organization_id)) {
            throw new TRPCError({
              code: 'FORBIDDEN',
              message: 'You do not have access to this organization',
            })
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

      // Apply organization filter (unless super admin)
      if (!superAdmin && organizationIds && organizationIds.size > 0) {
        query = query.in('organization_id', Array.from(organizationIds))
      } else if (input.organization_id) {
        query = query.eq('organization_id', input.organization_id)
      }

      if (input.status) {
        query = query.eq('status', input.status)
      }

      if (input.team_id) {
        query = query.eq('team_assignments.team_id', input.team_id)
      }

      if (input.myTeamsOnly) {
        if (!user) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
          })
        }

        const { data: memberships, error: membershipsError } = await supabaseAdmin
          .schema('core')
          .from('team_members')
          .select('team_id')
          .eq('user_id', user.id)
          .neq('status', 'removed')

        if (membershipsError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to load team memberships: ${membershipsError.message}`,
          })
        }

        const teamIds = (memberships ?? [])
          .map((membership) => membership.team_id as string | null)
          .filter((teamId): teamId is string => Boolean(teamId))

        if (teamIds.length === 0) {
          return {
            jobs: [],
            total: 0,
          }
        }

        query = query.in('team_assignments.team_id', teamIds)
      }

      const { data, error, count } = await query

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to fetch jobs: ${error.message}`,
        })
      }

      const jobs = (data ?? []).map((job) => {
        const { team_assignments: jobTeamsRaw, ...rest } = job as Record<string, unknown>
        const teamAssignments =
          (jobTeamsRaw as Array<Record<string, unknown>> | null)?.map((assignment) => ({
            teamId: assignment.team_id as string,
            isPrimary: Boolean(assignment.is_primary),
            roleKey: assignment.role_key as string,
            assignedAt: assignment.assigned_at as string,
            team: assignment.team
              ? {
                  id: (assignment.team as Record<string, unknown>).id as string,
                  name: (assignment.team as Record<string, unknown>).name as string | null,
                  organization_id: (assignment.team as Record<string, unknown>)
                    .organization_id as string,
                }
              : null,
          })) ?? []

        const primaryAssignment = teamAssignments.find((assignment) => assignment.isPrimary) ?? null

        return {
          ...rest,
          teamAssignments: teamAssignments,
          team_ids: teamAssignments.map((assignment) => assignment.teamId),
          primary_team_id: primaryAssignment?.teamId ?? null,
          team: primaryAssignment?.team ?? null,
        }
      })

      return {
        jobs,
        total: count ?? 0,
      }
    }),

  /**
   * Get single job with full details
   */
  getJob: officeProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { supabaseAdmin, user } = ctx

      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        })
      }

      const { data, error } = await supabaseAdmin
        .schema('core')
        .from('jobs')
        .select(
          `
          *,
          organization:organizations!organization_id(id, name, slug),
          team:teams(id, name),
          team_assignments:job_team_assignments(
            team_id,
            is_primary,
            role_key,
            assigned_at,
            team:teams(id, name, organization_id)
          ),
          created_by:users!created_by_user_id(id, username, display_name),
          job_certifications(
            certification:certifications(id, name, slug, issuing_organization)
          ),
          job_skills(
            skill_taxonomy,
            csi_skill_id,
            onet_occupation_id
          )
        `
        )
        .eq('id', input.id)
        .single()

      if (error) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Job not found: ${error.message}`,
        })
      }

      // Verify organization access (unless super admin)
      const { loadUserRoleAssignments, isSuperAdmin } = await import(
        '../../_shared/permissions/team-permissions'
      )
      const assignments = await loadUserRoleAssignments(supabaseAdmin, user.id)
      const superAdmin = isSuperAdmin(assignments)

      if (!superAdmin && data) {
        const organizationId = data.organization_id as string | null
        if (organizationId) {
          // Get user's accessible organization IDs
          const organizationIds = new Set<string>()

          // 1. Organizations owned by user
          const { data: ownedOrgs } = await supabaseAdmin
            .schema('core')
            .from('organizations')
            .select('id')
            .eq('owner_user_id', user.id)

          for (const org of ownedOrgs ?? []) {
            if (org.id) {
              organizationIds.add(org.id as string)
            }
          }

          // 2. Organizations where user is a team member
          const { data: teamMemberships } = await supabaseAdmin
            .schema('core')
            .from('team_members')
            .select('teams!inner(organization_id)')
            .eq('user_id', user.id)
            .neq('status', 'removed')

          for (const membership of teamMemberships ?? []) {
            const orgId = membership.teams?.organization_id
            if (orgId && typeof orgId === 'string') {
              organizationIds.add(orgId)
            }
          }

          // Verify user has access to the organization
          if (!organizationIds.has(organizationId)) {
            throw new TRPCError({
              code: 'FORBIDDEN',
              message: "You do not have access to this job's organization",
            })
          }
        }
      }

      const {
        job_skills: jobSkills,
        team_assignments: jobTeamsRaw,
        ...rest
      } = data as Record<string, unknown>

      const teamAssignments =
        (jobTeamsRaw as Array<Record<string, unknown>> | null)?.map((assignment) => ({
          teamId: assignment.team_id as string,
          isPrimary: Boolean(assignment.is_primary),
          roleKey: assignment.role_key as string,
          assignedAt: assignment.assigned_at as string,
          team: assignment.team
            ? {
                id: (assignment.team as Record<string, unknown>).id as string,
                name: (assignment.team as Record<string, unknown>).name as string | null,
                organization_id: (assignment.team as Record<string, unknown>)
                  .organization_id as string,
              }
            : null,
        })) ?? []

      const primaryAssignment = teamAssignments.find((assignment) => assignment.isPrimary) ?? null

      return {
        job: {
          ...rest,
          job_skills: jobSkills,
          skills: transformJobSkills(jobSkills || []),
          teamAssignments: teamAssignments,
          team_ids: teamAssignments.map((assignment) => assignment.teamId),
          primary_team_id: primaryAssignment?.teamId ?? null,
          team: primaryAssignment?.team ?? null,
        },
      }
    }),

  /**
   * Create new job
   */
  createJob: officeProcedure.input(jobCreateSchema).mutation(async ({ ctx, input }) => {
    const { supabaseAdmin, user } = ctx

    if (!user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'User not authenticated',
      })
    }

    // Verify organization access (unless super admin)
    const { loadUserRoleAssignments, isSuperAdmin } = await import(
      '../../_shared/permissions/team-permissions'
    )
    const assignments = await loadUserRoleAssignments(supabaseAdmin, user.id)
    const superAdmin = isSuperAdmin(assignments)

    if (!superAdmin && input.organization_id) {
      // Get user's accessible organization IDs
      const organizationIds = new Set<string>()

      // 1. Organizations owned by user
      const { data: ownedOrgs } = await supabaseAdmin
        .schema('core')
        .from('organizations')
        .select('id')
        .eq('owner_user_id', user.id)

      for (const org of ownedOrgs ?? []) {
        if (org.id) {
          organizationIds.add(org.id as string)
        }
      }

      // 2. Organizations where user is a team member
      const { data: teamMemberships } = await supabaseAdmin
        .schema('core')
        .from('team_members')
        .select('teams!inner(organization_id)')
        .eq('user_id', user.id)
        .neq('status', 'removed')

      for (const membership of teamMemberships ?? []) {
        const orgId = membership.teams?.organization_id
        if (orgId && typeof orgId === 'string') {
          organizationIds.add(orgId)
        }
      }

      // Verify user has access to the organization
      if (!organizationIds.has(input.organization_id)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this organization',
        })
      }
    }

    // Extract certification_ids and skill_ids before inserting job
    const { certification_ids, skill_ids, team_ids: inputTeamIds, ...jobData } = input

    const requestedTeamIds = Array.from(new Set(inputTeamIds ?? []))
    let primaryTeamId = jobData.assigned_team_id ?? null

    if (requestedTeamIds.length > 0) {
      if (primaryTeamId && !requestedTeamIds.includes(primaryTeamId)) {
        requestedTeamIds.unshift(primaryTeamId)
      } else if (!primaryTeamId) {
        primaryTeamId = requestedTeamIds[0] ?? null
      }
    }

    if (
      Object.hasOwn(jobData, 'assigned_team_id') &&
      (!jobData.assigned_team_id || jobData.assigned_team_id === '')
    ) {
      // Normalize falsy values to null for Supabase
      jobData.assigned_team_id = null
    }

    if (requestedTeamIds.length > 0) {
      const { data: teamRecords, error: teamsError } = await supabaseAdmin
        .schema('core')
        .from('teams')
        .select('id, organization_id')
        .in('id', requestedTeamIds)

      if (teamsError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to validate team assignments: ${teamsError.message}`,
        })
      }

      const missingTeams = requestedTeamIds.filter(
        (teamId) => !(teamRecords ?? []).some((team) => team.id === teamId)
      )

      if (missingTeams.length > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'One or more selected teams could not be found.',
        })
      }

      const invalidTeams = (teamRecords ?? []).filter(
        (team) => team.organization_id !== jobData.organization_id
      )

      if (invalidTeams.length > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'All teams must belong to the selected organization.',
        })
      }
    }

    if (primaryTeamId) {
      const { data: teamRecord, error: teamError } = await supabaseAdmin
        .schema('core')
        .from('teams')
        .select('id, organization_id')
        .eq('id', primaryTeamId)
        .single()

      if (teamError || !teamRecord) {
        throw new TRPCError({
          code: teamError?.code === 'PGRST116' ? 'BAD_REQUEST' : 'INTERNAL_SERVER_ERROR',
          message: teamError
            ? `Failed to validate assigned team: ${teamError.message}`
            : 'Assigned team not found',
        })
      }

      if (teamRecord.organization_id !== jobData.organization_id) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Assigned team must belong to the same organization as the job.',
        })
      }

      jobData.assigned_team_id = primaryTeamId
    } else {
      jobData.assigned_team_id = null
    }

    // Insert job using admin client to bypass RLS
    const { data: job, error: jobError } = await supabaseAdmin
      .schema('core')
      .from('jobs')
      .insert({
        ...jobData,
        created_by_user_id: user.id,
      })
      .select()
      .single()

    if (jobError) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to create job: ${jobError.message}`,
      })
    }

    if (requestedTeamIds.length > 0) {
      const effectivePrimaryId = jobData.assigned_team_id ?? requestedTeamIds[0] ?? null
      const rows = requestedTeamIds.map((teamId) => ({
        job_id: job.id,
        team_id: teamId,
        organization_id: job.organization_id,
        assigned_by: user.id,
        is_primary: effectivePrimaryId === teamId,
        metadata: {
          source: 'manual',
          created_by: user.id,
        },
      }))

      const { error: jobTeamsError } = await supabaseAdmin
        .schema('core')
        .from('job_team_assignments')
        .insert(rows)

      if (jobTeamsError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to assign teams to job: ${jobTeamsError.message}`,
        })
      }
    }

    // Insert certifications if provided
    if (certification_ids && certification_ids.length > 0) {
      const { error: certError } = await supabaseAdmin
        .schema('core')
        .from('job_certifications')
        .insert(
          certification_ids.map((cert_id) => ({
            job_id: job.id,
            certification_id: cert_id,
            is_required: true,
          }))
        )

      if (certError) {
        console.error('Failed to insert certifications:', certError)
      }
    }

    // TODO: Skill insertion needs to be updated for polymorphic skills
    // The new schema requires skill_taxonomy, csi_skill_id, or onet_occupation_id
    // This will need to be implemented when the job creation UI is updated
    if (skill_ids && skill_ids.length > 0) {
      console.warn('Skill insertion not yet implemented for polymorphic skills')
    }

    return { job }
  }),

  /**
   * Update existing job
   */
  updateJob: officeProcedure.input(jobUpdateSchema).mutation(async ({ ctx, input }) => {
    const { supabaseAdmin, user } = ctx
    const { id, certification_ids, skill_ids, team_ids, ...jobData } = input

    if (!user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'User not authenticated',
      })
    }

    const { data: existingJob, error: existingJobError } = await supabaseAdmin
      .schema('core')
      .from('jobs')
      .select('organization_id, assigned_team_id')
      .eq('id', id)
      .single()

    if (existingJobError || !existingJob) {
      throw new TRPCError({
        code: existingJobError?.code === 'PGRST116' ? 'NOT_FOUND' : 'INTERNAL_SERVER_ERROR',
        message: existingJobError
          ? `Failed to load job: ${existingJobError.message}`
          : 'Job not found',
      })
    }

    // Verify organization access (unless super admin)
    const { loadUserRoleAssignments, isSuperAdmin } = await import(
      '../../_shared/permissions/team-permissions'
    )
    const assignments = await loadUserRoleAssignments(supabaseAdmin, user.id)
    const superAdmin = isSuperAdmin(assignments)

    if (!superAdmin) {
      const currentOrganizationId = existingJob.organization_id as string
      const nextOrganizationId = jobData.organization_id ?? currentOrganizationId

      // Get user's accessible organization IDs
      const organizationIds = new Set<string>()

      // 1. Organizations owned by user
      const { data: ownedOrgs } = await supabaseAdmin
        .schema('core')
        .from('organizations')
        .select('id')
        .eq('owner_user_id', user.id)

      for (const org of ownedOrgs ?? []) {
        if (org.id) {
          organizationIds.add(org.id as string)
        }
      }

      // 2. Organizations where user is a team member
      const { data: teamMemberships } = await supabaseAdmin
        .schema('core')
        .from('team_members')
        .select('teams!inner(organization_id)')
        .eq('user_id', user.id)
        .neq('status', 'removed')

      for (const membership of teamMemberships ?? []) {
        const orgId = membership.teams?.organization_id
        if (orgId && typeof orgId === 'string') {
          organizationIds.add(orgId)
        }
      }

      // Verify user has access to current organization
      if (!organizationIds.has(currentOrganizationId)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: "You do not have access to this job's organization",
        })
      }

      // If changing organization, verify access to new organization
      if (jobData.organization_id && jobData.organization_id !== currentOrganizationId) {
        if (!organizationIds.has(nextOrganizationId)) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have access to the target organization',
          })
        }
      }
    }

    const currentOrganizationId = existingJob.organization_id as string
    const nextOrganizationId = jobData.organization_id ?? currentOrganizationId

    const requestedTeamIds = team_ids ? Array.from(new Set(team_ids)) : undefined

    if (
      Object.hasOwn(jobData, 'assigned_team_id') &&
      (!jobData.assigned_team_id || jobData.assigned_team_id === '')
    ) {
      jobData.assigned_team_id = null
    }

    if (requestedTeamIds) {
      if (requestedTeamIds.length > 0) {
        const { data: teamRecords, error: teamsError } = await supabaseAdmin
          .schema('core')
          .from('teams')
          .select('id, organization_id')
          .in('id', requestedTeamIds)

        if (teamsError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to validate team assignments: ${teamsError.message}`,
          })
        }

        const missingTeams = requestedTeamIds.filter(
          (teamId) => !(teamRecords ?? []).some((team) => team.id === teamId)
        )

        if (missingTeams.length > 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'One or more selected teams could not be found.',
          })
        }

        const invalidTeams = (teamRecords ?? []).filter(
          (team) => team.organization_id !== nextOrganizationId
        )

        if (invalidTeams.length > 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: "All teams must belong to the job's organization.",
          })
        }
      }

      const nextPrimaryTeamId =
        jobData.assigned_team_id ?? existingJob.assigned_team_id ?? requestedTeamIds[0] ?? null

      if (
        nextPrimaryTeamId &&
        requestedTeamIds.length > 0 &&
        !requestedTeamIds.includes(nextPrimaryTeamId)
      ) {
        requestedTeamIds.unshift(nextPrimaryTeamId)
      }

      jobData.assigned_team_id =
        requestedTeamIds.length > 0 ? (nextPrimaryTeamId ?? requestedTeamIds[0]) : null
    } else if (jobData.assigned_team_id) {
      const { data: teamRecord, error: teamError } = await supabaseAdmin
        .schema('core')
        .from('teams')
        .select('id, organization_id')
        .eq('id', jobData.assigned_team_id)
        .single()

      if (teamError || !teamRecord) {
        throw new TRPCError({
          code: teamError?.code === 'PGRST116' ? 'BAD_REQUEST' : 'INTERNAL_SERVER_ERROR',
          message: teamError
            ? `Failed to validate assigned team: ${teamError.message}`
            : 'Assigned team not found',
        })
      }

      if (teamRecord.organization_id !== nextOrganizationId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: "Assigned team must belong to the job's organization.",
        })
      }
    } else if (
      jobData.organization_id &&
      existingJob.assigned_team_id &&
      jobData.assigned_team_id === undefined
    ) {
      const { data: teamRecord, error: teamError } = await supabaseAdmin
        .schema('core')
        .from('teams')
        .select('id, organization_id')
        .eq('id', existingJob.assigned_team_id as string)
        .single()

      if (teamError || !teamRecord) {
        throw new TRPCError({
          code: teamError?.code === 'PGRST116' ? 'BAD_REQUEST' : 'INTERNAL_SERVER_ERROR',
          message: teamError
            ? `Failed to validate existing assigned team: ${teamError.message}`
            : 'Assigned team not found',
        })
      }

      if (teamRecord.organization_id !== jobData.organization_id) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            'Assigned team must belong to the new organization. Provide a team from the new organization or clear the team assignment.',
        })
      }
    }

    // Update job
    const { data: job, error: jobError } = await supabaseAdmin
      .schema('core')
      .from('jobs')
      .update(jobData)
      .eq('id', id)
      .select()
      .single()

    if (jobError) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to update job: ${jobError.message}`,
      })
    }

    if (requestedTeamIds) {
      const effectivePrimaryTeamId =
        jobData.assigned_team_id ?? existingJob.assigned_team_id ?? requestedTeamIds[0] ?? null

      const { data: existingAssignments, error: assignmentsError } = await supabaseAdmin
        .schema('core')
        .from('job_team_assignments')
        .select('team_id')
        .eq('job_id', id)

      if (assignmentsError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to load existing team assignments: ${assignmentsError.message}`,
        })
      }

      const existingTeamIds = (existingAssignments ?? []).map(
        (assignment) => assignment.team_id as string
      )

      const teamIdsToInsert = requestedTeamIds.filter((teamId) => !existingTeamIds.includes(teamId))
      const teamIdsToRemove = existingTeamIds.filter((teamId) => !requestedTeamIds.includes(teamId))

      if (teamIdsToRemove.length > 0) {
        const { error: deleteError } = await supabaseAdmin
          .schema('core')
          .from('job_team_assignments')
          .delete()
          .eq('job_id', id)
          .in('team_id', teamIdsToRemove)

        if (deleteError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to remove previous team assignments: ${deleteError.message}`,
          })
        }
      }

      if (teamIdsToInsert.length > 0) {
        const rows = teamIdsToInsert.map((teamId) => ({
          job_id: id,
          team_id: teamId,
          organization_id: nextOrganizationId,
          assigned_by: ctx.user?.id ?? null,
          is_primary: (effectivePrimaryTeamId ?? requestedTeamIds[0]) === teamId,
          metadata: {
            source: 'manual',
            updated_by: ctx.user?.id ?? null,
          },
        }))

        const { error: insertError } = await supabaseAdmin
          .schema('core')
          .from('job_team_assignments')
          .insert(rows)

        if (insertError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to assign teams to job: ${insertError.message}`,
          })
        }
      }

      const { error: resetPrimaryError } = await supabaseAdmin
        .schema('core')
        .from('job_team_assignments')
        .update({ is_primary: false })
        .eq('job_id', id)

      if (resetPrimaryError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to reset primary team flag: ${resetPrimaryError.message}`,
        })
      }

      if (requestedTeamIds.length > 0) {
        const primaryId = effectivePrimaryTeamId ?? requestedTeamIds[0] ?? null
        if (primaryId) {
          const { error: setPrimaryError } = await supabaseAdmin
            .schema('core')
            .from('job_team_assignments')
            .update({ is_primary: true })
            .eq('job_id', id)
            .eq('team_id', primaryId)

          if (setPrimaryError) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: `Failed to update primary team: ${setPrimaryError.message}`,
            })
          }
        }
      }
    }

    // Update certifications if provided
    if (certification_ids !== undefined) {
      // Delete existing certifications
      await supabaseAdmin.schema('core').from('job_certifications').delete().eq('job_id', id)

      // Insert new certifications
      if (certification_ids.length > 0) {
        const { error: certError } = await supabaseAdmin
          .schema('core')
          .from('job_certifications')
          .insert(
            certification_ids.map((cert_id) => ({
              job_id: id,
              certification_id: cert_id,
              is_required: true,
            }))
          )

        if (certError) {
          console.error('Failed to update certifications:', certError)
        }
      }
    }

    // TODO: Skill updates need to be updated for polymorphic skills
    // The new schema requires skill_taxonomy, csi_skill_id, or onet_occupation_id
    // This will need to be implemented when the job editing UI is updated
    if (skill_ids !== undefined) {
      // Delete existing skills
      await supabaseAdmin.from('job_skills').delete().eq('job_id', id)

      if (skill_ids.length > 0) {
        console.warn('Skill insertion not yet implemented for polymorphic skills')
      }
    }

    return { job }
  }),

  /**
   * Publish job (draft -> open)
   */
  publishJob: officeProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { supabaseAdmin, user } = ctx

      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        })
      }

      // First, get the job to verify organization access
      const { data: existingJob, error: jobError } = await supabaseAdmin
        .schema('core')
        .from('jobs')
        .select('organization_id')
        .eq('id', input.id)
        .single()

      if (jobError || !existingJob) {
        throw new TRPCError({
          code: jobError?.code === 'PGRST116' ? 'NOT_FOUND' : 'INTERNAL_SERVER_ERROR',
          message: jobError ? `Failed to load job: ${jobError.message}` : 'Job not found',
        })
      }

      // Verify organization access (unless super admin)
      const { loadUserRoleAssignments, isSuperAdmin } = await import(
        '../../_shared/permissions/team-permissions'
      )
      const assignments = await loadUserRoleAssignments(supabaseAdmin, user.id)
      const superAdmin = isSuperAdmin(assignments)

      if (!superAdmin) {
        const organizationId = existingJob.organization_id as string

        // Get user's accessible organization IDs
        const organizationIds = new Set<string>()

        // 1. Organizations owned by user
        const { data: ownedOrgs } = await supabaseAdmin
          .schema('core')
          .from('organizations')
          .select('id')
          .eq('owner_user_id', user.id)

        for (const org of ownedOrgs ?? []) {
          if (org.id) {
            organizationIds.add(org.id as string)
          }
        }

        // 2. Organizations where user is a team member
        const { data: teamMemberships } = await supabaseAdmin
          .schema('core')
          .from('team_members')
          .select('teams!inner(organization_id)')
          .eq('user_id', user.id)
          .neq('status', 'removed')

        for (const membership of teamMemberships ?? []) {
          const orgId = membership.teams?.organization_id
          if (orgId && typeof orgId === 'string') {
            organizationIds.add(orgId)
          }
        }

        // Verify user has access to the organization
        if (!organizationIds.has(organizationId)) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: "You do not have access to this job's organization",
          })
        }
      }

      const { data: job, error } = await supabaseAdmin
        .schema('core')
        .from('jobs')
        .update({
          status: 'open',
          posted_at: new Date().toISOString(),
        })
        .eq('id', input.id)
        .select()
        .single()

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to publish job: ${error.message}`,
        })
      }

      return { job }
    }),

  /**
   * Close job
   */
  closeJob: officeProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { supabaseAdmin, user } = ctx

      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        })
      }

      // First, get the job to verify organization access
      const { data: existingJob, error: jobError } = await supabaseAdmin
        .schema('core')
        .from('jobs')
        .select('organization_id')
        .eq('id', input.id)
        .single()

      if (jobError || !existingJob) {
        throw new TRPCError({
          code: jobError?.code === 'PGRST116' ? 'NOT_FOUND' : 'INTERNAL_SERVER_ERROR',
          message: jobError ? `Failed to load job: ${jobError.message}` : 'Job not found',
        })
      }

      // Verify organization access (unless super admin)
      const { loadUserRoleAssignments, isSuperAdmin } = await import(
        '../../_shared/permissions/team-permissions'
      )
      const assignments = await loadUserRoleAssignments(supabaseAdmin, user.id)
      const superAdmin = isSuperAdmin(assignments)

      if (!superAdmin) {
        const organizationId = existingJob.organization_id as string

        // Get user's accessible organization IDs
        const organizationIds = new Set<string>()

        // 1. Organizations owned by user
        const { data: ownedOrgs } = await supabaseAdmin
          .schema('core')
          .from('organizations')
          .select('id')
          .eq('owner_user_id', user.id)

        for (const org of ownedOrgs ?? []) {
          if (org.id) {
            organizationIds.add(org.id as string)
          }
        }

        // 2. Organizations where user is a team member
        const { data: teamMemberships } = await supabaseAdmin
          .schema('core')
          .from('team_members')
          .select('teams!inner(organization_id)')
          .eq('user_id', user.id)
          .neq('status', 'removed')

        for (const membership of teamMemberships ?? []) {
          const orgId = membership.teams?.organization_id
          if (orgId && typeof orgId === 'string') {
            organizationIds.add(orgId)
          }
        }

        // Verify user has access to the organization
        if (!organizationIds.has(organizationId)) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: "You do not have access to this job's organization",
          })
        }
      }

      const { data: job, error } = await supabaseAdmin
        .schema('core')
        .from('jobs')
        .update({ status: 'closed' })
        .eq('id', input.id)
        .select()
        .single()

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to close job: ${error.message}`,
        })
      }

      return { job }
    }),

  /**
   * Delete job (hard delete)
   * Removes job and related records permanently
   */
  deleteJob: officeProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { supabaseAdmin, user } = ctx

      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        })
      }

      // First, get the job to verify organization access
      const { data: existingJob, error: jobError } = await supabaseAdmin
        .schema('core')
        .from('jobs')
        .select('organization_id')
        .eq('id', input.id)
        .single()

      if (jobError || !existingJob) {
        throw new TRPCError({
          code: jobError?.code === 'PGRST116' ? 'NOT_FOUND' : 'INTERNAL_SERVER_ERROR',
          message: jobError ? `Failed to load job: ${jobError.message}` : 'Job not found',
        })
      }

      // Verify organization access (unless super admin)
      const { loadUserRoleAssignments, isSuperAdmin } = await import(
        '../../_shared/permissions/team-permissions'
      )
      const assignments = await loadUserRoleAssignments(supabaseAdmin, user.id)
      const superAdmin = isSuperAdmin(assignments)

      if (!superAdmin) {
        const organizationId = existingJob.organization_id as string

        // Get user's accessible organization IDs
        const organizationIds = new Set<string>()

        // 1. Organizations owned by user
        const { data: ownedOrgs } = await supabaseAdmin
          .schema('core')
          .from('organizations')
          .select('id')
          .eq('owner_user_id', user.id)

        for (const org of ownedOrgs ?? []) {
          if (org.id) {
            organizationIds.add(org.id as string)
          }
        }

        // 2. Organizations where user is a team member
        const { data: teamMemberships } = await supabaseAdmin
          .schema('core')
          .from('team_members')
          .select('teams!inner(organization_id)')
          .eq('user_id', user.id)
          .neq('status', 'removed')

        for (const membership of teamMemberships ?? []) {
          const orgId = membership.teams?.organization_id
          if (orgId && typeof orgId === 'string') {
            organizationIds.add(orgId)
          }
        }

        // Verify user has access to the organization
        if (!organizationIds.has(organizationId)) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: "You do not have access to this job's organization",
          })
        }
      }

      // Delete related records first (due to foreign key constraints)
      // Delete job certifications
      await supabaseAdmin.from('job_certifications').delete().eq('job_id', input.id)

      // Delete job skills
      await supabaseAdmin.from('job_skills').delete().eq('job_id', input.id)

      // Delete applications (if any)
      await supabaseAdmin.from('applications').delete().eq('job_id', input.id)

      // Finally delete the job itself
      const { error } = await supabaseAdmin.from('jobs').delete().eq('id', input.id)

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to delete job: ${error.message}`,
        })
      }

      return { success: true }
    }),

  /**
   * Duplicate job
   * Creates a copy of an existing job with status set to draft
   */
  duplicateJob: officeProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { supabaseAdmin, user } = ctx

      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        })
      }

      // Get the original job
      const { data: originalJob, error: jobError } = await supabaseAdmin
        .schema('core')
        .from('jobs')
        .select('*')
        .eq('id', input.id)
        .single()

      if (jobError || !originalJob) {
        throw new TRPCError({
          code: jobError?.code === 'PGRST116' ? 'NOT_FOUND' : 'INTERNAL_SERVER_ERROR',
          message: jobError ? `Failed to load job: ${jobError.message}` : 'Job not found',
        })
      }

      // Verify organization access (unless super admin)
      const { loadUserRoleAssignments, isSuperAdmin } = await import(
        '../../_shared/permissions/team-permissions'
      )
      const assignments = await loadUserRoleAssignments(supabaseAdmin, user.id)
      const superAdmin = isSuperAdmin(assignments)

      if (!superAdmin) {
        const organizationId = originalJob.organization_id as string

        // Get user's accessible organization IDs
        const organizationIds = new Set<string>()

        // 1. Organizations owned by user
        const { data: ownedOrgs } = await supabaseAdmin
          .schema('core')
          .from('organizations')
          .select('id')
          .eq('owner_user_id', user.id)

        for (const org of ownedOrgs ?? []) {
          if (org.id) {
            organizationIds.add(org.id as string)
          }
        }

        // 2. Organizations where user is a team member
        const { data: teamMemberships } = await supabaseAdmin
          .schema('core')
          .from('team_members')
          .select('teams!inner(organization_id)')
          .eq('user_id', user.id)
          .neq('status', 'removed')

        for (const membership of teamMemberships ?? []) {
          const orgId = membership.teams?.organization_id
          if (orgId && typeof orgId === 'string') {
            organizationIds.add(orgId)
          }
        }

        // Verify user has access to the organization
        if (!organizationIds.has(organizationId)) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: "You do not have access to this job's organization",
          })
        }
      }

      // Prepare job data for duplication (exclude id, timestamps, and set status to draft)
      const {
        id: _id,
        created_at: _created_at,
        updated_at: _updated_at,
        posted_at: _posted_at,
        created_by_user_id: _created_by_user_id,
        ...jobData
      } = originalJob

      // Create new job as draft
      const { data: newJob, error: createError } = await supabaseAdmin
        .schema('core')
        .from('jobs')
        .insert({
          ...jobData,
          status: 'draft',
          title: `${jobData.title} (Copy)`,
          created_by_user_id: user.id,
        })
        .select()
        .single()

      if (createError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to duplicate job: ${createError.message}`,
        })
      }

      // Duplicate job certifications
      const { data: certifications } = await supabaseAdmin
        .schema('core')
        .from('job_certifications')
        .select('certification_id, is_required')
        .eq('job_id', input.id)

      if (certifications && certifications.length > 0) {
        await supabaseAdmin
          .schema('core')
          .from('job_certifications')
          .insert(
            certifications.map((cert) => ({
              job_id: newJob.id,
              certification_id: cert.certification_id,
              is_required: cert.is_required,
            }))
          )
      }

      // Duplicate job skills (if any exist)
      const { data: skills } = await supabaseAdmin
        .schema('core')
        .from('job_skills')
        .select('*')
        .eq('job_id', input.id)

      if (skills && skills.length > 0) {
        await supabaseAdmin
          .schema('core')
          .from('job_skills')
          .insert(
            skills.map((skill) => ({
              job_id: newJob.id,
              skill_taxonomy: skill.skill_taxonomy,
              csi_skill_id: skill.csi_skill_id,
              onet_occupation_id: skill.onet_occupation_id,
            }))
          )
      }

      // Duplicate job team assignments
      const { data: teamAssignments } = await supabaseAdmin
        .schema('core')
        .from('job_team_assignments')
        .select('team_id, is_primary, role_key, organization_id')
        .eq('job_id', input.id)

      if (teamAssignments && teamAssignments.length > 0) {
        await supabaseAdmin
          .schema('core')
          .from('job_team_assignments')
          .insert(
            teamAssignments.map((assignment) => ({
              job_id: newJob.id,
              team_id: assignment.team_id,
              is_primary: assignment.is_primary,
              role_key: assignment.role_key,
              organization_id: assignment.organization_id,
              assigned_by: user.id,
              metadata: {
                source: 'duplicate',
                original_job_id: input.id,
                created_by: user.id,
              },
            }))
          )
      }

      return { job: newJob }
    }),

  /**
   * Get all organizations (admin view)
   * Super admins can see and manage jobs for any organization
   */
  getOrganizations: officeProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabaseAdmin
      .schema('core')
      .from('organizations')
      .select('id, name, slug, owner_user_id')
      .order('name', { ascending: true })

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to fetch organizations: ${error.message}`,
      })
    }

    return { organizations: data ?? [] }
  }),

  /**
   * List organizations with pagination and search
   */
  listOrganizations: officeProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      let query = ctx.supabaseAdmin
        .schema('core')
        .from('organizations')
        .select(
          `
          id,
          name,
          slug,
          industry_id,
          logo_url,
          visibility,
          owner_user_id,
          created_at,
          updated_at,
          industry:industries(name)
        `,
          { count: 'exact' }
        )
        .order('created_at', { ascending: false })
        .range(input.offset, input.offset + input.limit - 1)

      if (input.search) {
        query = query.or(`name.ilike.%${input.search}%,slug.ilike.%${input.search}%`)
      }

      const { data, error, count } = await query

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to fetch organizations: ${error.message}`,
        })
      }

      // Transform data to include industry_name
      const organizations = (data ?? []).map((org) => ({
        ...org,
        industry_name: org.industry?.name || null,
      }))

      return {
        organizations,
        total: count ?? 0,
      }
    }),

  /**
   * List organization requests for moderation
   */
  listOrganizationRequests: officeProcedure
    .input(
      z
        .object({
          status: z.enum(['pending', 'approved', 'rejected']).optional(),
          limit: z.number().min(1).max(100).default(25),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const appliedStatus = input?.status
      const limit = input?.limit ?? 25

      let query = ctx.supabaseAdmin
        .schema('core')
        .from('organization_requests')
        .select(
          `
          id,
          name,
          slug,
          website,
          notes,
          status,
          metadata,
          created_at,
          created_by_user_id,
          reviewed_at,
          reviewed_by_user_id,
          rejection_reason,
          organization_id
        `
        )
        .order('created_at', { ascending: true })
        .limit(limit)

      if (appliedStatus) {
        query = query.eq('status', appliedStatus)
      }

      const { data: requests, error } = await query

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to fetch organization requests: ${error.message}`,
        })
      }

      const [
        { count: pendingCount = 0 } = {},
        { count: approvedCount = 0 } = {},
        { count: rejectedCount = 0 } = {},
      ] = await Promise.all([
        ctx.supabaseAdmin
          .schema('core')
          .from('organization_requests')
          .select('*', { head: true, count: 'exact' })
          .eq('status', 'pending'),
        ctx.supabaseAdmin
          .schema('core')
          .from('organization_requests')
          .select('*', { head: true, count: 'exact' })
          .eq('status', 'approved'),
        ctx.supabaseAdmin
          .schema('core')
          .from('organization_requests')
          .select('*', { head: true, count: 'exact' })
          .eq('status', 'rejected'),
      ])

      return {
        requests: requests ?? [],
        counts: {
          pending: pendingCount ?? 0,
          approved: approvedCount ?? 0,
          rejected: rejectedCount ?? 0,
        },
      }
    }),

  /**
   * Review an organization request (approve or reject)
   */
  reviewOrganizationRequest: officeProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        action: z.enum(['approve', 'reject']),
        rejectionReason: z.string().trim().max(1000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user, supabaseAdmin } = ctx

      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        })
      }

      const { data: request, error: requestError } = await supabaseAdmin
        .schema('core')
        .from('organization_requests')
        .select('*')
        .eq('id', input.id)
        .single()

      if (requestError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to load organization request: ${requestError.message}`,
        })
      }

      if (!request) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Organization request not found',
        })
      }

      if (request.status !== 'pending') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Only pending requests can be reviewed',
        })
      }

      const moderationTimestamp = new Date().toISOString()

      if (input.action === 'reject') {
        if (!input.rejectionReason || input.rejectionReason.trim().length === 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Rejection reason is required when rejecting a request',
          })
        }

        const { data: updatedRequest, error: updateError } = await supabaseAdmin
          .schema('core')
          .from('organization_requests')
          .update({
            status: 'rejected',
            reviewed_by_user_id: user.id,
            reviewed_at: moderationTimestamp,
            rejection_reason: input.rejectionReason.trim(),
          })
          .eq('id', input.id)
          .select()
          .single()

        if (updateError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to reject organization request: ${updateError.message}`,
          })
        }

        return { request: updatedRequest, organization: null }
      }

      // Approve flow
      const { data: existingOrg, error: existingOrgError } = await supabaseAdmin
        .schema('core')
        .from('organizations')
        .select('id')
        .eq('slug', request.slug)
        .maybeSingle()

      if (existingOrgError && existingOrgError.code !== 'PGRST116') {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to validate organization slug: ${existingOrgError.message}`,
        })
      }

      if (existingOrg) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'An organization with this slug already exists',
        })
      }

      const { data: organization, error: createOrgError } = await supabaseAdmin
        .schema('core')
        .from('organizations')
        .insert({
          name: request.name,
          slug: request.slug,
          visibility: 'public',
          website: request.website ?? null,
          owner_user_id: request.created_by_user_id,
        })
        .select()
        .single()

      if (createOrgError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to create organization: ${createOrgError.message}`,
        })
      }

      const { data: approvedRequest, error: approveError } = await supabaseAdmin
        .schema('core')
        .from('organization_requests')
        .update({
          status: 'approved',
          reviewed_by_user_id: user.id,
          reviewed_at: moderationTimestamp,
          organization_id: organization?.id ?? null,
          rejection_reason: null,
        })
        .eq('id', input.id)
        .select()
        .single()

      if (approveError) {
        // Attempt to clean up the organization if request update fails
        if (organization?.id) {
          await supabaseAdmin
            .schema('core')
            .from('organizations')
            .delete()
            .eq('id', organization.id)
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to update organization request: ${approveError.message}`,
        })
      }

      return { request: approvedRequest, organization }
    }),

  /**
   * Get single organization with full details
   */
  getOrganization: officeProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabaseAdmin
        .schema('core')
        .from('organizations')
        .select(
          `
          *,
          industry:industries(id, name)
        `
        )
        .eq('id', input.id)
        .single()

      if (error) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Organization not found: ${error.message}`,
        })
      }

      return { organization: data }
    }),

  /**
   * Create new organization
   */
  createOrganization: officeProcedure
    .input(
      z.object({
        name: z.string().min(1, 'Name is required'),
        slug: z.string().min(1, 'Vanity URL is required').toLowerCase(),
        industry_id: z.string().uuid().optional(),
        logo_url: z.string().url().optional().or(z.literal('')),
        visibility: z.enum(['public', 'private']).default('public'),
        address: z.record(z.unknown()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx

      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        })
      }

      // Check if vanity URL is unique
      const { data: existing } = await ctx.supabaseAdmin
        .schema('core')
        .from('organizations')
        .select('id')
        .eq('slug', input.slug)
        .single()

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'An organization with this vanity URL already exists',
        })
      }

      const { data: organization, error } = await ctx.supabaseAdmin
        .schema('core')
        .from('organizations')
        .insert({
          ...input,
          owner_user_id: user.id,
        })
        .select()
        .single()

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to create organization: ${error.message}`,
        })
      }

      return { organization }
    }),

  /**
   * Update existing organization
   */
  updateOrganization: officeProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1, 'Name is required'),
        slug: z.string().min(1, 'Vanity URL is required').toLowerCase(),
        industry_id: z.string().uuid().optional(),
        logo_url: z.string().url().optional().or(z.literal('')),
        visibility: z.enum(['public', 'private']),
        address: z.record(z.unknown()).optional(),
        locations: z
          .array(
            z.object({
              name: z.string(),
              address: z.record(z.unknown()),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input

      // Check if vanity URL is unique (excluding current organization)
      const { data: existing } = await ctx.supabaseAdmin
        .schema('core')
        .from('organizations')
        .select('id')
        .eq('slug', input.slug)
        .neq('id', id)
        .single()

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'An organization with this vanity URL already exists',
        })
      }

      // Update organization including locations in JSONB column
      const { data: organization, error } = await ctx.supabaseAdmin
        .schema('core')
        .from('organizations')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to update organization: ${error.message}`,
        })
      }

      return { organization }
    }),

  /**
   * Delete organization (hard delete)
   * WARNING: This will cascade delete:
   * - Teams and team_members
   * - Jobs and all related records (applications, job_skills, job_certifications)
   * - Organization_skills
   * - Follows
   * - Invites
   */
  deleteOrganization: officeProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabaseAdmin
        .schema('core')
        .from('organizations')
        .delete()
        .eq('id', input.id)

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to delete organization: ${error.message}`,
        })
      }

      return { success: true }
    }),

  /**
   * Search certifications with pagination
   */
  searchCertifications: officeProcedure
    .input(
      z.object({
        query: z.string().optional(),
        category: z
          .enum(['safety', 'trade', 'equipment', 'license', 'management', 'other'])
          .optional(),
        include_inactive: z.boolean().default(false),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      let query = ctx.supabaseAdmin
        .from('certifications')
        .select('*', { count: 'exact' })
        .order('name')

      if (!input.include_inactive) {
        query = query.eq('is_active', true)
      }

      if (input.category) {
        query = query.eq('category', input.category)
      }

      if (input.query) {
        query = query.ilike('name', `%${input.query}%`)
      }

      query = query.range(input.offset, input.offset + input.limit - 1)

      const { data, error, count } = await query

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to search certifications: ${error.message}`,
        })
      }

      return {
        certifications: data ?? [],
        total: count ?? 0,
      }
    }),

  /**
   * Create new user (sends invite email)
   * Creates user in Supabase Auth and sends invite email
   */
  createUser: officeProcedure
    .input(
      z.object({
        email: z.string().email('Valid email required'),
        first_name: z.string().min(1, 'First name required'),
        last_name: z.string().min(1, 'Last name required'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { supabaseAdmin } = ctx

      // 1. Create user in Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: input.email,
        email_confirm: false, // User must confirm via invite email
        user_metadata: {
          first_name: input.first_name,
          last_name: input.last_name,
        },
      })

      if (authError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to create user: ${authError.message}`,
        })
      }

      // 2. Send invite email
      const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(input.email)

      if (inviteError) {
        console.error('Failed to send invite email:', inviteError)
        // Don't fail the whole operation if invite fails - user is created
      }

      // 3. Profile is created automatically via database trigger
      // 4. Return user data
      return {
        user: authData.user,
        inviteSent: !inviteError,
      }
    }),

  /**
   * Delete user (hard delete)
   * Permanently removes user and all related data
   */
  deleteUser: officeProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { supabaseAdmin } = ctx

      // Delete related records first
      // Note: Many tables have ON DELETE CASCADE, but we'll be explicit

      // Delete user skills
      await supabaseAdmin.schema('core').from('user_skills').delete().eq('user_id', input.id)

      // Delete user certifications
      await supabaseAdmin.from('user_certifications').delete().eq('user_id', input.id)

      // Delete work experience
      await supabaseAdmin.from('work_experience').delete().eq('user_id', input.id)

      // Delete education
      await supabaseAdmin.from('education').delete().eq('user_id', input.id)

      // Delete applications
      await supabaseAdmin.from('applications').delete().eq('user_id', input.id)

      // Delete reviews authored by user
      await supabaseAdmin.from('reviews').delete().eq('user_id', input.id)

      // Delete organization memberships
      await supabaseAdmin.from('organization_members').delete().eq('user_id', input.id)

      // Delete private data
      await supabaseAdmin.schema('core').from('profile').delete().eq('user_id', input.id)

      // Delete profile
      const { error: profileError } = await supabaseAdmin
        .schema('core')
        .from('users')
        .delete()
        .eq('id', input.id)

      if (profileError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to delete user profile: ${profileError.message}`,
        })
      }

      // Delete from Supabase Auth
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(input.id)

      if (authError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to delete user from auth: ${authError.message}`,
        })
      }

      return { success: true }
    }),

  /**
   * Get all certifications (simple list)
   */
  getCertifications: officeProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabaseAdmin
      .from('certifications')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to fetch certifications: ${error.message}`,
      })
    }

    return { certifications: data ?? [] }
  }),

  /**
   * Get single certification by ID
   */
  getCertification: officeProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabaseAdmin
        .from('certifications')
        .select('*')
        .eq('id', input.id)
        .single()

      if (error) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Certification not found: ${error.message}`,
        })
      }

      return { certification: data }
    }),

  /**
   * Create new certification
   */
  createCertification: officeProcedure
    .input(
      z.object({
        name: z.string().min(1, 'Name is required'),
        slug: z.string().min(1, 'Vanity URL is required'),
        issuing_organization: z.string().optional(),
        category: z.enum(['safety', 'trade', 'equipment', 'license', 'management', 'other']),
        description: z.string().optional(),
        typical_duration_days: z.number().int().positive().optional(),
        requires_renewal: z.boolean().default(false),
        renewal_period_months: z.number().int().positive().optional(),
        metadata: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabaseAdmin
        .from('certifications')
        .insert({
          ...input,
          is_active: true,
        })
        .select()
        .single()

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to create certification: ${error.message}`,
        })
      }

      return { certification: data }
    }),

  /**
   * Update existing certification
   */
  updateCertification: officeProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        slug: z.string().min(1).optional(),
        issuing_organization: z.string().optional(),
        category: z
          .enum(['safety', 'trade', 'equipment', 'license', 'management', 'other'])
          .optional(),
        description: z.string().optional(),
        typical_duration_days: z.number().int().positive().optional(),
        requires_renewal: z.boolean().optional(),
        renewal_period_months: z.number().int().positive().optional(),
        is_active: z.boolean().optional(),
        metadata: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input

      const { data, error } = await ctx.supabaseAdmin
        .from('certifications')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to update certification: ${error.message}`,
        })
      }

      return { certification: data }
    }),

  /**
   * Deactivate certification (soft delete)
   */
  deactivateCertification: officeProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabaseAdmin
        .from('certifications')
        .update({ is_active: false })
        .eq('id', input.id)
        .select()
        .single()

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to deactivate certification: ${error.message}`,
        })
      }

      return { certification: data }
    }),

  /**
   * Reactivate certification
   */
  reactivateCertification: officeProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabaseAdmin
        .from('certifications')
        .update({ is_active: true })
        .eq('id', input.id)
        .select()
        .single()

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to reactivate certification: ${error.message}`,
        })
      }

      return { certification: data }
    }),

  /**
   * Get all skills
   * TODO: Update to query from polymorphic skill sources (CSI, O*NET)
   */
  getSkills: officeProcedure.query(async ({ ctx }) => {
    // For now, return empty array since the skills table no longer exists
    // This needs to be updated to query csi.masterformat and onet.occupation_data
    return { skills: [] }
  }),

  /**
   * Get user general profile data (admin)
   * Uses the same schema as user profile for consistency
   */
  getUserGeneral: officeProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data: profile, error: profileError } = await ctx.supabaseAdmin
        .schema('core')
        .from('users')
        .select('first_name, last_name, about, avatar_path')
        .eq('id', input.userId)
        .single()

      if (profileError) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `User profile not found: ${profileError.message}`,
        })
      }

      // Get email from auth.users
      const { data: authUser, error: authError } = await ctx.supabaseAdmin.auth.admin.getUserById(
        input.userId
      )

      if (authError) {
        console.error('Error fetching auth user:', authError)
      }

      const { data: privateData, error: privateError } = await ctx.supabaseAdmin
        .schema('core')
        .from('profile')
        .select('street_address, city, state, zip_code, country, latitude, longitude')
        .eq('user_id', input.userId)
        .single()

      if (privateError && privateError.code !== 'PGRST116') {
        console.error('Error fetching private data:', privateError)
      }

      return {
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        about: profile.about || '',
        avatar_path: profile.avatar_path || '',
        email: authUser?.user?.email || '',
        phone: authUser?.user?.phone || '',
        address: {
          street: privateData?.street_address || '',
          city: privateData?.city || '',
          state: privateData?.state || '',
          zip: privateData?.zip_code || '',
          country: privateData?.country || 'United States',
          latitude: privateData?.latitude,
          longitude: privateData?.longitude,
        },
      }
    }),

  /**
   * Update user general profile (admin)
   * Uses the same schema as user profile for consistency
   */
  updateUserGeneral: officeProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        data: generalProfileSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { userId, data } = input

      // Update profiles table
      const profileUpdate: Record<string, string> = {}
      if (data.first_name) profileUpdate.first_name = data.first_name
      if (data.last_name) profileUpdate.last_name = data.last_name
      if (data.about !== undefined) profileUpdate.about = data.about
      if (data.avatar_path !== undefined) {
        profileUpdate.avatar_path = data.avatar_path
      }

      if (Object.keys(profileUpdate).length > 0) {
        const { error: profileError } = await ctx.supabaseAdmin
          .schema('core')
          .from('users')
          .update(profileUpdate)
          .eq('id', userId)

        if (profileError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to update profile: ${profileError.message}`,
          })
        }
      }

      // Update private table (phone is read-only from auth.users, not updated here)
      const privateUpdate: Record<string, string | number | null> = {}
      if (data.address) {
        if (data.address.street !== undefined) {
          privateUpdate.street_address = data.address.street
        }
        if (data.address.city !== undefined) {
          privateUpdate.city = data.address.city
        }
        if (data.address.state !== undefined) {
          privateUpdate.state = data.address.state
        }
        if (data.address.zip !== undefined) {
          privateUpdate.zip_code = data.address.zip
        }
        if (data.address.country !== undefined) {
          privateUpdate.country = data.address.country
        }
        if (data.address.latitude !== undefined) {
          privateUpdate.latitude = data.address.latitude
        }
        if (data.address.longitude !== undefined) {
          privateUpdate.longitude = data.address.longitude
        }
      }

      if (Object.keys(privateUpdate).length > 0) {
        const { error: privateError } = await ctx.supabaseAdmin
          .schema('core')
          .from('profile')
          .update(privateUpdate)
          .eq('user_id', userId)

        if (privateError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to update private data: ${privateError.message}`,
          })
        }
      }

      return { success: true }
    }),

  /**
   * Get user employment data (admin)
   * Uses the same schema as user profile for consistency
   */
  getUserEmployment: officeProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabaseAdmin
        .schema('core')
        .from('profile')
        .select(
          'preferred_work_locations, open_to_travel, travel_distance_miles, us_resident, us_passport, drivers_license_classes, military_status, availability, hourly_rate'
        )
        .eq('user_id', input.userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `User employment data not found: ${error.message}`,
        })
      }

      return {
        preferred_work_locations: data?.preferred_work_locations || [],
        open_to_travel: data?.open_to_travel ?? true,
        travel_distance_miles: data?.travel_distance_miles || 25,
        us_resident: data?.us_resident || false,
        us_passport: data?.us_passport || false,
        drivers_license_classes: data?.drivers_license_classes || [],
        military_status: data?.military_status || [],
        availability: data?.availability || [],
        hourly_rate: data?.hourly_rate,
      }
    }),

  /**
   * Update user employment data (admin)
   * Uses the same schema as user profile for consistency
   */
  updateUserEmployment: officeProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        data: employmentProfileSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { userId, data } = input

      const { error } = await ctx.supabaseAdmin
        .schema('core')
        .from('profile')
        .update({
          preferred_work_locations: data.preferred_work_locations,
          open_to_travel: data.open_to_travel,
          travel_distance_miles: data.travel_distance_miles,
          us_resident: data.us_resident,
          us_passport: data.us_passport,
          drivers_license_classes: data.drivers_license_classes,
          military_status: data.military_status,
          availability: data.availability,
          hourly_rate: data.hourly_rate,
        })
        .eq('user_id', userId)

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to update employment data: ${error.message}`,
        })
      }

      return { success: true }
    }),

  /**
   * List applications for organization's jobs
   * Super admins can view applications for jobs belonging to their organization(s)
   */
  listApplications: officeProcedure
    .input(
      z.object({
        organization_id: z.string().uuid().optional(),
        job_id: z.string().uuid().optional(),
        status: z
          .enum(['pending', 'reviewing', 'interview', 'offer', 'hired', 'rejected', 'withdrawn'])
          .optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
        date_from: z.string().optional(),
        date_to: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { supabaseAdmin, user } = ctx

      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        })
      }

      // Get user's organization IDs
      // 1. Organizations owned by user
      const { data: ownedOrgs, error: ownedError } = await supabaseAdmin
        .schema('core')
        .from('organizations')
        .select('id')
        .eq('owner_user_id', user.id)

      if (ownedError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to fetch owned organizations: ${ownedError.message}`,
        })
      }

      // 2. Organizations where user is a team member
      const { data: teamMemberships, error: membershipsError } = await supabaseAdmin
        .schema('core')
        .from('team_members')
        .select('teams!inner(organization_id)')
        .eq('user_id', user.id)
        .neq('status', 'removed')

      if (membershipsError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to load team memberships: ${membershipsError.message}`,
        })
      }

      const organizationIds = new Set<string>()

      // Add owned organizations
      for (const org of ownedOrgs ?? []) {
        if (org.id) {
          organizationIds.add(org.id as string)
        }
      }

      // Add organizations from team memberships
      for (const membership of teamMemberships ?? []) {
        const orgId = membership.teams?.organization_id
        if (orgId && typeof orgId === 'string') {
          organizationIds.add(orgId)
        }
      }

      // If user has no organization access, return empty result
      if (organizationIds.size === 0) {
        return {
          applications: [],
          total: 0,
          page_info: {
            has_more: false,
            offset: input.offset,
            limit: input.limit,
          },
        }
      }

      // If organization_id filter is provided, verify user has access
      if (input.organization_id) {
        if (!organizationIds.has(input.organization_id)) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have access to this organization',
          })
        }
        organizationIds.clear()
        organizationIds.add(input.organization_id)
      }

      // First, get job IDs for jobs in user's organizations
      const { data: jobs, error: jobsError } = await supabaseAdmin
        .schema('core')
        .from('jobs')
        .select('id')
        .in('organization_id', Array.from(organizationIds))

      if (jobsError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to fetch jobs: ${jobsError.message}`,
        })
      }

      const jobIds = (jobs ?? []).map((j) => j.id as string).filter(Boolean)

      // If no jobs found, return empty result
      if (jobIds.length === 0) {
        return {
          applications: [],
          total: 0,
          page_info: {
            has_more: false,
            offset: input.offset,
            limit: input.limit,
          },
        }
      }

      // Apply job_id filter if provided
      const filteredJobIds = input.job_id ? jobIds.filter((id) => id === input.job_id) : jobIds

      if (filteredJobIds.length === 0) {
        return {
          applications: [],
          total: 0,
          page_info: {
            has_more: false,
            offset: input.offset,
            limit: input.limit,
          },
        }
      }

      // Build query to get applications for jobs in user's organizations
      let query = supabaseAdmin
        .schema('core')
        .from('applications')
        .select(
          `
          *,
          job:jobs!inner(
            id,
            title,
            location,
            organization_id,
            status,
            pay_range_min_cents,
            pay_range_max_cents,
            pay_range_type,
            employment_type
          ),
          candidate:users!user_id(
            id,
            username,
            display_name,
            about,
            avatar_path
          )
        `,
          { count: 'exact' }
        )
        .in('job_id', filteredJobIds)
        .order('created_at', { ascending: false })
        .range(input.offset, input.offset + input.limit - 1)

      // Apply filters
      if (input.status) {
        query = query.eq('status', input.status)
      }

      if (input.date_from) {
        query = query.gte('created_at', input.date_from)
      }

      if (input.date_to) {
        query = query.lte('created_at', input.date_to)
      }

      const { data, error, count } = await query

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to fetch applications: ${error.message}`,
        })
      }

      // Transform data to match expected output format
      const applications = (data ?? []).map((app) => {
        const job = app.job as {
          id: string
          title: string | null
          location: string | null
          organization_id: string
          status: string
        } | null
        const candidate = app.candidate as {
          id: string
          username: string | null
          display_name: string | null
          about: string | null
          avatar_path: string | null
        } | null

        // Extract data from answers JSONB if it exists
        const answers = (app.answers as Record<string, unknown> | null) || {}
        const customQuestionAnswers =
          (answers.custom_question_answers as Array<{
            question: string
            answer: string
          }>) || []

        return {
          id: app.id,
          job_id: app.job_id,
          user_id: app.user_id,
          status: app.status,
          applied_at: app.created_at,
          updated_at: app.stage_changed_at || app.created_at,
          application_score: (answers.application_score as number | null) || null,
          auto_rejected: (answers.auto_rejected as boolean | null) || false,
          current_location: (answers.current_location as string | null) || null,
          willing_to_relocate: (answers.willing_to_relocate as boolean | null) || false,
          years_experience: (answers.years_experience as number | null) || 0,
          is_authorized_to_work: (answers.is_authorized_to_work as boolean | null) || false,
          earliest_start_date: (answers.earliest_start_date as string | null) || null,
          custom_question_answers: customQuestionAnswers,
          attachments: (answers.attachments as Record<string, unknown> | null) || {},
          candidate_id: candidate?.id || app.user_id,
          candidate_name: candidate?.display_name || candidate?.username || 'Unknown',
          profile_about: candidate?.about || null,
          profile_avatar_path: candidate?.avatar_path || null,
          job_title: job?.title || 'Unknown Job',
          job_location: job?.location || null,
          // Include nested job object for component compatibility
          job: job
            ? {
                id: job.id,
                title: job.title,
                location: job.location,
                organization_id: job.organization_id,
                status: job.status,
              }
            : null,
        }
      })

      return {
        applications,
        total: count ?? 0,
        page_info: {
          has_more: (count ?? 0) > input.offset + input.limit,
          offset: input.offset,
          limit: input.limit,
        },
      }
    }),
})

function normalizeOrganizationSlugInput(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_ORGANIZATION_SLUG_LENGTH)
}

function validateOrganizationSlug(
  slug: string
): { valid: boolean; reason?: OrganizationSlugValidationReason } {
  if (!slug) {
    return { valid: false, reason: 'format' }
  }

  if (slug.length < 3 || slug.length > MAX_ORGANIZATION_SLUG_LENGTH) {
    return { valid: false, reason: 'format' }
  }

  if (!ORGANIZATION_SLUG_PATTERN.test(slug)) {
    return { valid: false, reason: 'format' }
  }

  if (slug.includes('--') || slug.startsWith('-') || slug.endsWith('-')) {
    return { valid: false, reason: 'format' }
  }

  if (RESERVED_ORGANIZATION_SLUGS.has(slug)) {
    return { valid: false, reason: 'reserved' }
  }

  return { valid: true }
}

function getOrganizationSlugSuggestions(baseSlug: string, existingSlugs: string[]): string[] {
  const suggestions: string[] = []
  const existingSet = new Set(existingSlugs.map((s) => s.toLowerCase()))

  for (let i = 2; i <= 6; i++) {
    const candidate = `${baseSlug}-${i}`
    if (!existingSet.has(candidate) && validateOrganizationSlug(candidate).valid) {
      suggestions.push(candidate)
      if (suggestions.length >= 3) {
        return suggestions
      }
    }
  }

  const suffixes = ['team', 'group', 'hq', 'inc', 'llc']
  for (const suffix of suffixes) {
    if (suggestions.length >= 3) break
    const candidate = `${baseSlug}-${suffix}`
    if (!existingSet.has(candidate) && validateOrganizationSlug(candidate).valid) {
      suggestions.push(candidate)
    }
  }

  if (suggestions.length < 3) {
    const candidate = baseSlug.replace(/-/g, '')
    if (validateOrganizationSlug(candidate).valid && !existingSet.has(candidate)) {
      suggestions.push(candidate)
    }
  }

  return suggestions.slice(0, 3)
}
