/**
 * Document Router
 * Additional tRPC Routers - Document Management
 *
 * Implements document management procedures with type-safe tRPC procedures
 * using Supabase backend.
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { forsured } from '../../../lib/supabase';

/**
 * Document type enum for validation
 */
const DocumentTypeEnum = z.enum([
  'contract',
  'invoice',
  'receipt',
  'estimate',
  'change_order',
  'permit',
  'inspection',
  'other',
]);

/**
 * Document filters schema
 */
const DocumentFiltersSchema = z.object({
  document_type: z.array(DocumentTypeEnum).optional(),
  project_id: z.array(z.string().uuid()).optional(),
  uploaded_by_user_id: z.array(z.string().uuid()).optional(),
  date_range: z
    .object({
      start: z.string().optional(),
      end: z.string().optional(),
    })
    .optional(),
  search: z.string().optional(),
});

/**
 * Document Router
 *
 * All procedures require authentication and enforce organization-scoped access.
 */
export const documentRouter = createTRPCRouter({
  /**
   * List documents with filtering, search, and pagination
   */
  list: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
        filters: DocumentFiltersSchema.optional(),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
        sortBy: z.string().default('created_at'),
        sortOrder: z.enum(['asc', 'desc']).default('desc'),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify user belongs to organization
      if (ctx.organizationId !== input.organizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to access documents from this organization',
        });
      }

      // Build query
      let query = forsured('documents')
        .select('*', { count: 'exact' })
        .eq('organization_id', input.organizationId);

      // Apply filters
      if (input.filters) {
        if (input.filters.document_type && input.filters.document_type.length > 0) {
          query = query.in('document_type', input.filters.document_type);
        }

        if (input.filters.project_id && input.filters.project_id.length > 0) {
          query = query.in('project_id', input.filters.project_id);
        }

        if (input.filters.uploaded_by_user_id && input.filters.uploaded_by_user_id.length > 0) {
          query = query.in('uploaded_by_user_id', input.filters.uploaded_by_user_id);
        }

        if (input.filters.date_range) {
          if (input.filters.date_range.start) {
            query = query.gte('created_at', input.filters.date_range.start);
          }
          if (input.filters.date_range.end) {
            query = query.lte('created_at', input.filters.date_range.end);
          }
        }

        if (input.filters.search) {
          query = query.or(
            `file_name.ilike.%${input.filters.search}%,description.ilike.%${input.filters.search}%`
          );
        }
      }

      // Apply sorting and pagination
      const offset = (input.page - 1) * input.pageSize;
      query = query
        .order(input.sortBy, { ascending: input.sortOrder === 'asc' })
        .range(offset, offset + input.pageSize - 1);

      const { data, error, count } = await query;

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch documents',
          cause: error,
        });
      }

      return {
        documents: data || [],
        total: count || 0,
        page: input.page,
        pageSize: input.pageSize,
        hasMore: count ? offset + input.pageSize < count : false,
      };
    }),

  /**
   * Get single document by ID
   */
  get: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
        documentId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify user belongs to organization
      if (ctx.organizationId !== input.organizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to access this document',
        });
      }

      const { data, error } = await forsured('documents')
        .select('*')
        .eq('id', input.documentId)
        .eq('organization_id', input.organizationId)
        .single();

      if (error || !data) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Document not found',
          cause: error,
        });
      }

      return data;
    }),

  /**
   * Create a new document record
   */
  create: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
        projectId: z.string().uuid().optional(),
        fileName: z.string().min(1),
        fileUrl: z.string().url(),
        fileSize: z.number().optional(),
        mimeType: z.string().optional(),
        documentType: DocumentTypeEnum,
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify user belongs to organization
      if (ctx.organizationId !== input.organizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to create documents in this organization',
        });
      }

      const { data, error } = await forsured('documents')
        .insert({
          organization_id: input.organizationId,
          project_id: input.projectId,
          file_name: input.fileName,
          file_url: input.fileUrl,
          file_size: input.fileSize,
          mime_type: input.mimeType,
          document_type: input.documentType,
          description: input.description,
          uploaded_by_user_id: ctx.session?.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error || !data) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create document',
          cause: error,
        });
      }

      return data;
    }),

  /**
   * Update document metadata
   */
  update: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
        documentId: z.string().uuid(),
        updates: z.object({
          fileName: z.string().min(1).optional(),
          documentType: DocumentTypeEnum.optional(),
          description: z.string().optional(),
          projectId: z.string().uuid().nullable().optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify user belongs to organization
      if (ctx.organizationId !== input.organizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to update this document',
        });
      }

      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (input.updates.fileName) updateData.file_name = input.updates.fileName;
      if (input.updates.documentType) updateData.document_type = input.updates.documentType;
      if (input.updates.description !== undefined) updateData.description = input.updates.description;
      if (input.updates.projectId !== undefined) updateData.project_id = input.updates.projectId;

      const { data, error } = await forsured('documents')
        .update(updateData)
        .eq('id', input.documentId)
        .eq('organization_id', input.organizationId)
        .select()
        .single();

      if (error || !data) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update document',
          cause: error,
        });
      }

      return data;
    }),

  /**
   * Delete document
   */
  delete: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
        documentId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify user belongs to organization
      if (ctx.organizationId !== input.organizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete this document',
        });
      }

      const { error } = await forsured('documents')
        .delete()
        .eq('id', input.documentId)
        .eq('organization_id', input.organizationId);

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete document',
          cause: error,
        });
      }

      return { success: true };
    }),

  /**
   * Get documents by project
   */
  getByProject: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
        projectId: z.string().uuid(),
        documentType: DocumentTypeEnum.optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify user belongs to organization
      if (ctx.organizationId !== input.organizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to access documents from this organization',
        });
      }

      let query = forsured('documents')
        .select('*')
        .eq('organization_id', input.organizationId)
        .eq('project_id', input.projectId);

      if (input.documentType) {
        query = query.eq('document_type', input.documentType);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch project documents',
          cause: error,
        });
      }

      return data || [];
    }),
});
