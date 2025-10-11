import { TRPCError } from "@trpc/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { protectedProcedure, t } from "../../middleware.ts";
import { supabaseAnonKey, supabaseUrl } from "../../context.ts";

/**
 * Multi-Taxonomy Skills Router
 * Supports CSI (Construction only) and O*NET (all industries)
 */

// Input schemas
const searchSkillsInputSchema = z.object({
  query: z.string().min(1),
  industrySlug: z.string(),
  taxonomy: z.enum(["csi", "onet", "both"]).optional(),
  limit: z.number().optional(),
});

const addSkillInputSchema = z.object({
  taxonomy: z.enum(["csi", "onet"]),
  skillId: z.string(), // UUID for CSI, code for O*NET
  proficiencyLevel: z.number().min(0).max(5),
  yearsExperience: z.number().optional(),
  notes: z.string().optional(),
});

const updateSkillInputSchema = z.object({
  userSkillId: z.string().uuid(),
  proficiencyLevel: z.number().min(0).max(5).optional(),
  yearsExperience: z.number().optional(),
  notes: z.string().optional(),
});

const removeSkillInputSchema = z.object({
  userSkillId: z.string().uuid(),
});

export const skillsMultiTaxonomyRouter = t.router({
  /**
   * Get available industries
   */
  getIndustries: protectedProcedure.query(async ({ ctx }) => {
    const { supabase } = ctx;

    const { data, error } = await supabase
      .from("industries")
      .select("id, name, slug")
      .order("name");

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to fetch industries: ${error.message}`,
      });
    }

    return { industries: data || [] };
  }),

  /**
   * Search skills based on industry
   * - Construction: Can search both CSI and O*NET
   * - Other industries: O*NET only
   */
  searchSkills: protectedProcedure
    .input(searchSkillsInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase } = ctx;
      const isConstruction = input.industrySlug === "construction";

      // Determine which taxonomies to search
      let taxonomies: string[] = [];
      if (input.taxonomy === "both" || !input.taxonomy) {
        taxonomies = isConstruction ? ["csi", "onet"] : ["onet"];
      } else if (input.taxonomy === "csi") {
        if (!isConstruction) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "CSI skills are only available for the construction industry",
          });
        }
        taxonomies = ["csi"];
      } else {
        taxonomies = ["onet"];
      }

      const results: Array<{
        taxonomy: string;
        skill_id: string;
        code: string;
        display_code: string;
        name: string;
        description: string | null;
        hierarchy_level: number | null;
      }> = [];

      // Search CSI if applicable
      if (taxonomies.includes("csi")) {
        const { data: csiData, error: csiError } = await supabase
          .schema("data")
          .rpc("search_masterformat", {
            search_term: input.query,
          });

        if (!csiError && csiData) {
          results.push(
            ...csiData.slice(0, input.limit || 20).map((item: any) => ({
              taxonomy: "csi",
              skill_id: item.id,
              code: item.code_key,
              display_code: item.code_display,
              name: item.name,
              description: null,
              hierarchy_level: item.depth,
            })),
          );
        }
      }

      // Search O*NET
      if (taxonomies.includes("onet")) {
        const { data: onetData, error: onetError } = await supabase.rpc(
          "onet.search_occupations",
          {
            search_term: input.query,
          },
        );

        if (!onetError && onetData) {
          results.push(
            ...onetData.slice(0, input.limit || 20).map((item: any) => ({
              taxonomy: "onet",
              skill_id: item.onetsoc_code,
              code: item.onetsoc_code,
              display_code: item.onetsoc_code,
              name: item.title,
              description: item.description,
              hierarchy_level: null,
            })),
          );
        }
      }

      return {
        skills: results.slice(0, input.limit || 20),
        availableTaxonomies: taxonomies,
      };
    }),

  /**
   * Get user's skills with details from both taxonomies
   */
  getUserSkills: protectedProcedure.query(async ({ ctx }) => {
    const { supabase, user } = ctx;

    const { data, error } = await supabase
      .from("user_skills")
      .select(`
        id,
        skill_taxonomy,
        csi_skill_id,
        onet_occupation_id,
        proficiency_level,
        years_experience,
        verified,
        notes,
        created_at
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to fetch user skills: ${error.message}`,
      });
    }

    // Enrich with skill details
    const enrichedSkills = await Promise.all(
      (data || []).map(async (skill) => {
        if (skill.skill_taxonomy === "csi" && skill.csi_skill_id) {
          const { data: csiData } = await supabase
            .schema("data")
            .from("masterformat")
            .select("code_key, code_display, name, depth")
            .eq("id", skill.csi_skill_id)
            .single();

          return {
            ...skill,
            skill_details: csiData
              ? {
                code: csiData.code_key,
                display_code: csiData.code_display,
                name: csiData.name,
                hierarchy_level: csiData.depth,
              }
              : null,
          };
        }

        if (skill.skill_taxonomy === "onet" && skill.onet_occupation_id) {
          const { data: onetData } = await supabase
            .schema("onet")
            .from("occupation_data")
            .select("onetsoc_code, title, description")
            .eq("onetsoc_code", skill.onet_occupation_id)
            .single();

          return {
            ...skill,
            skill_details: onetData
              ? {
                code: onetData.onetsoc_code,
                display_code: onetData.onetsoc_code,
                name: onetData.title,
                description: onetData.description,
                hierarchy_level: null,
              }
              : null,
          };
        }

        return { ...skill, skill_details: null };
      }),
    );

    return { skills: enrichedSkills };
  }),

  /**
   * Add a skill to user's profile
   */
  addSkill: protectedProcedure
    .input(addSkillInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { user, userToken } = ctx;

      const userScopedClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });

      const insertData: any = {
        user_id: user.id,
        skill_taxonomy: input.taxonomy,
        proficiency_level: input.proficiencyLevel,
      };

      if (input.taxonomy === "csi") {
        insertData.csi_skill_id = input.skillId;
      } else {
        insertData.onet_occupation_id = input.skillId;
      }

      if (input.yearsExperience !== undefined) {
        insertData.years_experience = input.yearsExperience;
      }

      if (input.notes) {
        insertData.notes = input.notes;
      }

      const { error } = await userScopedClient
        .from("user_skills")
        .insert(insertData);

      if (error) {
        if (error.code === "23505") {
          throw new TRPCError({
            code: "CONFLICT",
            message: "You have already added this skill",
          });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to add skill: ${error.message}`,
        });
      }

      return { success: true };
    }),

  /**
   * Update a user skill
   */
  updateSkill: protectedProcedure
    .input(updateSkillInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { user, userToken } = ctx;

      const userScopedClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });

      const updateData: any = {};
      if (input.proficiencyLevel !== undefined) {
        updateData.proficiency_level = input.proficiencyLevel;
      }
      if (input.yearsExperience !== undefined) {
        updateData.years_experience = input.yearsExperience;
      }
      if (input.notes !== undefined) {
        updateData.notes = input.notes;
      }

      if (Object.keys(updateData).length === 0) {
        return { success: true };
      }

      const { error } = await userScopedClient
        .from("user_skills")
        .update(updateData)
        .eq("id", input.userSkillId)
        .eq("user_id", user.id);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to update skill: ${error.message}`,
        });
      }

      return { success: true };
    }),

  /**
   * Remove a user skill
   */
  removeSkill: protectedProcedure
    .input(removeSkillInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { user, userToken } = ctx;

      const userScopedClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });

      const { error } = await userScopedClient
        .from("user_skills")
        .delete()
        .eq("id", input.userSkillId)
        .eq("user_id", user.id);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to remove skill: ${error.message}`,
        });
      }

      return { success: true };
    }),

  /**
   * Get user's primary industry
   */
  getPrimaryIndustry: protectedProcedure.query(async ({ ctx }) => {
    const { supabase, user } = ctx;

    const { data, error } = await supabase
      .from("user_private")
      .select("primary_industry_id, industries(id, name, slug)")
      .eq("user_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to fetch primary industry: ${error.message}`,
      });
    }

    return {
      primary_industry_id: data?.primary_industry_id || null,
      industry: data?.industries || null,
    };
  }),

  /**
   * Update user's primary industry
   */
  updatePrimaryIndustry: protectedProcedure
    .input(z.object({ industryId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      const { error } = await supabase
        .from("user_private")
        .upsert({
          user_id: user.id,
          primary_industry_id: input.industryId,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to update primary industry: ${error.message}`,
        });
      }

      return { success: true };
    }),
});
