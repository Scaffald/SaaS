/**
 * Legal Agreements REST API
 * Office role required. Violation reports management.
 * Migrated from tRPC legalAgreementsRouter.
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { requireRole } from '../middleware/auth.ts'

const app = new Hono()
app.use('*', requireRole('office', 'platform'))

app.get(
  '/violation-reports',
  zValidator(
    'query',
    z.object({
      status: z
        .enum(['pending', 'under_review', 'confirmed', 'dismissed', 'resolved'])
        .optional(),
      violationType: z
        .enum(['off_platform_hire', 'off_platform_communication', 'fee_avoidance', 'other'])
        .optional(),
      organizationId: z.string().uuid().optional(),
      workerUserId: z.string().uuid().optional(),
      limit: z.coerce.number().int().positive().max(100).default(50),
      offset: z.coerce.number().int().nonnegative().default(0),
    })
  ),
  async (c) => {
    const supabaseAdmin = c.get('supabaseAdmin')
    if (!supabaseAdmin) return c.json({ error: 'Unauthorized' }, 401)

    const input = c.req.valid('query')

    let query = supabaseAdmin
      .schema('core')
      .from('circumvention_reports')
      .select(
        `
        *,
        reported_by:users!circumvention_reports_reported_by_user_id_fkey(id, display_name, email),
        organization:organizations(id, name),
        worker:users!circumvention_reports_worker_user_id_fkey(id, display_name, email),
        hire_agreement:hire_agreements(id, status)
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(input.offset, input.offset + input.limit - 1)

    if (input.status) query = query.eq('status', input.status)
    if (input.violationType) query = query.eq('violation_type', input.violationType)
    if (input.organizationId) query = query.eq('organization_id', input.organizationId)
    if (input.workerUserId) query = query.eq('worker_user_id', input.workerUserId)

    const { data, error, count } = await query

    if (error) {
      return c.json({ error: `Failed to load violation reports: ${error.message}` }, 500)
    }

    type ReportRow = {
      id: string
      status: string
      violation_type: string
      description: string | null
      reported_by: { id: string; display_name: string | null; email: string | null } | null
      organization: { id: string; name: string } | null
      worker: { id: string; display_name: string | null; email: string | null } | null
      resolution_action: string | null
      resolved_at: string | null
      created_at: string
      updated_at: string
      [key: string]: unknown
    }

    return c.json({
      items: ((data as ReportRow[]) ?? []).map((row) => ({
        id: row.id,
        status: row.status,
        violationType: row.violation_type,
        description: row.description,
        reportedByName: row.reported_by?.display_name ?? row.reported_by?.email ?? null,
        organizationName: row.organization?.name ?? null,
        workerName: row.worker?.display_name ?? row.worker?.email ?? null,
        resolutionAction: row.resolution_action,
        resolvedAt: row.resolved_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
      totalCount: count ?? 0,
    })
  }
)

app.patch(
  '/violation-reports/:reportId',
  zValidator(
    'json',
    z.object({
      status: z
        .enum(['pending', 'under_review', 'confirmed', 'dismissed', 'resolved'])
        .optional(),
      reviewNotes: z.string().optional(),
      resolutionAction: z
        .enum([
          'warning_issued',
          'fee_collected',
          'account_suspended',
          'account_terminated',
          'no_action',
          'other',
        ])
        .optional(),
    })
  ),
  async (c) => {
    const supabaseAdmin = c.get('supabaseAdmin')
    const user = c.get('user')
    if (!supabaseAdmin) return c.json({ error: 'Unauthorized' }, 401)

    const reportId = c.req.param('reportId')
    const input = c.req.valid('json')

    const updateData: Record<string, unknown> = {}

    if (input.status) {
      updateData.status = input.status
      const reviewableStatuses = ['under_review', 'confirmed', 'dismissed', 'resolved']
      if (reviewableStatuses.includes(input.status)) {
        updateData.reviewed_by_user_id = user?.id ?? null
        updateData.reviewed_at = new Date().toISOString()
      }
      if (input.status === 'resolved') {
        updateData.resolved_at = new Date().toISOString()
      }
    }

    if (input.reviewNotes !== undefined) {
      updateData.review_notes = input.reviewNotes
    }

    if (input.resolutionAction !== undefined) {
      updateData.resolution_action = input.resolutionAction
    }

    const { data: report, error } = await supabaseAdmin
      .schema('core')
      .from('circumvention_reports')
      .update(updateData)
      .eq('id', reportId)
      .select('*')
      .maybeSingle()

    if (error || !report) {
      return c.json(
        {
          error: error
            ? `Failed to update violation report: ${error.message}`
            : 'Violation report not found',
        },
        error ? 500 : 404
      )
    }

    return c.json({
      id: (report as Record<string, unknown>).id,
      status: (report as Record<string, unknown>).status,
      updatedAt: (report as Record<string, unknown>).updated_at,
    })
  }
)

export default app
