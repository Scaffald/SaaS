/**
 * Documents Router
 * Document Organization by Client/Project/GC
 * TASK-2: Build Document List with Filtering and Search
 *
 * Handles document data access with organization-scoped authorization.
 * Provides listing and filtering of documents by client, project, type, and status.
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { forsured } from '../../../lib/supabase';

/**
 * Document type enum matching database values
 */
const DocumentTypeEnum = z.enum(['coi', 'license', 'contract', 'w9', 'endorsement', 'other']);

/**
 * Document status enum matching database values
 */
const DocumentStatusEnum = z.enum(['verified', 'pending', 'expiring', 'expired']);

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
 * Documents Router
 *
 * All procedures:
 * - Require authentication (use protectedProcedure)
 * - Validate input with Zod schemas
 * - Check organization authorization before data access
 * - Return organization-scoped data only
 */
export const documentsRouter = createTRPCRouter({
  /**
   * List documents with filtering and search
   */
  list: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid('Organization ID must be a valid UUID'),
        clientId: z.string().uuid().optional(),
        projectId: z.string().uuid().optional(),
        docType: DocumentTypeEnum.optional(),
        status: DocumentStatusEnum.optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify user has access to this organization
      verifyOrganizationAccess(ctx.organizationId, input.organizationId);

      // Build query with joins to get client and project names
      let query = forsured('documents')
        .select(
          `
          id,
          filename,
          doc_type,
          status,
          client_id,
          project_id,
          updated_at,
          expires_at,
          clients!inner (
            id,
            name
          ),
          projects (
            id,
            name
          )
        `,
          { count: 'exact' }
        )
        .eq('organization_id', input.organizationId);

      // Apply filters
      if (input.clientId) {
        query = query.eq('client_id', input.clientId);
      }

      if (input.projectId) {
        query = query.eq('project_id', input.projectId);
      }

      if (input.docType) {
        query = query.eq('doc_type', input.docType);
      }

      if (input.status) {
        query = query.eq('status', input.status);
      }

      // Apply search filter (filename or content)
      if (input.search) {
        query = query.or(`filename.ilike.%${input.search}%,content_preview.ilike.%${input.search}%`);
      }

      // Apply pagination and ordering
      const { data, error, count } = await query
        .order('updated_at', { ascending: false })
        .range(input.offset, input.offset + input.limit - 1);

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch documents',
          cause: error,
        });
      }

      // Transform data to match our types
      const documents = (data || []).map((doc: Record<string, unknown>) => {
        const client = doc.clients as { id: string; name: string } | null;
        const project = doc.projects as { id: string; name: string } | null;

        return {
          id: doc.id as string,
          filename: doc.filename as string,
          docType: doc.doc_type as string,
          status: doc.status as string,
          clientId: doc.client_id as string,
          clientName: client?.name || 'Unknown',
          projectId: doc.project_id as string | null,
          projectName: project?.name || null,
          updatedAt: doc.updated_at as string,
          expiresAt: doc.expires_at as string | null,
        };
      });

      return {
        documents,
        total: count || 0,
        limit: input.limit,
        offset: input.offset,
      };
    }),

  /**
   * Get a single document by ID
   */
  getById: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid('Organization ID must be a valid UUID'),
        documentId: z.string().uuid('Document ID must be a valid UUID'),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify user has access to this organization
      verifyOrganizationAccess(ctx.organizationId, input.organizationId);

      const { data, error } = await forsured('documents')
        .select(
          `
          *,
          clients!inner (
            id,
            name,
            type
          ),
          projects (
            id,
            name
          )
        `
        )
        .eq('id', input.documentId)
        .eq('organization_id', input.organizationId)
        .single();

      if (error) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Document not found',
          cause: error,
        });
      }

      const client = data.clients as { id: string; name: string; type: string } | null;
      const project = data.projects as { id: string; name: string } | null;

      return {
        id: data.id,
        filename: data.filename,
        docType: data.doc_type,
        status: data.status,
        clientId: data.client_id,
        clientName: client?.name || 'Unknown',
        clientType: client?.type || 'gc',
        projectId: data.project_id,
        projectName: project?.name || null,
        contentPreview: data.content_preview,
        fileSize: data.file_size,
        mimeType: data.mime_type,
        uploadedBy: data.uploaded_by,
        uploadedAt: data.uploaded_at,
        verifiedAt: data.verified_at,
        expiresAt: data.expires_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    }),

  /**
   * Get document statistics summary
   */
  getSummary: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid('Organization ID must be a valid UUID'),
        clientId: z.string().uuid().optional(),
        projectId: z.string().uuid().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify user has access to this organization
      verifyOrganizationAccess(ctx.organizationId, input.organizationId);

      // Build base query
      let baseQuery = forsured('documents')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', input.organizationId);

      if (input.clientId) {
        baseQuery = baseQuery.eq('client_id', input.clientId);
      }

      if (input.projectId) {
        baseQuery = baseQuery.eq('project_id', input.projectId);
      }

      // Get total count
      const { count: total } = await baseQuery;

      // Get counts by status
      const statusCounts: Record<string, number> = {
        verified: 0,
        pending: 0,
        expiring: 0,
        expired: 0,
      };

      for (const status of ['verified', 'pending', 'expiring', 'expired']) {
        let statusQuery = forsured('documents')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', input.organizationId)
          .eq('status', status);

        if (input.clientId) {
          statusQuery = statusQuery.eq('client_id', input.clientId);
        }

        if (input.projectId) {
          statusQuery = statusQuery.eq('project_id', input.projectId);
        }

        const { count } = await statusQuery;
        statusCounts[status] = count || 0;
      }

      // Get counts by type
      const typeCounts: Record<string, number> = {
        coi: 0,
        license: 0,
        contract: 0,
        w9: 0,
        endorsement: 0,
        other: 0,
      };

      for (const docType of ['coi', 'license', 'contract', 'w9', 'endorsement', 'other']) {
        let typeQuery = forsured('documents')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', input.organizationId)
          .eq('doc_type', docType);

        if (input.clientId) {
          typeQuery = typeQuery.eq('client_id', input.clientId);
        }

        if (input.projectId) {
          typeQuery = typeQuery.eq('project_id', input.projectId);
        }

        const { count } = await typeQuery;
        typeCounts[docType] = count || 0;
      }

      return {
        total: total || 0,
        byStatus: statusCounts,
        byType: typeCounts,
      };
    }),

  /**
   * Get available clients for filtering
   */
  getClients: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid('Organization ID must be a valid UUID'),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify user has access to this organization
      verifyOrganizationAccess(ctx.organizationId, input.organizationId);

      const { data, error } = await forsured('clients')
        .select('id, name, type')
        .eq('organization_id', input.organizationId)
        .order('name', { ascending: true });

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch clients',
          cause: error,
        });
      }

      return (data || []).map((client) => ({
        id: client.id,
        name: client.name,
        type: client.type as 'gc' | 'subcontractor',
      }));
    }),

  /**
   * Get available projects for filtering (optionally by client)
   */
  getProjects: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid('Organization ID must be a valid UUID'),
        clientId: z.string().uuid().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify user has access to this organization
      verifyOrganizationAccess(ctx.organizationId, input.organizationId);

      let query = forsured('projects')
        .select('id, name, client_id')
        .eq('organization_id', input.organizationId);

      if (input.clientId) {
        query = query.eq('client_id', input.clientId);
      }

      const { data, error } = await query.order('name', { ascending: true });

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch projects',
          cause: error,
        });
      }

      return (data || []).map((project) => ({
        id: project.id,
        name: project.name,
        clientId: project.client_id,
      }));
    }),
});
