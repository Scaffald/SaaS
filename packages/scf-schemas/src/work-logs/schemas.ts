import { z } from 'zod';

import { LOCATION_PERMISSION_STATUS_VALUES } from '../common/location.ts';

const TIME_24_HOUR = /^([01]\d|2[0-3]):([0-5]\d)$/;

const WORK_LOG_ENTRY_TYPES = ["daily", "project", "task"] as const;
const WORK_LOG_VISIBILITY = ["public", "private"] as const;
const WORK_LOG_STATUS = [
  "draft",
  "pending_verification",
  "verified",
  "disputed",
] as const;
const WORK_LOG_PHOTO_TYPES = [
  "before",
  "progress",
  "after",
  "general",
] as const;

export const WORK_LOG_LIST_SORT_FIELDS = [
  "log_date",
  "created_at",
  "updated_at",
  "total_hours",
] as const;

export const workLogListSortFieldSchema = z.enum(WORK_LOG_LIST_SORT_FIELDS);
export type WorkLogListSortField = z.infer<typeof workLogListSortFieldSchema>;

export const workLogSortDirectionSchema = z.enum(["asc", "desc"]);
export type WorkLogSortDirection = z.infer<typeof workLogSortDirectionSchema>;

const TWO_MB_IN_BYTES = 2 * 1024 * 1024;
const MAX_MINUTES_PER_DAY = 24 * 60;

const toMinutes = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

export const hasTimeEntriesOverlap = (
  entries: Array<{ start: string; end: string }>,
) => {
  const sorted = [...entries]
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => toMinutes(a.entry.start) - toMinutes(b.entry.start));

  for (let i = 1; i < sorted.length; i += 1) {
    const current = sorted[i];
    const previous = sorted[i - 1];
    const currentStart = toMinutes(current.entry.start);
    const previousEnd = toMinutes(previous.entry.end);
    if (currentStart < previousEnd) {
      return true;
    }
  }

  return false;
};

export const timeEntrySchema = z
  .object({
    start: z.string().regex(
      TIME_24_HOUR,
      "Invalid time format. Expected HH:MM in 24-hour format.",
    ),
    end: z.string().regex(
      TIME_24_HOUR,
      "Invalid time format. Expected HH:MM in 24-hour format.",
    ),
  })
  .superRefine((entry, ctx) => {
    if (entry.start >= entry.end) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Time entry end must be after the start time.",
        path: ["end"],
      });
    }
  });

export type TimeEntryInput = z.infer<typeof timeEntrySchema>;

export const timeEntriesSchema = z
  .array(timeEntrySchema)
  .min(1, "At least one time entry is required.")
  .superRefine((entries, ctx) => {
    if (hasTimeEntriesOverlap(entries)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Time overlap detected between entries.",
      });
    }

    const totalMinutes = entries.reduce((sum, entry) => {
      const start = toMinutes(entry.start);
      const end = toMinutes(entry.end);
      return sum + (end - start);
    }, 0);

    if (totalMinutes <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Total logged time must be greater than zero.",
        path: [0, "start"],
      });
    }

    if (totalMinutes > MAX_MINUTES_PER_DAY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Total logged time cannot exceed 24 hours per work log.",
      });
    }
  });

export const workLogStatusSchema = z.enum(WORK_LOG_STATUS);
export type WorkLogStatus = z.infer<typeof workLogStatusSchema>;

export const workLogVisibilitySchema = z.enum(WORK_LOG_VISIBILITY);
export type WorkLogVisibility = z.infer<typeof workLogVisibilitySchema>;

const gpsCaptureSchema = z
  .object({
    latitude: z
      .number()
      .gte(-90, "Latitude must be greater than or equal to -90.")
      .lte(90, "Latitude must be less than or equal to 90."),
    longitude: z
      .number()
      .gte(-180, "Longitude must be greater than or equal to -180.")
      .lte(180, "Longitude must be less than or equal to 180."),
    accuracyMeters: z
      .number()
      .positive("Accuracy must be greater than zero.")
      .nullable()
      .optional(),
    capturedAt: z.string().datetime().optional(),
    deviceType: z.enum(["ios", "android", "web"]).optional(),
    permissionStatus: z.enum(LOCATION_PERMISSION_STATUS_VALUES).optional(),
  })
  .strict();

const baseWorkLogFieldsSchema = z.object({
  entryType: z.enum(WORK_LOG_ENTRY_TYPES).default("daily"),
  logDate: z.string().regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "Invalid date format. Expected YYYY-MM-DD.",
  ),
  timeEntries: timeEntriesSchema,
  workDescription: z.string().min(1, "Work description is required."),
  tasksCompleted: z
    .array(z.string().min(1, "Task descriptions must not be empty."))
    .max(50, "A maximum of 50 tasks can be provided.")
    .default([]),
  skillsUsed: z
    .array(z.string().uuid())
    .max(100, "A maximum of 100 skills can be attached.")
    .default([]),
  visibility: workLogVisibilitySchema.default("private"),
  showOnProfile: z.boolean().default(false),
  showDateRangeOnProfile: z.boolean().default(false),
  gpsCapture: gpsCaptureSchema.optional(),
});

export const createWorkLogSchema = baseWorkLogFieldsSchema.extend({
  projectId: z.string().uuid(),
});

export type CreateWorkLogInput = z.infer<typeof createWorkLogSchema>;

const editableWorkLogFieldsSchema = baseWorkLogFieldsSchema
  .extend({
    status: workLogStatusSchema.optional(),
  })
  .partial();

export const updateWorkLogSchema = z
  .object({
    workLogId: z.string().uuid(),
    payload: editableWorkLogFieldsSchema,
    reason: z
      .string()
      .min(1, "A reason is required after submission.")
      .max(500, "Reasons must not exceed 500 characters.")
      .optional(),
  })
  .superRefine((input, ctx) => {
    if (Object.keys(input.payload).length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["payload"],
        message:
          "At least one field must be provided when updating a work log.",
      });
    }

    if (input.payload.timeEntries && input.payload.timeEntries.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["payload", "timeEntries"],
        message: "Time entries cannot be set to an empty array.",
      });
    }
  });

export type UpdateWorkLogInput = z.infer<typeof updateWorkLogSchema>;

export const submitWorkLogSchema = z.object({
  workLogId: z.string().uuid(),
  forceSubmit: z.boolean().default(false),
  reason: z.string().min(1).max(500).optional(),
});

export type SubmitWorkLogInput = z.infer<typeof submitWorkLogSchema>;

export const verifyWorkLogSchema = z.object({
  workLogId: z.string().uuid(),
});

export const disputeWorkLogSchema = z.object({
  workLogId: z.string().uuid(),
  disputeReason: z.string().min(1, "A dispute reason is required.").max(500),
  message: z.string().min(1, "A dispute message is required.").max(2_000),
});

export type DisputeWorkLogInput = z.infer<typeof disputeWorkLogSchema>;

export const addCollaboratorSchema = z.object({
  workLogId: z.string().uuid(),
  collaboratorUserId: z.string().uuid(),
  permissionLevel: z.enum(["view", "edit"]).default("view"),
});

export type AddCollaboratorInput = z.infer<typeof addCollaboratorSchema>;

export const updateCollaboratorSchema = z.object({
  workLogId: z.string().uuid(),
  collaboratorUserId: z.string().uuid(),
  permissionLevel: z.enum(["view", "edit"]),
});

export const removeCollaboratorSchema = z.object({
  workLogId: z.string().uuid(),
  collaboratorUserId: z.string().uuid(),
});

export const addWorkLogCommentSchema = z.object({
  workLogId: z.string().uuid(),
  message: z
    .string()
    .min(1, "Comment cannot be empty.")
    .max(2_000, "Comments cannot exceed 2000 characters."),
  isSystemMessage: z.boolean().default(false),
});

export type AddWorkLogCommentInput = z.infer<typeof addWorkLogCommentSchema>;

export const uploadWorkLogPhotoSchema = z.object({
  workLogId: z.string().uuid(),
  fileName: z.string().min(1),
  fileSizeBytes: z
    .number()
    .int()
    .positive()
    .max(TWO_MB_IN_BYTES, "Files must be 2MB or less before compression."),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  caption: z.string().max(500).optional(),
  photoType: z.enum(WORK_LOG_PHOTO_TYPES).optional(),
  displayOrder: z.number().int().nonnegative().optional(),
  showOnProfile: z.boolean().optional(),
  takenAt: z.string().datetime().optional(),
  gpsCapture: gpsCaptureSchema.optional(),
});

export type UploadWorkLogPhotoInput = z.infer<typeof uploadWorkLogPhotoSchema>;

export const updateWorkLogPhotoSchema = z.object({
  photoId: z.string().uuid(),
  workLogId: z.string().uuid(),
  caption: z.string().max(500).nullable().optional(),
  photoType: z.enum(WORK_LOG_PHOTO_TYPES).optional(),
  displayOrder: z.number().int().min(0).max(10_000).optional(),
});

export type UpdateWorkLogPhotoInput = z.infer<typeof updateWorkLogPhotoSchema>;

export const updatePhotoVisibilitySchema = z.object({
  photoId: z.string().uuid(),
  showOnProfile: z.boolean(),
});

export const deleteWorkLogPhotoSchema = z.object({
  photoId: z.string().uuid(),
  workLogId: z.string().uuid(),
});

export type DeleteWorkLogPhotoInput = z.infer<typeof deleteWorkLogPhotoSchema>;

export const updateProfileVisibilitySchema = z
  .object({
    workLogId: z.string().uuid(),
    visibility: workLogVisibilitySchema.optional(),
    showOnProfile: z.boolean().optional(),
    showDateRangeOnProfile: z.boolean().optional(),
  })
  .superRefine((input, ctx) => {
    const { visibility, showOnProfile, showDateRangeOnProfile } = input;
    if (
      visibility === undefined &&
      showOnProfile === undefined &&
      showDateRangeOnProfile === undefined
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [],
        message: "At least one visibility field must be updated.",
      });
    }
  });

export const moveWorkLogSchema = z.object({
  workLogId: z.string().uuid(),
  targetProjectId: z.string().uuid(),
  reason: z
    .string()
    .min(1, "A reason is required when requesting a project move.")
    .max(500, "Move reasons cannot exceed 500 characters."),
  requireApproval: z.boolean().optional(),
});

export type MoveWorkLogInput = z.infer<typeof moveWorkLogSchema>;

export const approveWorkLogMoveSchema = z.object({
  workLogId: z.string().uuid(),
});

export type ApproveWorkLogMoveInput = z.infer<typeof approveWorkLogMoveSchema>;

export const denyWorkLogMoveSchema = z.object({
  workLogId: z.string().uuid(),
  reason: z
    .string()
    .min(1, "A denial reason is required.")
    .max(500, "Denial reasons cannot exceed 500 characters."),
});

export type DenyWorkLogMoveInput = z.infer<typeof denyWorkLogMoveSchema>;

export const cancelWorkLogMoveSchema = z.object({
  workLogId: z.string().uuid(),
});

export type CancelWorkLogMoveInput = z.infer<typeof cancelWorkLogMoveSchema>;

export const exportWorkLogSchema = z.object({
  workLogId: z.string().uuid(),
  format: z.enum(["csv", "pdf"]).default("csv"),
});

export type ExportWorkLogInput = z.infer<typeof exportWorkLogSchema>;

export const checkTimeOverlapSchema = z.object({
  logDate: z.string().regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "Invalid date format. Expected YYYY-MM-DD.",
  ),
  timeEntries: timeEntriesSchema,
  workLogId: z.string().uuid().optional(),
});

export type CheckTimeOverlapInput = z.infer<typeof checkTimeOverlapSchema>;

export const getSuggestedSkillsSchema = z.object({
  workLogId: z.string().uuid(),
});

export type GetSuggestedSkillsInput = z.infer<typeof getSuggestedSkillsSchema>;

const baseAddSkillSchema = z.object({
  workLogId: z.string().uuid(),
  proficiencyLevel: z.number().int().min(
    0,
    "Proficiency must be between 0 and 5.",
  ).max(5),
  yearsExperience: z.number().min(0, "Years of experience cannot be negative.")
    .max(100).optional(),
});

export const addSkillToProfileSchema = z.discriminatedUnion("taxonomy", [
  baseAddSkillSchema.extend({
    taxonomy: z.literal("csi"),
    skillId: z.string().uuid({
      message: "CSI skills must reference a valid UUID.",
    }),
  }),
  baseAddSkillSchema.extend({
    taxonomy: z.literal("onet"),
    skillId: z.string().min(
      1,
      "O*NET skills must provide a valid occupation code.",
    ),
  }),
]);

export type AddSkillToProfileInput = z.infer<typeof addSkillToProfileSchema>;

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const statusSummaryEntrySchema = z.object({
  count: z.number().int().nonnegative(),
  hours: z.number().min(0),
});

export const workLogStatusSummarySchema = z.object({
  draft: statusSummaryEntrySchema,
  pending_verification: statusSummaryEntrySchema,
  verified: statusSummaryEntrySchema,
  disputed: statusSummaryEntrySchema,
});

export type WorkLogStatusSummary = z.infer<typeof workLogStatusSummarySchema>;

const workLogProjectMetadataSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  status: z.string().nullable(),
  isArchived: z.boolean(),
  organizationId: z.string().uuid().nullable(),
  projectNumber: z.string().nullable(),
});

export type WorkLogProjectMetadata = z.infer<
  typeof workLogProjectMetadataSchema
>;

export const workLogListQuerySchema = z.object({
  page: z.number().int().min(0).default(0),
  pageSize: z.number().int().min(1).max(100).default(20),
  statuses: z.array(workLogStatusSchema).optional(),
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
  sortField: workLogListSortFieldSchema.default("log_date"),
  sortDirection: workLogSortDirectionSchema.default("desc"),
});

export type WorkLogListQuery = z.infer<typeof workLogListQuerySchema>;

const workLogPaginationSchema = z.object({
  page: z.number().int().min(0),
  pageSize: z.number().int().min(1),
  totalItems: z.number().int().min(0),
  totalPages: z.number().int().min(1),
});

const workLogListItemSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid().nullable(),
  project: workLogProjectMetadataSchema.nullable(),
  status: workLogStatusSchema,
  logDate: z.string().nullable(),
  entryType: z.string(),
  totalHours: z.number().min(0),
  submittedAt: z.string().nullable(),
  verifiedAt: z.string().nullable(),
  disputedAt: z.string().nullable(),
  disputeReason: z.string().nullable(),
  visibility: workLogVisibilitySchema,
  showOnProfile: z.boolean(),
  showDateRangeOnProfile: z.boolean(),
  createdAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
  photoCount: z.number().int().min(0),
  collaboratorCount: z.number().int().min(0),
  commentCount: z.number().int().min(0),
  descriptionPreview: z.string().nullable(),
});

export type WorkLogListItem = z.infer<typeof workLogListItemSchema>;

export const workLogListResponseSchema = z.object({
  items: z.array(workLogListItemSchema),
  pagination: workLogPaginationSchema,
  aggregates: z.object({
    totalHours: z.number().min(0),
    totalPhotos: z.number().int().min(0),
    totalComments: z.number().int().min(0),
    statusSummary: workLogStatusSummarySchema,
  }),
  filtersApplied: z.object({
    statuses: z.array(workLogStatusSchema).nullable(),
    projectId: z.string().uuid().nullable(),
    dateFrom: z.string().regex(DATE_ONLY_REGEX).nullable(),
    dateTo: z.string().regex(DATE_ONLY_REGEX).nullable(),
    search: z.string().nullable(),
    sortField: workLogListSortFieldSchema,
    sortDirection: workLogSortDirectionSchema,
  }),
});

export type WorkLogListResponse = z.infer<typeof workLogListResponseSchema>;

const workLogOverviewProjectSummarySchema = z.object({
  projectId: z.string().uuid(),
  project: workLogProjectMetadataSchema.nullable(),
  totalLogs: z.number().int().min(0),
  totalHours: z.number().min(0),
  verifiedHours: z.number().min(0),
  disputedCount: z.number().int().min(0),
  pendingVerificationCount: z.number().int().min(0),
  photoCount: z.number().int().min(0),
  commentCount: z.number().int().min(0),
  collaboratorCount: z.number().int().min(0),
  statusSummary: workLogStatusSummarySchema,
  lastActivityAt: z.string().nullable(),
});

const workLogRecentActivitySchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid().nullable(),
  project: workLogProjectMetadataSchema.nullable(),
  status: workLogStatusSchema,
  logDate: z.string().nullable(),
  totalHours: z.number().min(0),
  photoCount: z.number().int().min(0),
  commentCount: z.number().int().min(0),
  updatedAt: z.string().nullable(),
});

export const workLogOverviewResponseSchema = z.object({
  totals: z.object({
    totalLogs: z.number().int().min(0),
    totalHours: z.number().min(0),
    verifiedHours: z.number().min(0),
    statusSummary: workLogStatusSummarySchema,
    pendingVerificationCount: z.number().int().min(0),
    disputedCount: z.number().int().min(0),
    needsAttentionCount: z.number().int().min(0),
  }),
  media: z.object({
    totalPhotos: z.number().int().min(0),
    totalComments: z.number().int().min(0),
    uniqueCollaborators: z.number().int().min(0),
  }),
  projectSummaries: z.array(workLogOverviewProjectSummarySchema),
  recentActivity: z.array(workLogRecentActivitySchema),
  filtersApplied: z.object({
    dateFrom: z.string().regex(DATE_ONLY_REGEX).nullable(),
    dateTo: z.string().regex(DATE_ONLY_REGEX).nullable(),
  }),
});

export type WorkLogOverviewResponse = z.infer<
  typeof workLogOverviewResponseSchema
>;

const workLogProjectTimelineEntrySchema = z.object({
  logDate: z.string().regex(DATE_ONLY_REGEX),
  totalHours: z.number().min(0),
  verifiedHours: z.number().min(0),
});

const workLogProjectRecentActivitySchema = z.object({
  id: z.string().uuid(),
  status: workLogStatusSchema,
  logDate: z.string().nullable(),
  totalHours: z.number().min(0),
  photoCount: z.number().int().min(0),
  commentCount: z.number().int().min(0),
  updatedAt: z.string().nullable(),
});

export const workLogProjectRollupResponseSchema = z.object({
  projectId: z.string().uuid(),
  project: workLogProjectMetadataSchema,
  totals: z.object({
    totalLogs: z.number().int().min(0),
    totalHours: z.number().min(0),
    verifiedHours: z.number().min(0),
    statusSummary: workLogStatusSummarySchema,
    pendingVerificationCount: z.number().int().min(0),
    disputedCount: z.number().int().min(0),
    photoCount: z.number().int().min(0),
    commentCount: z.number().int().min(0),
    collaboratorCount: z.number().int().min(0),
  }),
  timeline: z.array(workLogProjectTimelineEntrySchema),
  recentActivity: z.array(workLogProjectRecentActivitySchema),
  filtersApplied: z.object({
    dateFrom: z.string().regex(DATE_ONLY_REGEX).nullable(),
    dateTo: z.string().regex(DATE_ONLY_REGEX).nullable(),
  }),
});

export type WorkLogProjectRollupResponse = z.infer<
  typeof workLogProjectRollupResponseSchema
>;

const workLogProjectWorkerSummarySchema = z.object({
  userId: z.string().uuid(),
  displayName: z.string(),
  username: z.string().nullable(),
  totalLogs: z.number().int().min(0),
  totalHours: z.number().min(0),
  verifiedHours: z.number().min(0),
  disputedCount: z.number().int().min(0),
  pendingVerificationCount: z.number().int().min(0),
  photoCount: z.number().int().min(0),
  commentCount: z.number().int().min(0),
  statusSummary: workLogStatusSummarySchema,
  latestActivity: z.string().nullable(),
});

const workLogProjectManagerActivitySchema = z.object({
  id: z.string().uuid(),
  workerId: z.string().uuid().nullable(),
  workerName: z.string(),
  status: workLogStatusSchema,
  logDate: z.string().nullable(),
  totalHours: z.number().min(0),
  photoCount: z.number().int().min(0),
  commentCount: z.number().int().min(0),
  updatedAt: z.string().nullable(),
});

export const workLogProjectAnalyticsResponseSchema = z.object({
  projectId: z.string().uuid(),
  project: workLogProjectMetadataSchema,
  totals: z.object({
    totalLogs: z.number().int().min(0),
    totalHours: z.number().min(0),
    verifiedHours: z.number().min(0),
    statusSummary: workLogStatusSummarySchema,
    pendingVerificationCount: z.number().int().min(0),
    disputedCount: z.number().int().min(0),
    photoCount: z.number().int().min(0),
    commentCount: z.number().int().min(0),
    collaboratorCount: z.number().int().min(0),
    uniqueWorkers: z.number().int().min(0),
  }),
  workers: z.array(workLogProjectWorkerSummarySchema),
  timeline: z.array(workLogProjectTimelineEntrySchema),
  recentActivity: z.array(workLogProjectManagerActivitySchema),
  filtersApplied: z.object({
    dateFrom: z.string().regex(DATE_ONLY_REGEX).nullable(),
    dateTo: z.string().regex(DATE_ONLY_REGEX).nullable(),
  }),
});

export type WorkLogProjectAnalyticsResponse = z.infer<
  typeof workLogProjectAnalyticsResponseSchema
>;

export const publicWorkLogPhotoSchema = z.object({
  id: z.string().uuid(),
  caption: z.string().nullable(),
  signedUrl: z.string().nullable(),
  thumbnailSignedUrl: z.string().nullable(),
});

export type PublicWorkLogPhoto = z.infer<typeof publicWorkLogPhotoSchema>;

export const publicWorkLogSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid().nullable(),
  projectName: z.string().nullable(),
  organizationName: z.string().nullable(),
  logDate: z.string().nullable(),
  showDateOnProfile: z.boolean(),
  verifiedAt: z.string().nullable(),
  photos: z.array(publicWorkLogPhotoSchema),
});

export type PublicWorkLog = z.infer<typeof publicWorkLogSchema>;

export const publicWorkLogsResponseSchema = z.object({
  workLogs: z.array(publicWorkLogSchema),
});

export type PublicWorkLogsResponse = z.infer<
  typeof publicWorkLogsResponseSchema
>;
