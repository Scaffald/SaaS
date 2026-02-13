/**
 * User Merge Workflow tRPC Router
 * User merge workflow tRPC router
 *
 * Handles detection, conflict resolution, and execution of user data merges
 * when manually-added users register with Scaffald accounts.
 */

<<<<<<< HEAD
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { core, forsured } from "../../../lib/supabase";
import { AuditService } from "../../../lib/audit/AuditService";
import { sendMergeCompletionNotifications } from "../../../lib/mergeNotifications";
=======
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { forsured } from '../../../lib/supabase'
import { AuditService } from '../../../lib/audit/AuditService'
import { sendMergeCompletionNotifications } from '../../../lib/mergeNotifications'
>>>>>>> 264530c73bf14a52195cd0553c9391f21eeccac1

/**
 * Fields that can have conflicts during merge
 */
const CONFLICT_FIELDS = ["name", "company", "phone"] as const;
type ConflictField = typeof CONFLICT_FIELDS[number];

/**
 * Input validation schemas
 */
const detectMatchesInput = z.object({
  email: z.string().email(),
});

const getConflictsInput = z.object({
  manualUserId: z.string().uuid(),
});

const resolveConflictsInput = z.object({
  manualUserId: z.string().uuid(),
  resolutions: z.array(z.object({
    fieldName: z.string(),
    selectedValue: z.string().nullable(),
  })),
  confirmedProjectIds: z.array(z.string().uuid()).optional(),
});

const executeMergeInput = z.object({
  manualUserId: z.string().uuid(),
});

/**
 * Get the current user's profile
 */
async function getCurrentUserProfile(userId: string) {
  const { data, error } = await forsured("user_profiles")
    .select("id, scaffald_user_id, user_type, name, email, company, phone")
    .eq("scaffald_user_id", userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

/**
 * Create an audit log entry for merge operations
 */
async function logMergeAudit(
  action: string,
  userId: string,
  organizationId: string | null,
  metadata: Record<string, unknown>,
) {
  try {
    const auditService = new AuditService();
    await auditService.log({
      category: "data_modification",
      action,
      severity: "medium",
      user_id: userId,
      organization_id: organizationId || undefined,
      resource_type: "user_merge",
      status: "success",
      metadata,
      manual_user_merge_reference: metadata,
    });
  } catch (error) {
    console.error("[UserMerge] Failed to log audit event:", error);
    // Don't fail the operation if audit logging fails
  }
}

/**
 * User Merge tRPC Router
 */
export const userMergeRouter = createTRPCRouter({
  /**
   * Detect manual user matches for the current user's email
   */
  detectMatches: protectedProcedure
    .input(detectMatchesInput)
    .query(async ({ input, ctx }) => {
      const normalizedEmail = input.email.toLowerCase().trim();

      console.log("[UserMerge] Detecting matches for email:", normalizedEmail);

      // Find manually-created users matching this email
      const { data: manualUsers, error: userError } = await forsured(
        "user_profiles",
      )
        .select(`
          id,
          name,
          email,
          phone,
          company,
          user_type,
          is_manually_created,
          created_by_user_id,
          created_at
        `)
        .eq("email", normalizedEmail)
        .eq("is_manually_created", true)
        .is("merged_at", null);

      if (userError) {
        console.error("[UserMerge] Error fetching manual users:", userError);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to search for matching users",
        });
      }

      if (!manualUsers || manualUsers.length === 0) {
        return { matches: [], hasMatches: false };
      }

      // Get invitation context for each match
      const userIds = manualUsers.map((u) => u.id);
      const { data: invitations } = await forsured("relationship_invitations")
        .select(`
          id,
          manual_user_id,
          inviter_user_id,
          inviter_type,
          status,
          relationship_code,
          invited_at
        `)
        .in("manual_user_id", userIds);

      // Get creator profiles for context
      const creatorIds = manualUsers
        .map((u) => u.created_by_user_id)
        .filter((id): id is string => id !== null);

      let creatorProfiles: Record<
        string,
        { name: string; company: string | null }
      > = {};

      if (creatorIds.length > 0) {
        const { data: creators } = await forsured("user_profiles")
          .select("id, name, company")
          .in("id", creatorIds);

        creatorProfiles = (creators || []).reduce((acc, c) => {
          acc[c.id] = { name: c.name || "Unknown", company: c.company };
          return acc;
        }, {} as Record<string, { name: string; company: string | null }>);
      }

      // Build matches with context
      const matches = manualUsers.map((user) => {
        const userInvitations = (invitations || []).filter(
          (inv) => inv.manual_user_id === user.id,
        );
        const creator = user.created_by_user_id
          ? creatorProfiles[user.created_by_user_id]
          : null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          company: user.company,
          userType: user.user_type,
          createdAt: user.created_at,
          createdBy: creator,
          invitations: userInvitations.map((inv) => ({
            id: inv.id,
            status: inv.status,
            inviterType: inv.inviter_type,
            invitedAt: inv.invited_at,
          })),
        };
      });

      console.log(`[UserMerge] Found ${matches.length} match(es)`);

      return { matches, hasMatches: matches.length > 0 };
    }),

  /**
   * Get conflicts between manual user and current user profiles
   */
  getConflicts: protectedProcedure
    .input(getConflictsInput)
    .query(async ({ input, ctx }) => {
      // Get current user's profile
      const currentProfile = await getCurrentUserProfile(ctx.userId);

      if (!currentProfile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Your profile was not found",
        });
      }

      // Get the manual user profile
      const { data: manualUser, error: manualError } = await forsured(
        "user_profiles",
      )
        .select(
          "id, name, email, phone, company, user_type, is_manually_created, merged_at",
        )
        .eq("id", input.manualUserId)
        .single();

      if (manualError || !manualUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Manual user not found",
        });
      }

      if (!manualUser.is_manually_created) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This user is not a manual user",
        });
      }

      if (manualUser.merged_at) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This user has already been merged",
        });
      }

      // Compare fields and identify conflicts
      const conflicts: Array<{
        fieldName: ConflictField;
        manualValue: string | null;
        scaffaldValue: string | null;
        hasConflict: boolean;
      }> = [];

      for (const field of CONFLICT_FIELDS) {
        const manualValue = manualUser[field] as string | null;
        const scaffaldValue = currentProfile[field] as string | null;

        // A conflict exists if both have values and they differ
        const hasConflict = Boolean(
          manualValue &&
            scaffaldValue &&
            manualValue.toLowerCase().trim() !==
              scaffaldValue.toLowerCase().trim(),
        );

        conflicts.push({
          fieldName: field,
          manualValue,
          scaffaldValue,
          hasConflict,
        });
      }

      // Get tasks assigned to the manual user
      const { data: tasks } = await forsured("tasks")
        .select("id, title, status, project_id")
        .eq("assignee_id", input.manualUserId);

      // Get projects the manual user is associated with
      const { data: projectAssociations } = await forsured(
        "project_subcontractors",
      )
        .select("project_id, projects:project_id(id, name)")
        .eq("subcontractor_id", input.manualUserId);

      // Get documents owned by the manual user
      const { data: documents } = await forsured("documents")
        .select("id, name, file_type")
        .eq("owner_id", input.manualUserId);

      const dataToTransfer = {
        tasks: tasks || [],
        projects: (projectAssociations || []).map((pa) => ({
          id: pa.project_id,
          name: (pa.projects as { id: string; name: string } | null)?.name ||
            "Unknown Project",
        })),
        documents: documents || [],
      };

      console.log("[UserMerge] Conflicts identified:", {
        conflictCount: conflicts.filter((c) => c.hasConflict).length,
        taskCount: dataToTransfer.tasks.length,
        projectCount: dataToTransfer.projects.length,
        documentCount: dataToTransfer.documents.length,
      });

      return {
        manualUser: {
          id: manualUser.id,
          name: manualUser.name,
          email: manualUser.email,
          userType: manualUser.user_type,
        },
        conflicts,
        dataToTransfer,
        hasConflicts: conflicts.some((c) => c.hasConflict),
      };
    }),

  /**
   * Resolve conflicts and store user decisions
   */
  resolveConflicts: protectedProcedure
    .input(resolveConflictsInput)
    .mutation(async ({ input, ctx }) => {
      const currentProfile = await getCurrentUserProfile(ctx.userId);

      if (!currentProfile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Your profile was not found",
        });
      }

      // Verify the manual user exists and is eligible for merge
      const { data: manualUser, error: manualError } = await forsured(
        "user_profiles",
      )
        .select(
          "id, name, email, phone, company, is_manually_created, merged_at",
        )
        .eq("id", input.manualUserId)
        .single();

      if (manualError || !manualUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Manual user not found",
        });
      }

      if (!manualUser.is_manually_created || manualUser.merged_at) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This user cannot be merged",
        });
      }

      // Store conflict resolutions
      const resolutionRecords = input.resolutions.map((resolution) => ({
        manual_user_id: input.manualUserId,
        real_user_id: currentProfile.id,
        field_name: resolution.fieldName,
        manual_value:
          manualUser[resolution.fieldName as keyof typeof manualUser] as
            | string
            | null,
        scaffald_value:
          currentProfile[resolution.fieldName as keyof typeof currentProfile] as
            | string
            | null,
        selected_value: resolution.selectedValue,
        resolved_at: new Date().toISOString(),
        resolved_by: currentProfile.id,
      }));

      // Upsert resolutions (in case user is revising their choices)
      for (const record of resolutionRecords) {
        const { error } = await forsured("user_merge_resolutions")
          .upsert(record, {
            onConflict: "manual_user_id,real_user_id,field_name",
          });

        if (error) {
          console.error("[UserMerge] Error storing resolution:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to store conflict resolution",
          });
        }
      }

      console.log(
        "[UserMerge] Stored",
        resolutionRecords.length,
        "conflict resolutions",
      );

      // Log the resolution event
      await logMergeAudit(
        "user_merge_conflicts_resolved",
        ctx.userId,
        ctx.organizationId,
        {
          manual_user_id: input.manualUserId,
          real_user_id: currentProfile.id,
          resolution_count: resolutionRecords.length,
          confirmed_project_ids: input.confirmedProjectIds,
        },
      );

      return {
        success: true,
        resolutionCount: resolutionRecords.length,
      };
    }),

  /**
   * Execute the merge operation atomically
   */
  executeMerge: protectedProcedure
    .input(executeMergeInput)
    .mutation(async ({ input, ctx }) => {
      const currentProfile = await getCurrentUserProfile(ctx.userId);

      if (!currentProfile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Your profile was not found",
        });
      }

      // Verify the manual user exists and is eligible for merge
      const { data: manualUser, error: manualError } = await forsured(
        "user_profiles",
      )
        .select(
          "id, name, email, phone, company, user_type, is_manually_created, merged_at",
        )
        .eq("id", input.manualUserId)
        .single();

      if (manualError || !manualUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Manual user not found",
        });
      }

      if (!manualUser.is_manually_created) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This user is not a manual user",
        });
      }

      if (manualUser.merged_at) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This user has already been merged",
        });
      }

      console.log("[UserMerge] Starting merge execution:", {
        manualUserId: input.manualUserId,
        realUserId: currentProfile.id,
      });

      // Get conflict resolutions
      const { data: resolutions } = await forsured("user_merge_resolutions")
        .select("field_name, selected_value")
        .eq("manual_user_id", input.manualUserId)
        .eq("real_user_id", currentProfile.id);

      // Build profile updates from resolutions
      const profileUpdates: Record<string, string | null> = {};
      for (const resolution of resolutions || []) {
        if (resolution.selected_value) {
          profileUpdates[resolution.field_name] = resolution.selected_value;
        }
      }

      const mergeResults = {
        tasksTransferred: 0,
        documentsTransferred: 0,
        projectsLinked: 0,
        profileFieldsUpdated: Object.keys(profileUpdates).length,
      };

      try {
        // 1. Transfer tasks from manual user to real user
        const { data: updatedTasks, error: taskError } = await forsured("tasks")
          .update({
            assignee_id: currentProfile.id,
            updated_at: new Date().toISOString(),
          })
          .eq("assignee_id", input.manualUserId)
          .select("id");

        if (taskError) {
          throw new Error(`Failed to transfer tasks: ${taskError.message}`);
        }
        mergeResults.tasksTransferred = updatedTasks?.length || 0;

        // 2. Transfer documents from manual user to real user
        const { data: updatedDocs, error: docError } = await forsured(
          "documents",
        )
          .update({
            owner_id: currentProfile.id,
            updated_at: new Date().toISOString(),
          })
          .eq("owner_id", input.manualUserId)
          .select("id");

        if (docError) {
          throw new Error(`Failed to transfer documents: ${docError.message}`);
        }
        mergeResults.documentsTransferred = updatedDocs?.length || 0;

        // 3. Transfer project associations
        const { data: updatedProjects, error: projectError } = await forsured(
          "project_subcontractors",
        )
          .update({
            subcontractor_id: currentProfile.id,
            updated_at: new Date().toISOString(),
          })
          .eq("subcontractor_id", input.manualUserId)
          .select("id");

        if (projectError) {
          throw new Error(
            `Failed to transfer project associations: ${projectError.message}`,
          );
        }
        mergeResults.projectsLinked = updatedProjects?.length || 0;

        // 4. Apply resolved profile field values to real user
        if (Object.keys(profileUpdates).length > 0) {
          const { error: profileError } = await forsured("user_profiles")
            .update({
              ...profileUpdates,
              updated_at: new Date().toISOString(),
            })
            .eq("id", currentProfile.id);

          if (profileError) {
            throw new Error(
              `Failed to update profile: ${profileError.message}`,
            );
          }
        }

        // 5. Mark the real user as having been merged from this manual user
        const { error: realUserError } = await forsured("user_profiles")
          .update({
            merged_from_manual_user_id: input.manualUserId,
            updated_at: new Date().toISOString(),
          })
          .eq("id", currentProfile.id);

        if (realUserError) {
          throw new Error(
            `Failed to update merge reference: ${realUserError.message}`,
          );
        }

        // 6. Mark the manual user as merged
        const { error: manualUpdateError } = await forsured("user_profiles")
          .update({
            merged_at: new Date().toISOString(),
            scaffald_user_id: ctx.userId,
            updated_at: new Date().toISOString(),
          })
          .eq("id", input.manualUserId);

        if (manualUpdateError) {
          throw new Error(
            `Failed to mark manual user as merged: ${manualUpdateError.message}`,
          );
        }

        // 7. Update relationship invitations to mark as connected
        await forsured("relationship_invitations")
          .update({
            status: "connected",
            invitee_user_id: ctx.userId,
            connected_at: new Date().toISOString(),
          })
          .eq("manual_user_id", input.manualUserId)
          .eq("status", "pending");

        console.log("[UserMerge] Merge completed successfully:", mergeResults);

        // Log the merge completion
        await logMergeAudit(
          "user_merge_completed",
          ctx.userId,
          ctx.organizationId,
          {
            manual_user_id: input.manualUserId,
            real_user_id: currentProfile.id,
            ...mergeResults,
          },
        );

        // Send merge completion notifications
        // Get the established user who created the manual user
        const { data: establishedUserData } = await forsured("user_profiles")
          .select("id, name, email, organization_id, created_by_user_id")
          .eq("id", input.manualUserId)
          .single();

        if (establishedUserData?.created_by_user_id) {
          const { data: creatorProfile } = await forsured("user_profiles")
            .select("id, name, email, organization_id")
            .eq("id", establishedUserData.created_by_user_id)
            .single();

          if (creatorProfile) {
            // Send notifications to both users (non-blocking)
            sendMergeCompletionNotifications({
              establishedUser: {
                id: creatorProfile.id,
                name: creatorProfile.name || "Unknown",
                email: creatorProfile.email || "",
                organizationId: creatorProfile.organization_id,
              },
              newUser: {
                id: currentProfile.id,
                name: currentProfile.name || "Unknown",
                email: currentProfile.email || "",
                organizationId: ctx.organizationId,
              },
              manualUserId: input.manualUserId,
              stats: mergeResults,
            }).catch((err) => {
              // Log but don't fail the merge if notifications fail
              console.error("[UserMerge] Failed to send notifications:", err);
            });
          }
        }

        return {
          success: true,
          mergeResults,
        };
      } catch (error) {
        console.error("[UserMerge] Merge failed:", error);

        // Log the merge failure
        await logMergeAudit(
          "user_merge_failed",
          ctx.userId,
          ctx.organizationId,
          {
            manual_user_id: input.manualUserId,
            real_user_id: currentProfile.id,
            error: error instanceof Error ? error.message : "Unknown error",
          },
        );

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error
            ? error.message
            : "Merge operation failed",
        });
      }
    }),

  /**
   * Get merge status for the current user
   */
  getMergeStatus: protectedProcedure.query(async ({ ctx }) => {
    const currentProfile = await getCurrentUserProfile(ctx.userId);

    if (!currentProfile) {
      return { hasPendingMerge: false, mergedFrom: null };
    }

    // Check if user has a merged_from reference
    const { data: profile } = await forsured("user_profiles")
      .select("merged_from_manual_user_id")
      .eq("id", currentProfile.id)
      .single();

    if (profile?.merged_from_manual_user_id) {
      // Get info about the merged manual user
      const { data: manualUser } = await forsured("user_profiles")
        .select("id, name, email, merged_at")
        .eq("id", profile.merged_from_manual_user_id)
        .single();

      return {
        hasPendingMerge: false,
        mergedFrom: manualUser
          ? {
            id: manualUser.id,
            name: manualUser.name,
            email: manualUser.email,
            mergedAt: manualUser.merged_at,
          }
          : null,
      };
    }

    // Check for pending manual user matches
    const userEmail = ctx.session?.email;
    if (userEmail) {
      const { data: pendingMatches } = await forsured("user_profiles")
        .select("id")
        .eq("email", userEmail.toLowerCase())
        .eq("is_manually_created", true)
        .is("merged_at", null)
        .limit(1);

      return {
        hasPendingMerge: (pendingMatches?.length || 0) > 0,
        mergedFrom: null,
      };
    }

    return { hasPendingMerge: false, mergedFrom: null };
  }),

  /**
   * Cancel/skip a pending merge
   */
  skipMerge: protectedProcedure
    .input(z.object({ manualUserId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      // Mark that the user declined to merge with this manual user
      // This prevents the merge prompt from appearing again

      await logMergeAudit(
        "user_merge_skipped",
        ctx.userId,
        ctx.organizationId,
        {
          manual_user_id: input.manualUserId,
          skipped_at: new Date().toISOString(),
        },
      );

      // Store the skip in metadata or a separate table if needed
      // For now, we just log it

      return { success: true };
    }),
});
