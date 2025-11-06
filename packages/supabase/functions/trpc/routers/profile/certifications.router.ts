import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, t } from "../../middleware.ts";
import {
  deleteCertificationFileInputSchema,
  deleteCertificationFileOutputSchema,
  deleteCertificationInputSchema,
  deleteCertificationOutputSchema,
  getCertificationsOutputSchema,
  saveCertificationsInputSchema,
  saveCertificationsOutputSchema,
  uploadCertificationFileInputSchema,
  uploadCertificationFileOutputSchema,
  // @ts-ignore - Deno requires .ts extension
} from "../../../_shared/schemas/consolidated.ts";

/**
 * Profile Certifications router - handles certification CRUD and file upload operations
 * Supports hierarchical certification management with progressive saving
 */
export const profileCertificationsRouter = t.router({
  certifications: t.router({
    /**
     * Get top-level certifications (depth 0) for initial selection
     */
    getTopLevelCertifications: protectedProcedure
      .input(
        z.object({
          search: z.string().optional(),
          limit: z.number().min(1).max(50).default(20),
        }),
      )
      .query(async ({ ctx, input }) => {
        const { supabase } = ctx;

        let query = supabase
          .schema("data")
          .from("certifications")
          .select("*")
          .eq("depth", 0)
          .eq("is_active", true)
          .order("sort_order");

        if (input.search) {
          query = query.ilike("title", `%${input.search}%`);
        }

        const { data, error } = await query.limit(input.limit);

        if (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              `Failed to fetch top-level certifications: ${error.message}`,
          });
        }

        return { certifications: data || [] };
      }),

    /**
     * Get certification children by parent ID
     */
    getCertificationChildren: protectedProcedure
      .input(z.object({ parent_id: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        const { supabase } = ctx;

        const { data, error } = await supabase
          .schema("data")
          .from("certifications")
          .select("*")
          .eq("parent_id", input.parent_id)
          .eq("is_active", true)
          .order("sort_order");

        if (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to fetch certification children: ${error.message}`,
          });
        }

        return { certifications: data || [] };
      }),

    /**
     * Get full certification tree for user (reconstructs state)
     */
    getUserCertificationTree: protectedProcedure.query(async ({ ctx }) => {
      const { supabase, user } = ctx;

      // Get all user certifications
      const { data: userCerts, error } = await supabase
            .schema("core")
        .from("user_certifications")
        .select(`
        id,
        user_id,
        certification_id,
        issue_date,
        expiration_date,
        credential_id,
        credential_url,
        certificate_file_path,
        description,
        is_active,
        verification_status,
        created_at,
        updated_at
      `)
        .eq("user_id", user.id)
        .eq("is_active", true);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch user certifications: ${error.message}`,
        });
      }

      if (!userCerts || userCerts.length === 0) {
        return {
          depth0: [],
          depth1ByParent: {},
          depth2ByParent: {},
        };
      }

      // Get catalog details for all certifications
      const certIds = userCerts.map((uc) => uc.certification_id);
      const { data: catalogCerts, error: catalogError } = await supabase
        .schema("data")
        .from("certifications")
        .select("*")
        .in("id", certIds);

      if (catalogError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch catalog details: ${catalogError.message}`,
        });
      }

      // Create lookup map
      const catalogMap = new Map(
        catalogCerts?.map((c) => [c.id, c]) || [],
      );

      // Organize by depth
      const depth0: unknown[] = [];
      const depth1ByParent: Record<string, unknown[]> = {};
      const depth2ByParent: Record<string, unknown[]> = {};

      for (const userCert of userCerts) {
        const catalogCert = catalogMap.get(userCert.certification_id);
        if (!catalogCert) continue;

        const combined = { ...userCert, catalog: catalogCert };

        if (catalogCert.depth === 0) {
          depth0.push(combined);
        } else if (catalogCert.depth === 1) {
          const parentId = catalogCert.parent_id;
          if (!depth1ByParent[parentId]) {
            depth1ByParent[parentId] = [];
          }
          depth1ByParent[parentId].push(combined);
        } else if (catalogCert.depth === 2) {
          const parentId = catalogCert.parent_id;
          if (!depth2ByParent[parentId]) {
            depth2ByParent[parentId] = [];
          }
          depth2ByParent[parentId].push(combined);
        }
      }

      return {
        depth0,
        depth1ByParent,
        depth2ByParent,
      };
    }),

    /**
     * Add top-level certification (depth 0) - creates when chip is added
     */
    addTopLevelCertification: protectedProcedure
      .input(z.object({ certification_id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        const { supabase, user } = ctx;

        // Verify it's a depth 0 certification
        const { data: cert, error: certError } = await supabase
          .schema("data")
          .from("certifications")
          .select("*")
          .eq("id", input.certification_id)
          .eq("depth", 0)
          .eq("is_active", true)
          .single();

        if (certError || !cert) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Top-level certification not found",
          });
        }

        // Check if already exists
        const { data: existing } = await supabase
          .schema("core")
          .from("user_certifications")
          .select("id")
          .eq("user_id", user.id)
          .eq("certification_id", input.certification_id)
          .eq("is_active", true)
          .single();

        if (existing) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You already have this certification category",
          });
        }

        // Create user certification
        const { data, error } = await supabase
          .schema("core")
          .from("user_certifications")
          .insert({
            user_id: user.id,
            certification_id: input.certification_id,
            is_active: true,
            verification_status: "unverified",
          })
          .select()
          .single();

        if (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to add certification: ${error.message}`,
          });
        }

        return { success: true, certification: data };
      }),

    /**
     * Add category certification (depth 1) - creates when toggle is activated
     */
    addCategoryCertification: protectedProcedure
      .input(
        z.object({
          category_id: z.string().uuid(),
          parent_id: z.string().uuid(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const { supabase, user } = ctx;

        // Verify parent exists in user's certifications
        const { data: parentCert } = await supabase
          .schema("core")
          .from("user_certifications")
          .select("id")
          .eq("user_id", user.id)
          .eq("certification_id", input.parent_id)
          .eq("is_active", true)
          .single();

        if (!parentCert) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Parent certification not found in your profile",
          });
        }

        // Verify it's a depth 1 certification with correct parent
        const { data: cert, error: certError } = await supabase
          .schema("data")
          .from("certifications")
          .select("*")
          .eq("id", input.category_id)
          .eq("depth", 1)
          .eq("parent_id", input.parent_id)
          .eq("is_active", true)
          .single();

        if (certError || !cert) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Category certification not found",
          });
        }

        // Check if already exists
        const { data: existing } = await supabase
          .schema("core")
          .from("user_certifications")
          .select("id")
          .eq("user_id", user.id)
          .eq("certification_id", input.category_id)
          .eq("is_active", true)
          .single();

        if (existing) {
          return {
            success: true,
            certification: existing,
            alreadyExists: true,
          };
        }

        // Create user certification
        const { data, error } = await supabase
          .schema("core")
          .from("user_certifications")
          .insert({
            user_id: user.id,
            certification_id: input.category_id,
            is_active: true,
            verification_status: "unverified",
          })
          .select()
          .single();

        if (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to add category: ${error.message}`,
          });
        }

        return { success: true, certification: data, alreadyExists: false };
      }),

    /**
     * Toggle specific certification (depth 2) - creates/removes when checkbox changes
     */
    toggleSpecificCertification: protectedProcedure
      .input(
        z.object({
          certification_id: z.string().uuid(),
          parent_id: z.string().uuid(),
          checked: z.boolean(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const { supabase, user } = ctx;

        if (input.checked) {
          // Add certification
          const { data: parentCert } = await supabase
            .schema("core")
            .from("user_certifications")
            .select("id")
            .eq("user_id", user.id)
            .eq("certification_id", input.parent_id)
            .eq("is_active", true)
            .single();

          if (!parentCert) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Parent category not found in your profile",
            });
          }

          const { data: cert, error: certError } = await supabase
            .schema("data")
            .from("certifications")
            .select("*")
            .eq("id", input.certification_id)
            .eq("depth", 2)
            .eq("parent_id", input.parent_id)
            .eq("is_active", true)
            .single();

          if (certError || !cert) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Certification not found",
            });
          }

          const { data: existing } = await supabase
            .schema("core")
            .from("user_certifications")
            .select("id")
            .eq("user_id", user.id)
            .eq("certification_id", input.certification_id)
            .eq("is_active", true)
            .single();

          if (existing) {
            return { success: true, certification: existing };
          }

          const { data, error } = await supabase
            .schema("core")
            .from("user_certifications")
            .insert({
              user_id: user.id,
              certification_id: input.certification_id,
              is_active: true,
              verification_status: "unverified",
            })
            .select()
            .single();

          if (error) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: `Failed to add certification: ${error.message}`,
            });
          }

          return { success: true, certification: data };
        }

        // Remove certification (soft delete)
        const { error } = await supabase
          .schema("core")
          .from("user_certifications")
          .update({ is_active: false })
          .eq("user_id", user.id)
          .eq("certification_id", input.certification_id);

        if (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to remove certification: ${error.message}`,
          });
        }

        return { success: true, certification: null };
      }),

    /**
     * Remove top-level certification with cascade warning
     */
    removeTopLevelCertification: protectedProcedure
      .input(
        z.object({
          top_level_id: z.string().uuid(),
          confirmed: z.boolean().default(false),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const { supabase, user } = ctx;

        const { data: topLevelCatalog, error: catalogError } = await supabase
          .schema("data")
          .from("certifications")
          .select("*")
          .eq("id", input.top_level_id)
          .eq("depth", 0)
          .single();

        if (catalogError || !topLevelCatalog) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Top-level certification not found",
          });
        }

        const { data: descendants } = await supabase
          .schema("data")
          .from("certifications")
          .select("id")
          .ilike("hierarchy_path", `${topLevelCatalog.hierarchy_path}%`)
          .neq("id", input.top_level_id);

        const descendantIds = descendants?.map((d) => d.id) || [];
        const allIdsToRemove = [input.top_level_id, ...descendantIds];

        const { data: affectedCerts, error: countError } = await supabase
          .schema("core")
          .from("user_certifications")
          .select("id, certification_id")
          .eq("user_id", user.id)
          .in("certification_id", allIdsToRemove)
          .eq("is_active", true);

        if (countError) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              `Failed to count affected certifications: ${countError.message}`,
          });
        }

        const affectedCount = affectedCerts?.length || 0;

        if (!input.confirmed && affectedCount > 1) {
          return {
            success: false,
            needsConfirmation: true,
            affectedCount: affectedCount - 1,
            message: `Removing this will also remove ${
              affectedCount - 1
            } related certification(s)`,
          };
        }

        const { error: deleteError } = await supabase
          .schema("core")
          .from("user_certifications")
          .update({ is_active: false })
          .eq("user_id", user.id)
          .in("certification_id", allIdsToRemove);

        if (deleteError) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to remove certifications: ${deleteError.message}`,
          });
        }

        return {
          success: true,
          needsConfirmation: false,
          removedCount: affectedCount,
        };
      }),

    /**
     * Update certification proof (file or URL)
     */
    updateCertificationProof: protectedProcedure
      .input(
        z.object({
          user_certification_id: z.string().uuid(),
          proof_type: z.enum(["url", "file"]),
          credential_url: z.string().url().optional(),
          certificate_file: z.string().optional(),
          file_name: z.string().optional(),
          content_type: z.string().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const { supabase, user } = ctx;

        const { data: userCert, error: certError } = await supabase
          .schema("core")
          .from("user_certifications")
          .select("*")
          .eq("id", input.user_certification_id)
          .eq("user_id", user.id)
          .single();

        if (certError || !userCert) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Certification not found",
          });
        }

        if (input.proof_type === "url") {
          const { error } = await supabase
            .schema("core")
            .from("user_certifications")
            .update({
              credential_url: input.credential_url,
              updated_at: new Date().toISOString(),
            })
            .eq("id", input.user_certification_id);

          if (error) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: `Failed to update URL: ${error.message}`,
            });
          }

          return { success: true, proofType: "url", url: input.credential_url };
        }

        if (!input.certificate_file || !input.file_name) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "File data and name required for file upload",
          });
        }

        const base64Data = input.certificate_file.split(",")[1];
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const sanitizedFileName = input.file_name
          .replace(/[^a-zA-Z0-9.-]/g, "_")
          .substring(0, 50);
        const uniqueFileName =
          `${user.id}/cert-${Date.now()}-${sanitizedFileName}`;

        const { error: uploadError } = await supabase.storage
          .from("certifications")
          .upload(uniqueFileName, bytes, {
            contentType: input.content_type || "application/pdf",
            upsert: true,
          });

        if (uploadError) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to upload file: ${uploadError.message}`,
          });
        }

        const { error: updateError } = await supabase
          .schema("core")
          .from("user_certifications")
          .update({
            certificate_file_path: uniqueFileName,
            updated_at: new Date().toISOString(),
          })
          .eq("id", input.user_certification_id);

        if (updateError) {
          await supabase.storage
            .from("certifications")
            .remove([uniqueFileName]);

          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to update record: ${updateError.message}`,
          });
        }

        return {
          success: true,
          proofType: "file",
          filePath: uniqueFileName,
        };
      }),

    /**
     * Get user's certifications (legacy - maintains backwards compatibility)
     */
    getCertifications: protectedProcedure
      .output(getCertificationsOutputSchema)
      .query(async ({ ctx }) => {
        const { supabase, user } = ctx;

        const { data, error } = await supabase
          .schema("core")
          .from("user_certifications")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .order("issue_date", { ascending: false });

        if (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to fetch certifications: ${error.message}`,
          });
        }

        return data || [];
      }),

    /**
     * Save certifications (create/update bulk) - legacy
     */
    saveCertifications: protectedProcedure
      .input(saveCertificationsInputSchema)
      .output(saveCertificationsOutputSchema)
      .mutation(async ({ ctx, input }) => {
        const { supabase, user } = ctx;

        try {
          const savedCertifications = [];

          for (const cert of input.certifications) {
            if (cert.id) {
              const { data, error } = await supabase
                .schema("core")
                .from("user_certifications")
                .update({
                  name: cert.name,
                  issuing_organization: cert.issuing_organization,
                  issue_date: cert.issue_date || null,
                  expiration_date: cert.expiration_date || null,
                  credential_id: cert.credential_id || null,
                  credential_url: cert.credential_url || null,
                  description: cert.description || null,
                  is_active: cert.is_active,
                  verification_status: cert.verification_status,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", cert.id)
                .eq("user_id", user.id)
                .select()
                .single();

              if (error) {
                throw new TRPCError({
                  code: "INTERNAL_SERVER_ERROR",
                  message: `Failed to update certification: ${error.message}`,
                });
              }

              savedCertifications.push(data);
            } else {
              const { data, error } = await supabase
                .schema("core")
                .from("user_certifications")
                .insert({
                  user_id: user.id,
                  name: cert.name,
                  issuing_organization: cert.issuing_organization,
                  issue_date: cert.issue_date || null,
                  expiration_date: cert.expiration_date || null,
                  credential_id: cert.credential_id || null,
                  credential_url: cert.credential_url || null,
                  description: cert.description || null,
                  is_active: cert.is_active,
                  verification_status: cert.verification_status,
                })
                .select()
                .single();

              if (error) {
                throw new TRPCError({
                  code: "INTERNAL_SERVER_ERROR",
                  message: `Failed to create certification: ${error.message}`,
                });
              }

              savedCertifications.push(data);
            }
          }

          return {
            success: true,
            certifications: savedCertifications,
          };
        } catch (error) {
          const errorMessage = error instanceof Error
            ? error.message
            : String(error);
          console.error("Save certifications error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to save certifications: ${errorMessage}`,
          });
        }
      }),

    /**
     * Upload certification file (PDF or image) - legacy
     */
    uploadCertificationFile: protectedProcedure
      .input(uploadCertificationFileInputSchema)
      .output(uploadCertificationFileOutputSchema)
      .mutation(async ({ ctx, input }) => {
        const { supabase, user } = ctx;

        try {
          const { data: certification, error: certError } = await supabase
            .schema("core")
            .from("user_certifications")
            .select("id, user_id")
            .eq("id", input.certificationId)
            .eq("user_id", user.id)
            .single();

          if (certError || !certification) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Certification not found or does not belong to user",
            });
          }

          const base64Data = input.file.split(",")[1];
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          const sanitizedFileName = input.fileName
            .replace(/[^a-zA-Z0-9.-]/g, "_")
            .substring(0, 50);
          const uniqueFileName =
            `${user.id}/cert-${Date.now()}-${sanitizedFileName}`;

          const { error: uploadError } = await supabase.storage
            .from("certifications")
            .upload(uniqueFileName, bytes, {
              contentType: input.contentType,
              upsert: true,
            });

          if (uploadError) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message:
                `Failed to upload certification file: ${uploadError.message}`,
            });
          }

          const { error: updateError } = await supabase
            .schema("core")
            .from("user_certifications")
            .update({
              certificate_file_path: uniqueFileName,
              updated_at: new Date().toISOString(),
            })
            .eq("id", input.certificationId)
            .eq("user_id", user.id);

          if (updateError) {
            await supabase.storage
              .from("certifications")
              .remove([uniqueFileName]);

            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message:
                `Failed to update certification with file path: ${updateError.message}`,
            });
          }

          return {
            success: true,
            filePath: uniqueFileName,
          };
        } catch (error) {
          const errorMessage = error instanceof Error
            ? error.message
            : String(error);
          console.error("Certification file upload error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Certification file upload failed: ${errorMessage}`,
          });
        }
      }),

    /**
     * Delete certification file - legacy
     */
    deleteCertificationFile: protectedProcedure
      .input(deleteCertificationFileInputSchema)
      .output(deleteCertificationFileOutputSchema)
      .mutation(async ({ ctx, input }) => {
        const { supabase, user } = ctx;

        try {
          const { data: certification, error: certError } = await supabase
            .schema("core")
            .from("user_certifications")
            .select("id, user_id, certificate_file_path")
            .eq("id", input.certificationId)
            .eq("user_id", user.id)
            .single();

          if (certError || !certification) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Certification not found or does not belong to user",
            });
          }

          if (certification.certificate_file_path !== input.filePath) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "File path does not match certification record",
            });
          }

          const { error: deleteError } = await supabase.storage
            .from("certifications")
            .remove([input.filePath]);

          if (deleteError) {
            console.error("Error deleting file from storage:", deleteError);
          }

          const { error: updateError } = await supabase
            .schema("core")
            .from("user_certifications")
            .update({
              certificate_file_path: null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", input.certificationId)
            .eq("user_id", user.id);

          if (updateError) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message:
                `Failed to update certification record: ${updateError.message}`,
            });
          }

          return {
            success: true,
          };
        } catch (error) {
          const errorMessage = error instanceof Error
            ? error.message
            : String(error);
          console.error("Certification file deletion error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Certification file deletion failed: ${errorMessage}`,
          });
        }
      }),

    /**
     * Delete certification - legacy
     */
    deleteCertification: protectedProcedure
      .input(deleteCertificationInputSchema)
      .output(deleteCertificationOutputSchema)
      .mutation(async ({ ctx, input }) => {
        const { supabase, user } = ctx;

        try {
          const { data: cert, error: fetchError } = await supabase
            .schema("core")
            .from("user_certifications")
            .select("certificate_file_path")
            .eq("id", input.certificationId)
            .eq("user_id", user.id)
            .single();

          if (fetchError) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Certification not found",
            });
          }

          if (cert.certificate_file_path) {
            await supabase.storage
              .from("certifications")
              .remove([cert.certificate_file_path]);
          }

          const { error: deleteError } = await supabase
            .schema("core")
            .from("user_certifications")
            .delete()
            .eq("id", input.certificationId)
            .eq("user_id", user.id);

          if (deleteError) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: `Failed to delete certification: ${deleteError.message}`,
            });
          }

          return { success: true };
        } catch (error) {
          const errorMessage = error instanceof Error
            ? error.message
            : String(error);
          console.error("Delete certification error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to delete certification: ${errorMessage}`,
          });
        }
      }),
  }),
});
