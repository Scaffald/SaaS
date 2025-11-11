import { TRPCError } from "@trpc/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import {
  officeProcedure,
  protectedProcedure,
  publicProcedure,
  t,
} from "../middleware.ts";

// @ts-ignore - Deno requires file extension
import type { Database } from "../../_shared/database.types.ts";
// @ts-ignore - Deno requires file extension
import {
  addCollaboratorSchema,
  addWorkLogCommentSchema,
  checkTimeOverlapSchema,
  createWorkLogSchema,
  disputeWorkLogSchema,
  moveWorkLogSchema,
  submitWorkLogSchema,
  updateCollaboratorSchema,
  updatePhotoVisibilitySchema,
  updateProfileVisibilitySchema,
  updateWorkLogSchema,
  uploadWorkLogPhotoSchema,
  verifyWorkLogSchema,
} from "../../_shared/work-log-schemas.ts";
// @ts-ignore - Deno requires file extension
import { notifyWorkLogCollaborator } from "../../_shared/work-log-notifications.ts";

type DbClient = SupabaseClient<Database>;
type WorkLogRow = Database["core"]["Tables"]["work_logs"]["Row"];
type CollaboratorRow = Database["core"]["Tables"]["work_log_collaborators"]["Row"];

const WORK_LOG_PHOTO_BUCKET = "work-log-photos";
const SIGNED_UPLOAD_URL_TTL_SECONDS = 60 * 5;

const WORK_LOG_SELECT =
  "id, user_id, status, project_id, time_entries, tasks_completed, skills_used, visibility, show_on_profile, show_date_range_on_profile, entry_type, log_date, work_description, gps_location, gps_accuracy_meters, gps_captured_at, device_type, location_permission_status, verified_by_user_id";

const sanitizeFileName = (fileName: string): string => {
  return fileName
    .trim()
    .replace(/[^a-zA-Z0-9_.-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const buildPoint = (latitude: number, longitude: number) =>
  `POINT(${longitude} ${latitude})`;

const entriesOverlap = (
  a: { start: string; end: string },
  b: { start: string; end: string },
) => {
  return !(a.end <= b.start || b.end <= a.start);
};

const intersectingEntries = (
  currentEntries: Array<{ start: string; end: string }>,
  existingEntries: Array<{ start: string; end: string }>,
) => {
  const conflicts: Array<{ incoming: { start: string; end: string }; existing: { start: string; end: string } }> = [];
  for (const incoming of currentEntries) {
    for (const existing of existingEntries) {
      if (entriesOverlap(incoming, existing)) {
        conflicts.push({ incoming, existing });
      }
    }
  }
  return conflicts;
};

const fetchWorkLog = async (
  supabase: DbClient,
  workLogId: string,
): Promise<WorkLogRow> => {
  const { data, error } = await supabase
    .schema("core")
    .from("work_logs")
    .select(WORK_LOG_SELECT)
    .eq("id", workLogId)
    .single();

  if (error || !data) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Work log not found",
    });
  }

  return data;
};

const getWorkLogAccess = async (
  supabase: DbClient,
  workLogId: string,
  userId: string,
): Promise<{ workLog: WorkLogRow; role: "owner" | "editor" | "viewer"; collaborator?: Pick<CollaboratorRow, "permission_level"> }> => {
  const workLog = await fetchWorkLog(supabase, workLogId);

  if (workLog.user_id === userId) {
    return { workLog, role: "owner" };
  }

  const { data: collaborator, error } = await supabase
    .schema("core")
    .from("work_log_collaborators")
    .select("permission_level")
    .eq("work_log_id", workLogId)
    .eq("collaborator_user_id", userId)
    .maybeSingle();

  if (error) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to verify collaborator access",
    });
  }

  if (collaborator) {
    const role = collaborator.permission_level === "edit" ? "editor" : "viewer";
    return { workLog, role, collaborator };
  }

  if (workLog.verified_by_user_id === userId) {
    return { workLog, role: "editor" };
  }

  throw new TRPCError({
    code: "FORBIDDEN",
    message: "You do not have access to this work log",
  });
};

const listCollaboratorSummaries = async (
  supabase: DbClient,
  workLogId: string,
): Promise<Array<Pick<CollaboratorRow, "collaborator_user_id" | "permission_level">>> => {
  const { data, error } = await supabase
    .schema("core")
    .from("work_log_collaborators")
    .select("collaborator_user_id, permission_level")
    .eq("work_log_id", workLogId);

  if (error) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to load collaborators",
    });
  }

  return (data ?? []) as Array<Pick<CollaboratorRow, "collaborator_user_id" | "permission_level">>;
};

const getConversationParticipants = async (
  supabase: DbClient,
  workLog: WorkLogRow,
): Promise<{
  participants: Set<string>;
  collaboratorPermissions: Map<string, "view" | "edit">;
}> => {
  const participants = new Set<string>();
  const collaboratorPermissions = new Map<string, "view" | "edit">();

  participants.add(workLog.user_id);
  collaboratorPermissions.set(workLog.user_id, "edit");

  if (workLog.verified_by_user_id) {
    participants.add(workLog.verified_by_user_id);
    collaboratorPermissions.set(workLog.verified_by_user_id, "edit");
  }

  const collaboratorSummaries = await listCollaboratorSummaries(supabase, workLog.id);
  for (const collaborator of collaboratorSummaries) {
    participants.add(collaborator.collaborator_user_id);
    collaboratorPermissions.set(
      collaborator.collaborator_user_id,
      collaborator.permission_level as "view" | "edit",
    );
  }

  return { participants, collaboratorPermissions };
};

const notifyConversationParticipants = async (
  supabase: DbClient,
  workLog: WorkLogRow,
  actorId: string,
  preview: string,
): Promise<void> => {
  const { participants, collaboratorPermissions } = await getConversationParticipants(
    supabase,
    workLog,
  );

  participants.delete(actorId);

  await Promise.all(
    [...participants].map((recipientId) =>
      notifyWorkLogCollaborator("comment", {
        supabase,
        recipientId,
        actorId,
        workLogId: workLog.id,
        entryType: workLog.entry_type ?? "daily",
        logDate: workLog.log_date,
        permissionLevel: collaboratorPermissions.get(recipientId),
        commentPreview: preview,
      }),
    ),
  );
};

const createSystemMessage = async (
  supabase: DbClient,
  workLog: WorkLogRow,
  actorId: string,
  message: string,
) => {
  const { data, error } = await supabase
    .schema("core")
    .from("work_log_conversations")
    .insert({
      work_log_id: workLog.id,
      user_id: actorId,
      message,
      is_system_message: true,
    })
    .select()
    .single();

  if (error || !data) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to record system message",
    });
  }

  await notifyConversationParticipants(supabase, workLog, actorId, shorten(message));

  return data;
};

const ensureCollaboratorExists = async (
  supabaseAdmin: SupabaseClient<Database>,
  userId: string,
): Promise<void> => {
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (error || !data?.user) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Collaborator user not found",
    });
  }
};

const shorten = (value: string, max = 140): string => {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
};

const getUserDisplayName = async (
  supabase: DbClient,
  userId: string,
): Promise<string> => {
  const { data } = await supabase
    .schema("core")
    .from("users")
    .select("display_name, username")
    .eq("id", userId)
    .maybeSingle();

  if (!data) {
    return "System";
  }

  return data.display_name?.trim() || data.username?.trim() || "Member";
};

const recordAuditLog = async (
  supabase: DbClient,
  {
    workLogId,
    userId,
    action,
    oldValue,
    newValue,
    reason,
  }: {
    workLogId: string;
    userId: string;
    action: "status_change" | "edit" | "comment" | "move_project" | "collaborator_added" | "photo_added" | "photo_removed";
    oldValue?: Record<string, unknown> | null;
    newValue?: Record<string, unknown> | null;
    reason?: string | null;
  },
) => {
  await supabase
    .schema("core")
    .from("work_log_audit_log")
    .insert({
      work_log_id: workLogId,
      user_id: userId,
      action,
      old_value: oldValue ?? null,
      new_value: newValue ?? null,
      reason: reason ?? null,
    });
};

const getProjectVerificationRequirement = async (
  supabase: DbClient,
  projectId: string,
) => {
  const { data: project } = await supabase
    .schema("public")
    .from("construction_projects")
    .select("organization_id, work_log_require_verification_override")
    .eq("id", projectId)
    .maybeSingle();

  if (!project) {
    return false;
  }

  if (typeof project.work_log_require_verification_override === "boolean") {
    return project.work_log_require_verification_override;
  }

  const { data: organization } = await supabase
    .schema("public")
    .from("organizations")
    .select("work_log_require_verification")
    .eq("id", project.organization_id)
    .maybeSingle();

  return Boolean(organization?.work_log_require_verification);
};

export const workLogsRouter = t.router({
  create: protectedProcedure
    .input(createWorkLogSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      if (!user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const { data: projectExists, error: projectError } = await supabase
        .schema("public")
        .from("construction_projects")
        .select("id")
        .eq("id", input.projectId)
        .single();

      if (projectError || !projectExists) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Construction project is required before creating a work log.",
        });
      }

      const gpsCapture = input.gpsCapture;
      const insertPayload: Record<string, unknown> = {
        user_id: user.id,
        project_id: input.projectId,
        entry_type: input.entryType,
        log_date: input.logDate,
        time_entries: input.timeEntries,
        work_description: input.workDescription,
        tasks_completed: input.tasksCompleted,
        skills_used: input.skillsUsed,
        visibility: input.visibility,
        show_on_profile: input.showOnProfile,
        show_date_range_on_profile: input.showDateRangeOnProfile,
      };

      if (gpsCapture) {
        insertPayload.gps_location = buildPoint(
          gpsCapture.latitude,
          gpsCapture.longitude,
        );
        insertPayload.gps_accuracy_meters = gpsCapture.accuracyMeters ?? null;
        insertPayload.gps_captured_at = gpsCapture.capturedAt ?? null;
        insertPayload.device_type = gpsCapture.deviceType ?? null;
        insertPayload.location_permission_status =
          gpsCapture.permissionStatus ?? null;
      }

      const { data, error } = await supabase
        .schema("core")
        .from("work_logs")
        .insert(insertPayload)
        .select()
        .single();

      if (error || !data) {
        console.error("[workLogs.create] Failed to create work log", {
          userId: user.id,
          message: error?.message,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create work log",
        });
      }

      return data;
    }),

  update: protectedProcedure
    .input(updateWorkLogSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      if (!user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const { workLog, role } = await getWorkLogAccess(
        supabase,
        input.workLogId,
        user.id,
      );

      if (role === "viewer") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to edit this work log.",
        });
      }

      if (workLog.status !== "draft" && !input.reason) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "A reason is required to modify submitted work logs.",
        });
      }

      if (input.payload.status && input.payload.status !== workLog.status) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Status updates must use the dedicated workflow endpoints.",
        });
      }

      const updates: Record<string, unknown> = {};
      const oldValue: Record<string, unknown> = {};
      const newValue: Record<string, unknown> = {};

      const assignField = <Key extends keyof typeof input.payload>(
        key: Key,
        columnName: string,
      ) => {
        const newVal = input.payload[key];
        if (typeof newVal !== "undefined") {
          updates[columnName] = newVal;
          oldValue[columnName] = (workLog as Record<string, unknown>)[columnName];
          newValue[columnName] = newVal;
        }
      };

      assignField("entryType", "entry_type");
      assignField("logDate", "log_date");
      assignField("timeEntries", "time_entries");
      assignField("workDescription", "work_description");
      assignField("tasksCompleted", "tasks_completed");
      assignField("skillsUsed", "skills_used");
      assignField("visibility", "visibility");
      assignField("showOnProfile", "show_on_profile");
      assignField("showDateRangeOnProfile", "show_date_range_on_profile");

      if (input.payload.gpsCapture) {
        const capture = input.payload.gpsCapture;
        updates.gps_location = buildPoint(capture.latitude, capture.longitude);
        updates.gps_accuracy_meters = capture.accuracyMeters ?? null;
        updates.gps_captured_at = capture.capturedAt ?? null;
        updates.device_type = capture.deviceType ?? null;
        updates.location_permission_status = capture.permissionStatus ?? null;

        oldValue.gps_location = workLog.gps_location ?? null;
        newValue.gps_location = updates.gps_location;
      }

      if (Object.keys(updates).length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No valid fields provided for update.",
        });
      }

      updates.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .schema("core")
        .from("work_logs")
        .update(updates)
        .eq("id", input.workLogId)
        .select()
        .single();

      if (error || !data) {
        console.error("[workLogs.update] Failed to update work log", {
          workLogId: input.workLogId,
          userId: user.id,
          message: error?.message,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update work log",
        });
      }

      if (workLog.status !== "draft" && Object.keys(newValue).length > 0) {
        await recordAuditLog(supabase, {
          workLogId: input.workLogId,
          userId: user.id,
          action: "edit",
          oldValue,
          newValue,
          reason: input.reason ?? null,
        });
      }

      return {
        workLog: data,
        permission: role,
      };
    }),

  submit: protectedProcedure
    .input(submitWorkLogSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      if (!user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const workLog = await fetchWorkLog(supabase, input.workLogId);

      if (workLog.user_id !== user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the work log owner can submit it for verification.",
        });
      }

      if (workLog.status !== "draft" && workLog.status !== "disputed") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only draft or disputed work logs can be submitted.",
        });
      }

      const { data: existingLogs } = await supabase
        .schema("core")
        .from("work_logs")
        .select("id, time_entries")
        .eq("user_id", user.id)
        .eq("log_date", workLog.log_date)
        .neq("id", workLog.id);

      if (Array.isArray(existingLogs) && existingLogs.length > 0) {
        const conflictingLogs = existingLogs
          .map((other) => ({
            workLogId: other.id,
            conflicts: intersectingEntries(
              workLog.time_entries as Array<{ start: string; end: string }>,
              other.time_entries as Array<{ start: string; end: string }>,
            ),
          }))
          .filter(({ conflicts }) => conflicts.length > 0);

        if (conflictingLogs.length > 0 && !input.forceSubmit) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Time overlap detected with other work logs.",
            cause: conflictingLogs,
          });
        }
      }

      const requireVerification = await getProjectVerificationRequirement(
        supabase,
        workLog.project_id,
      );

      const nextStatus = requireVerification ? "pending_verification" : "verified";
      const updates: Record<string, unknown> = {
        status: nextStatus,
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        dispute_reason: null,
        disputed_at: null,
      };

      if (nextStatus === "verified") {
        updates.verified_at = new Date().toISOString();
        updates.verified_by_user_id = user.id;
      }

      const { data, error } = await supabase
        .schema("core")
        .from("work_logs")
        .update(updates)
        .eq("id", workLog.id)
        .select()
        .single();

      if (error || !data) {
        console.error("[workLogs.submit] Failed to submit work log", {
          workLogId: workLog.id,
          message: error?.message,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to submit work log",
        });
      }

      await recordAuditLog(supabase, {
        workLogId: workLog.id,
        userId: user.id,
        action: "status_change",
        oldValue: { status: workLog.status },
        newValue: { status: nextStatus },
        reason: input.forceSubmit ? "User elected to submit despite overlap warning." : input.reason ?? null,
      });

      if (workLog.status === "disputed") {
        const actorName = await getUserDisplayName(supabase, user.id);
        await createSystemMessage(
          supabase,
          data,
          user.id,
          `Work log resubmitted for verification by ${actorName}`,
        );
      }

      return data;
    }),

  verify: officeProcedure
    .input(verifyWorkLogSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      if (!user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const workLog = await fetchWorkLog(supabase, input.workLogId);

      if (workLog.status !== "pending_verification") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only work logs pending verification can be verified.",
        });
      }

      const updates = {
        status: "verified",
        verified_by_user_id: user.id,
        verified_at: new Date().toISOString(),
        disputed_at: null,
        dispute_reason: null,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .schema("core")
        .from("work_logs")
        .update(updates)
        .eq("id", workLog.id)
        .select()
        .single();

      if (error || !data) {
        console.error("[workLogs.verify] Failed to verify work log", {
          workLogId: workLog.id,
          message: error?.message,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to verify work log",
        });
      }

      await recordAuditLog(supabase, {
        workLogId: workLog.id,
        userId: user.id,
        action: "status_change",
        oldValue: { status: workLog.status },
        newValue: { status: "verified" },
      });

      const actorName = await getUserDisplayName(supabase, user.id);
      await createSystemMessage(
        supabase,
        data,
        user.id,
        `Work log verified by ${actorName}`,
      );

      return data;
    }),

  dispute: officeProcedure
    .input(disputeWorkLogSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      if (!user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const workLog = await fetchWorkLog(supabase, input.workLogId);

      if (workLog.status !== "pending_verification" && workLog.status !== "verified") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only pending or verified work logs can be disputed.",
        });
      }

      const updates = {
        status: "disputed",
        disputed_at: new Date().toISOString(),
        dispute_reason: input.disputeReason,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .schema("core")
        .from("work_logs")
        .update(updates)
        .eq("id", workLog.id)
        .select()
        .single();

      if (error || !data) {
        console.error("[workLogs.dispute] Failed to dispute work log", {
          workLogId: workLog.id,
          message: error?.message,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to dispute work log",
        });
      }

      await supabase
        .schema("core")
        .from("work_log_conversations")
        .insert({
          work_log_id: workLog.id,
          user_id: user.id,
          message: input.message,
          is_system_message: false,
        });

      await recordAuditLog(supabase, {
        workLogId: workLog.id,
        userId: user.id,
        action: "status_change",
        oldValue: { status: workLog.status },
        newValue: { status: "disputed" },
        reason: input.disputeReason,
      });

      const actorName = await getUserDisplayName(supabase, user.id);
      const disputeMessage = input.disputeReason
        ? `Work log disputed by ${actorName}: ${input.disputeReason}`
        : `Work log disputed by ${actorName}`;
      await createSystemMessage(supabase, data, user.id, disputeMessage);

      return data;
    }),

  addCollaborator: protectedProcedure
    .input(addCollaboratorSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase, supabaseAdmin, user } = ctx;

      if (!user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const { workLog, role } = await getWorkLogAccess(
        supabase,
        input.workLogId,
        user.id,
      );

      if (role !== "owner") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the owner can manage collaborators.",
        });
      }

      if (input.collaboratorUserId === workLog.user_id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You are already the owner of this work log.",
        });
      }

      await ensureCollaboratorExists(supabaseAdmin, input.collaboratorUserId);

      const permissionLevel = input.permissionLevel ?? "view";

      const { data: existing, error: existingError } = await supabase
        .schema("core")
        .from("work_log_collaborators")
        .select("*")
        .eq("work_log_id", input.workLogId)
        .eq("collaborator_user_id", input.collaboratorUserId)
        .maybeSingle();

      if (existingError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to verify collaborator status",
        });
      }

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Collaborator already added to this work log.",
        });
      }

      const { data, error } = await supabase
        .schema("core")
        .from("work_log_collaborators")
        .insert({
          work_log_id: input.workLogId,
          collaborator_user_id: input.collaboratorUserId,
          permission_level: permissionLevel,
        })
        .select()
        .single();

      if (error || !data) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to add collaborator",
        });
      }

      await recordAuditLog(supabase, {
        workLogId: input.workLogId,
        userId: user.id,
        action: "collaborator_added",
        newValue: {
          collaborator_user_id: input.collaboratorUserId,
          permission_level: permissionLevel,
        },
      });

      await notifyWorkLogCollaborator("added", {
        supabase,
        recipientId: input.collaboratorUserId,
        actorId: user.id,
        workLogId: workLog.id,
        entryType: workLog.entry_type ?? "daily",
        logDate: workLog.log_date,
        permissionLevel,
      });

      return data;
    }),

  updateCollaborator: protectedProcedure
    .input(updateCollaboratorSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      if (!user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const { workLog, role } = await getWorkLogAccess(
        supabase,
        input.workLogId,
        user.id,
      );

      if (role !== "owner") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the owner can manage collaborators.",
        });
      }

      const { data: existing, error: existingError } = await supabase
        .schema("core")
        .from("work_log_collaborators")
        .select("*")
        .eq("work_log_id", input.workLogId)
        .eq("collaborator_user_id", input.collaboratorUserId)
        .maybeSingle();

      if (existingError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to load collaborator",
        });
      }

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Collaborator not found on this work log.",
        });
      }

      if (existing.permission_level === input.permissionLevel) {
        return existing;
      }

      const { data, error } = await supabase
        .schema("core")
        .from("work_log_collaborators")
        .update({
          permission_level: input.permissionLevel,
          updated_at: new Date().toISOString(),
        })
        .eq("work_log_id", input.workLogId)
        .eq("collaborator_user_id", input.collaboratorUserId)
        .select()
        .single();

      if (error || !data) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update collaborator",
        });
      }

      await recordAuditLog(supabase, {
        workLogId: input.workLogId,
        userId: user.id,
        action: "edit",
        newValue: {
          collaborator_user_id: input.collaboratorUserId,
          permission_level: input.permissionLevel,
        },
      });

      await notifyWorkLogCollaborator("permission_changed", {
        supabase,
        recipientId: input.collaboratorUserId,
        actorId: user.id,
        workLogId: workLog.id,
        entryType: workLog.entry_type ?? "daily",
        logDate: workLog.log_date,
        permissionLevel: input.permissionLevel,
      });

      return data;
    }),

  removeCollaborator: protectedProcedure
    .input(
      z.object({
        workLogId: z.string().uuid(),
        collaboratorUserId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      if (!user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const { workLog, role } = await getWorkLogAccess(
        supabase,
        input.workLogId,
        user.id,
      );

      if (role !== "owner") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the owner can manage collaborators.",
        });
      }

      const { data: existing, error: existingError } = await supabase
        .schema("core")
        .from("work_log_collaborators")
        .select("*")
        .eq("work_log_id", input.workLogId)
        .eq("collaborator_user_id", input.collaboratorUserId)
        .maybeSingle();

      if (existingError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to load collaborator",
        });
      }

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Collaborator not found on this work log.",
        });
      }

      const { error } = await supabase
        .schema("core")
        .from("work_log_collaborators")
        .delete()
        .eq("work_log_id", input.workLogId)
        .eq("collaborator_user_id", input.collaboratorUserId);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to remove collaborator",
        });
      }

      await recordAuditLog(supabase, {
        workLogId: input.workLogId,
        userId: user.id,
        action: "edit",
        oldValue: {
          collaborator_user_id: input.collaboratorUserId,
          permission_level: existing.permission_level,
        },
      });

      await notifyWorkLogCollaborator("removed", {
        supabase,
        recipientId: input.collaboratorUserId,
        actorId: user.id,
        workLogId: workLog.id,
        entryType: workLog.entry_type ?? "daily",
        logDate: workLog.log_date,
        permissionLevel: existing.permission_level as "view" | "edit",
      });

      return { success: true };
    }),

  addComment: protectedProcedure
    .input(addWorkLogCommentSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      if (!user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const { workLog } = await getWorkLogAccess(
        supabase,
        input.workLogId,
        user.id,
      );

      if (workLog.status === "draft") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Conversations are not available while a work log is in draft.",
        });
      }

      const { data, error } = await supabase
        .schema("core")
        .from("work_log_conversations")
        .insert({
          work_log_id: input.workLogId,
          user_id: user.id,
          message: input.message,
          is_system_message: input.isSystemMessage ?? false,
        })
        .select()
        .single();

      if (error || !data) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to add comment",
        });
      }

      await recordAuditLog(supabase, {
        workLogId: input.workLogId,
        userId: user.id,
        action: "comment",
        newValue: {
          message: input.message,
        },
      });

      if (!input.isSystemMessage) {
        await notifyConversationParticipants(
          supabase,
          workLog,
          user.id,
          shorten(input.message, 140),
        );
      }

      return data;
    }),

  uploadPhoto: protectedProcedure
    .input(uploadWorkLogPhotoSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      if (!user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const { workLog, role } = await getWorkLogAccess(
        supabase,
        input.workLogId,
        user.id,
      );

      if (role === "viewer") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to upload photos for this work log.",
        });
      }

      const { data: usage } = await supabase
        .schema("core")
        .from("user_storage_usage")
        .select(
          "work_log_photos_bytes, storage_limit_bytes, portfolio_photos_bytes, certification_files_bytes",
        )
        .eq("user_id", user.id)
        .maybeSingle();

      const currentUsage = usage?.work_log_photos_bytes ?? 0;
      const storageLimit = usage?.storage_limit_bytes ?? 104_857_600;

      if (currentUsage + input.fileSizeBytes > storageLimit) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Storage limit reached. Remove existing photos or contact support.",
        });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const sanitizedFileName = sanitizeFileName(input.fileName);
      const filePath = `${user.id}/${input.workLogId}/${timestamp}-${sanitizedFileName}`;

      const { data: signedUpload, error: signedUrlError } = await supabase.storage
        .from(WORK_LOG_PHOTO_BUCKET)
        .createSignedUploadUrl(filePath, SIGNED_UPLOAD_URL_TTL_SECONDS, {
          contentType: input.contentType,
        });

      if (signedUrlError || !signedUpload) {
        console.error("[workLogs.uploadPhoto] Failed to create signed upload URL", {
          workLogId: input.workLogId,
          message: signedUrlError?.message,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Unable to create upload URL",
        });
      }

      const insertPayload: Record<string, unknown> = {
        work_log_id: input.workLogId,
        file_path: filePath,
        file_size_bytes: input.fileSizeBytes,
        caption: input.caption ?? null,
        photo_type: input.photoType ?? null,
        display_order: input.displayOrder ?? 0,
        show_on_profile: input.showOnProfile ?? false,
        taken_at: input.takenAt ?? null,
      };

      if (input.gpsCapture) {
        insertPayload.gps_location = buildPoint(
          input.gpsCapture.latitude,
          input.gpsCapture.longitude,
        );
      }

      const { data: photoRecord, error: insertError } = await supabase
        .schema("core")
        .from("work_log_photos")
        .insert(insertPayload)
        .select()
        .single();

      if (insertError || !photoRecord) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to record photo metadata",
        });
      }

      if (usage) {
        const { error: usageUpdateError } = await supabase
          .schema("core")
          .from("user_storage_usage")
          .update({
            work_log_photos_bytes: currentUsage + input.fileSizeBytes,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);

        if (usageUpdateError) {
          console.error("[workLogs.uploadPhoto] Failed to update storage usage", {
            userId: user.id,
            message: usageUpdateError.message,
          });
        }
      } else {
        await supabase
          .schema("core")
          .from("user_storage_usage")
          .insert({
            user_id: user.id,
            work_log_photos_bytes: input.fileSizeBytes,
            portfolio_photos_bytes: 0,
            certification_files_bytes: 0,
          });
      }

      await recordAuditLog(supabase, {
        workLogId: input.workLogId,
        userId: user.id,
        action: "photo_added",
        newValue: {
          photo_id: photoRecord.id,
          file_path: photoRecord.file_path,
        },
      });

      return {
        uploadUrl: signedUpload.signedUrl,
        token: signedUpload.token,
        photo: photoRecord,
        expiresIn: SIGNED_UPLOAD_URL_TTL_SECONDS,
      };
    }),

  updatePhotoVisibility: protectedProcedure
    .input(updatePhotoVisibilitySchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      if (!user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const { workLog, role } = await getWorkLogAccess(
        supabase,
        input.workLogId,
        user.id,
      );

      if (role !== "owner") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the owner can change photo visibility.",
        });
      }

      const { data: photo, error: photoError } = await supabase
        .schema("core")
        .from("work_log_photos")
        .select("id, work_log_id, show_on_profile")
        .eq("id", input.photoId)
        .single();

      if (photoError || !photo || photo.work_log_id !== workLog.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Work log photo not found",
        });
      }

      const { data, error } = await supabase
        .schema("core")
        .from("work_log_photos")
        .update({
          show_on_profile: input.showOnProfile,
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.photoId)
        .select()
        .single();

      if (error || !data) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update photo visibility",
        });
      }

      await recordAuditLog(supabase, {
        workLogId: photo.work_log_id,
        userId: user.id,
        action: "photo_added",
        oldValue: { photo_id: photo.id, show_on_profile: photo.show_on_profile },
        newValue: { photo_id: photo.id, show_on_profile: input.showOnProfile },
      });

      return data;
    }),

  updateProfileVisibility: protectedProcedure
    .input(updateProfileVisibilitySchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      if (!user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const { workLog, role } = await getWorkLogAccess(
        supabase,
        input.workLogId,
        user.id,
      );

      if (role !== "owner") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the owner can update profile visibility.",
        });
      }

      const updates: Record<string, unknown> = {};
      if (typeof input.visibility !== "undefined") {
        updates.visibility = input.visibility;
      }
      if (typeof input.showOnProfile !== "undefined") {
        updates.show_on_profile = input.showOnProfile;
      }
      if (typeof input.showDateRangeOnProfile !== "undefined") {
        updates.show_date_range_on_profile = input.showDateRangeOnProfile;
      }
      updates.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .schema("core")
        .from("work_logs")
        .update(updates)
        .eq("id", input.workLogId)
        .select()
        .single();

      if (error || !data) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update profile visibility",
        });
      }

      await recordAuditLog(supabase, {
        workLogId: input.workLogId,
        userId: user.id,
        action: "edit",
        oldValue: {
          visibility: workLog.visibility,
          show_on_profile: workLog.show_on_profile,
          show_date_range_on_profile: workLog.show_date_range_on_profile,
        },
        newValue: {
          visibility: updates.visibility ?? workLog.visibility,
          show_on_profile: updates.show_on_profile ?? workLog.show_on_profile,
          show_date_range_on_profile:
            updates.show_date_range_on_profile ?? workLog.show_date_range_on_profile,
        },
      });

      return data;
    }),

  moveToProject: protectedProcedure
    .input(moveWorkLogSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      if (!user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const { workLog, role } = await getWorkLogAccess(
        supabase,
        input.workLogId,
        user.id,
      );

      if (role !== "owner") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the owner can move a work log between projects.",
        });
      }

      if (workLog.project_id === input.targetProjectId) {
        return workLog;
      }

      const { data: targetProject, error: projectError } = await supabase
        .schema("public")
        .from("construction_projects")
        .select("id")
        .eq("id", input.targetProjectId)
        .single();

      if (projectError || !targetProject) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Target project not found.",
        });
      }

      const updates: Record<string, unknown> = {
        project_id: input.targetProjectId,
        updated_at: new Date().toISOString(),
      };

      if (input.requireApproval) {
        updates.status = "pending_verification";
      }

      const { data, error } = await supabase
        .schema("core")
        .from("work_logs")
        .update(updates)
        .eq("id", input.workLogId)
        .select()
        .single();

      if (error || !data) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to move work log",
        });
      }

      await recordAuditLog(supabase, {
        workLogId: input.workLogId,
        userId: user.id,
        action: "move_project",
        oldValue: { project_id: workLog.project_id },
        newValue: { project_id: input.targetProjectId },
      });

      return data;
    }),

  checkTimeOverlap: protectedProcedure
    .input(checkTimeOverlapSchema)
    .query(async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      if (!user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      if (input.workLogId) {
        const { role } = await getWorkLogAccess(
          supabase,
          input.workLogId,
          user.id,
        );

        if (role !== "owner") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only the owner can check for time overlaps.",
          });
        }
      }

      const { data: workLogs } = await supabase
        .schema("core")
        .from("work_logs")
        .select("id, time_entries")
        .eq("user_id", user.id)
        .eq("log_date", input.logDate);

      const relevantLogs = (workLogs ?? []).filter((log) => log.id !== input.workLogId);

      const conflicts = relevantLogs
        .map((log) => ({
          workLogId: log.id,
          conflicts: intersectingEntries(
            input.timeEntries,
            log.time_entries as Array<{ start: string; end: string }>,
          ),
        }))
        .filter(({ conflicts }) => conflicts.length > 0);

      return {
        hasConflicts: conflicts.length > 0,
        conflicts,
      };
    }),

  getCollaborators: protectedProcedure
    .input(z.object({ workLogId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      if (!user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      await getWorkLogAccess(supabase, input.workLogId, user.id);

      const { data, error } = await supabase
        .schema("core")
        .from("work_log_collaborators")
        .select(`
          id,
          work_log_id,
          collaborator_user_id,
          permission_level,
          invited_at,
          created_at,
          user:users(id, display_name, username, avatar_url)
        `)
        .eq("work_log_id", input.workLogId)
        .order("created_at", { ascending: true });

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to load collaborators",
        });
      }

      return data ?? [];
    }),

  getConversation: protectedProcedure
    .input(z.object({ workLogId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      if (!user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      await getWorkLogAccess(supabase, input.workLogId, user.id);

      const { data, error } = await supabase
        .schema("core")
        .from("work_log_conversations")
        .select(`
          id,
          work_log_id,
          user_id,
          message,
          is_system_message,
          created_at,
          updated_at,
          user:users(id, display_name, username, avatar_url)
        `)
        .eq("work_log_id", input.workLogId)
        .order("created_at", { ascending: true });

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to load conversation",
        });
      }

      return data ?? [];
    }),

  getById: publicProcedure
    .input(z.object({ workLogId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      const { data, error } = await supabase
        .schema("core")
        .from("work_logs")
        .select(
          `
          *,
          photos:work_log_photos(*),
          collaborators:work_log_collaborators(*),
          conversations:work_log_conversations(*)
        `,
        )
        .eq("id", input.workLogId)
        .maybeSingle();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to load work log",
        });
      }

      if (!data) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Work log not found",
        });
      }

      if (!user || data.user_id === user.id) {
        return data;
      }

      const { data: collaborator } = await ctx.supabase
        .schema("core")
        .from("work_log_collaborators")
        .select("permission_level")
        .eq("work_log_id", input.workLogId)
        .eq("collaborator_user_id", user.id)
        .maybeSingle();

      if (!collaborator) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to access this work log.",
        });
      }

      return data;
    }),
});


