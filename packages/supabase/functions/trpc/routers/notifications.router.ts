import { TRPCError } from "@trpc/server";
import { protectedProcedure, t } from "../middleware.ts";
import { z } from "zod";

/**
 * Notifications router - handles user notifications
 * Supports listing, marking as read, and getting unread counts
 */
export const notificationsRouter = t.router({
  /**
   * List user's notifications
   * Returns notifications grouped by read/unread status
   * Optionally filters by read status
   */
  list: protectedProcedure
    .input(
      z
        .object({
          read: z.boolean().optional(), // Filter by read status (optional)
          limit: z.number().min(1).max(100).optional().default(50), // Limit results
        })
        .optional()
        .default({}),
    )
    .query(async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      let query = supabase
        .schema("core")
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      // Filter by read status if provided
      if (input.read !== undefined) {
        query = query.eq("read", input.read);
      }

      // Apply limit
      query = query.limit(input.limit);

      const { data, error } = await query;

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch notifications: ${error.message}`,
        });
      }

      return data || [];
    }),

  /**
   * Mark a single notification as read
   */
  markAsRead: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      const { data, error } = await supabase
        .schema("core")
        .from("notifications")
        .update({ read: true, updated_at: new Date().toISOString() })
        .eq("id", input.id)
        .eq("user_id", user.id) // Ensure user can only update their own notifications
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to mark notification as read: ${error.message}`,
        });
      }

      if (!data) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Notification not found",
        });
      }

      return data;
    }),

  /**
   * Mark all user notifications as read
   */
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    const { supabase, user } = ctx;

    const { data, error } = await supabase
      .schema("core")
      .from("notifications")
      .update({ read: true, updated_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("read", false) // Only update unread notifications
      .select();

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to mark all notifications as read: ${error.message}`,
      });
    }

    return {
      count: data?.length || 0,
      notifications: data || [],
    };
  }),

  /**
   * Get count of unread notifications
   */
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const { supabase, user } = ctx;

    const { count, error } = await supabase
      .schema("core")
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("read", false);

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to get unread count: ${error.message}`,
      });
    }

    return {
      count: count || 0,
    };
  }),
});

