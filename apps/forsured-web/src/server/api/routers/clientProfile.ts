/**
 * Client Profile Router
 * REQ-274: Clickable Client Navigation
 * TASK-2: Implement Client Profile Data Fetching
 *
 * Provides client profile data including:
 * - Client basic information (name, ID)
 * - GC relationships with compliance scores
 * - Recent activity feed
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { forsured } from '../../../lib/supabase';

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
 * Compliance status enum based on score
 */
type ComplianceStatus = 'compliant' | 'warning' | 'critical';

function getComplianceStatus(score: number): ComplianceStatus {
  if (score >= 80) return 'compliant';
  if (score >= 60) return 'warning';
  return 'critical';
}

/**
 * Client Profile Router
 *
 * All procedures:
 * - Require authentication (use protectedProcedure)
 * - Validate input with Zod schemas
 * - Check organization authorization before data access
 * - Return organization-scoped data only
 */
export const clientProfileRouter = createTRPCRouter({
  /**
   * Get client profile with GC relationships and recent activity
   */
  getProfile: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid('Organization ID must be a valid UUID'),
        clientId: z.string().uuid('Client ID must be a valid UUID'),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify user has access to this organization
      verifyOrganizationAccess(ctx.organizationId, input.organizationId);

      // Fetch client basic information
      const { data: clientData, error: clientError } = await forsured('clients')
        .select('id, name, type, organization_id, created_at')
        .eq('id', input.clientId)
        .eq('organization_id', input.organizationId)
        .single();

      if (clientError || !clientData) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Client not found',
          cause: clientError,
        });
      }

      // Fetch GC relationships with compliance scores
      // Structure: gc_relationships table with foreign key to gcs table and compliance_scores
      const { data: gcRelationshipsData, error: gcError } = await forsured('gc_relationships')
        .select(
          `
          id,
          gc_id,
          client_id,
          gcs (
            id,
            name
          ),
          compliance_scores (
            score,
            status
          )
        `
        )
        .eq('client_id', input.clientId)
        .order('created_at', { ascending: false });

      if (gcError) {
        // If gc_relationships table doesn't exist, return empty array
        console.warn('Failed to fetch GC relationships:', gcError);
      }

      // Transform GC relationships data
      const gcRelationships = (gcRelationshipsData || []).map(
        (rel: Record<string, unknown>) => {
          const gc = rel.gcs as { id: string; name: string } | null;
          const complianceScores = rel.compliance_scores as
            | Array<{ score: number; status: string }>
            | null;
          const latestScore = complianceScores?.[0]?.score ?? 0;

          return {
            gcId: gc?.id || (rel.gc_id as string),
            gcName: gc?.name || 'Unknown GC',
            complianceScore: latestScore,
            complianceStatus: getComplianceStatus(latestScore),
          };
        }
      );

      // Fetch recent activity for the client
      const { data: activityData, error: activityError } = await forsured('activity_logs')
        .select('id, type, description, created_at')
        .eq('client_id', input.clientId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (activityError) {
        // If activity_logs table doesn't exist, return empty array
        console.warn('Failed to fetch activity logs:', activityError);
      }

      // Transform activity data
      const recentActivity = (activityData || []).map((activity: Record<string, unknown>) => ({
        id: activity.id as string,
        type: activity.type as string,
        description: activity.description as string,
        timestamp: activity.created_at as string,
      }));

      return {
        client: {
          id: clientData.id as string,
          name: clientData.name as string,
          type: clientData.type as string,
        },
        gcRelationships,
        recentActivity,
      };
    }),

  /**
   * Get list of clients for navigation/linking
   */
  list: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid('Organization ID must be a valid UUID'),
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify user has access to this organization
      verifyOrganizationAccess(ctx.organizationId, input.organizationId);

      let query = forsured('clients')
        .select('id, name, type', { count: 'exact' })
        .eq('organization_id', input.organizationId);

      // Apply search filter
      if (input.search) {
        query = query.ilike('name', `%${input.search}%`);
      }

      // Apply pagination and ordering
      const { data, error, count } = await query
        .order('name', { ascending: true })
        .range(input.offset, input.offset + input.limit - 1);

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch clients',
          cause: error,
        });
      }

      return {
        clients: (data || []).map((client: Record<string, unknown>) => ({
          id: client.id as string,
          name: client.name as string,
          type: client.type as string,
        })),
        total: count || 0,
        limit: input.limit,
        offset: input.offset,
      };
    }),
});
