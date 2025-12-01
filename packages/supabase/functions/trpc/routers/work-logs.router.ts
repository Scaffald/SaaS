import type { SupabaseClient } from "@supabase/supabase-js";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
// Deno requires file extension in Deno runtime
import type { Database } from '../../_shared/database.types';
// Deno requires file extension in Deno runtime
import { insertNotification } from '../../_shared/notifications/utils';
// Deno requires file extension in Deno runtime
import type {
  WorkLogExportSnapshot,
  WorkLogExportTimeEntry,
} from '../../_shared/work-log-export';
// Deno requires file extension in Deno runtime
import {
  buildWorkLogCsv,
  buildWorkLogPdf,
} from '../../_shared/work-log-export';
// Deno requires file extension in Deno runtime
import { notifyWorkLogCollaborator } from '../../_shared/work-log-notifications';
// Deno requires file extension in Deno runtime
import {
  addCollaboratorSchema,
  addSkillToProfileSchema,
  addWorkLogCommentSchema,
  approveWorkLogMoveSchema,
  cancelWorkLogMoveSchema,
  checkTimeOverlapSchema,
  createWorkLogSchema,
  deleteWorkLogPhotoSchema,
  denyWorkLogMoveSchema,
  disputeWorkLogSchema,
  exportWorkLogSchema,
  getSuggestedSkillsSchema,
  moveWorkLogSchema,
  submitWorkLogSchema,
  updateCollaboratorSchema,
  updatePhotoVisibilitySchema,
  updateProfileVisibilitySchema,
  updateWorkLogPhotoSchema,
  updateWorkLogSchema,
  uploadWorkLogPhotoSchema,
  verifyWorkLogSchema,
  workLogStatusSchema,
} from '../../_shared/work-log-schemas';
import {
  officeProcedure,
  protectedProcedure,
  publicProcedure,
  t,
} from '../middleware';
// Deno requires file extension in Deno runtime
import { enrichUserSkills } from './utils/skill-enrichment';

type DbClient = SupabaseClient<Database>;
type WorkLogRow = Database["core"]["Tables"]["work_logs"]["Row"];
type CollaboratorRow =
  Database["core"]["Tables"]["work_log_collaborators"]["Row"];

const WORK_LOG_PHOTO_BUCKET = "work-log-photos";
const SIGNED_UPLOAD_URL_TTL_SECONDS = 60 * 5;
const WORK_LOG_EXPORT_BUCKET = "work-log-exports";
const SIGNED_EXPORT_URL_TTL_SECONDS = 60 * 10;
const PUBLIC_WORK_LOG_PHOTO_TTL_SECONDS = 60 * 5;

const WORK_LOG_SELECT =
  "id, user_id, status, project_id, time_entries, tasks_completed, skills_used, visibility, show_on_profile, show_date_range_on_profile, entry_type, log_date, work_description, total_hours, submitted_at, verified_at, disputed_at, dispute_reason, gps_location, gps_accuracy_meters, gps_captured_at, device_type, location_permission_status, created_at, updated_at, verified_by_user_id, pending_move_to_project_id, pending_move_reason, pending_move_requested_at, pending_move_requested_by";

const sanitizeFileName = (fileName: string): string => {
  return fileName
    .trim()
    .replace(/[^a-zA-Z0-9_.-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const buildPoint = (latitude: number, longitude: number) =>
  `POINT(${longitude} ${latitude})`;

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const normalizeAccuracyMeters = (input: unknown): number | null => {
  if (!isFiniteNumber(input)) {
    return null;
  }

  return input > 0 ? input : null;
};

const projectOptionsInputSchema = z
  .object({
    organizationId: z.string().uuid().optional(),
    search: z
      .string()
      .min(1)
      .max(120)
      .transform((value) => value.trim())
      .optional(),
    includeArchived: z.boolean().optional(),
  })
  .optional();

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const LIST_SORT_FIELDS = [
  "log_date",
  "created_at",
  "updated_at",
  "total_hours",
] as const;

const listSortFieldSchema = z.enum(LIST_SORT_FIELDS);
const sortDirectionSchema = z.enum(["asc", "desc"]);

const listWorkLogsInputSchema = z.object({
  page: z.number().int().min(0).default(0),
  pageSize: z.number().int().min(1).max(100).default(20),
  statuses: z.array(workLogStatusSchema).min(1).optional(),
  projectId: z.string().uuid().optional(),
  dateFrom: z
    .string()
    .regex(DATE_ONLY_REGEX, "Invalid date format. Expected YYYY-MM-DD.")
    .optional(),
  dateTo: z.string().regex(
    DATE_ONLY_REGEX,
    "Invalid date format. Expected YYYY-MM-DD.",
  ).optional(),
  search: z.string().min(2).max(120).optional(),
  sortField: listSortFieldSchema.default("log_date"),
  sortDirection: sortDirectionSchema.default("desc"),
});

const ownerOverviewInputSchema = z
  .object({
    dateFrom: z
      .string()
      .regex(DATE_ONLY_REGEX, "Invalid date format. Expected YYYY-MM-DD.")
      .optional(),
    dateTo: z
      .string()
      .regex(DATE_ONLY_REGEX, "Invalid date format. Expected YYYY-MM-DD.")
      .optional(),
  })
  .default({});

const projectAnalyticsInputSchema = z.object({
  projectId: z.string().uuid(),
  dateFrom: z
    .string()
    .regex(DATE_ONLY_REGEX, "Invalid date format. Expected YYYY-MM-DD.")
    .optional(),
  dateTo: z.string().regex(
    DATE_ONLY_REGEX,
    "Invalid date format. Expected YYYY-MM-DD.",
  ).optional(),
});

const projectRollupInputSchema = projectAnalyticsInputSchema;

const publicWorkLogsInputSchema = z.object({
  userId: z.string().uuid(),
  limit: z.number().int().min(1).max(50).default(12),
});

const WORK_LOG_LIST_SELECT = `
  id,
  user_id,
  project_id,
  status,
  log_date,
  total_hours,
  entry_type,
  visibility,
  show_on_profile,
  show_date_range_on_profile,
  submitted_at,
  verified_at,
  disputed_at,
  dispute_reason,
  created_at,
  updated_at,
  work_description
`;

const WORK_LOG_STATUSES = [
  "draft",
  "pending_verification",
  "verified",
  "disputed",
] as const;

type WorkLogStatusKey = (typeof WORK_LOG_STATUSES)[number];

const WORK_LOG_STATUS_SET = new Set<WorkLogStatusKey>(WORK_LOG_STATUSES);

const createEmptyStatusSummary = () =>
  WORK_LOG_STATUSES.reduce(
    (acc, status) => {
      acc[status] = { count: 0, hours: 0 };
      return acc;
    },
    {} as Record<WorkLogStatusKey, { count: number; hours: number }>,
  );

const accumulateStatusSummary = (
  summary: Record<WorkLogStatusKey, { count: number; hours: number }>,
  status: string | null | undefined,
  hours: number,
) => {
  if (!status || !WORK_LOG_STATUS_SET.has(status as WorkLogStatusKey)) {
    return;
  }

  const key = status as WorkLogStatusKey;
  summary[key].count += 1;
  summary[key].hours += hours;
};

const coerceNumber = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const resolveActivityTimestamp = (
  log: Pick<WorkLogRow, "updated_at" | "created_at" | "log_date">,
): string | null => {
  if (log.updated_at) return log.updated_at;
  if (log.created_at) return log.created_at;
  if (log.log_date) return `${log.log_date}T00:00:00.000Z`;
  return null;
};

interface RelationshipCounts {
  photoCount: Map<string, number>;
  collaboratorCount: Map<string, number>;
  commentCount: Map<string, number>;
  uniqueCollaboratorIds: Set<string>;
  collaboratorsByWorkLog: Map<string, string[]>;
}

const fetchWorkLogRelationshipCounts = async (
  supabase: DbClient,
  workLogIds: string[],
): Promise<RelationshipCounts> => {
  if (!workLogIds.length) {
    return {
      photoCount: new Map(),
      collaboratorCount: new Map(),
      commentCount: new Map(),
      uniqueCollaboratorIds: new Set(),
      collaboratorsByWorkLog: new Map(),
    };
  }

  const [photoResult, collaboratorResult, conversationResult] = await Promise
    .all([
      supabase
        .schema("core")
        .from("work_log_photos")
        .select("work_log_id")
        .in("work_log_id", workLogIds),
      supabase
        .schema("core")
        .from("work_log_collaborators")
        .select("work_log_id, collaborator_user_id")
        .in("work_log_id", workLogIds),
      supabase
        .schema("core")
        .from("work_log_conversations")
        .select("work_log_id")
        .in("work_log_id", workLogIds),
    ]);

  if (photoResult.error) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to load photo counts for work logs.",
    });
  }

  if (collaboratorResult.error) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to load collaborator counts for work logs.",
    });
  }

  if (conversationResult.error) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to load conversation counts for work logs.",
    });
  }

  const photoCount = new Map<string, number>();
  for (const row of photoResult.data ?? []) {
    const workLogId = typeof row?.work_log_id === "string"
      ? row.work_log_id
      : null;
    if (!workLogId) continue;
    photoCount.set(workLogId, (photoCount.get(workLogId) ?? 0) + 1);
  }

  const collaboratorCount = new Map<string, number>();
  const collaboratorsByWorkLog = new Map<string, string[]>();
  const uniqueCollaboratorIds = new Set<string>();
  for (const row of collaboratorResult.data ?? []) {
    const workLogId = typeof row?.work_log_id === "string"
      ? row.work_log_id
      : null;
    if (!workLogId) continue;
    collaboratorCount.set(
      workLogId,
      (collaboratorCount.get(workLogId) ?? 0) + 1,
    );

    if (typeof row?.collaborator_user_id === "string") {
      uniqueCollaboratorIds.add(row.collaborator_user_id);
      const existing = collaboratorsByWorkLog.get(workLogId) ?? [];
      collaboratorsByWorkLog.set(
        workLogId,
        existing.includes(row.collaborator_user_id)
          ? existing
          : [...existing, row.collaborator_user_id],
      );
    }
  }

  const commentCount = new Map<string, number>();
  for (const row of conversationResult.data ?? []) {
    const workLogId = typeof row?.work_log_id === "string"
      ? row.work_log_id
      : null;
    if (!workLogId) continue;
    commentCount.set(workLogId, (commentCount.get(workLogId) ?? 0) + 1);
  }

  return {
    photoCount,
    collaboratorCount,
    commentCount,
    uniqueCollaboratorIds,
    collaboratorsByWorkLog,
  };
};

export interface ProjectMetadata {
  id: string;
  name: string;
  status: string | null;
  isArchived: boolean;
  organizationId: string | null;
  projectNumber: string | null;
}

const fetchProjectMetadata = async (
  supabase: DbClient,
  projectIds: string[],
): Promise<Map<string, ProjectMetadata>> => {
  if (!projectIds.length) {
    return new Map();
  }

  const { data, error } = await supabase
    .schema("core")
    .from("construction_projects")
    .select("*")
    .in("id", projectIds);

  if (error) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to load project metadata.",
    });
  }

  const map = new Map<string, ProjectMetadata>();
  for (const project of data ?? []) {
    if (!project?.id) continue;
    const record = project as Record<string, unknown>;
    const id = typeof record.id === "string"
      ? record.id
      : String(record.id ?? "");
    map.set(id, toProjectMetadata(record));
  }

  return map;
};

const toProjectMetadata = (
  project: Record<string, unknown>,
): ProjectMetadata => {
  const id = typeof project.id === "string"
    ? project.id
    : String(project.id ?? "");

  const status = resolveStringField(project, ["status", "project_status"]);
  const organizationId = resolveStringField(project, ["organization_id"]);
  const projectNumber = resolveStringField(project, [
    "project_number",
    "project_code",
    "job_number",
  ]);

  return {
    id,
    name: resolveProjectDisplayName(project),
    status,
    isArchived: isArchivedProject(project),
    organizationId,
    projectNumber,
  };
};

const validateGpsCapture = (capture: {
  latitude: number;
  longitude: number;
  accuracyMeters?: number | null;
}) => {
  const { latitude, longitude, accuracyMeters } = capture;

  if (!isFiniteNumber(latitude) || !isFiniteNumber(longitude)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "GPS coordinates must be finite numbers.",
    });
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        "GPS coordinates fall outside the valid latitude/longitude ranges.",
    });
  }

  if (isFiniteNumber(accuracyMeters) && accuracyMeters <= 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "GPS accuracy must be greater than zero when provided.",
    });
  }
};

type ProjectRecord = {
  id: string;
  organization_id: string;
  work_log_require_approval_to_move_override?: boolean | null;
};

type OrganizationMoveSettings = {
  id: string;
  owner_user_id: string | null;
  work_log_require_approval_to_move: boolean | null;
};

const fetchProjectRecord = async (
  supabase: DbClient,
  projectId: string,
  errorMessage: string,
): Promise<ProjectRecord> => {
  const { data, error } = await supabase
    .schema("core")
    .from("construction_projects")
    .select("id, organization_id, work_log_require_approval_to_move_override")
    .eq("id", projectId)
    .maybeSingle();

  if (error || !data) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: errorMessage,
    });
  }

  return data;
};

const fetchOrganizationMoveSettings = async (
  supabase: DbClient,
  organizationId: string,
): Promise<OrganizationMoveSettings> => {
  const { data, error } = await supabase
    .schema("core")
    .from("organizations")
    .select("id, owner_user_id, work_log_require_approval_to_move")
    .eq("id", organizationId)
    .maybeSingle();

  if (error || !data) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Organization configuration could not be found.",
    });
  }

  return data;
};

const resolveMoveApprovalRequirement = (
  project: ProjectRecord,
  organization: OrganizationMoveSettings,
  explicitRequest?: boolean,
) => {
  if (typeof explicitRequest === "boolean") {
    return explicitRequest;
  }

  if (typeof project.work_log_require_approval_to_move_override === "boolean") {
    return project.work_log_require_approval_to_move_override;
  }

  return Boolean(organization.work_log_require_approval_to_move);
};

const getOrganizationManagerIds = async (
  supabase: DbClient,
  organizationId: string,
) => {
  const { data, error } = await supabase
    .schema("core")
    .from("role_assignments")
    .select("user_id, roles:roles(name, scope)")
    .eq("scope_org_id", organizationId);

  if (error || !data) {
    console.error("[workLogs] unable to load organization managers", {
      organizationId,
      error: error?.message,
    });
    return [] as string[];
  }

  const managerRoles = new Set(["manager", "admin"]);

  return data
    .filter(
      (
        assignment: {
          roles?: { scope?: string; name?: string } | null;
          user_id: string | null;
        },
      ) =>
        assignment.roles?.scope === "organization" &&
        assignment.roles?.name &&
        managerRoles.has(assignment.roles.name),
    )
    .map((assignment: { user_id: string | null }) => assignment.user_id)
    .filter((value: string | null): value is string => Boolean(value));
};

const assertUserIsOrganizationManager = async (
  supabase: DbClient,
  userId: string,
  organization: OrganizationMoveSettings,
) => {
  if (organization.owner_user_id === userId) {
    return;
  }

  const managerIds = await getOrganizationManagerIds(supabase, organization.id);

  if (!managerIds.includes(userId)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only project managers can approve move requests.",
    });
  }
};

const notifyMoveEvent = async (
  supabase: DbClient,
  recipients: string[],
  {
    actorId,
    workLogId,
    title,
    message,
    metadata = {},
  }: {
    actorId: string;
    workLogId: string;
    title: string;
    message: string;
    metadata?: Record<string, unknown>;
  },
) => {
  if (!recipients.length) {
    return;
  }

  const routedChannels = ["in_app"] as const;

  await Promise.all(
    recipients.map((recipientId) =>
      insertNotification(supabase, {
        user_id: recipientId,
        type: "info",
        severity: "info",
        title,
        message,
        metadata: {
          ...metadata,
          workLogId,
          actorId,
        },
        routed_channels: [...routedChannels],
      })
    ),
  );
};

const toMinutesFromTimeString = (value: string): number => {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) {
    return Number.NaN;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return Number.NaN;
  }

  return hours * 60 + minutes;
};

const parseTimeEntries = (raw: unknown): WorkLogExportTimeEntry[] => {
  if (!Array.isArray(raw)) {
    return [];
  }

  const entries: WorkLogExportTimeEntry[] = [];

  for (const candidate of raw) {
    if (typeof candidate !== "object" || candidate === null) {
      continue;
    }

    const entry = candidate as Record<string, unknown>;
    const start = typeof entry.start === "string" ? entry.start : null;
    const end = typeof entry.end === "string" ? entry.end : null;

    if (!start || !end) {
      continue;
    }

    const startMinutes = toMinutesFromTimeString(start);
    const endMinutes = toMinutesFromTimeString(end);

    if (Number.isNaN(startMinutes) || Number.isNaN(endMinutes)) {
      continue;
    }

    const rawBreak = typeof entry.breakMinutes === "number"
      ? entry.breakMinutes
      : typeof entry.breakMinutes === "string"
      ? Number(entry.breakMinutes)
      : 0;

    const breakMinutes = Number.isFinite(rawBreak) && rawBreak > 0
      ? Math.floor(rawBreak)
      : 0;

    const rawDuration = Math.max(endMinutes - startMinutes, 0);
    const effectiveDuration = Math.max(rawDuration - breakMinutes, 0);

    entries.push({
      start,
      end,
      durationHours: effectiveDuration / 60,
      breakMinutes,
      description: typeof entry.description === "string" &&
          entry.description.trim().length > 0
        ? entry.description
        : null,
    });
  }

  return entries;
};

const resolveStringField = (
  source: Record<string, unknown> | null | undefined,
  keys: string[],
): string | null => {
  if (!source) {
    return null;
  }

  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }

  return null;
};

function resolveProjectDisplayName(
  project: Record<string, unknown> | null | undefined,
): string {
  const name = resolveStringField(project, [
    "name",
    "project_name",
    "title",
    "display_name",
  ]) ?? "";

  const trimmed = name.trim();

  if (trimmed.length > 0) {
    return trimmed;
  }

  const fallbackId =
    typeof project?.id === "string" && project.id.trim().length > 0
      ? project.id.slice(0, 8)
      : "unknown";

  return `Project ${fallbackId}`;
}

function isArchivedProject(project: Record<string, unknown>): boolean {
  if (typeof project.is_archived === "boolean") {
    return project.is_archived;
  }

  if (typeof project.archived === "boolean") {
    return project.archived;
  }

  if (project.archived_at) {
    return true;
  }

  return false;
}

const buildWorkLogExportSnapshot = async (
  supabase: DbClient,
  workLog: WorkLogRow,
): Promise<WorkLogExportSnapshot> => {
  const ownerName = await getUserDisplayName(supabase, workLog.user_id);

  const { data: ownerRecord } = await supabase
    .schema("core")
    .from("users")
    .select("email")
    .eq("id", workLog.user_id)
    .maybeSingle();

  let projectRecord: Record<string, unknown> | null = null;

  if (workLog.project_id) {
    const { data: projectData } = await supabase
      .schema("core")
      .from("construction_projects")
      .select("*")
      .eq("id", workLog.project_id)
      .maybeSingle();

    projectRecord = (projectData as Record<string, unknown> | null) ?? null;
  }

  let organizationRecord: Record<string, unknown> | null = null;

  const organizationId = resolveStringField(projectRecord, ["organization_id"]);

  if (organizationId) {
    const { data: organizationData } = await supabase
      .schema("core")
      .from("organizations")
      .select("*")
      .eq("id", organizationId)
      .maybeSingle();

    organizationRecord = (organizationData as Record<string, unknown> | null) ??
      null;
  }

  const { data: collaboratorRows } = await supabase
    .schema("core")
    .from("work_log_collaborators")
    .select("collaborator_user_id, permission_level")
    .eq("work_log_id", workLog.id)
    .order("invited_at", { ascending: true });

  const collaborators: WorkLogExportSnapshot["collaborators"] = [];

  for (const row of collaboratorRows ?? []) {
    if (!row.collaborator_user_id) {
      continue;
    }

    const displayName = await getUserDisplayName(
      supabase,
      row.collaborator_user_id,
    );

    collaborators.push({
      userId: row.collaborator_user_id,
      displayName,
      permissionLevel: (row.permission_level as "view" | "edit") ?? "view",
    });
  }

  const { data: photoRows } = await supabase
    .schema("core")
    .from("work_log_photos")
    .select("id")
    .eq("work_log_id", workLog.id);

  const { data: conversationRows } = await supabase
    .schema("core")
    .from("work_log_conversations")
    .select("id")
    .eq("work_log_id", workLog.id);

  const tasks =
    Array.isArray(workLog.tasks_completed) && workLog.tasks_completed.length > 0
      ? workLog.tasks_completed.filter(
        (task): task is string =>
          typeof task === "string" && task.trim().length > 0,
      )
      : [];

  const skillIds =
    Array.isArray(workLog.skills_used) && workLog.skills_used.length > 0
      ? workLog.skills_used.filter(
        (skill): skill is string =>
          typeof skill === "string" && skill.trim().length > 0,
      )
      : [];

  let skillLabels: string[] = [];
  let skillSummaries: Array<{
    id: string;
    label: string;
    taxonomy: "csi" | "onet";
    tradeId: string | null;
    tradeName: string | null;
    tradeSlug: string | null;
  }> = [];

  if (skillIds.length > 0) {
    const { data: userSkillRows, error: userSkillError } = await supabase
      .schema("core")
      .from("user_skills")
      .select("*")
      .in("id", skillIds);

    if (userSkillError) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to load work log skills for export.",
      });
    }

    const enrichedSkills = await enrichUserSkills(
      supabase,
      userSkillRows ?? [],
    );

    skillLabels = enrichedSkills.map((skill) => skill.label);
    skillSummaries = enrichedSkills.map((skill) => ({
      id: skill.id,
      label: skill.label,
      taxonomy: skill.taxonomy,
      tradeId: skill.tradeId,
      tradeName: skill.tradeName,
      tradeSlug: skill.tradeSlug,
    }));
  }

  const totalHours = typeof workLog.total_hours === "number"
    ? workLog.total_hours
    : workLog.total_hours
    ? Number(workLog.total_hours)
    : 0;

  return {
    workLog,
    ownerName,
    ownerEmail: typeof ownerRecord?.email === "string"
      ? ownerRecord.email
      : null,
    projectName: resolveStringField(projectRecord, [
      "name",
      "title",
      "project_name",
    ]),
    projectIdentifier: resolveStringField(projectRecord, [
      "project_code",
      "job_number",
      "slug",
      "reference_code",
    ]),
    organizationName: resolveStringField(organizationRecord, [
      "name",
      "display_name",
    ]),
    organizationIdentifier: resolveStringField(organizationRecord, [
      "slug",
      "external_id",
      "short_code",
    ]),
    totalHours,
    tasks,
    skills: skillLabels,
    skillSummaries,
    timeEntries: parseTimeEntries(workLog.time_entries),
    collaborators,
    photoCount: photoRows?.length ?? 0,
    commentCount: conversationRows?.length ?? 0,
  };
};

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
  const conflicts: Array<{
    incoming: { start: string; end: string };
    existing: { start: string; end: string };
  }> = [];
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
): Promise<{
  workLog: WorkLogRow;
  role: "owner" | "editor" | "viewer";
  collaborator?: Pick<CollaboratorRow, "permission_level">;
}> => {
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
): Promise<
  Array<Pick<CollaboratorRow, "collaborator_user_id" | "permission_level">>
> => {
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

  return (data ?? []) as Array<
    Pick<CollaboratorRow, "collaborator_user_id" | "permission_level">
  >;
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

  const collaboratorSummaries = await listCollaboratorSummaries(
    supabase,
    workLog.id,
  );
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
  const { participants, collaboratorPermissions } =
    await getConversationParticipants(
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
      })
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

  await notifyConversationParticipants(
    supabase,
    workLog,
    actorId,
    shorten(message),
  );

  return data;
};

type SkillTaxonomy = "csi" | "onet";

export interface SuggestedSkill {
  id: string;
  taxonomy: SkillTaxonomy;
  name: string;
  code: string | null;
  displayCode: string | null;
  label: string;
  context: {
    workLogId: string;
    projectId: string | null;
    projectName: string | null;
    organizationId: string | null;
    organizationName: string | null;
    logDate: string | null;
  };
}

interface ProjectContext {
  projectId: string | null;
  projectName: string | null;
  organizationId: string | null;
  organizationName: string | null;
}

const normaliseOnetCode = (value: string | null | undefined): string => {
  if (!value) return "";
  return value.trim();
};

const extractSkillIds = (input: unknown): string[] => {
  if (!Array.isArray(input)) {
    return [];
  }

  return (input as unknown[])
    .filter((item): item is string =>
      typeof item === "string" && item.trim().length > 0
    )
    .map((item) => item.trim());
};

const fetchProjectContext = async (
  supabase: DbClient,
  projectId: string | null,
): Promise<ProjectContext> => {
  if (!projectId) {
    return {
      projectId: null,
      projectName: null,
      organizationId: null,
      organizationName: null,
    };
  }

  const { data: project, error: projectError } = await supabase
    .schema("core")
    .from("construction_projects")
    .select("*")
    .eq("id", projectId)
    .maybeSingle();

  if (projectError) {
    console.error("[workLogs] Failed to load project context", projectError);
  }

  const projectRecord = (project ?? null) as Record<string, unknown> | null;
  const projectName = (projectRecord?.name as string | undefined) ??
    (projectRecord?.project_name as string | undefined) ??
    (projectRecord?.title as string | undefined) ??
    null;

  const organizationId =
    (projectRecord?.organization_id as string | undefined) ?? null;

  let organizationName: string | null = null;

  if (organizationId) {
    const { data: organization, error: organizationError } = await supabase
      .schema("core")
      .from("organizations")
      .select("*")
      .eq("id", organizationId)
      .maybeSingle();

    if (organizationError) {
      console.error(
        "[workLogs] Failed to load organization context",
        organizationError,
      );
    }

    const orgRecord = (organization ?? null) as Record<string, unknown> | null;
    organizationName = (orgRecord?.name as string | undefined) ??
      (orgRecord?.legal_name as string | undefined) ??
      (orgRecord?.display_name as string | undefined) ??
      null;
  }

  return {
    projectId,
    projectName,
    organizationId,
    organizationName,
  };
};

const resolveCsiSkillDetails = async (
  supabase: DbClient,
  skillIds: string[],
): Promise<
  Map<
    string,
    { name: string; code_key: string | null; code_display: string | null }
  >
> => {
  if (skillIds.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase
    .schema("data")
    .from("masterformat")
    .select("id, name, code_key, code_display")
    .in("id", skillIds);

  if (error) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to load skill details",
    });
  }

  return new Map(
    (data ?? []).map((
      row: {
        id: string;
        name: string;
        code_key: string | null;
        code_display: string | null;
      },
    ) => [
      row.id,
      {
        name: row.name,
        code_key: row.code_key ?? null,
        code_display: row.code_display ?? null,
      },
    ]),
  );
};

const getUserSkillSets = async (
  supabase: DbClient,
  userId: string,
): Promise<{ csi: Set<string>; onet: Set<string> }> => {
  const { data, error } = await supabase
    .schema("core")
    .from("user_skills")
    .select("skill_taxonomy, csi_skill_id, onet_occupation_id")
    .eq("user_id", userId);

  if (error) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to load user skills",
    });
  }

  const csi = new Set<string>();
  const onet = new Set<string>();

  for (const skill of data ?? []) {
    if (skill.skill_taxonomy === "csi" && skill.csi_skill_id) {
      csi.add(skill.csi_skill_id);
    } else if (skill.skill_taxonomy === "onet" && skill.onet_occupation_id) {
      onet.add(normaliseOnetCode(skill.onet_occupation_id));
    }
  }

  return { csi, onet };
};

const getSuggestedSkillsForWorkLog = async (
  supabase: DbClient,
  workLog: WorkLogRow,
  userId: string,
): Promise<SuggestedSkill[]> => {
  const skillIds = Array.from(
    new Set(extractSkillIds(workLog.skills_used as unknown)),
  );

  if (skillIds.length === 0) {
    return [];
  }

  const { csi: existingCsiSkills } = await getUserSkillSets(supabase, userId);

  const missingCsiSkillIds = skillIds.filter((skillId) =>
    !existingCsiSkills.has(skillId)
  );

  if (missingCsiSkillIds.length === 0) {
    return [];
  }

  const csiDetails = await resolveCsiSkillDetails(supabase, missingCsiSkillIds);
  const projectContext = await fetchProjectContext(
    supabase,
    workLog.project_id,
  );

  const suggestions: SuggestedSkill[] = [];

  for (const skillId of missingCsiSkillIds) {
    const detail = csiDetails.get(skillId);
    if (!detail) {
      continue;
    }

    const label = detail.code_display
      ? `${detail.code_display} · ${detail.name}`
      : detail.name;

    suggestions.push({
      id: skillId,
      taxonomy: "csi",
      name: detail.name,
      code: detail.code_key,
      displayCode: detail.code_display,
      label,
      context: {
        workLogId: workLog.id,
        projectId: projectContext.projectId,
        projectName: projectContext.projectName,
        organizationId: projectContext.organizationId,
        organizationName: projectContext.organizationName,
        logDate: (workLog.log_date as string | null) ?? null,
      },
    });
  }

  return suggestions;
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
    action:
      | "status_change"
      | "edit"
      | "comment"
      | "move_project"
      | "move_requested"
      | "move_cancelled"
      | "move_denied"
      | "move_approved"
      | "collaborator_added"
      | "photo_added"
      | "photo_removed"
      | "export_generated";
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
    .schema("core")
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
    .schema("core")
    .from("organizations")
    .select("work_log_require_verification")
    .eq("id", project.organization_id)
    .maybeSingle();

  return Boolean(organization?.work_log_require_verification);
};

export const workLogsRouter = t.router({
  getProjectOptions: protectedProcedure
    .input(projectOptionsInputSchema)
    .query(async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      if (!user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const { data: memberships, error: membershipsError } = await supabase
        .schema("public")
        .from("v_organization_memberships")
        .select(
          "user_id, organization_id, organization_name, is_admin, is_owner",
        )
        .eq("user_id", user.id);

      if (membershipsError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to load organization memberships.",
        });
      }

      const organizationsMap = new Map<
        string,
        {
          id: string;
          name: string;
          isAdmin: boolean;
          isOwner: boolean;
        }
      >();

      for (const membership of memberships ?? []) {
        const organizationId = typeof membership.organization_id === "string"
          ? membership.organization_id
          : null;

        if (!organizationId) {
          continue;
        }

        if (!organizationsMap.has(organizationId)) {
          organizationsMap.set(organizationId, {
            id: organizationId,
            name: typeof membership.organization_name === "string" &&
                membership.organization_name.trim().length > 0
              ? membership.organization_name.trim()
              : "Unknown Organization",
            isAdmin: Boolean(membership.is_admin),
            isOwner: Boolean(membership.is_owner),
          });
        }
      }

      const organizations = Array.from(organizationsMap.values());

      if (!organizations.length) {
        return {
          organizations: [],
          projects: [] as Array<{
            id: string;
            name: string;
            organizationId: string;
            status: string | null;
            isArchived: boolean;
            startsAt: string | null;
            endsAt: string | null;
          }>,
        };
      }

      const filterOrganizationId = input?.organizationId ?? null;

      if (filterOrganizationId && !organizationsMap.has(filterOrganizationId)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to the requested organization.",
        });
      }

      const organizationIds = filterOrganizationId
        ? [filterOrganizationId]
        : organizations.map((organization) => organization.id);

      if (!organizationIds.length) {
        return {
          organizations,
          projects: [] as Array<{
            id: string;
            name: string;
            organizationId: string;
            status: string | null;
            isArchived: boolean;
            startsAt: string | null;
            endsAt: string | null;
          }>,
        };
      }

      const { data: projectRows, error: projectsError } = await supabase
        .schema("core")
        .from("construction_projects")
        .select("*")
        .in("organization_id", organizationIds);

      if (projectsError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to load projects for organizations.",
        });
      }

      const includeArchived = input?.includeArchived ?? false;
      const normalizedSearch =
        typeof input?.search === "string" && input.search.length > 0
          ? input.search.toLowerCase()
          : null;

      const projects = (projectRows ?? [])
        .map((project: unknown) => project as Record<string, unknown>)
        .map((project: Record<string, unknown>) => {
          const id = typeof project.id === "string"
            ? project.id
            : String(project.id);
          const organizationId = typeof project.organization_id === "string"
            ? project.organization_id
            : String(project.organization_id ?? "");

          const status = resolveStringField(project, [
            "status",
            "project_status",
            "state",
          ]) ?? null;

          const startsAt = resolveStringField(project, [
            "start_date",
            "starts_at",
            "project_start",
          ]) ?? null;

          const endsAt = resolveStringField(project, [
            "end_date",
            "ends_at",
            "project_end",
          ]) ?? null;

          return {
            id,
            name: resolveProjectDisplayName(project),
            organizationId,
            status,
            isArchived: isArchivedProject(project),
            startsAt,
            endsAt,
          };
        })
        .filter(
          (
            project: {
              organizationId: string;
              isArchived: boolean;
              name: string;
              id: string;
            },
          ) => {
            if (!project.organizationId) {
              return false;
            }

            if (!includeArchived && project.isArchived) {
              return false;
            }

            if (normalizedSearch) {
              const haystack = [project.name, project.id]
                .filter(Boolean)
                .map((value: string) => value.toLowerCase());

              const matchesSearch = haystack.some((value: string) =>
                value.includes(normalizedSearch)
              );

              if (!matchesSearch) {
                return false;
              }
            }

            return true;
          },
        )
        .sort(
          (
            a: { organizationId: string; name: string },
            b: { organizationId: string; name: string },
          ) => {
            if (a.organizationId === b.organizationId) {
              return a.name.localeCompare(b.name);
            }

            return a.organizationId.localeCompare(b.organizationId);
          },
        );

      return {
        organizations,
        projects,
      };
    }),

  getProjectRollup: protectedProcedure
    .input(projectRollupInputSchema)
    .query(async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      if (!user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      let query = supabase
        .schema("core")
        .from("work_logs")
        .select(
          `
            id,
            user_id,
            project_id,
            status,
            log_date,
            total_hours,
            submitted_at,
            verified_at,
            disputed_at,
            created_at,
            updated_at
          `,
        )
        .eq("user_id", user.id)
        .eq("project_id", input.projectId);

      if (input.dateFrom) {
        query = query.gte("log_date", input.dateFrom);
      }

      if (input.dateTo) {
        query = query.lte("log_date", input.dateTo);
      }

      const { data: rows, error } = await query;

      if (error) {
        console.error("[workLogs.getProjectRollup] Failed to load work logs", {
          error: error.message,
          userId: user.id,
          projectId: input.projectId,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Unable to load project rollup.",
        });
      }

      const workLogs = rows ?? [];
      const workLogIds = workLogs
        .map((
          row: { id: string | number },
        ) => (typeof row.id === "string" ? row.id : null))
        .filter((value: string | null): value is string => Boolean(value));

      const projectMap = await fetchProjectMetadata(supabase, [
        input.projectId,
      ]);

      const project = projectMap.get(input.projectId) ?? null;

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found or inaccessible.",
        });
      }

      const relationshipCounts = await fetchWorkLogRelationshipCounts(
        supabase,
        workLogIds,
      );

      const statusSummary = createEmptyStatusSummary();
      const hoursByDay = new Map<
        string,
        { totalHours: number; verifiedHours: number }
      >();
      let totalHours = 0;
      let verifiedHours = 0;
      let photoCount = 0;
      let commentCount = 0;
      let disputedCount = 0;
      let pendingVerificationCount = 0;
      const collaboratorSet = new Set<string>();

      for (const log of workLogs) {
        const logId = typeof log.id === "string" ? log.id : String(log.id);
        const hours = coerceNumber(log.total_hours);
        totalHours += hours;
        if (log.status === "verified") {
          verifiedHours += hours;
        }
        if (log.status === "disputed") {
          disputedCount += 1;
        }
        if (log.status === "pending_verification") {
          pendingVerificationCount += 1;
        }

        accumulateStatusSummary(statusSummary, log.status, hours);

        const dateKey = log.log_date ?? null;
        if (dateKey) {
          const entry = hoursByDay.get(dateKey) ??
            { totalHours: 0, verifiedHours: 0 };
          entry.totalHours += hours;
          if (log.status === "verified") {
            entry.verifiedHours += hours;
          }
          hoursByDay.set(dateKey, entry);
        }

        photoCount += relationshipCounts.photoCount.get(logId) ?? 0;
        commentCount += relationshipCounts.commentCount.get(logId) ?? 0;

        const collaborators =
          relationshipCounts.collaboratorsByWorkLog.get(logId) ?? [];
        for (const collaborator of collaborators) {
          collaboratorSet.add(collaborator);
        }
      }

      const recentActivity = workLogs
        .map(
          (
            log: {
              id: string | number;
              status?: string;
              log_date?: string | null;
              total_hours?: number | null;
              [key: string]: unknown;
            },
          ) => {
            const logId = typeof log.id === "string" ? log.id : String(log.id);
            const activityTimestamp = resolveActivityTimestamp(log);
            return {
              id: logId,
              status: typeof log.status === "string" ? log.status : "draft",
              logDate: log.log_date ?? null,
              totalHours: coerceNumber(log.total_hours),
              photoCount: relationshipCounts.photoCount.get(logId) ?? 0,
              commentCount: relationshipCounts.commentCount.get(logId) ?? 0,
              updatedAt: activityTimestamp,
            };
          },
        )
        .sort(
          (
            a: { updatedAt: string | null },
            b: { updatedAt: string | null },
          ) => {
            const timeA = a.updatedAt ? Number(new Date(a.updatedAt)) : 0;
            const timeB = b.updatedAt ? Number(new Date(b.updatedAt)) : 0;
            return timeB - timeA;
          },
        )
        .slice(0, 5);

      const timeline = Array.from(hoursByDay.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([logDate, value]) => ({
          logDate,
          totalHours: value.totalHours,
          verifiedHours: value.verifiedHours,
        }));

      return {
        projectId: input.projectId,
        project,
        totals: {
          totalLogs: workLogs.length,
          totalHours,
          verifiedHours,
          statusSummary,
          pendingVerificationCount,
          disputedCount,
          photoCount,
          commentCount,
          collaboratorCount: collaboratorSet.size,
        },
        timeline,
        recentActivity,
        filtersApplied: {
          dateFrom: input.dateFrom ?? null,
          dateTo: input.dateTo ?? null,
        },
      };
    }),

  publicProfileFeed: publicProcedure
    .input(publicWorkLogsInputSchema)
    .query(async ({ ctx, input }) => {
      const { supabaseAdmin } = ctx;

      const { userId, limit } = input;

      const { data: workLogRows, error: workLogError } = await supabaseAdmin
        .schema("core")
        .from("work_logs")
        .select(
          "id, project_id, log_date, show_on_profile, show_date_range_on_profile, visibility, status, verified_at, created_at",
        )
        .eq("user_id", userId)
        .eq("show_on_profile", true)
        .eq("visibility", "public")
        .eq("status", "verified")
        .order("log_date", { ascending: false })
        .limit(limit);

      if (workLogError) {
        console.error("[workLogs.publicProfileFeed] Failed to load logs", {
          userId,
          message: workLogError.message,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Unable to load public work logs.",
        });
      }

      const workLogs = workLogRows ?? [];

      if (workLogs.length === 0) {
        return { workLogs: [] };
      }

      const logIds = workLogs
        .map((log: { id: string | number }) => log.id)
        .filter((value: string | number): value is string =>
          typeof value === "string"
        );

      const projectIds = workLogs
        .map((log: { project_id: string | null }) => log.project_id)
        .filter((value: string | null): value is string =>
          typeof value === "string"
        );

      const projectMap = new Map<
        string,
        { name: string | null; organizationName: string | null }
      >();

      if (projectIds.length > 0) {
        const { data: projectRows, error: projectError } = await supabaseAdmin
          .schema("core")
          .from("construction_projects")
          .select("id, name, organization_id, organizations(name)")
          .in("id", Array.from(new Set(projectIds)));

        if (projectError) {
          console.warn(
            "[workLogs.publicProfileFeed] Unable to load project metadata",
            {
              message: projectError.message,
            },
          );
        } else {
          for (const project of projectRows ?? []) {
            if (!project?.id) continue;
            const id = String(project.id);
            const name = typeof project.name === "string" ? project.name : null;
            const organizationName =
              typeof project.organizations?.name === "string"
                ? project.organizations.name
                : null;
            projectMap.set(id, { name, organizationName });
          }
        }
      }

      const photosByWorkLog = new Map<
        string,
        Array<{
          id: string;
          caption: string | null;
          signedUrl: string | null;
          thumbnailSignedUrl: string | null;
        }>
      >();

      if (logIds.length > 0) {
        const { data: photoRows, error: photoError } = await supabaseAdmin
          .schema("core")
          .from("work_log_photos")
          .select(
            "id, work_log_id, file_path, thumbnail_path, caption, display_order",
          )
          .in("work_log_id", logIds)
          .eq("show_on_profile", true)
          .order("display_order", { ascending: true });

        if (photoError) {
          console.warn("[workLogs.publicProfileFeed] Unable to load photos", {
            message: photoError.message,
          });
        } else {
          const signedPhotos = await Promise.all(
            (photoRows ?? []).map(
              async (
                photo: {
                  id: string | number;
                  file_path?: string;
                  [key: string]: unknown;
                },
              ) => {
                if (typeof photo.id !== "string") {
                  return null;
                }

                const filePath = typeof photo.file_path === "string"
                  ? photo.file_path
                  : null;
                const thumbnailPath = typeof photo.thumbnail_path === "string"
                  ? photo.thumbnail_path
                  : null;

                let signedUrl: string | null = null;
                let thumbnailSignedUrl: string | null = null;

                try {
                  if (filePath) {
                    const { data: signed } = await supabaseAdmin.storage
                      .from(WORK_LOG_PHOTO_BUCKET)
                      .createSignedUrl(
                        filePath,
                        PUBLIC_WORK_LOG_PHOTO_TTL_SECONDS,
                      );
                    signedUrl = signed?.signedUrl ?? null;
                  }
                } catch (error) {
                  console.warn(
                    "[workLogs.publicProfileFeed] Failed to sign photo URL",
                    {
                      filePath,
                      error,
                    },
                  );
                }

                try {
                  if (thumbnailPath) {
                    const { data: signedThumb } = await supabaseAdmin.storage
                      .from(WORK_LOG_PHOTO_BUCKET)
                      .createSignedUrl(
                        thumbnailPath,
                        PUBLIC_WORK_LOG_PHOTO_TTL_SECONDS,
                      );
                    thumbnailSignedUrl = signedThumb?.signedUrl ?? null;
                  }
                } catch (error) {
                  console.warn(
                    "[workLogs.publicProfileFeed] Failed to sign thumbnail URL",
                    {
                      thumbnailPath,
                      error,
                    },
                  );
                }

                return {
                  id: photo.id,
                  workLogId: typeof photo.work_log_id === "string"
                    ? photo.work_log_id
                    : null,
                  caption: typeof photo.caption === "string"
                    ? photo.caption
                    : null,
                  signedUrl,
                  thumbnailSignedUrl,
                };
              },
            ),
          );

          for (const photo of signedPhotos) {
            if (!photo?.workLogId) continue;
            const existing = photosByWorkLog.get(photo.workLogId) ?? [];
            existing.push({
              id: photo.id,
              caption: photo.caption,
              signedUrl: photo.signedUrl,
              thumbnailSignedUrl: photo.thumbnailSignedUrl,
            });
            photosByWorkLog.set(photo.workLogId, existing);
          }
        }
      }

      const result = workLogs.map(
        (
          log: {
            id: string | number;
            project_id?: string | null;
            [key: string]: unknown;
          },
        ) => {
          const logId = String(log.id);
          const project = typeof log.project_id === "string"
            ? (projectMap.get(log.project_id) ?? null)
            : null;

          const photos = photosByWorkLog.get(logId) ?? [];

          return {
            id: logId,
            projectId: typeof log.project_id === "string"
              ? log.project_id
              : null,
            projectName: project?.name ?? null,
            organizationName: project?.organizationName ?? null,
            logDate: log.show_date_range_on_profile
              ? (log.log_date ?? null)
              : null,
            showDateOnProfile: Boolean(log.show_date_range_on_profile),
            verifiedAt: log.verified_at ?? null,
            photos,
          };
        },
      );

      return { workLogs: result };
    }),

  projectAnalytics: officeProcedure
    .input(projectAnalyticsInputSchema)
    .query(async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      if (!user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const projectRecord = await fetchProjectRecord(
        supabase,
        input.projectId,
        "Project not found.",
      );

      const organizationSettings = await fetchOrganizationMoveSettings(
        supabase,
        projectRecord.organization_id,
      );

      await assertUserIsOrganizationManager(
        supabase,
        user.id,
        organizationSettings,
      );

      let query = supabase
        .schema("core")
        .from("work_logs")
        .select(
          `
            id,
            user_id,
            project_id,
            status,
            log_date,
            total_hours,
            submitted_at,
            verified_at,
            disputed_at,
            created_at,
            updated_at
          `,
        )
        .eq("project_id", input.projectId);

      if (input.dateFrom) {
        query = query.gte("log_date", input.dateFrom);
      }

      if (input.dateTo) {
        query = query.lte("log_date", input.dateTo);
      }

      const { data: rows, error } = await query;

      if (error) {
        console.error("[workLogs.projectAnalytics] Failed to load work logs", {
          error: error.message,
          projectId: input.projectId,
          userId: user.id,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Unable to load project analytics.",
        });
      }

      const workLogs = rows ?? [];
      const workLogIds = workLogs
        .map((
          row: { id: string | number },
        ) => (typeof row.id === "string" ? row.id : null))
        .filter((value: string | null): value is string => Boolean(value));

      const workerIds = workLogs
        .map((
          row: { user_id?: string | null },
        ) => (typeof row.user_id === "string" ? row.user_id : null))
        .filter((value: string | null): value is string => Boolean(value));

      const [projectMap, relationshipCounts, workerRows] = await Promise.all([
        fetchProjectMetadata(supabase, [input.projectId]),
        fetchWorkLogRelationshipCounts(supabase, workLogIds),
        workerIds.length
          ? supabase
            .schema("core")
            .from("users")
            .select("id, display_name, username")
            .in("id", Array.from(new Set(workerIds)))
          : Promise.resolve({
            data: [] as Array<Record<string, unknown>>,
            error: null,
          }),
      ]);

      if (workerRows.error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Unable to load worker profiles for analytics.",
        });
      }

      const project = projectMap.get(input.projectId) ?? {
        id: input.projectId,
        name: "Unknown Project",
        status: null,
        isArchived: false,
        organizationId: projectRecord.organization_id,
        projectNumber: null,
      };

      const workerMetadata = new Map<
        string,
        { displayName: string; username: string | null }
      >();
      for (const row of workerRows.data ?? []) {
        const id = typeof row?.id === "string" ? row.id : null;
        if (!id) continue;
        const displayName = typeof row?.display_name === "string" &&
            row.display_name.trim().length > 0
          ? row.display_name.trim()
          : typeof row?.username === "string"
          ? row.username
          : "Member";
        const username = typeof row?.username === "string"
          ? row.username
          : null;
        workerMetadata.set(id, { displayName, username });
      }

      const statusSummary = createEmptyStatusSummary();
      let totalHours = 0;
      let verifiedHours = 0;
      let photoCount = 0;
      let commentCount = 0;
      let disputedCount = 0;
      let pendingVerificationCount = 0;
      const collaboratorSet = new Set<string>();
      const hoursByDay = new Map<
        string,
        { totalHours: number; verifiedHours: number }
      >();

      const workerAggregates = new Map<
        string,
        {
          userId: string;
          totalLogs: number;
          totalHours: number;
          verifiedHours: number;
          disputedCount: number;
          pendingVerificationCount: number;
          photoCount: number;
          commentCount: number;
          statusSummary: ReturnType<typeof createEmptyStatusSummary>;
          latestActivity: string | null;
        }
      >();

      for (const log of workLogs) {
        const logId = typeof log.id === "string" ? log.id : String(log.id);
        const workerId = typeof log.user_id === "string" ? log.user_id : null;
        const hours = coerceNumber(log.total_hours);

        totalHours += hours;
        if (log.status === "verified") {
          verifiedHours += hours;
        }
        if (log.status === "disputed") {
          disputedCount += 1;
        }
        if (log.status === "pending_verification") {
          pendingVerificationCount += 1;
        }

        accumulateStatusSummary(statusSummary, log.status, hours);

        const dateKey = log.log_date ?? null;
        if (dateKey) {
          const entry = hoursByDay.get(dateKey) ??
            { totalHours: 0, verifiedHours: 0 };
          entry.totalHours += hours;
          if (log.status === "verified") {
            entry.verifiedHours += hours;
          }
          hoursByDay.set(dateKey, entry);
        }

        photoCount += relationshipCounts.photoCount.get(logId) ?? 0;
        commentCount += relationshipCounts.commentCount.get(logId) ?? 0;

        const collaborators =
          relationshipCounts.collaboratorsByWorkLog.get(logId) ?? [];
        for (const collaborator of collaborators) {
          collaboratorSet.add(collaborator);
        }

        if (workerId) {
          const aggregate = workerAggregates.get(workerId) ?? {
            userId: workerId,
            totalLogs: 0,
            totalHours: 0,
            verifiedHours: 0,
            disputedCount: 0,
            pendingVerificationCount: 0,
            photoCount: 0,
            commentCount: 0,
            statusSummary: createEmptyStatusSummary(),
            latestActivity: null,
          };

          aggregate.totalLogs += 1;
          aggregate.totalHours += hours;
          if (log.status === "verified") {
            aggregate.verifiedHours += hours;
          }
          if (log.status === "disputed") {
            aggregate.disputedCount += 1;
          }
          if (log.status === "pending_verification") {
            aggregate.pendingVerificationCount += 1;
          }
          aggregate.photoCount += relationshipCounts.photoCount.get(logId) ?? 0;
          aggregate.commentCount +=
            relationshipCounts.commentCount.get(logId) ?? 0;
          accumulateStatusSummary(aggregate.statusSummary, log.status, hours);

          const activityTimestamp = resolveActivityTimestamp(log);
          if (
            activityTimestamp &&
            (!aggregate.latestActivity ||
              Number(new Date(activityTimestamp)) >
                Number(new Date(aggregate.latestActivity)))
          ) {
            aggregate.latestActivity = activityTimestamp;
          }

          workerAggregates.set(workerId, aggregate);
        }
      }

      const workers = Array.from(workerAggregates.values())
        .map((aggregate) => {
          const profile = workerMetadata.get(aggregate.userId);
          return {
            userId: aggregate.userId,
            displayName: profile?.displayName ?? "Member",
            username: profile?.username ?? null,
            totalLogs: aggregate.totalLogs,
            totalHours: aggregate.totalHours,
            verifiedHours: aggregate.verifiedHours,
            disputedCount: aggregate.disputedCount,
            pendingVerificationCount: aggregate.pendingVerificationCount,
            photoCount: aggregate.photoCount,
            commentCount: aggregate.commentCount,
            statusSummary: aggregate.statusSummary,
            latestActivity: aggregate.latestActivity,
          };
        })
        .sort((a, b) => b.totalHours - a.totalHours);

      const timeline = Array.from(hoursByDay.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([logDate, value]) => ({
          logDate,
          totalHours: value.totalHours,
          verifiedHours: value.verifiedHours,
        }));

      const recentActivity = workLogs
        .map(
          (
            log: {
              id: string | number;
              user_id?: string | null;
              status?: string;
              log_date?: string | null;
              total_hours?: number | null;
              [key: string]: unknown;
            },
          ) => {
            const logId = typeof log.id === "string" ? log.id : String(log.id);
            const workerId = typeof log.user_id === "string"
              ? log.user_id
              : null;
            const worker = workerId
              ? (workerMetadata.get(workerId) ?? null)
              : null;
            const activityTimestamp = resolveActivityTimestamp(log);
            return {
              id: logId,
              workerId,
              workerName: worker?.displayName ?? "Member",
              status: typeof log.status === "string" ? log.status : "draft",
              logDate: log.log_date ?? null,
              totalHours: coerceNumber(log.total_hours),
              photoCount: relationshipCounts.photoCount.get(logId) ?? 0,
              commentCount: relationshipCounts.commentCount.get(logId) ?? 0,
              updatedAt: activityTimestamp,
            };
          },
        )
        .sort(
          (
            a: { updatedAt: string | null },
            b: { updatedAt: string | null },
          ) => {
            const timeA = a.updatedAt ? Number(new Date(a.updatedAt)) : 0;
            const timeB = b.updatedAt ? Number(new Date(b.updatedAt)) : 0;
            return timeB - timeA;
          },
        )
        .slice(0, 10);

      return {
        projectId: input.projectId,
        project,
        totals: {
          totalLogs: workLogs.length,
          totalHours,
          verifiedHours,
          statusSummary,
          pendingVerificationCount,
          disputedCount,
          photoCount,
          commentCount,
          collaboratorCount: collaboratorSet.size,
          uniqueWorkers: new Set(workerIds).size,
        },
        workers,
        timeline,
        recentActivity,
        filtersApplied: {
          dateFrom: input.dateFrom ?? null,
          dateTo: input.dateTo ?? null,
        },
      };
    }),

  list: protectedProcedure.input(listWorkLogsInputSchema).query(
    async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      if (!user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const page = input.page ?? 0;
      const pageSize = input.pageSize ?? 20;

      let query = supabase
        .schema("core")
        .from("work_logs")
        .select(WORK_LOG_LIST_SELECT, { count: "exact" })
        .eq("user_id", user.id);

      if (input.statuses?.length) {
        query = query.in("status", input.statuses);
      }

      if (input.projectId) {
        query = query.eq("project_id", input.projectId);
      }

      if (input.dateFrom) {
        query = query.gte("log_date", input.dateFrom);
      }

      if (input.dateTo) {
        query = query.lte("log_date", input.dateTo);
      }

      if (input.search) {
        const normalized = input.search.trim();
        if (normalized.length > 0) {
          query = query.ilike("work_description", `%${normalized}%`);
        }
      }

      const offset = page * pageSize;

      query = query
        .order(input.sortField, {
          ascending: input.sortDirection === "asc",
          nullsLast: true,
        })
        .range(offset, offset + pageSize - 1);

      const { data: rows, count, error } = await query;

      if (error) {
        console.error("[workLogs.list] Failed to load work logs", {
          error: error.message,
          userId: user.id,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Unable to load work logs.",
        });
      }

      const workLogs = rows ?? [];
      const workLogIds = workLogs
        .map((
          row: { id: string | number },
        ) => (typeof row.id === "string" ? row.id : null))
        .filter((value: string | null): value is string => Boolean(value));

      const projectIds = workLogs
        .map((
          row: { project_id?: string | null },
        ) => (typeof row.project_id === "string" ? row.project_id : null))
        .filter((value: string | null): value is string => Boolean(value));

      const [projectMap, relationshipCounts] = await Promise.all([
        fetchProjectMetadata(supabase, Array.from(new Set(projectIds))),
        fetchWorkLogRelationshipCounts(supabase, workLogIds),
      ]);

      const items = workLogs.map(
        (
          row: {
            id: string | number;
            project_id?: string | null;
            status?: string;
            [key: string]: unknown;
          },
        ) => {
          const id = typeof row.id === "string" ? row.id : String(row.id);
          const projectId = typeof row.project_id === "string"
            ? row.project_id
            : null;
          const project = projectId
            ? (projectMap.get(projectId) ?? null)
            : null;
          const status = typeof row.status === "string" ? row.status : "draft";
          const totalHours = coerceNumber(row.total_hours);

          return {
            id,
            projectId,
            project,
            status,
            logDate: row.log_date ?? null,
            entryType: typeof row.entry_type === "string"
              ? row.entry_type
              : "daily",
            totalHours,
            submittedAt: row.submitted_at ?? null,
            verifiedAt: row.verified_at ?? null,
            disputedAt: row.disputed_at ?? null,
            disputeReason: row.dispute_reason ?? null,
            visibility: typeof row.visibility === "string"
              ? row.visibility
              : "private",
            showOnProfile: Boolean(row.show_on_profile),
            showDateRangeOnProfile: Boolean(row.show_date_range_on_profile),
            createdAt: row.created_at ?? null,
            updatedAt: row.updated_at ?? null,
            photoCount: relationshipCounts.photoCount.get(id) ?? 0,
            collaboratorCount: relationshipCounts.collaboratorCount.get(id) ??
              0,
            commentCount: relationshipCounts.commentCount.get(id) ?? 0,
            descriptionPreview: typeof row.work_description === "string"
              ? shorten(row.work_description, 220)
              : null,
          };
        },
      );

      const statusSummary = createEmptyStatusSummary();
      let totalHours = 0;
      let totalPhotos = 0;
      let totalComments = 0;

      for (const item of items) {
        totalHours += item.totalHours;
        totalPhotos += item.photoCount;
        totalComments += item.commentCount;
        accumulateStatusSummary(statusSummary, item.status, item.totalHours);
      }

      const totalItems = count ?? items.length;
      const totalPages = Math.max(
        1,
        Math.ceil(totalItems / Math.max(pageSize, 1)),
      );

      return {
        items,
        pagination: {
          page,
          pageSize,
          totalItems,
          totalPages,
        },
        aggregates: {
          totalHours,
          totalPhotos,
          totalComments,
          statusSummary,
        },
        filtersApplied: {
          statuses: input.statuses ?? null,
          projectId: input.projectId ?? null,
          dateFrom: input.dateFrom ?? null,
          dateTo: input.dateTo ?? null,
          search: input.search ?? null,
          sortField: input.sortField,
          sortDirection: input.sortDirection,
        },
      };
    },
  ),

  getOverview: protectedProcedure.input(ownerOverviewInputSchema).query(
    async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      if (!user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      let query = supabase
        .schema("core")
        .from("work_logs")
        .select(
          `
            id,
            user_id,
            project_id,
            status,
            log_date,
            total_hours,
            submitted_at,
            verified_at,
            disputed_at,
            created_at,
            updated_at
          `,
        )
        .eq("user_id", user.id);

      if (input.dateFrom) {
        query = query.gte("log_date", input.dateFrom);
      }

      if (input.dateTo) {
        query = query.lte("log_date", input.dateTo);
      }

      const { data: rows, error } = await query;

      if (error) {
        console.error("[workLogs.getOverview] Failed to load work logs", {
          error: error.message,
          userId: user.id,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Unable to build work log overview.",
        });
      }

      const workLogs = rows ?? [];
      const workLogIds = workLogs
        .map((
          row: { id: string | number },
        ) => (typeof row.id === "string" ? row.id : null))
        .filter((value: string | null): value is string => Boolean(value));

      const projectIds = workLogs
        .map((
          row: { project_id?: string | null },
        ) => (typeof row.project_id === "string" ? row.project_id : null))
        .filter((value: string | null): value is string => Boolean(value));

      const [projectMap, relationshipCounts] = await Promise.all([
        fetchProjectMetadata(supabase, Array.from(new Set(projectIds))),
        fetchWorkLogRelationshipCounts(supabase, workLogIds),
      ]);

      const statusSummary = createEmptyStatusSummary();
      let totalHours = 0;
      let verifiedHours = 0;
      let totalPhotos = 0;
      let totalComments = 0;

      for (const log of workLogs) {
        const hours = coerceNumber(log.total_hours);
        totalHours += hours;
        if (log.status === "verified") {
          verifiedHours += hours;
        }
        accumulateStatusSummary(statusSummary, log.status, hours);
      }

      for (const value of relationshipCounts.photoCount.values()) {
        totalPhotos += value;
      }

      for (const value of relationshipCounts.commentCount.values()) {
        totalComments += value;
      }

      const needsAttentionCount = statusSummary.pending_verification.count +
        statusSummary.disputed.count;

      const projectGroups = new Map<string, typeof workLogs>();
      for (const log of workLogs) {
        const projectId = typeof log.project_id === "string"
          ? log.project_id
          : null;
        if (!projectId) continue;
        const group = projectGroups.get(projectId) ?? [];
        group.push(log);
        projectGroups.set(projectId, group);
      }

      const projectSummaries = Array.from(projectGroups.entries())
        .map(([projectId, logs]) => {
          const project = projectMap.get(projectId) ?? null;
          const projectStatusSummary = createEmptyStatusSummary();
          let projectTotalHours = 0;
          let projectVerifiedHours = 0;
          let projectPhotoCount = 0;
          let projectCommentCount = 0;
          let projectDisputedCount = 0;
          let projectPendingCount = 0;
          const collaboratorSet = new Set<string>();

          let latestActivity: string | null = null;

          for (const log of logs) {
            const logId = typeof log.id === "string" ? log.id : String(log.id);
            const hours = coerceNumber(log.total_hours);
            projectTotalHours += hours;
            if (log.status === "verified") {
              projectVerifiedHours += hours;
            }
            if (log.status === "disputed") {
              projectDisputedCount += 1;
            }
            if (log.status === "pending_verification") {
              projectPendingCount += 1;
            }
            accumulateStatusSummary(projectStatusSummary, log.status, hours);

            projectPhotoCount += relationshipCounts.photoCount.get(logId) ?? 0;
            projectCommentCount += relationshipCounts.commentCount.get(logId) ??
              0;

            const collaborators =
              relationshipCounts.collaboratorsByWorkLog.get(logId) ?? [];
            for (const collaboratorId of collaborators) {
              collaboratorSet.add(collaboratorId);
            }

            const activityTimestamp = resolveActivityTimestamp(log);
            if (
              activityTimestamp &&
              (!latestActivity ||
                Number(new Date(activityTimestamp)) >
                  Number(new Date(latestActivity)))
            ) {
              latestActivity = activityTimestamp;
            }
          }

          return {
            projectId,
            project,
            totalLogs: logs.length,
            totalHours: projectTotalHours,
            verifiedHours: projectVerifiedHours,
            disputedCount: projectDisputedCount,
            pendingVerificationCount: projectPendingCount,
            photoCount: projectPhotoCount,
            commentCount: projectCommentCount,
            collaboratorCount: collaboratorSet.size,
            statusSummary: projectStatusSummary,
            lastActivityAt: latestActivity,
          };
        })
        .sort((a, b) => b.totalHours - a.totalHours);

      const recentActivity = workLogs
        .map(
          (
            log: {
              id: string | number;
              project_id?: string | null;
              status?: string;
              log_date?: string | null;
              total_hours?: number | null;
              [key: string]: unknown;
            },
          ) => {
            const id = typeof log.id === "string" ? log.id : String(log.id);
            const projectId = typeof log.project_id === "string"
              ? log.project_id
              : null;
            const activityTimestamp = resolveActivityTimestamp(log);
            return {
              id,
              projectId,
              project: projectId ? (projectMap.get(projectId) ?? null) : null,
              status: typeof log.status === "string" ? log.status : "draft",
              logDate: log.log_date ?? null,
              totalHours: coerceNumber(log.total_hours),
              photoCount: relationshipCounts.photoCount.get(id) ?? 0,
              commentCount: relationshipCounts.commentCount.get(id) ?? 0,
              updatedAt: activityTimestamp,
            };
          },
        )
        .sort(
          (
            a: { updatedAt: string | null },
            b: { updatedAt: string | null },
          ) => {
            const timeA = a.updatedAt ? Number(new Date(a.updatedAt)) : 0;
            const timeB = b.updatedAt ? Number(new Date(b.updatedAt)) : 0;
            return timeB - timeA;
          },
        )
        .slice(0, 5);

      return {
        totals: {
          totalLogs: workLogs.length,
          totalHours,
          verifiedHours,
          statusSummary,
          pendingVerificationCount: statusSummary.pending_verification.count,
          disputedCount: statusSummary.disputed.count,
          needsAttentionCount,
        },
        media: {
          totalPhotos,
          totalComments,
          uniqueCollaborators: relationshipCounts.uniqueCollaboratorIds.size,
        },
        projectSummaries,
        recentActivity,
        filtersApplied: {
          dateFrom: input.dateFrom ?? null,
          dateTo: input.dateTo ?? null,
        },
      };
    },
  ),

  create: protectedProcedure.input(createWorkLogSchema).mutation(
    async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      if (!user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const { data: projectExists, error: projectError } = await supabase
        .schema("core")
        .from("construction_projects")
        .select("id")
        .eq("id", input.projectId)
        .single();

      if (projectError || !projectExists) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Construction project is required before creating a work log.",
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
        validateGpsCapture(gpsCapture);
        insertPayload.gps_location = buildPoint(
          gpsCapture.latitude,
          gpsCapture.longitude,
        );
        insertPayload.gps_accuracy_meters = normalizeAccuracyMeters(
          gpsCapture.accuracyMeters,
        );
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
    },
  ),

  update: protectedProcedure.input(updateWorkLogSchema).mutation(
    async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      if (!user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const { workLog: _workLog, role } = await getWorkLogAccess(
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

      if (_workLog.status !== "draft" && !input.reason) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "A reason is required to modify submitted work logs.",
        });
      }

      if (input.payload.status && input.payload.status !== _workLog.status) {
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
          oldValue[columnName] =
            (_workLog as Record<string, unknown>)[columnName];
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
        validateGpsCapture(capture);
        updates.gps_location = buildPoint(capture.latitude, capture.longitude);
        updates.gps_accuracy_meters = normalizeAccuracyMeters(
          capture.accuracyMeters,
        );
        updates.gps_captured_at = capture.capturedAt ?? null;
        updates.device_type = capture.deviceType ?? null;
        updates.location_permission_status = capture.permissionStatus ?? null;

        oldValue.gps_location = _workLog.gps_location ?? null;
        newValue.gps_location = updates.gps_location;
        oldValue.gps_accuracy_meters = _workLog.gps_accuracy_meters ?? null;
        newValue.gps_accuracy_meters = updates.gps_accuracy_meters;
        oldValue.gps_captured_at = _workLog.gps_captured_at ?? null;
        newValue.gps_captured_at = updates.gps_captured_at;
        oldValue.device_type = _workLog.device_type ?? null;
        newValue.device_type = updates.device_type ?? null;
        oldValue.location_permission_status =
          _workLog.location_permission_status ?? null;
        newValue.location_permission_status =
          updates.location_permission_status ?? null;
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

      if (_workLog.status !== "draft" && Object.keys(newValue).length > 0) {
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
    },
  ),

  submit: protectedProcedure.input(submitWorkLogSchema).mutation(
    async ({ ctx, input }) => {
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

      const nextStatus = requireVerification
        ? "pending_verification"
        : "verified";
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
        reason: input.forceSubmit
          ? "User elected to submit despite overlap warning."
          : (input.reason ?? null),
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

      const suggestedSkills = await getSuggestedSkillsForWorkLog(
        supabase,
        data,
        user.id,
      );

      return {
        workLog: data,
        suggestedSkills,
      };
    },
  ),

  verify: officeProcedure.input(verifyWorkLogSchema).mutation(
    async ({ ctx, input }) => {
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
    },
  ),

  dispute: officeProcedure.input(disputeWorkLogSchema).mutation(
    async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      if (!user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const workLog = await fetchWorkLog(supabase, input.workLogId);

      if (
        workLog.status !== "pending_verification" &&
        workLog.status !== "verified"
      ) {
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

      await supabase.schema("core").from("work_log_conversations").insert({
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
    },
  ),

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

  addComment: protectedProcedure.input(addWorkLogCommentSchema).mutation(
    async ({ ctx, input }) => {
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
          message:
            "Conversations are not available while a work log is in draft.",
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
    },
  ),

  getSuggestedSkills: protectedProcedure
    .input(getSuggestedSkillsSchema)
    .query(async ({ ctx, input }) => {
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
          message: "Only the work log owner can view skill suggestions.",
        });
      }

      const suggestions = await getSuggestedSkillsForWorkLog(
        supabase,
        workLog,
        user.id,
      );

      return { suggestions };
    }),

  addSkillToProfile: protectedProcedure
    .input(addSkillToProfileSchema)
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
          message: "Only the work log owner can add skills from this log.",
        });
      }

      const skillIdsFromLog = new Set(
        extractSkillIds(workLog.skills_used as unknown),
      );

      if (input.taxonomy === "csi" && !skillIdsFromLog.has(input.skillId)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "The requested skill is not associated with this work log.",
        });
      }

      const skillIdentifier = input.taxonomy === "csi"
        ? input.skillId
        : normaliseOnetCode(input.skillId);

      const { data: existingSkill, error: existingSkillError } = await supabase
        .schema("core")
        .from("user_skills")
        .select("id")
        .eq("user_id", user.id)
        .eq("skill_taxonomy", input.taxonomy)
        .eq(
          input.taxonomy === "csi" ? "csi_skill_id" : "onet_occupation_id",
          skillIdentifier,
        )
        .maybeSingle();

      if (existingSkillError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to check existing skills",
        });
      }

      if (existingSkill) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This skill is already on your profile.",
        });
      }

      const projectContext = await fetchProjectContext(
        supabase,
        workLog.project_id,
      );
      const metadata = {
        sources: [
          {
            type: "work_log",
            workLogId: workLog.id,
            projectId: projectContext.projectId,
            projectName: projectContext.projectName,
            organizationId: projectContext.organizationId,
            organizationName: projectContext.organizationName,
            logDate: (workLog.log_date as string | null) ?? null,
            addedAt: new Date().toISOString(),
          },
        ],
      };

      const insertPayload: Database["core"]["Tables"]["user_skills"]["Insert"] =
        {
          user_id: user.id,
          skill_taxonomy: input.taxonomy,
          proficiency_level: input.proficiencyLevel,
          metadata,
        };

      if (input.yearsExperience !== undefined) {
        insertPayload.years_experience = input.yearsExperience;
      }

      if (input.taxonomy === "csi") {
        insertPayload.csi_skill_id = input.skillId;
      } else {
        insertPayload.onet_occupation_id = skillIdentifier;
      }

      const { data, error } = await supabase
        .schema("core")
        .from("user_skills")
        .insert(insertPayload)
        .select()
        .single();

      if (error || !data) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to add skill to profile",
        });
      }

      const [enrichedSkill] = await enrichUserSkills(supabase, [data]);

      return {
        skill: enrichedSkill ?? null,
      };
    }),

  uploadPhoto: protectedProcedure
    .input(uploadWorkLogPhotoSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      if (!user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const { workLog: _workLog, role } = await getWorkLogAccess(
        supabase,
        input.workLogId,
        user.id,
      );

      if (role === "viewer") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have permission to upload photos for this work log.",
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
          message:
            "Storage limit reached. Remove existing photos or contact support.",
        });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const sanitizedFileName = sanitizeFileName(input.fileName);
      const filePath =
        `${user.id}/${input.workLogId}/${timestamp}-${sanitizedFileName}`;

      const { data: signedUpload, error: signedUrlError } = await supabase
        .storage
        .from(WORK_LOG_PHOTO_BUCKET)
        .createSignedUploadUrl(filePath, SIGNED_UPLOAD_URL_TTL_SECONDS, {
          contentType: input.contentType,
        });

      if (signedUrlError || !signedUpload) {
        console.error(
          "[workLogs.uploadPhoto] Failed to create signed upload URL",
          {
            workLogId: input.workLogId,
            message: signedUrlError?.message,
          },
        );
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
        validateGpsCapture(input.gpsCapture);
        insertPayload.gps_location = buildPoint(
          input.gpsCapture.latitude,
          input.gpsCapture.longitude,
        );
        insertPayload.gps_accuracy_meters = normalizeAccuracyMeters(
          input.gpsCapture.accuracyMeters,
        );
        insertPayload.gps_captured_at = input.gpsCapture.capturedAt ?? null;
        insertPayload.device_type = input.gpsCapture.deviceType ?? null;
        insertPayload.location_permission_status =
          input.gpsCapture.permissionStatus ?? null;
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
          console.error(
            "[workLogs.uploadPhoto] Failed to update storage usage",
            {
              userId: user.id,
              message: usageUpdateError.message,
            },
          );
        }
      } else {
        await supabase.schema("core").from("user_storage_usage").insert({
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
        filePath: filePath,
        photo: photoRecord,
        expiresIn: SIGNED_UPLOAD_URL_TTL_SECONDS,
      };
    }),

  updatePhotoMetadata: protectedProcedure
    .input(updateWorkLogPhotoSchema)
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
          message: "You do not have permission to update this photo.",
        });
      }

      const { data: photoRecord, error: photoError } = await supabase
        .schema("core")
        .from("work_log_photos")
        .select("id, work_log_id, caption, photo_type, display_order")
        .eq("id", input.photoId)
        .single();

      if (
        photoError || !photoRecord || photoRecord.work_log_id !== workLog.id
      ) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Work log photo not found.",
        });
      }

      const updates: Record<string, unknown> = {};
      const oldValue: Record<string, unknown> = {};
      const newValue: Record<string, unknown> = {};

      if (typeof input.caption !== "undefined") {
        updates.caption = input.caption ?? null;
        oldValue.caption = photoRecord.caption ?? null;
        newValue.caption = updates.caption;
      }

      if (typeof input.photoType !== "undefined") {
        updates.photo_type = input.photoType ?? null;
        oldValue.photo_type = photoRecord.photo_type ?? null;
        newValue.photo_type = updates.photo_type;
      }

      if (typeof input.displayOrder !== "undefined") {
        updates.display_order = input.displayOrder ?? 0;
        oldValue.display_order = photoRecord.display_order ?? 0;
        newValue.display_order = updates.display_order;
      }

      if (Object.keys(updates).length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No metadata fields provided for update.",
        });
      }

      updates.updated_at = new Date().toISOString();

      const { data: updatedPhoto, error: updateError } = await supabase
        .schema("core")
        .from("work_log_photos")
        .update(updates)
        .eq("id", input.photoId)
        .select()
        .single();

      if (updateError || !updatedPhoto) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update photo metadata.",
        });
      }

      await recordAuditLog(supabase, {
        workLogId: workLog.id,
        userId: user.id,
        action: "edit",
        oldValue,
        newValue,
      });

      return updatedPhoto;
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
        oldValue: {
          photo_id: photo.id,
          show_on_profile: photo.show_on_profile,
        },
        newValue: { photo_id: photo.id, show_on_profile: input.showOnProfile },
      });

      return data;
    }),

  deletePhoto: protectedProcedure
    .input(deleteWorkLogPhotoSchema)
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
          message: "You do not have permission to delete this photo.",
        });
      }

      const { data: photoRecord, error: photoError } = await supabase
        .schema("core")
        .from("work_log_photos")
        .select(
          "id, work_log_id, file_path, thumbnail_path, medium_path, file_size_bytes",
        )
        .eq("id", input.photoId)
        .single();

      if (
        photoError || !photoRecord || photoRecord.work_log_id !== workLog.id
      ) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Work log photo not found.",
        });
      }

      const filePaths = [
        photoRecord.file_path,
        photoRecord.thumbnail_path,
        photoRecord.medium_path,
      ].filter((value): value is string =>
        typeof value === "string" && value.length > 0
      );

      if (filePaths.length > 0) {
        const { error: removeError } = await supabase.storage
          .from(WORK_LOG_PHOTO_BUCKET)
          .remove(filePaths);

        if (removeError) {
          console.warn(
            "[workLogs.deletePhoto] Failed to delete storage objects",
            {
              workLogId: workLog.id,
              photoId: photoRecord.id,
              message: removeError.message,
            },
          );
        }
      }

      const { error: deleteError } = await supabase
        .schema("core")
        .from("work_log_photos")
        .delete()
        .eq("id", input.photoId);

      if (deleteError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete photo record.",
        });
      }

      const photoBytes = typeof photoRecord.file_size_bytes === "number"
        ? photoRecord.file_size_bytes
        : Number(photoRecord.file_size_bytes ?? 0);

      if (photoBytes > 0) {
        const { data: usage } = await supabase
          .schema("core")
          .from("user_storage_usage")
          .select("work_log_photos_bytes")
          .eq("user_id", workLog.user_id)
          .maybeSingle();

        if (usage) {
          const nextBytes = Math.max(
            0,
            (usage.work_log_photos_bytes ?? 0) - photoBytes,
          );
          const { error: usageError } = await supabase
            .schema("core")
            .from("user_storage_usage")
            .update({
              work_log_photos_bytes: nextBytes,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", workLog.user_id);

          if (usageError) {
            console.warn(
              "[workLogs.deletePhoto] Failed to update usage metrics",
              {
                userId: workLog.user_id,
                message: usageError.message,
              },
            );
          }
        }
      }

      await recordAuditLog(supabase, {
        workLogId: workLog.id,
        userId: user.id,
        action: "photo_removed",
        oldValue: {
          photo_id: photoRecord.id,
          file_path: photoRecord.file_path,
        },
        newValue: null,
      });

      return { success: true };
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
          show_date_range_on_profile: updates.show_date_range_on_profile ??
            workLog.show_date_range_on_profile,
        },
      });

      return data;
    }),

  moveToProject: protectedProcedure.input(moveWorkLogSchema).mutation(
    async ({ ctx, input }) => {
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
          message: "Only the owner can move a work log between projects.",
        });
      }

      if (
        workLog.project_id === input.targetProjectId &&
        !workLog.pending_move_to_project_id
      ) {
        return workLog;
      }

      if (workLog.pending_move_to_project_id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "A move request is already pending. Cancel the existing request before creating a new one.",
        });
      }

      const sourceProject = await fetchProjectRecord(
        supabase,
        workLog.project_id,
        "Source project not found.",
      );

      const targetProject = await fetchProjectRecord(
        supabase,
        input.targetProjectId,
        "Target project not found.",
      );

      if (sourceProject.organization_id !== targetProject.organization_id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Work logs can only be moved between projects within the same organization.",
        });
      }

      const organization = await fetchOrganizationMoveSettings(
        supabase,
        sourceProject.organization_id,
      );

      const requireApproval = resolveMoveApprovalRequirement(
        targetProject,
        organization,
        input.requireApproval,
      );

      const managerRecipients = new Set<string>(
        await getOrganizationManagerIds(supabase, organization.id),
      );
      if (organization.owner_user_id) {
        managerRecipients.add(organization.owner_user_id);
      }
      managerRecipients.delete(user.id);

      const notificationClient = supabaseAdmin ?? supabase;
      const nowIso = new Date().toISOString();

      if (requireApproval) {
        const pendingUpdates: Record<string, unknown> = {
          pending_move_to_project_id: input.targetProjectId,
          pending_move_reason: input.reason,
          pending_move_requested_at: nowIso,
          pending_move_requested_by: user.id,
          updated_at: nowIso,
        };

        const { data, error } = await supabase
          .schema("core")
          .from("work_logs")
          .update(pendingUpdates)
          .eq("id", input.workLogId)
          .select()
          .single();

        if (error || !data) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to request work log move",
          });
        }

        await recordAuditLog(supabase, {
          workLogId: input.workLogId,
          userId: user.id,
          action: "move_requested",
          oldValue: { project_id: workLog.project_id },
          newValue: {
            pending_move_to_project_id: input.targetProjectId,
            pending_move_reason: input.reason,
          },
          reason: input.reason,
        });

        const actorName = await getUserDisplayName(supabase, user.id);
        await createSystemMessage(
          supabase,
          data,
          user.id,
          `Work log move requested by ${actorName}: ${input.reason}`,
        );

        if (managerRecipients.size > 0) {
          await notifyMoveEvent(notificationClient, [...managerRecipients], {
            actorId: user.id,
            workLogId: workLog.id,
            title: "Work Log Move Requires Approval",
            message:
              "A work log move is awaiting your approval before it can be completed.",
            metadata: {
              targetProjectId: input.targetProjectId,
              reason: input.reason,
              status: "pending",
            },
          });
        }

        return data;
      }

      const updates: Record<string, unknown> = {
        project_id: input.targetProjectId,
        pending_move_to_project_id: null,
        pending_move_reason: null,
        pending_move_requested_at: null,
        pending_move_requested_by: null,
        updated_at: nowIso,
      };

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
        reason: input.reason,
      });

      const actorName = await getUserDisplayName(supabase, user.id);
      await createSystemMessage(
        supabase,
        data,
        user.id,
        `Work log moved to a new project by ${actorName}. Reason: ${input.reason}`,
      );

      if (managerRecipients.size > 0) {
        await notifyMoveEvent(notificationClient, [...managerRecipients], {
          actorId: user.id,
          workLogId: workLog.id,
          title: "Work Log Moved",
          message:
            "A work log was moved to a different project. Review the entry if any follow-up is required.",
          metadata: {
            targetProjectId: input.targetProjectId,
            reason: input.reason,
            status: "completed",
          },
        });
      }

      return data;
    },
  ),

  approveMoveRequest: protectedProcedure
    .input(approveWorkLogMoveSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase, supabaseAdmin, user } = ctx;

      if (!user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const workLog = await fetchWorkLog(supabase, input.workLogId);

      if (!workLog.pending_move_to_project_id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "There is no pending move request for this work log.",
        });
      }

      const targetProject = await fetchProjectRecord(
        supabase,
        workLog.pending_move_to_project_id,
        "Pending move target project not found.",
      );

      const organization = await fetchOrganizationMoveSettings(
        supabase,
        targetProject.organization_id,
      );

      await assertUserIsOrganizationManager(supabase, user.id, organization);

      const notificationClient = supabaseAdmin ?? supabase;
      const nowIso = new Date().toISOString();

      const { data, error } = await supabase
        .schema("core")
        .from("work_logs")
        .update({
          project_id: workLog.pending_move_to_project_id,
          pending_move_to_project_id: null,
          pending_move_reason: null,
          pending_move_requested_at: null,
          pending_move_requested_by: null,
          updated_at: nowIso,
        })
        .eq("id", workLog.id)
        .select()
        .single();

      if (error || !data) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to approve move request",
        });
      }

      await recordAuditLog(supabase, {
        workLogId: workLog.id,
        userId: user.id,
        action: "move_approved",
        oldValue: {
          project_id: workLog.project_id,
          pending_move_to_project_id: workLog.pending_move_to_project_id,
        },
        newValue: { project_id: data.project_id },
        reason: workLog.pending_move_reason ?? null,
      });

      const actorName = await getUserDisplayName(supabase, user.id);
      await createSystemMessage(
        supabase,
        data,
        user.id,
        `Work log move approved by ${actorName}.`,
      );

      const requesterId = workLog.pending_move_requested_by ??
        workLog.user_id ?? null;

      if (requesterId) {
        await notifyMoveEvent(notificationClient, [requesterId], {
          actorId: user.id,
          workLogId: workLog.id,
          title: "Work Log Move Approved",
          message:
            "Your work log move request has been approved and is now complete.",
          metadata: {
            targetProjectId: data.project_id,
            status: "approved",
          },
        });
      }

      return data;
    }),

  denyMoveRequest: protectedProcedure
    .input(denyWorkLogMoveSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase, supabaseAdmin, user } = ctx;

      if (!user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const workLog = await fetchWorkLog(supabase, input.workLogId);

      if (!workLog.pending_move_to_project_id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "There is no pending move request for this work log.",
        });
      }

      const targetProject = await fetchProjectRecord(
        supabase,
        workLog.pending_move_to_project_id,
        "Pending move target project not found.",
      );

      const organization = await fetchOrganizationMoveSettings(
        supabase,
        targetProject.organization_id,
      );

      await assertUserIsOrganizationManager(supabase, user.id, organization);

      const notificationClient = supabaseAdmin ?? supabase;

      const { data, error } = await supabase
        .schema("core")
        .from("work_logs")
        .update({
          pending_move_to_project_id: null,
          pending_move_reason: null,
          pending_move_requested_at: null,
          pending_move_requested_by: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", workLog.id)
        .select()
        .single();

      if (error || !data) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to deny move request",
        });
      }

      await recordAuditLog(supabase, {
        workLogId: workLog.id,
        userId: user.id,
        action: "move_denied",
        oldValue: {
          pending_move_to_project_id: workLog.pending_move_to_project_id,
          pending_move_reason: workLog.pending_move_reason,
        },
        newValue: {
          pending_move_to_project_id: null,
          pending_move_reason: null,
        },
        reason: input.reason,
      });

      const actorName = await getUserDisplayName(supabase, user.id);
      await createSystemMessage(
        supabase,
        data,
        user.id,
        `Work log move denied by ${actorName}: ${input.reason}`,
      );

      const requesterId = workLog.pending_move_requested_by ??
        workLog.user_id ?? null;

      if (requesterId) {
        await notifyMoveEvent(notificationClient, [requesterId], {
          actorId: user.id,
          workLogId: workLog.id,
          title: "Work Log Move Denied",
          message:
            "Your work log move request was denied. Review the provided reason before submitting another request.",
          metadata: {
            targetProjectId: workLog.pending_move_to_project_id,
            denialReason: input.reason,
            status: "denied",
          },
        });
      }

      return data;
    }),

  cancelMoveRequest: protectedProcedure
    .input(cancelWorkLogMoveSchema)
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
          message: "Only the owner can cancel a move request.",
        });
      }

      if (!workLog.pending_move_to_project_id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "There is no pending move request to cancel.",
        });
      }

      const sourceProject = await fetchProjectRecord(
        supabase,
        workLog.project_id,
        "Source project not found.",
      );

      const organization = await fetchOrganizationMoveSettings(
        supabase,
        sourceProject.organization_id,
      );

      const managerRecipients = new Set<string>(
        await getOrganizationManagerIds(supabase, organization.id),
      );
      if (organization.owner_user_id) {
        managerRecipients.add(organization.owner_user_id);
      }
      managerRecipients.delete(user.id);

      const notificationClient = supabaseAdmin ?? supabase;

      const { data, error } = await supabase
        .schema("core")
        .from("work_logs")
        .update({
          pending_move_to_project_id: null,
          pending_move_reason: null,
          pending_move_requested_at: null,
          pending_move_requested_by: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", workLog.id)
        .select()
        .single();

      if (error || !data) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to cancel move request",
        });
      }

      await recordAuditLog(supabase, {
        workLogId: workLog.id,
        userId: user.id,
        action: "move_cancelled",
        oldValue: {
          pending_move_to_project_id: workLog.pending_move_to_project_id,
          pending_move_reason: workLog.pending_move_reason,
        },
        newValue: {
          pending_move_to_project_id: null,
          pending_move_reason: null,
        },
        reason: workLog.pending_move_reason ?? null,
      });

      const actorName = await getUserDisplayName(supabase, user.id);
      await createSystemMessage(
        supabase,
        data,
        user.id,
        `Work log move request cancelled by ${actorName}.`,
      );

      if (managerRecipients.size > 0) {
        await notifyMoveEvent(notificationClient, [...managerRecipients], {
          actorId: user.id,
          workLogId: workLog.id,
          title: "Work Log Move Cancelled",
          message:
            "A pending work log move request was cancelled by the worker.",
          metadata: {
            previousTargetProjectId: workLog.pending_move_to_project_id,
            status: "cancelled",
          },
        });
      }

      return data;
    }),

  exportWorkLog: protectedProcedure.input(exportWorkLogSchema).mutation(
    async ({ ctx, input }) => {
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
          message: "Only the owner can export this work log.",
        });
      }

      const snapshot = await buildWorkLogExportSnapshot(supabase, workLog);

      const baseNameParts = [
        "work-log",
        workLog.log_date ?? null,
        workLog.id.slice(0, 8),
      ].filter(
        Boolean,
      );

      const proposedName = sanitizeFileName(baseNameParts.join("-"));
      const fileBaseName = proposedName.length > 0
        ? proposedName
        : `work-log-${workLog.id.slice(0, 8)}`;

      let fileBytes: Uint8Array;
      let mimeType: string;
      let extension: "pdf" | "csv";

      if (input.format === "pdf") {
        const pdfBytes = await buildWorkLogPdf(snapshot);
        fileBytes = pdfBytes;
        mimeType = "application/pdf";
        extension = "pdf";
      } else {
        const csvContent = buildWorkLogCsv(snapshot);
        const csvBytes = new TextEncoder().encode(csvContent);
        fileBytes = csvBytes;
        mimeType = "text/csv";
        extension = "csv";
      }

      const timestampSuffix = new Date()
        .toISOString()
        .replace(/[-:TZ.]/g, "")
        .slice(0, 14);

      const storagePath =
        `${user.id}/${workLog.id}/${fileBaseName}-${timestampSuffix}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from(WORK_LOG_EXPORT_BUCKET)
        .upload(storagePath, fileBytes, {
          contentType: mimeType,
          upsert: true,
        });

      if (uploadError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to persist work log export.",
        });
      }

      const { data: signedUrlData, error: signedUrlError } = await supabase
        .storage
        .from(WORK_LOG_EXPORT_BUCKET)
        .createSignedUrl(storagePath, SIGNED_EXPORT_URL_TTL_SECONDS);

      if (signedUrlError || !signedUrlData?.signedUrl) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate download link for work log export.",
        });
      }

      const expiresAtIso = signedUrlData.expiresAt ??
        new Date(Date.now() + SIGNED_EXPORT_URL_TTL_SECONDS * 1000)
          .toISOString();

      await recordAuditLog(supabase, {
        workLogId: workLog.id,
        userId: user.id,
        action: "export_generated",
        newValue: {
          format: extension,
          storagePath,
        },
      });

      return {
        fileName: `${fileBaseName}.${extension}`,
        mimeType,
        byteLength: fileBytes.length,
        downloadUrl: signedUrlData.signedUrl,
        expiresAt: expiresAtIso,
        storagePath,
      };
    },
  ),

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

      const relevantLogs = (workLogs ?? []).filter((
        log: { id: string | number },
      ) => log.id !== input.workLogId);

      const conflicts = relevantLogs
        .map((log: { id: string | number; [key: string]: unknown }) => ({
          workLogId: log.id,
          conflicts: intersectingEntries(
            input.timeEntries,
            log.time_entries as Array<{ start: string; end: string }>,
          ),
        }))
        .filter(({ conflicts }: { conflicts: unknown[] }) => (conflicts as unknown[]).length > 0);

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
