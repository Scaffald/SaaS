import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { t } from "../middleware.ts";

/**
 * Workers Router
 * Public discovery of worker profiles (similar to office.listUsers but public)
 */
export const workersRouter = t.router({
  /**
   * Get all workers with filtering
   * Public endpoint for worker discovery page
   */
  getWorkers: t.procedure
    .input(
      z
        .object({
          search: z.string().optional(),
          industryIds: z.array(z.string()).optional(),
          skillIds: z.array(z.string()).optional(),
          limit: z.number().min(1).max(100).default(50),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      let query = ctx.supabase
        .schema("core")
        .from("users")
        .select(
          `
          id,
          name,
          first_name,
          last_name,
          about,
          avatar_path,
          created_at,
          updated_at
        `,
        )
        .order("created_at", { ascending: false });

      // Apply limit
      if (input?.limit) {
        query = query.limit(input.limit);
      }

      const { data: workers, error } = await query;

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch workers: ${error.message}`,
        });
      }

      return {
        workers: workers || [],
        total: workers?.length || 0,
      };
    }),

  /**
   * Get a single worker profile by ID
   */
  getWorkerById: t.procedure
    .input(
      z.object({
        id: z.string().uuid(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { data: worker, error } = await ctx.supabase
        .schema("core")
        .from("users")
        .select(
          `
          id,
          name,
          first_name,
          last_name,
          about,
          avatar_path,
          created_at,
          updated_at
        `,
        )
        .eq("id", input.id)
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch worker: ${error.message}`,
        });
      }

      return worker;
    }),
});
