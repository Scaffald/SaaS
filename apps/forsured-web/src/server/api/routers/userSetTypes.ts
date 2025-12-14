/**
 * User Set Types Router
 * REQ-4: Multi-Industry User Set Type System with Configurable Lexicon
 * TASK-3: Implement admin CRUD endpoints for user set types
 * TASK-4: Implement public API endpoints for user set type selection
 *
 * Provides:
 * - Admin CRUD operations for managing user set types
 * - Admin lexicon management
 * - Public endpoints for listing active user set types (signup flow)
 * - User endpoint for fetching their lexicon
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc';
import { forsured } from '../../../lib/supabase';

/**
 * Zod schemas for user set type validation
 */
const userSetTypeBaseSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(50, 'Slug must be 50 characters or less')
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Slug must be lowercase, alphanumeric, with hyphens only'),
  managerLabelSingular: z.string().min(1, 'Manager label (singular) is required'),
  managerLabelPlural: z.string().min(1, 'Manager label (plural) is required'),
  contractorLabelSingular: z.string().min(1, 'Contractor label (singular) is required'),
  contractorLabelPlural: z.string().min(1, 'Contractor label (plural) is required'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

const createUserSetTypeSchema = userSetTypeBaseSchema;

const updateUserSetTypeSchema = userSetTypeBaseSchema.partial().extend({
  id: z.string().uuid('ID must be a valid UUID'),
});

const lexiconEntrySchema = z.object({
  key: z.string().min(1, 'Key is required'),
  value: z.string().min(1, 'Value is required'),
  category: z.string().min(1, 'Category is required'),
});

const updateLexiconSchema = z.object({
  userSetTypeId: z.string().uuid('User set type ID must be a valid UUID'),
  entries: z.array(lexiconEntrySchema),
});

/**
 * Helper to verify admin access
 * Checks if the user has admin role in the forsured.user_profiles table
 */
async function verifyAdminAccess(userId: string): Promise<void> {
  const { data: userProfile, error } = await forsured('user_profiles')
    .select('user_type')
    .eq('scaffald_user_id', userId)
    .single();

  if (error || !userProfile) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'User profile not found',
    });
  }

  if (userProfile.user_type !== 'admin') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Admin access required',
    });
  }
}

/**
 * Transform database row to camelCase response
 */
function transformUserSetType(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    managerLabelSingular: row.manager_label_singular as string,
    managerLabelPlural: row.manager_label_plural as string,
    contractorLabelSingular: row.contractor_label_singular as string,
    contractorLabelPlural: row.contractor_label_plural as string,
    description: row.description as string | null,
    isActive: row.is_active as boolean,
    lexicon: row.lexicon as Record<string, string>,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

/**
 * User Set Types Router
 */
export const userSetTypesRouter = createTRPCRouter({
  /**
   * PUBLIC: List active user set types (for signup flow)
   * Returns only active user set types for display in the signup selector
   */
  listActive: publicProcedure.query(async () => {
    const { data, error } = await forsured('user_set_types')
      .select('id, name, slug, manager_label_singular, manager_label_plural, contractor_label_singular, contractor_label_plural, description')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch user set types',
        cause: error,
      });
    }

    return (data || []).map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      managerLabelSingular: row.manager_label_singular,
      managerLabelPlural: row.manager_label_plural,
      contractorLabelSingular: row.contractor_label_singular,
      contractorLabelPlural: row.contractor_label_plural,
      description: row.description,
    }));
  }),

  /**
   * PROTECTED: Get user's lexicon
   * Returns the lexicon for the current user's user set type
   */
  getUserLexicon: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session?.id) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Not authenticated',
      });
    }

    // Get user's profile with user_set_type
    const { data: userProfile, error: profileError } = await forsured('user_profiles')
      .select('user_set_type_id, user_type')
      .eq('scaffald_user_id', ctx.session.id)
      .single();

    if (profileError || !userProfile) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User profile not found',
      });
    }

    // Brokers and admins don't have a user set type - return empty lexicon
    if (!userProfile.user_set_type_id) {
      return {
        lexicon: {},
        userSetType: null,
      };
    }

    // Get user set type with lexicon
    const { data: userSetType, error: ustError } = await forsured('user_set_types')
      .select('*')
      .eq('id', userProfile.user_set_type_id)
      .single();

    if (ustError || !userSetType) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User set type not found',
      });
    }

    return {
      lexicon: userSetType.lexicon as Record<string, string>,
      userSetType: transformUserSetType(userSetType),
    };
  }),

  // ==================== ADMIN ENDPOINTS ====================

  /**
   * ADMIN: List all user set types (including inactive)
   */
  list: protectedProcedure
    .input(
      z.object({
        includeInactive: z.boolean().optional().default(true),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.session?.id) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
      }

      await verifyAdminAccess(ctx.session.id);

      let query = forsured('user_set_types').select('*');

      if (input && !input.includeInactive) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query.order('name', { ascending: true });

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch user set types',
          cause: error,
        });
      }

      // Get user counts for each type
      const { data: userCounts, error: countError } = await forsured('user_profiles')
        .select('user_set_type_id');

      const countMap = new Map<string, number>();
      if (!countError && userCounts) {
        for (const profile of userCounts) {
          if (profile.user_set_type_id) {
            const count = countMap.get(profile.user_set_type_id) || 0;
            countMap.set(profile.user_set_type_id, count + 1);
          }
        }
      }

      return (data || []).map((row) => ({
        ...transformUserSetType(row),
        userCount: countMap.get(row.id as string) || 0,
      }));
    }),

  /**
   * ADMIN: Get user set type by ID (with full lexicon)
   */
  get: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid('ID must be a valid UUID'),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.session?.id) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
      }

      await verifyAdminAccess(ctx.session.id);

      const { data, error } = await forsured('user_set_types')
        .select('*')
        .eq('id', input.id)
        .single();

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch user set type',
          cause: error,
        });
      }

      if (!data) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User set type not found',
        });
      }

      // Get lexicon entries
      const { data: lexiconEntries } = await forsured('user_set_type_lexicon')
        .select('key, value, category')
        .eq('user_set_type_id', input.id)
        .order('category', { ascending: true });

      return {
        ...transformUserSetType(data),
        lexiconEntries: lexiconEntries || [],
      };
    }),

  /**
   * ADMIN: Create new user set type
   */
  create: protectedProcedure.input(createUserSetTypeSchema).mutation(async ({ ctx, input }) => {
    if (!ctx.session?.id) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
    }

    await verifyAdminAccess(ctx.session.id);

    const { data, error } = await forsured('user_set_types')
      .insert({
        name: input.name,
        slug: input.slug,
        manager_label_singular: input.managerLabelSingular,
        manager_label_plural: input.managerLabelPlural,
        contractor_label_singular: input.contractorLabelSingular,
        contractor_label_plural: input.contractorLabelPlural,
        description: input.description || null,
        is_active: input.isActive,
        lexicon: {},
      })
      .select()
      .single();

    if (error) {
      // Check for unique constraint violations
      if (error.code === '23505') {
        if (error.message.includes('name')) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'A user set type with this name already exists',
          });
        }
        if (error.message.includes('slug')) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'A user set type with this slug already exists',
          });
        }
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create user set type',
        cause: error,
      });
    }

    return transformUserSetType(data);
  }),

  /**
   * ADMIN: Update user set type
   */
  update: protectedProcedure.input(updateUserSetTypeSchema).mutation(async ({ ctx, input }) => {
    if (!ctx.session?.id) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
    }

    await verifyAdminAccess(ctx.session.id);

    const { id, ...updates } = input;

    // Build update object with snake_case keys
    const updateData: Record<string, unknown> = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.slug !== undefined) updateData.slug = updates.slug;
    if (updates.managerLabelSingular !== undefined)
      updateData.manager_label_singular = updates.managerLabelSingular;
    if (updates.managerLabelPlural !== undefined)
      updateData.manager_label_plural = updates.managerLabelPlural;
    if (updates.contractorLabelSingular !== undefined)
      updateData.contractor_label_singular = updates.contractorLabelSingular;
    if (updates.contractorLabelPlural !== undefined)
      updateData.contractor_label_plural = updates.contractorLabelPlural;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

    const { data, error } = await forsured('user_set_types')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        if (error.message.includes('name')) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'A user set type with this name already exists',
          });
        }
        if (error.message.includes('slug')) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'A user set type with this slug already exists',
          });
        }
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update user set type',
        cause: error,
      });
    }

    if (!data) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User set type not found',
      });
    }

    return transformUserSetType(data);
  }),

  /**
   * ADMIN: Delete user set type
   */
  delete: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid('ID must be a valid UUID'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.id) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
      }

      await verifyAdminAccess(ctx.session.id);

      // Check if any users are using this type
      const { data: users, error: usersError } = await forsured('user_profiles')
        .select('id')
        .eq('user_set_type_id', input.id)
        .limit(1);

      if (usersError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to check user associations',
          cause: usersError,
        });
      }

      if (users && users.length > 0) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Cannot delete user set type with active users. Please reassign users first.',
        });
      }

      const { error } = await forsured('user_set_types').delete().eq('id', input.id);

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete user set type',
          cause: error,
        });
      }

      return { success: true };
    }),

  /**
   * ADMIN: Update lexicon for a user set type
   * Replaces all lexicon entries and updates the JSONB lexicon column
   */
  updateLexicon: protectedProcedure.input(updateLexiconSchema).mutation(async ({ ctx, input }) => {
    if (!ctx.session?.id) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
    }

    await verifyAdminAccess(ctx.session.id);

    // Build the lexicon JSONB object
    const lexiconObject: Record<string, string> = {};
    for (const entry of input.entries) {
      lexiconObject[entry.key] = entry.value;
    }

    // Update the JSONB lexicon column
    const { error: updateError } = await forsured('user_set_types')
      .update({ lexicon: lexiconObject })
      .eq('id', input.userSetTypeId);

    if (updateError) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update lexicon',
        cause: updateError,
      });
    }

    // Delete existing lexicon entries and insert new ones
    await forsured('user_set_type_lexicon').delete().eq('user_set_type_id', input.userSetTypeId);

    if (input.entries.length > 0) {
      const { error: insertError } = await forsured('user_set_type_lexicon').insert(
        input.entries.map((entry) => ({
          user_set_type_id: input.userSetTypeId,
          key: entry.key,
          value: entry.value,
          category: entry.category,
        }))
      );

      if (insertError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to insert lexicon entries',
          cause: insertError,
        });
      }
    }

    return { success: true, entriesUpdated: input.entries.length };
  }),

  /**
   * ADMIN: Export lexicon as JSON
   */
  exportLexicon: protectedProcedure
    .input(
      z.object({
        userSetTypeId: z.string().uuid('User set type ID must be a valid UUID'),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.session?.id) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
      }

      await verifyAdminAccess(ctx.session.id);

      const { data, error } = await forsured('user_set_types')
        .select('slug, lexicon')
        .eq('id', input.userSetTypeId)
        .single();

      if (error || !data) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User set type not found',
        });
      }

      return {
        slug: data.slug as string,
        lexicon: data.lexicon as Record<string, string>,
      };
    }),
});
