import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { officeProcedure, publicProcedure, t } from "../middleware.ts";
import {
  type WelcomeSlide,
  welcomeSlideCreateSchema,
  welcomeSlideListSchema,
  welcomeSlideReorderSchema,
  welcomeSlideUpdateSchema,
} from "../../_shared/cms-schemas.ts";

/**
 * CMS router - Content management operations
 * Public procedures for reading content
 * Office procedures for admin-only content management
 */
export const cmsRouter = t.router({
  /**
   * Get active welcome slides (public endpoint)
   * Returns only active slides for public display
   */
  getActiveWelcomeSlides: publicProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .schema("cms")
      .from("welcome_slides")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to fetch welcome slides: ${error.message}`,
      });
    }

    return {
      slides: data as WelcomeSlide[],
    };
  }),

  /**
   * List welcome slides
   * Public: Returns only active slides
   * Admin: Can include inactive slides with parameter
   */
  listWelcomeSlides: publicProcedure
    .input(welcomeSlideListSchema.optional())
    .query(async ({ ctx, input }) => {
      const includeInactive = input?.include_inactive ?? false;

      let query = ctx.supabase
        .schema("cms")
        .from("welcome_slides")
        .select("*")
        .order("display_order", { ascending: true });

      // Non-admin users only see active slides
      if (!includeInactive) {
        query = query.eq("is_active", true);
      }

      const { data, error } = await query;

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch welcome slides: ${error.message}`,
        });
      }

      return {
        slides: data as WelcomeSlide[],
      };
    }),

  /**
   * Get single welcome slide by ID
   * Admin only
   */
  getWelcomeSlide: officeProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabaseAdmin
        .schema("cms")
        .from("welcome_slides")
        .select("*")
        .eq("id", input.id)
        .single();

      if (error) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Welcome slide not found: ${error.message}`,
        });
      }

      return { slide: data as WelcomeSlide };
    }),

  /**
   * Create new welcome slide
   * Admin only
   */
  createWelcomeSlide: officeProcedure
    .input(welcomeSlideCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabaseAdmin
        .schema("cms")
        .from("welcome_slides")
        .insert(input)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to create welcome slide: ${error.message}`,
        });
      }

      return { slide: data as WelcomeSlide };
    }),

  /**
   * Update existing welcome slide
   * Admin only
   */
  updateWelcomeSlide: officeProcedure
    .input(welcomeSlideUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      const { data, error } = await ctx.supabaseAdmin
        .schema("cms")
        .from("welcome_slides")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to update welcome slide: ${error.message}`,
        });
      }

      return { slide: data as WelcomeSlide };
    }),

  /**
   * Delete welcome slide
   * Admin only
   */
  deleteWelcomeSlide: officeProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabaseAdmin
        .schema("cms")
        .from("welcome_slides")
        .delete()
        .eq("id", input.id);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to delete welcome slide: ${error.message}`,
        });
      }

      return { success: true };
    }),

  /**
   * Reorder welcome slides
   * Updates display_order for multiple slides at once
   * Admin only
   */
  reorderWelcomeSlides: officeProcedure
    .input(welcomeSlideReorderSchema)
    .mutation(async ({ ctx, input }) => {
      // Update each slide's display_order
      const updates = input.slides.map((
        slide: { id: string; display_order: number },
      ) =>
        ctx.supabaseAdmin
          .schema("cms")
          .from("welcome_slides")
          .update({ display_order: slide.display_order })
          .eq("id", slide.id)
      );

      const results = await Promise.all(updates);

      // Check for any errors
      const errors = results.filter((result: { error: unknown }) =>
        result.error
      );
      if (errors.length > 0) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to reorder slides: ${errors[0].error?.message}`,
        });
      }

      return { success: true };
    }),

  /**
   * Upload image to Supabase Storage
   * Admin only
   * Returns public URL for the uploaded image
   */
  uploadSlideImage: officeProcedure
    .input(
      z.object({
        slideId: z.string().uuid(),
        fileName: z.string(),
        fileData: z.string(), // base64 encoded file data
        contentType: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { slideId, fileName, fileData, contentType } = input;

      // Decode base64 file data
      const buffer = Uint8Array.from(atob(fileData), (c) => c.charCodeAt(0));

      // Construct storage path
      const storagePath = `welcome-slides/${slideId}/${fileName}`;

      // Upload to storage
      const { data, error } = await ctx.supabaseAdmin.storage
        .from("cms-media")
        .upload(storagePath, buffer, {
          contentType,
          upsert: true, // Replace if exists
        });

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to upload image: ${error.message}`,
        });
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = ctx.supabaseAdmin.storage
        .from("cms-media")
        .getPublicUrl(storagePath);

      return {
        path: data.path,
        publicUrl,
      };
    }),

  /**
   * Delete image from Supabase Storage
   * Admin only
   */
  deleteSlideImage: officeProcedure
    .input(
      z.object({
        slideId: z.string().uuid(),
        fileName: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { slideId, fileName } = input;
      const storagePath = `welcome-slides/${slideId}/${fileName}`;

      const { error } = await ctx.supabaseAdmin.storage
        .from("cms-media")
        .remove([storagePath]);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to delete image: ${error.message}`,
        });
      }

      return { success: true };
    }),
});
