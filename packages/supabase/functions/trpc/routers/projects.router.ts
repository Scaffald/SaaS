import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import type { Context } from '../context.ts';
import { protectedProcedure, t } from '../middleware.ts';

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/

/**
 * Helper function to check if user can edit a project
 */
async function canEditProject(supabase: Context['supabase'], userId: string, projectId: string): Promise<boolean> {
  // Get project
  const { data: project, error } = await supabase
    .schema('core')
    .from('projects')
    .select('created_by, organization_id')
    .eq('id', projectId)
    .single()

  if (error || !project) {
    return false
  }

  // Creator can always edit
  if (project.created_by === userId) {
    return true
  }

  // Check if user is org admin or super admin
  const { data: roleAssignments } = await supabase
    .schema('core')
    .from('role_assignments')
    .select('role:roles(name, scope), scope_org_id')
    .eq('user_id', userId)

  if (!roleAssignments) {
    return false
  }

  // biome-ignore lint/suspicious/noExplicitAny: Role can be array or object from join
  return roleAssignments.some((assignment: any) => {
    const role = Array.isArray(assignment.role) ? assignment.role[0] : assignment.role
    return (
      role &&
      (assignment.scope_org_id === project.organization_id ||
        (role.name === 'admin' && role.scope === 'platform') ||
        (role.name === 'super_admin' && role.scope === 'platform'))
    )
  })
}

/**
 * Helper function to check if user is organization member
 */
async function isOrganizationMember(
  supabase: Context['supabase'],
  userId: string,
  organizationId: string
): Promise<boolean> {
  const { data: roleAssignments } = await supabase
    .schema('core')
    .from('role_assignments')
    .select('role:roles(name, scope), scope_org_id')
    .eq('user_id', userId)

  if (!roleAssignments) {
    return false
  }

  // biome-ignore lint/suspicious/noExplicitAny: Role can be array or object from join
  return roleAssignments.some((assignment: any) => {
    const role = Array.isArray(assignment.role) ? assignment.role[0] : assignment.role
    return (
      role &&
      (assignment.scope_org_id === organizationId ||
        (role.name === 'admin' && role.scope === 'platform') ||
        (role.name === 'super_admin' && role.scope === 'platform'))
    )
  })
}

/**
 * Projects Router
 * Handles project CRUD operations and worker management
 */
export const projectsRouter = t.router({
  /**
   * Create a new project
   */
  create: protectedProcedure
    .input(
      z.object({
        organization_id: z.string().uuid(),
        name: z.string().min(1, 'Name is required').max(255),
        description: z.string().optional(),
        status: z.enum(['planning', 'active', 'completed', 'on_hold']).optional(),
        start_date: z
          .string()
          .regex(DATE_ONLY_REGEX, 'Invalid date format. Expected YYYY-MM-DD.')
          .optional(),
        end_date: z
          .string()
          .regex(DATE_ONLY_REGEX, 'Invalid date format. Expected YYYY-MM-DD.')
          .optional(),
        location_visibility: z
          .enum(['public', 'authenticated', 'organization_only', 'private'])
          .optional(),
        location_visibility_override: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      // Check if user is organization member
      const isMember = await isOrganizationMember(ctx.supabase, ctx.user.id, input.organization_id)

      if (!isMember) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to create projects for this organization',
        })
      }

      // Get organization default visibility if not overridden
      const { data: org } = await ctx.supabase
        .schema('core')
        .from('organizations')
        .select('default_project_location_visibility')
        .eq('id', input.organization_id)
        .single()

      const locationVisibility =
        input.location_visibility || org?.default_project_location_visibility || 'organization_only'

      const { data: project, error } = await ctx.supabase
        .schema('core')
        .from('projects')
        .insert({
          organization_id: input.organization_id,
          name: input.name.trim(),
          description: input.description?.trim() || null,
          status: input.status || 'planning',
          start_date: input.start_date || null,
          end_date: input.end_date || null,
          location_visibility: locationVisibility,
          location_visibility_override: input.location_visibility_override || false,
          created_by: ctx.user.id,
        })
        .select()
        .single()

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to create project: ${error.message}`,
        })
      }

      return { project }
    }),

  /**
   * Update a project
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().optional().nullable(),
        status: z.enum(['planning', 'active', 'completed', 'on_hold']).optional(),
        start_date: z
          .string()
          .regex(DATE_ONLY_REGEX, 'Invalid date format. Expected YYYY-MM-DD.')
          .optional()
          .nullable(),
        end_date: z
          .string()
          .regex(DATE_ONLY_REGEX, 'Invalid date format. Expected YYYY-MM-DD.')
          .optional()
          .nullable(),
        location_visibility: z
          .enum(['public', 'authenticated', 'organization_only', 'private'])
          .optional(),
        location_visibility_override: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const { id, ...updates } = input

      // Check permissions
      const canEdit = await canEditProject(ctx.supabase, ctx.user.id, id)

      if (!canEdit) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to edit this project',
        })
      }

      const updateData: {
        name?: string
        description?: string | null
        status?: string
        start_date?: string | null
        end_date?: string | null
        location_visibility?: string
        location_visibility_override?: boolean
      } = {}
      if (updates.name !== undefined) updateData.name = updates.name.trim()
      if (updates.description !== undefined)
        updateData.description = updates.description?.trim() || null
      if (updates.status !== undefined) updateData.status = updates.status
      if (updates.start_date !== undefined) updateData.start_date = updates.start_date || null
      if (updates.end_date !== undefined) updateData.end_date = updates.end_date || null
      if (updates.location_visibility !== undefined)
        updateData.location_visibility = updates.location_visibility
      if (updates.location_visibility_override !== undefined)
        updateData.location_visibility_override = updates.location_visibility_override

      const { data: project, error } = await ctx.supabase
        .schema('core')
        .from('projects')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to update project: ${error.message}`,
        })
      }

      return { project }
    }),

  /**
   * Get a project by ID with sites, addresses, and workers
   */
  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data: project, error } = await ctx.supabase
        .schema('core')
        .from('projects')
        .select(
          `
          *,
          project_sites(
            is_primary,
            site:sites(
              id,
              site_identifier,
              boundary,
              area_sqft,
              zoning_classification,
              jurisdiction,
              metadata
            )
          ),
          project_addresses(
            is_primary,
            address:addresses(
              id,
              address,
              geo,
              property_type,
              metadata
            )
          ),
          project_workers(
            id,
            user_id,
            job_id,
            status,
            claimed_by_worker,
            assigned_by_manager,
            approved_by,
            approved_at,
            start_date,
            end_date,
            role_on_project,
            notes
          )
        `
        )
        .eq('id', input.id)
        .single()

      if (error) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Project not found: ${error.message}`,
        })
      }

      // RLS will handle visibility filtering, but we can add additional checks here if needed
      return { project }
    }),

  /**
   * List projects with pagination and filters
   */
  list: protectedProcedure
    .input(
      z.object({
        organization_id: z.string().uuid().optional(),
        status: z.enum(['planning', 'active', 'completed', 'on_hold']).optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      let query = ctx.supabase
        .schema('core')
        .from('projects')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(input.offset, input.offset + input.limit - 1)

      if (input.organization_id) {
        query = query.eq('organization_id', input.organization_id)
      }

      if (input.status) {
        query = query.eq('status', input.status)
      }

      const { data: projects, error, count } = await query

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to list projects: ${error.message}`,
        })
      }

      return {
        projects: projects || [],
        count: count || 0,
      }
    }),

  /**
   * Add a site to a project
   */
  addSite: protectedProcedure
    .input(
      z.object({
        project_id: z.string().uuid(),
        site_id: z.string().uuid(),
        is_primary: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      // Check permissions
      const canEdit = await canEditProject(ctx.supabase, ctx.user.id, input.project_id)

      if (!canEdit) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to edit this project',
        })
      }

      // Check if site exists
      const { data: site } = await ctx.supabase
        .schema('core')
        .from('sites')
        .select('id, boundary')
        .eq('id', input.site_id)
        .single()

      if (!site) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Site not found',
        })
      }

      // Check for overlaps (validation will be done by trigger, but we can warn here)
      // Note: Overlap notifications are created automatically by the database trigger
      const { data: overlaps, error: overlapError } = await ctx.supabase
        .rpc('check_site_overlaps', {
          p_site_id: input.site_id,
          p_boundary: site.boundary,
        })

      if (overlapError) {
        console.warn('Failed to check site overlaps:', overlapError)
      }

      const { data: projectSite, error } = await ctx.supabase
        .schema('core')
        .from('project_sites')
        .insert({
          project_id: input.project_id,
          site_id: input.site_id,
          is_primary: input.is_primary || false,
        })
        .select()
        .single()

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to add site to project: ${error.message}`,
        })
      }

      return {
        project_site: projectSite,
        overlaps: overlaps || [],
      }
    }),

  /**
   * Add an address to a project
   */
  addAddress: protectedProcedure
    .input(
      z.object({
        project_id: z.string().uuid(),
        address_id: z.string().uuid(),
        is_primary: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      // Check permissions
      const canEdit = await canEditProject(ctx.supabase, ctx.user.id, input.project_id)

      if (!canEdit) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to edit this project',
        })
      }

      const { data: projectAddress, error } = await ctx.supabase
        .schema('core')
        .from('project_addresses')
        .insert({
          project_id: input.project_id,
          address_id: input.address_id,
          is_primary: input.is_primary || false,
        })
        .select()
        .single()

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to add address to project: ${error.message}`,
        })
      }

      return { project_address: projectAddress }
    }),

  /**
   * Manager assigns a worker to a project
   */
  addWorker: protectedProcedure
    .input(
      z.object({
        project_id: z.string().uuid(),
        user_id: z.string().uuid(),
        job_id: z.string().uuid().optional(),
        start_date: z
          .string()
          .regex(DATE_ONLY_REGEX, 'Invalid date format. Expected YYYY-MM-DD.')
          .optional(),
        end_date: z
          .string()
          .regex(DATE_ONLY_REGEX, 'Invalid date format. Expected YYYY-MM-DD.')
          .optional(),
        role_on_project: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      // Check permissions (manager/admin)
      const canEdit = await canEditProject(ctx.supabase, ctx.user.id, input.project_id)

      if (!canEdit) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only project managers and admins can assign workers',
        })
      }

      const { data: worker, error } = await ctx.supabase
        .schema('core')
        .from('project_workers')
        .insert({
          project_id: input.project_id,
          user_id: input.user_id,
          job_id: input.job_id || null,
          status: 'approved',
          assigned_by_manager: true,
          approved_by: ctx.user.id,
          approved_at: new Date().toISOString(),
          start_date: input.start_date || null,
          end_date: input.end_date || null,
          role_on_project: input.role_on_project || null,
          notes: input.notes || null,
        })
        .select()
        .single()

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to add worker: ${error.message}`,
        })
      }

      return { worker }
    }),

  /**
   * Worker claims they worked on a project
   */
  claimWork: protectedProcedure
    .input(
      z.object({
        project_id: z.string().uuid(),
        job_id: z.string().uuid().optional(),
        start_date: z
          .string()
          .regex(DATE_ONLY_REGEX, 'Invalid date format. Expected YYYY-MM-DD.')
          .optional(),
        end_date: z
          .string()
          .regex(DATE_ONLY_REGEX, 'Invalid date format. Expected YYYY-MM-DD.')
          .optional(),
        role_on_project: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const { data: worker, error } = await ctx.supabase
        .schema('core')
        .from('project_workers')
        .insert({
          project_id: input.project_id,
          user_id: ctx.user.id,
          job_id: input.job_id || null,
          status: 'pending',
          claimed_by_worker: true,
          start_date: input.start_date || null,
          end_date: input.end_date || null,
          role_on_project: input.role_on_project || null,
          notes: input.notes || null,
        })
        .select()
        .single()

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to claim work: ${error.message}`,
        })
      }

      return { worker }
    }),

  /**
   * Manager approves a worker claim
   */
  approveWorker: protectedProcedure
    .input(z.object({ project_worker_id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      // Get project_worker to find project_id
      const { data: projectWorker } = await ctx.supabase
        .schema('core')
        .from('project_workers')
        .select('project_id')
        .eq('id', input.project_worker_id)
        .single()

      if (!projectWorker) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Worker association not found',
        })
      }

      // Check permissions
      const canEdit = await canEditProject(ctx.supabase, ctx.user.id, projectWorker.project_id)

      if (!canEdit) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only project managers and admins can approve worker claims',
        })
      }

      const { data: worker, error } = await ctx.supabase
        .schema('core')
        .from('project_workers')
        .update({
          status: 'approved',
          approved_by: ctx.user.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', input.project_worker_id)
        .select()
        .single()

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to approve worker: ${error.message}`,
        })
      }

      return { worker }
    }),

  /**
   * Manager rejects a worker claim
   */
  rejectWorker: protectedProcedure
    .input(
      z.object({
        project_worker_id: z.string().uuid(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      // Get project_worker to find project_id
      const { data: projectWorker } = await ctx.supabase
        .schema('core')
        .from('project_workers')
        .select('project_id')
        .eq('id', input.project_worker_id)
        .single()

      if (!projectWorker) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Worker association not found',
        })
      }

      // Check permissions
      const canEdit = await canEditProject(ctx.supabase, ctx.user.id, projectWorker.project_id)

      if (!canEdit) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only project managers and admins can reject worker claims',
        })
      }

      const updateData: {
        status: string
        notes?: string
      } = {
        status: 'rejected',
      }

      if (input.reason) {
        updateData.notes = input.reason
      }

      const { data: worker, error } = await ctx.supabase
        .schema('core')
        .from('project_workers')
        .update(updateData)
        .eq('id', input.project_worker_id)
        .select()
        .single()

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to reject worker: ${error.message}`,
        })
      }

      return { worker }
    }),
})
