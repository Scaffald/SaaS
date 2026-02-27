/**
 * Participants Router
 * Participants Tab Compliance View
 * TASK-1, TASK-2: Create participants tRPC router with compliance data endpoints
 *
 * Handles project participant (subcontractor) data access with compliance scoring.
 * Enables GCs to view all project participants with their compliance status.
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { forsured } from '../../../lib/supabase';

/**
 * Compliance status enum matching UI component expectations
 * Maps to ComplianceStatus from @unicornlove/compliance
 */
export const participantComplianceStatusEnum = z.enum([
  'compliant',
  'pending',
  'at-risk',
  'non-compliant',
]);

export type ParticipantComplianceStatus = z.infer<typeof participantComplianceStatusEnum>;

/**
 * Participant type enum
 */
export const participantTypeEnum = z.enum(['individual', 'organization']);

export type ParticipantType = z.infer<typeof participantTypeEnum>;

/**
 * Participant schema for response
 */
export const participantSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  company: z.string(),
  type: participantTypeEnum,
  role: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  status: participantComplianceStatusEnum,
  score: z.number().min(0).max(100).optional(),
  pendingItems: z.number().min(0).optional(),
  lastActivity: z.string().optional(),
});

export type Participant = z.infer<typeof participantSchema>;

/**
 * Authorization helper that verifies user belongs to the requested organization
 */
function verifyOrganizationAccess(
  userOrganizationId: string | null,
  requestedOrganizationId: string
): void {
  if (!userOrganizationId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You must belong to an organization to access this resource',
    });
  }

  if (userOrganizationId !== requestedOrganizationId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You do not have permission to access data from this organization',
    });
  }
}

/**
 * Calculate compliance status based on score
 * Score thresholds:
 * - 100: compliant
 * - 70-99: at-risk (warning)
 * - 1-69: pending (needs attention)
 * - 0: non-compliant
 */
function calculateComplianceStatus(score: number | null): ParticipantComplianceStatus {
  if (score === null || score === undefined) {
    return 'pending';
  }
  if (score >= 100) {
    return 'compliant';
  }
  if (score >= 70) {
    return 'at-risk';
  }
  if (score > 0) {
    return 'pending';
  }
  return 'non-compliant';
}

/**
 * Map database compliance status to UI status
 * Database uses: compliant, warning, critical
 * UI uses: compliant, pending, at-risk, non-compliant
 */
function mapDatabaseStatusToUIStatus(
  dbStatus: string | null,
  score: number | null
): ParticipantComplianceStatus {
  if (dbStatus === 'compliant') {
    return 'compliant';
  }
  if (dbStatus === 'warning') {
    return 'at-risk';
  }
  if (dbStatus === 'critical') {
    return 'non-compliant';
  }
  // Fallback to score-based calculation
  return calculateComplianceStatus(score);
}

/**
 * Participants Router
 *
 * All procedures:
 * - Require authentication (use protectedProcedure)
 * - Validate input with Zod schemas
 * - Check organization authorization before data access
 * - Return organization-scoped data only
 */
export const participantsRouter = createTRPCRouter({
  /**
   * List all participants for a project with compliance data
   *
   * Returns all subcontractors assigned to a project with their
   * compliance scores and status for that specific project.
   */
  listByProject: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid('Organization ID must be a valid UUID'),
        projectId: z.string().uuid('Project ID must be a valid UUID'),
        status: participantComplianceStatusEnum.optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify user has access to this organization
      verifyOrganizationAccess(ctx.organizationId, input.organizationId);

      // Verify project belongs to organization
      const { data: project, error: projectError } = await forsured('projects')
        .select('id')
        .eq('id', input.projectId)
        .eq('organization_id', input.organizationId)
        .single();

      if (projectError || !project) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found or does not belong to your organization',
        });
      }

      // Query subcontractors with compliance scores for this project
      const { data: subcontractors, error: subError } = await forsured('subcontractors')
        .select(`
          id,
          name,
          company,
          contact_info,
          created_at
        `)
        .eq('organization_id', input.organizationId)
        .order('created_at', { ascending: false })
        .range(input.offset, input.offset + input.limit - 1);

      if (subError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch participants',
          cause: subError,
        });
      }

      if (!subcontractors || subcontractors.length === 0) {
        return {
          participants: [],
          total: 0,
          limit: input.limit,
          offset: input.offset,
        };
      }

      // Get compliance scores for these subcontractors on this project
      const subcontractorIds = subcontractors.map((s) => s.id);
      const { data: complianceScores, error: compError } = await forsured('compliance_scores')
        .select('subcontractor_id, score, status, gaps, last_evaluated')
        .eq('project_id', input.projectId)
        .in('subcontractor_id', subcontractorIds);

      if (compError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch compliance scores',
          cause: compError,
        });
      }

      // Get pending compliance issues count for each subcontractor
      const { data: issuesCounts, error: issuesError } = await forsured('compliance_issues')
        .select('subcontractor_id')
        .eq('project_id', input.projectId)
        .eq('status', 'open')
        .in('subcontractor_id', subcontractorIds);

      if (issuesError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch compliance issues',
          cause: issuesError,
        });
      }

      // Build lookup maps for compliance data
      const scoreMap = new Map(
        (complianceScores || []).map((c) => [
          c.subcontractor_id,
          { score: c.score, status: c.status, lastEvaluated: c.last_evaluated },
        ])
      );

      // Count issues per subcontractor
      const issuesCountMap = new Map<string, number>();
      (issuesCounts || []).forEach((issue) => {
        const count = issuesCountMap.get(issue.subcontractor_id) || 0;
        issuesCountMap.set(issue.subcontractor_id, count + 1);
      });

      // Transform subcontractors to participants
      const participants: Participant[] = subcontractors.map((sub) => {
        const complianceData = scoreMap.get(sub.id);
        const pendingItems = issuesCountMap.get(sub.id) || 0;
        const contactInfo = sub.contact_info as { email?: string; phone?: string; role?: string } | null;

        const uiStatus = complianceData
          ? mapDatabaseStatusToUIStatus(complianceData.status, complianceData.score)
          : pendingItems > 0
            ? 'pending'
            : 'pending'; // Default to pending if no compliance data

        return {
          id: sub.id,
          name: sub.name,
          company: sub.company,
          type: 'organization' as ParticipantType, // Subcontractors are organizations
          role: contactInfo?.role || 'Subcontractor',
          email: contactInfo?.email,
          phone: contactInfo?.phone,
          status: uiStatus,
          score: complianceData?.score ?? undefined,
          pendingItems,
          lastActivity: complianceData?.lastEvaluated
            ? new Date(complianceData.lastEvaluated).toISOString()
            : undefined,
        };
      });

      // Filter by status if specified
      const filteredParticipants = input.status
        ? participants.filter((p) => p.status === input.status)
        : participants;

      // Get total count
      const { count: totalCount, error: countError } = await forsured('subcontractors')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', input.organizationId);

      if (countError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to count participants',
          cause: countError,
        });
      }

      return {
        participants: filteredParticipants,
        total: totalCount || 0,
        limit: input.limit,
        offset: input.offset,
      };
    }),

  /**
   * Get a single participant with detailed compliance information
   */
  get: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid('Organization ID must be a valid UUID'),
        projectId: z.string().uuid('Project ID must be a valid UUID'),
        participantId: z.string().uuid('Participant ID must be a valid UUID'),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify user has access to this organization
      verifyOrganizationAccess(ctx.organizationId, input.organizationId);

      // Query subcontractor
      const { data: subcontractor, error: subError } = await forsured('subcontractors')
        .select('*')
        .eq('id', input.participantId)
        .eq('organization_id', input.organizationId)
        .single();

      if (subError || !subcontractor) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Participant not found or does not belong to your organization',
        });
      }

      // Get compliance score for this project
      const { data: complianceScore, error: compError } = await forsured('compliance_scores')
        .select('*')
        .eq('project_id', input.projectId)
        .eq('subcontractor_id', input.participantId)
        .single();

      // Note: It's okay if no compliance score exists yet
      if (compError && compError.code !== 'PGRST116') {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch compliance score',
          cause: compError,
        });
      }

      // Get compliance issues for this subcontractor on this project
      const { data: issues, error: issuesError } = await forsured('compliance_issues')
        .select('*')
        .eq('project_id', input.projectId)
        .eq('subcontractor_id', input.participantId)
        .order('created_at', { ascending: false });

      if (issuesError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch compliance issues',
          cause: issuesError,
        });
      }

      const contactInfo = subcontractor.contact_info as {
        email?: string;
        phone?: string;
        role?: string;
      } | null;

      const pendingItems = (issues || []).filter((i) => i.status === 'open').length;
      const uiStatus = complianceScore
        ? mapDatabaseStatusToUIStatus(complianceScore.status, complianceScore.score)
        : pendingItems > 0
          ? 'pending'
          : 'pending';

      return {
        participant: {
          id: subcontractor.id,
          name: subcontractor.name,
          company: subcontractor.company,
          type: 'organization' as ParticipantType,
          role: contactInfo?.role || 'Subcontractor',
          email: contactInfo?.email,
          phone: contactInfo?.phone,
          status: uiStatus,
          score: complianceScore?.score ?? undefined,
          pendingItems,
          lastActivity: complianceScore?.last_evaluated
            ? new Date(complianceScore.last_evaluated).toISOString()
            : undefined,
        },
        complianceDetails: complianceScore
          ? {
              score: complianceScore.score,
              status: complianceScore.status,
              gaps: complianceScore.gaps,
              lastEvaluated: complianceScore.last_evaluated,
            }
          : null,
        issues: issues || [],
      };
    }),

  /**
   * Get compliance summary for a project
   *
   * Returns aggregate compliance statistics for all participants
   */
  getComplianceSummary: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid('Organization ID must be a valid UUID'),
        projectId: z.string().uuid('Project ID must be a valid UUID'),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify user has access to this organization
      verifyOrganizationAccess(ctx.organizationId, input.organizationId);

      // Verify project belongs to organization
      const { data: project, error: projectError } = await forsured('projects')
        .select('id')
        .eq('id', input.projectId)
        .eq('organization_id', input.organizationId)
        .single();

      if (projectError || !project) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found or does not belong to your organization',
        });
      }

      // Get all subcontractors for this organization
      const { data: subcontractors, error: subError, count: totalCount } = await forsured(
        'subcontractors'
      )
        .select('id', { count: 'exact' })
        .eq('organization_id', input.organizationId);

      if (subError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch participants',
          cause: subError,
        });
      }

      if (!subcontractors || subcontractors.length === 0) {
        return {
          total: 0,
          compliant: 0,
          pending: 0,
          atRisk: 0,
          nonCompliant: 0,
          averageScore: 0,
        };
      }

      const subcontractorIds = subcontractors.map((s) => s.id);

      // Get compliance scores
      const { data: scores, error: scoresError } = await forsured('compliance_scores')
        .select('score, status')
        .eq('project_id', input.projectId)
        .in('subcontractor_id', subcontractorIds);

      if (scoresError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch compliance scores',
          cause: scoresError,
        });
      }

      // Calculate summary
      let compliant = 0;
      let pending = 0;
      let atRisk = 0;
      let nonCompliant = 0;
      let totalScore = 0;

      (scores || []).forEach((s) => {
        const uiStatus = mapDatabaseStatusToUIStatus(s.status, s.score);
        if (uiStatus === 'compliant') compliant++;
        else if (uiStatus === 'pending') pending++;
        else if (uiStatus === 'at-risk') atRisk++;
        else if (uiStatus === 'non-compliant') nonCompliant++;
        totalScore += s.score || 0;
      });

      // Participants without scores are pending
      const withoutScores = (totalCount || 0) - (scores?.length || 0);
      pending += withoutScores;

      const averageScore =
        scores && scores.length > 0 ? Math.round(totalScore / scores.length) : 0;

      return {
        total: totalCount || 0,
        compliant,
        pending,
        atRisk,
        nonCompliant,
        averageScore,
      };
    }),

  /**
   * Calculate and update compliance score for a participant
   *
   * This recalculates the compliance score based on:
   * - Project requirements vs actual coverage
   * - Open compliance issues
   * - Policy expiration status
   */
  recalculateCompliance: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid('Organization ID must be a valid UUID'),
        projectId: z.string().uuid('Project ID must be a valid UUID'),
        participantId: z.string().uuid('Participant ID must be a valid UUID'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify user has access to this organization
      verifyOrganizationAccess(ctx.organizationId, input.organizationId);

      // Get project requirements
      const { data: requirements, error: reqError } = await forsured('requirements')
        .select('*')
        .eq('project_id', input.projectId)
        .eq('organization_id', input.organizationId);

      if (reqError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch project requirements',
          cause: reqError,
        });
      }

      const totalRequirements = requirements?.length || 0;

      if (totalRequirements === 0) {
        // No requirements = automatically compliant
        const { error: upsertError } = await forsured('compliance_scores').upsert(
          {
            project_id: input.projectId,
            subcontractor_id: input.participantId,
            organization_id: input.organizationId,
            score: 100,
            status: 'compliant',
            gaps: [],
            last_evaluated: new Date().toISOString(),
          },
          {
            onConflict: 'project_id,subcontractor_id',
          }
        );

        if (upsertError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to update compliance score',
            cause: upsertError,
          });
        }

        return {
          score: 100,
          status: 'compliant' as ParticipantComplianceStatus,
          gaps: [],
        };
      }

      // Count open compliance issues (represents unmet requirements)
      const { data: openIssues, error: issuesError } = await forsured('compliance_issues')
        .select('id, type, title')
        .eq('project_id', input.projectId)
        .eq('subcontractor_id', input.participantId)
        .eq('status', 'open');

      if (issuesError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch compliance issues',
          cause: issuesError,
        });
      }

      const issuesCount = openIssues?.length || 0;

      // Calculate score: (met requirements / total requirements) * 100
      // Each open issue represents an unmet requirement
      const metRequirements = Math.max(0, totalRequirements - issuesCount);
      const score = Math.round((metRequirements / totalRequirements) * 100);

      // Determine status
      let status: 'compliant' | 'warning' | 'critical';
      if (score >= 100) {
        status = 'compliant';
      } else if (score >= 70) {
        status = 'warning';
      } else {
        status = 'critical';
      }

      // Build gaps array
      const gaps = (openIssues || []).map((issue) => ({
        type: issue.type,
        title: issue.title,
      }));

      // Upsert compliance score
      const { error: upsertError } = await forsured('compliance_scores').upsert(
        {
          project_id: input.projectId,
          subcontractor_id: input.participantId,
          organization_id: input.organizationId,
          score,
          status,
          gaps,
          last_evaluated: new Date().toISOString(),
        },
        {
          onConflict: 'project_id,subcontractor_id',
        }
      );

      if (upsertError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update compliance score',
          cause: upsertError,
        });
      }

      return {
        score,
        status: mapDatabaseStatusToUIStatus(status, score),
        gaps,
      };
    }),
});
