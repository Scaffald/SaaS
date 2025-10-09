import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { superAdminProcedure, t } from "../../middleware.ts";

/**
 * Office Universities router - handles university catalog management (admin only)
 */
export const officeUniversitiesRouter = t.router({
  /**
   * Get paginated list of universities
   */
  getUniversities: superAdminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
        search: z.string().optional(),
        country: z.string().optional(),
        sortBy: z.enum(["name", "country", "created_at"]).default("name"),
        sortOrder: z.enum(["asc", "desc"]).default("asc"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { supabase } = ctx;
      const { page, pageSize, search, country, sortBy, sortOrder } = input;

      let query = supabase
        .from("universities")
        .select("*", { count: "exact" })
        .eq("is_active", true);

      // Apply filters
      if (search) {
        query = query.ilike("name", `%${search}%`);
      }

      if (country) {
        query = query.eq("country", country);
      }

      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === "asc" });

      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch universities: ${error.message}`,
        });
      }

      return {
        universities: data || [],
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      };
    }),

  /**
   * Get single university by ID
   */
  getUniversity: superAdminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { supabase } = ctx;

      const { data, error } = await supabase
        .from("universities")
        .select("*")
        .eq("id", input.id)
        .single();

      if (error) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "University not found",
        });
      }

      return data;
    }),

  /**
   * Search universities (for user-facing autocomplete)
   */
  searchUniversities: superAdminProcedure
    .input(
      z.object({
        query: z.string().min(1),
        country: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { supabase } = ctx;

      // Use the search_universities function for trigram similarity
      const { data, error } = await supabase.rpc("search_universities", {
        p_query: input.query,
        p_country: input.country || null,
        p_limit: input.limit,
      });

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to search universities: ${error.message}`,
        });
      }

      return { universities: data || [] };
    }),

  /**
   * Get list of countries with university counts
   */
  getCountries: superAdminProcedure.query(async ({ ctx }) => {
    const { supabase } = ctx;

    const { data, error } = await supabase
      .from("universities")
      .select("country, alpha_two_code")
      .eq("is_active", true);

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to fetch countries: ${error.message}`,
      });
    }

    // Group by country and count
    const countryMap = new Map<
      string,
      { country: string; alpha_two_code: string; count: number }
    >();

    for (const row of data) {
      const existing = countryMap.get(row.country);
      if (existing) {
        existing.count++;
      } else {
        countryMap.set(row.country, {
          country: row.country,
          alpha_two_code: row.alpha_two_code,
          count: 1,
        });
      }
    }

    return {
      countries: Array.from(countryMap.values()).sort((a, b) =>
        a.country.localeCompare(b.country)
      ),
    };
  }),

  /**
   * Create new university
   */
  createUniversity: superAdminProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required"),
        slug: z.string().min(1, "Slug is required"),
        country: z.string().min(1, "Country is required"),
        alpha_two_code: z.string().length(2, "Must be 2-letter country code"),
        domains: z.array(z.string()).default([]),
        web_pages: z.array(z.string()).default([]),
        state_province: z.string().optional(),
        metadata: z.record(z.unknown()).default({}),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { supabase } = ctx;

      try {
        // Check if slug already exists
        const { data: existing } = await supabase
          .from("universities")
          .select("id")
          .eq("slug", input.slug)
          .single();

        if (existing) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "A university with this slug already exists",
          });
        }

        const { data, error } = await supabase
          .from("universities")
          .insert({
            name: input.name,
            slug: input.slug,
            country: input.country,
            alpha_two_code: input.alpha_two_code.toUpperCase(),
            domains: input.domains,
            web_pages: input.web_pages,
            state_province: input.state_province || null,
            metadata: input.metadata,
            is_active: true,
          })
          .select()
          .single();

        if (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to create university: ${error.message}`,
          });
        }

        return { success: true, university: data };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        const errorMessage = error instanceof Error
          ? error.message
          : String(error);
        console.error("Create university error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to create university: ${errorMessage}`,
        });
      }
    }),

  /**
   * Update existing university
   */
  updateUniversity: superAdminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1, "Name is required"),
        slug: z.string().min(1, "Slug is required"),
        country: z.string().min(1, "Country is required"),
        alpha_two_code: z.string().length(2, "Must be 2-letter country code"),
        domains: z.array(z.string()).default([]),
        web_pages: z.array(z.string()).default([]),
        state_province: z.string().optional(),
        metadata: z.record(z.unknown()).default({}),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { supabase } = ctx;

      try {
        const { id, ...updateData } = input;

        // Check if slug is being changed to one that already exists
        if (updateData.slug) {
          const { data: existing } = await supabase
            .from("universities")
            .select("id")
            .eq("slug", updateData.slug)
            .neq("id", id)
            .single();

          if (existing) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "A university with this slug already exists",
            });
          }
        }

        const { data, error } = await supabase
          .from("universities")
          .update({
            name: updateData.name,
            slug: updateData.slug,
            country: updateData.country,
            alpha_two_code: updateData.alpha_two_code.toUpperCase(),
            domains: updateData.domains,
            web_pages: updateData.web_pages,
            state_province: updateData.state_province || null,
            metadata: updateData.metadata,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)
          .select()
          .single();

        if (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to update university: ${error.message}`,
          });
        }

        return { success: true, university: data };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        const errorMessage = error instanceof Error
          ? error.message
          : String(error);
        console.error("Update university error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to update university: ${errorMessage}`,
        });
      }
    }),

  /**
   * Delete (soft delete) university
   */
  deleteUniversity: superAdminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { supabase } = ctx;

      try {
        // Check if university is used in any user_education records
        const { count } = await supabase
          .from("user_education")
          .select("id", { count: "exact", head: true })
          .eq("university_id", input.id);

        if (count && count > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              `Cannot delete university: ${count} user(s) have this in their education history`,
          });
        }

        // Soft delete by setting is_active to false
        const { error } = await supabase
          .from("universities")
          .update({
            is_active: false,
            updated_at: new Date().toISOString(),
          })
          .eq("id", input.id);

        if (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to delete university: ${error.message}`,
          });
        }

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        const errorMessage = error instanceof Error
          ? error.message
          : String(error);
        console.error("Delete university error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to delete university: ${errorMessage}`,
        });
      }
    }),

  /**
   * Get statistics about universities
   */
  getStatistics: superAdminProcedure.query(async ({ ctx }) => {
    const { supabase } = ctx;

    // Get total count
    const { count: totalCount } = await supabase
      .from("universities")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    // Get country count
    const { data: countries } = await supabase
      .from("universities")
      .select("country")
      .eq("is_active", true);

    const uniqueCountries = new Set(countries?.map((c) => c.country) || []);

    // Get universities with user education links
    const { count: usedCount } = await supabase
      .from("user_education")
      .select("university_id", { count: "exact", head: true })
      .not("university_id", "is", null);

    return {
      total: totalCount || 0,
      countries: uniqueCountries.size,
      usedInEducation: usedCount || 0,
    };
  }),
});
