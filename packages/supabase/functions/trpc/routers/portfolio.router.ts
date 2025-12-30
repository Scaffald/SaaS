import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { protectedProcedure, t } from '../middleware.ts';

/**
 * Portfolio router - handles user portfolio items
 * Supports CRUD operations and reordering
 */
export const portfolioRouter = t.router({
  /**
   * List user's portfolio items
   * Returns portfolio items ordered by display_order
   */
  list: protectedProcedure
    .input(
      z
        .object({
          userId: z.string().uuid().optional(), // If provided, get portfolio for specific user (public profile)
        })
        .optional()
        .default({})
    )
    .query(async ({ ctx, input }) => {
      const { supabase, user } = ctx
      const targetUserId = input.userId || user.id

      const { data, error } = await supabase
        .schema('core')
        .from('portfolio_items')
        .select('*')
        .eq('user_id', targetUserId)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false })

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to fetch portfolio items: ${error.message}`,
        })
      }

      return data || []
    }),

  /**
   * Create a new portfolio item
   */
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.unknown().optional(), // JSONB for rich text
        imageUrl: z.string().optional(),
        filePath: z.string().optional(),
        displayOrder: z.number().optional().default(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx

      const { data, error } = await supabase
        .schema('core')
        .from('portfolio_items')
        .insert({
          user_id: user.id,
          title: input.title,
          description: input.description || null,
          image_url: input.imageUrl || null,
          file_path: input.filePath || null,
          display_order: input.displayOrder,
        })
        .select()
        .single()

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to create portfolio item: ${error.message}`,
        })
      }

      return data
    }),

  /**
   * Update a portfolio item
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).optional(),
        description: z.unknown().optional(),
        imageUrl: z.string().optional().nullable(),
        filePath: z.string().optional().nullable(),
        displayOrder: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx
      const { id, ...updates } = input

      // Build update object
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      }

      if (updates.title !== undefined) {
        updateData.title = updates.title
      }
      if (updates.description !== undefined) {
        updateData.description = updates.description
      }
      if (updates.imageUrl !== undefined) {
        updateData.image_url = updates.imageUrl
      }
      if (updates.filePath !== undefined) {
        updateData.file_path = updates.filePath
      }
      if (updates.displayOrder !== undefined) {
        updateData.display_order = updates.displayOrder
      }

      const { data, error } = await supabase
        .schema('core')
        .from('portfolio_items')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id) // Ensure user can only update their own items
        .select()
        .single()

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to update portfolio item: ${error.message}`,
        })
      }

      if (!data) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Portfolio item not found',
        })
      }

      return data
    }),

  /**
   * Delete a portfolio item
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx

      const { data, error } = await supabase
        .schema('core')
        .from('portfolio_items')
        .delete()
        .eq('id', input.id)
        .eq('user_id', user.id) // Ensure user can only delete their own items
        .select()
        .single()

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to delete portfolio item: ${error.message}`,
        })
      }

      if (!data) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Portfolio item not found',
        })
      }

      return { success: true, deletedItem: data }
    }),

  /**
   * Reorder portfolio items
   * Updates display_order for multiple items at once
   */
  reorder: protectedProcedure
    .input(
      z.object({
        items: z.array(
          z.object({
            id: z.string().uuid(),
            displayOrder: z.number(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx

      // Update each item's display_order
      const updatePromises = input.items.map(
        (item) =>
          supabase
            .schema('core')
            .from('portfolio_items')
            .update({ display_order: item.displayOrder, updated_at: new Date().toISOString() })
            .eq('id', item.id)
            .eq('user_id', user.id) // Ensure user can only reorder their own items
      )

      const results = await Promise.all(updatePromises)

      // Check for errors
      // biome-ignore lint/suspicious/noExplicitAny: Result type from Promise.all
      const errors = results.filter((result: any) => result.error)
      if (errors.length > 0) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to reorder portfolio items: ${errors[0]?.error?.message}`,
        })
      }

      return { success: true, updatedCount: input.items.length }
    }),

  /**
   * Upload portfolio image
   * Handles file upload to Supabase Storage and returns file path
   */
  uploadImage: protectedProcedure
    .input(
      z.object({
        portfolioItemId: z.string().uuid().optional(), // Optional: if updating existing item
        file: z.string(), // base64 encoded file data
        fileName: z.string(),
        contentType: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx

      try {
        // Convert base64 to Uint8Array
        const base64Data = input.file.split(',')[1] // Remove data:image/jpeg;base64, prefix
        const binaryString = atob(base64Data)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }

        // Generate unique file name
        const fileExtension = input.fileName.split('.').pop() || 'jpg'
        const uniqueFileName = input.portfolioItemId
          ? `${user.id}/${input.portfolioItemId}/image-${Date.now()}.${fileExtension}`
          : `${user.id}/temp-${Date.now()}.${fileExtension}`

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('portfolio')
          .upload(uniqueFileName, bytes, {
            contentType: input.contentType,
            upsert: true,
          })

        if (uploadError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to upload image: ${uploadError.message}`,
          })
        }

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from('portfolio').getPublicUrl(uniqueFileName)

        return {
          filePath: uploadData.path,
          imageUrl: publicUrl,
        }
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to process image upload: ${error instanceof Error ? error.message : 'Unknown error'}`,
        })
      }
    }),
})
