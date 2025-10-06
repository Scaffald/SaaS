import { TRPCError } from "@trpc/server";
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
 */
export const profileCertificationsRouter = t.router({
  /**
   * Get user's certifications
   */
  getCertifications: protectedProcedure
    .output(getCertificationsOutputSchema)
    .query(async ({ ctx }) => {
      const { supabase, user } = ctx;

      const { data, error } = await supabase
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
   * Save certifications (create/update bulk)
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
            // Update existing certification
            const { data, error } = await supabase
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
            // Create new certification
            const { data, error } = await supabase
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
   * Delete certification
   */
  deleteCertification: protectedProcedure
    .input(deleteCertificationInputSchema)
    .output(deleteCertificationOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      try {
        // Get certification to check if it has a file
        const { data: cert, error: fetchError } = await supabase
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

        // Delete file from storage if exists
        if (cert.certificate_file_path) {
          await supabase.storage
            .from("certifications")
            .remove([cert.certificate_file_path]);
        }

        // Delete certification record
        const { error: deleteError } = await supabase
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
  /**
   * Upload certification file (PDF or image)
   * Handles file upload to Supabase Storage and updates user_certifications table
   */
  uploadCertificationFile: protectedProcedure
    .input(uploadCertificationFileInputSchema)
    .output(uploadCertificationFileOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      try {
        // Verify the certification belongs to the user
        const { data: certification, error: certError } = await supabase
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

        // Convert base64 to Uint8Array
        const base64Data = input.file.split(",")[1]; // Remove data:type;base64, prefix
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        // Generate unique file name with timestamp
        const sanitizedFileName = input.fileName
          .replace(/[^a-zA-Z0-9.-]/g, "_")
          .substring(0, 50);
        const uniqueFileName =
          `${user.id}/cert-${Date.now()}-${sanitizedFileName}`;

        // Upload to Supabase Storage
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

        // Update certification record with file path
        const { error: updateError } = await supabase
          .from("user_certifications")
          .update({
            certificate_file_path: uniqueFileName,
            updated_at: new Date().toISOString(),
          })
          .eq("id", input.certificationId)
          .eq("user_id", user.id);

        if (updateError) {
          // If update fails, try to clean up uploaded file
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
   * Delete certification file
   * Removes file from storage and updates database record
   */
  deleteCertificationFile: protectedProcedure
    .input(deleteCertificationFileInputSchema)
    .output(deleteCertificationFileOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      try {
        // Verify the certification belongs to the user
        const { data: certification, error: certError } = await supabase
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

        // Verify the file path matches
        if (certification.certificate_file_path !== input.filePath) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "File path does not match certification record",
          });
        }

        // Delete file from storage
        const { error: deleteError } = await supabase.storage
          .from("certifications")
          .remove([input.filePath]);

        if (deleteError) {
          console.error("Error deleting file from storage:", deleteError);
          // Continue anyway to clear the database field
        }

        // Update certification record to clear file path
        const { error: updateError } = await supabase
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
});
