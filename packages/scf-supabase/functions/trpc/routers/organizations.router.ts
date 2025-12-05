import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  isOrganizationAdminRole,
  isSuperAdmin,
  loadUserRoleAssignments,
} from '../../_shared/permissions/team-permissions.ts';
import type { Context } from '../context.ts';
import { protectedProcedure, t } from '../middleware.ts';

const ORG_DOCUMENT_BUCKET = "organization-documents";
const DOCUMENT_UPLOAD_URL_TTL_SECONDS = 60 * 10;
const DEFAULT_INVITE_EXPIRATION_DAYS = 7;
const DEFAULT_SUBSCRIPTION_TIER = "starter";
const STORAGE_WARNING_LEVELS = [0.75, 0.9, 0.95, 0.99] as const;

const DOCUMENT_CATEGORY_OPTIONS = [
  "contracts",
  "templates",
  "compliance",
  "certifications",
  "onboarding",
  "general",
  "other",
] as const;

const DOCUMENT_PERMISSION_LEVELS = ["view", "edit", "manage"] as const;
const INVITE_STATUS_VALUES = [
  "pending",
  "sent",
  "viewed",
  "accepted",
  "declined",
  "expired",
  "canceled",
] as const;

type MembershipCheckResult = {
  organization: {
    id: string;
    name: string;
    slug: string;
    owner_user_id: string | null;
  };
  superAdmin: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  isMember: boolean;
};

type AuditLogPayload = {
  actionType: string;
  targetType?: string;
  targetId?: string | null;
  description?: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  metadata?: Record<string, unknown>;
};

const sanitizeFileName = (fileName: string) =>
  fileName.replace(/[^a-zA-Z0-9-_.]/g, "_");

async function ensureOrganizationAccess(
  ctx: Context,
  organizationId: string,
  options: { requireAdmin?: boolean } = {},
): Promise<MembershipCheckResult> {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  const { data: organization, error } = await ctx.supabase
    .schema("core")
    .from("organizations")
    .select("id, name, slug, owner_user_id")
    .eq("id", organizationId)
    .single();

  if (error || !organization) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Organization not found",
    });
  }

  const isOwner = organization.owner_user_id === ctx.user.id;
  const assignments = await loadUserRoleAssignments(
    ctx.supabaseAdmin,
    ctx.user.id,
  );
  const superAdmin = isSuperAdmin(assignments);
  const orgAssignments = assignments.filter(
    (assignment) =>
      assignment.scope_org_id === organizationId &&
      assignment.role?.scope === "organization",
  );

  const isAdmin = superAdmin ||
    isOwner ||
    orgAssignments.some((assignment) =>
      isOrganizationAdminRole(assignment.role?.name ?? null)
    );
  const isMember = isAdmin || orgAssignments.length > 0;

  if (options.requireAdmin && !isAdmin) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin permissions are required for this action",
    });
  }

  if (!options.requireAdmin && !isMember) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have access to this organization",
    });
  }

  return {
    organization,
    superAdmin,
    isOwner,
    isAdmin,
    isMember,
  };
}

async function recordOrganizationAuditLog(
  ctx: Context,
  organizationId: string,
  payload: AuditLogPayload,
) {
  await ctx.supabaseAdmin
    .schema("core")
    .from("organization_audit_log")
    .insert({
      organization_id: organizationId,
      actor_user_id: ctx.user?.id ?? null,
      actor_email: ctx.user?.email ?? null,
      action_type: payload.actionType,
      target_type: payload.targetType ?? null,
      target_id: payload.targetId ?? null,
      description: payload.description ?? null,
      before_data: payload.before ?? null,
      after_data: payload.after ?? null,
      metadata: payload.metadata ?? {},
    });
}

async function getStoragePolicy(ctx: Context, organizationId: string) {
  const [{ data: tier }, { data: override }] = await Promise.all([
    ctx.supabase
      .schema("core")
      .from("subscription_tier_limits")
      .select(
        "tier, max_storage_bytes, max_file_bytes, soft_warning_thresholds",
      )
      .eq("tier", DEFAULT_SUBSCRIPTION_TIER)
      .maybeSingle(),
    ctx.supabase
      .schema("core")
      .from("organization_limit_overrides")
      .select("storage_bytes, file_bytes, active")
      .eq("organization_id", organizationId)
      .eq("active", true)
      .maybeSingle(),
  ]);

  const warningThresholds = tier?.soft_warning_thresholds ??
    STORAGE_WARNING_LEVELS;

  return {
    maxStorageBytes: override?.storage_bytes ?? tier?.max_storage_bytes ??
      10 * 1024 * 1024 * 1024,
    maxFileBytes: override?.file_bytes ?? tier?.max_file_bytes ??
      25 * 1024 * 1024,
    warningThresholds,
  };
}

async function getStorageUsage(ctx: Context, organizationId: string) {
  const { data } = await ctx.supabase
    .schema("core")
    .from("organization_storage_usage")
    .select("storage_bytes, document_count, version_count, updated_at")
    .eq("organization_id", organizationId)
    .maybeSingle();

  return (
    data ?? {
      storage_bytes: 0,
      document_count: 0,
      version_count: 0,
      updated_at: new Date().toISOString(),
    }
  );
}

async function incrementStorageUsage(
  ctx: Context,
  organizationId: string,
  deltaBytes: number,
  options: { incrementDocumentCount?: boolean } = {},
) {
  const existing = await getStorageUsage(ctx, organizationId);
  const nextDocCount = existing.document_count +
    (options.incrementDocumentCount ? 1 : 0);

  if (existing.storage_bytes === 0 && existing.version_count === 0) {
    await ctx.supabaseAdmin
      .schema("core")
      .from("organization_storage_usage")
      .upsert({
        organization_id: organizationId,
        storage_bytes: deltaBytes,
        document_count: Math.max(nextDocCount, 1),
        version_count: 1,
      });
  } else {
    await ctx.supabaseAdmin
      .schema("core")
      .from("organization_storage_usage")
      .update({
        storage_bytes: Math.max(0, existing.storage_bytes + deltaBytes),
        document_count: Math.max(0, nextDocCount),
        version_count: existing.version_count + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("organization_id", organizationId);
  }
}

const inviteMemberInputSchema = z.object({
  organizationId: z.string().uuid(),
  email: z.string().email(),
  roleName: z.string().min(1).max(120).default("member"),
  message: z.string().max(1000).optional(),
  personalNote: z.string().max(500).optional(),
});

const updateInvitationSchema = z.object({
  inviteId: z.string().uuid(),
  organizationId: z.string().uuid(),
});

const listInvitationsSchema = z.object({
  organizationId: z.string().uuid(),
  statuses: z.array(z.enum(INVITE_STATUS_VALUES)).optional(),
});

const respondInvitationSchema = z.object({
  token: z.string().min(10),
  reason: z.string().max(500).optional(),
});

const listMembersSchema = z.object({
  organizationId: z.string().uuid(),
  search: z.string().optional(),
  roleNames: z.array(z.string()).optional(),
});

const memberActivitySchema = z.object({
  organizationId: z.string().uuid(),
  lookbackDays: z.number().min(1).max(90).default(30),
});

const removeMemberSchema = z.object({
  organizationId: z.string().uuid(),
  userId: z.string().uuid(),
  reason: z.string().max(500).optional(),
});

const transferOwnershipSchema = z.object({
  organizationId: z.string().uuid(),
  newOwnerUserId: z.string().uuid(),
});

const documentUploadRequestSchema = z.object({
  organizationId: z.string().uuid(),
  documentId: z.string().uuid().optional(),
  name: z.string().min(1).max(255),
  folderId: z.string().uuid().nullable().optional(),
  description: z.string().max(2000).optional(),
  category: z.enum(DOCUMENT_CATEGORY_OPTIONS).default("general"),
  tags: z.array(z.string().max(50)).max(20).optional(),
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(255),
  fileSize: z.number().positive(),
  isTemplate: z.boolean().optional(),
});

const commitDocumentVersionSchema = z.object({
  organizationId: z.string().uuid(),
  documentId: z.string().uuid(),
  versionId: z.string().uuid(),
  storagePath: z.string().min(1),
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(255),
  fileSize: z.number().positive(),
  checksum: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

const listDocumentsSchema = z.object({
  organizationId: z.string().uuid(),
  folderId: z.string().uuid().nullable().optional(),
  search: z.string().optional(),
  category: z.enum(DOCUMENT_CATEGORY_OPTIONS).optional(),
  limit: z.number().min(1).max(100).default(50),
  cursor: z.string().optional(),
});

const documentIdentifierSchema = z.object({
  organizationId: z.string().uuid(),
  documentId: z.string().uuid(),
});

const downloadDocumentSchema = documentIdentifierSchema.extend({
  versionId: z.string().uuid().optional(),
});

const shareDocumentSchema = z.object({
  organizationId: z.string().uuid(),
  documentId: z.string().uuid(),
  permission: z.enum(DOCUMENT_PERMISSION_LEVELS).default("view"),
  shareType: z.enum(["organization_member", "external"]).default(
    "organization_member",
  ),
  targetUserId: z.string().uuid().optional(),
  externalEmail: z.string().email().optional(),
  expiresAt: z.string().datetime().optional(),
});

const viewInvitationSchema = z.object({
  token: z.string().min(10),
});

const folderUpsertSchema = z.object({
  organizationId: z.string().uuid(),
  folderId: z.string().uuid().optional(),
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  parentFolderId: z.string().uuid().nullable().optional(),
});

const updateShareSchema = z.object({
  organizationId: z.string().uuid(),
  shareId: z.string().uuid(),
  permission: z.enum(DOCUMENT_PERMISSION_LEVELS).optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});

const revokeShareSchema = z.object({
  organizationId: z.string().uuid(),
  shareId: z.string().uuid(),
});

const locationUpsertSchema = z.object({
  organizationId: z.string().uuid(),
  locationId: z.string().uuid().optional(),
  name: z.string().min(1).max(255),
  locationType: z.enum([
    "headquarters",
    "branch",
    "job_site",
    "remote",
    "other",
  ]).default("other"),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      postal_code: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  timezone: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  isActive: z.boolean().optional(),
});

const locationArchiveSchema = z.object({
  organizationId: z.string().uuid(),
  locationId: z.string().uuid(),
  isActive: z.boolean().default(false),
});

const updateSettingsSchema = z.object({
  organizationId: z.string().uuid(),
  timezone: z.string().optional(),
  locale: z.string().optional(),
  defaultCurrency: z.string().optional(),
  businessHours: z.array(z.record(z.any())).optional(),
  holidayCalendar: z.array(z.record(z.any())).optional(),
  notificationPreferences: z.record(z.any()).optional(),
  securityPreferences: z.record(z.any()).optional(),
  privacyPreferences: z.record(z.any()).optional(),
  enforceMfa: z.boolean().optional(),
  sessionTimeoutMinutes: z.number().min(15).max(720).optional(),
  ipAllowList: z.array(z.string()).optional(),
});

const auditLogListSchema = z.object({
  organizationId: z.string().uuid(),
  limit: z.number().min(1).max(200).default(50),
  cursor: z.string().optional(),
  actionTypes: z.array(z.string()).optional(),
});

const auditLogExportSchema = z.object({
  organizationId: z.string().uuid(),
  format: z.enum(["csv", "json"]).default("csv"),
  since: z.string().datetime().optional(),
});

const organizationRequestInputSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  slug: z
    .string()
    .min(1, "Vanity URL is required")
    .max(120, "Slug must be 120 characters or fewer"),
  website: z.string().trim().url("Website must be a valid URL").max(255)
    .optional(),
  notes: z.string().trim().max(1000, "Notes must be 1000 characters or fewer")
    .optional(),
});

/**
 * Organizations Router
 * Handles organization-specific queries and operations
 */
export const organizationsRouter = t.router({
  /**
   * Create a moderated organization request accessible to dashboard users.
   * Persists request for office review while enforcing slug uniqueness across
   * live organizations and pending requests.
   */
  createOrganizationRequest: protectedProcedure
    .input(organizationRequestInputSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const trimmedName = input.name.trim();
      const normalizedSlug = input.slug.trim().toLowerCase();
      const slugPattern = /^[a-z0-9-]+$/;

      if (!slugPattern.test(normalizedSlug)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Slug must contain only lowercase letters, numbers, and hyphens.",
        });
      }

      // Ensure slug is not already in use by an existing organization
      const { data: existingOrganization, error: existingOrgError } = await ctx
        .supabase
        .schema("core")
        .from("organizations")
        .select("id")
        .eq("slug", normalizedSlug)
        .maybeSingle();

      if (existingOrgError && existingOrgError.code !== "PGRST116") {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            `Failed to validate organization slug: ${existingOrgError.message}`,
        });
      }

      if (existingOrganization) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An organization with this slug already exists.",
        });
      }

      // Ensure no pending or approved request already exists for this slug
      const { data: existingRequest, error: existingRequestError } = await ctx
        .supabase
        .schema("core")
        .from("organization_requests")
        .select("id, status, created_by_user_id")
        .eq("slug", normalizedSlug)
        .in("status", ["pending", "approved"])
        .maybeSingle();

      if (existingRequestError && existingRequestError.code !== "PGRST116") {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            `Failed to validate organization request: ${existingRequestError.message}`,
        });
      }

      if (existingRequest) {
        const isOwnRequest = existingRequest.created_by_user_id === ctx.user.id;
        throw new TRPCError({
          code: "CONFLICT",
          message: isOwnRequest
            ? "You already have a pending request for this organization."
            : "Another user already requested this organization and it is pending review.",
        });
      }

      const { data: request, error: requestError } = await ctx.supabase
        .schema("core")
        .from("organization_requests")
        .insert({
          name: trimmedName,
          slug: normalizedSlug,
          website: input.website?.trim() ?? null,
          notes: input.notes?.trim() ?? null,
          created_by_user_id: ctx.user.id,
        })
        .select(
          `
          id,
          name,
          slug,
          status,
          created_at
        `,
        )
        .single();

      if (requestError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            `Failed to submit organization request: ${requestError.message}`,
        });
      }

      return { request };
    }),

  /**
   * Get open jobs count for an organization
   */
  getOpenJobsCount: t.procedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { count, error } = await ctx.supabase
        .schema("core")
        .from("jobs")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", input.organizationId)
        .eq("status", "open");

      if (error) {
        throw new Error(`Failed to fetch open jobs count: ${error.message}`);
      }

      return {
        count: count || 0,
        organizationId: input.organizationId,
      };
    }),

  /**
   * Get organization by ID
   */
  getOrganization: t.procedure
    .input(
      z.object({
        id: z.string().uuid(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { data: organization, error } = await ctx.supabase
        .schema("core")
        .from("organizations")
        .select(
          `
          id,
          name,
          slug,
          description,
          website,
          visibility,
          address,
          logo_url,
          industry_id,
          industries (
            id,
            name,
            slug
          ),
          owner_user_id,
          created_at,
          updated_at
        `,
        )
        .eq("id", input.id)
        .single();

      if (error) {
        throw new Error(`Failed to fetch organization: ${error.message}`);
      }

      return organization;
    }),

  /**
   * Update organization's default project location visibility
   */
  updateLocationVisibility: protectedProcedure
    .input(
      z.object({
        organization_id: z.string().uuid(),
        default_project_location_visibility: z.enum([
          "public",
          "authenticated",
          "organization_only",
          "private",
        ]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // Check if user is organization admin
      const { data: org } = await ctx.supabase
        .schema("core")
        .from("organizations")
        .select("owner_user_id")
        .eq("id", input.organization_id)
        .single();

      if (!org) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organization not found",
        });
      }

      // Check if user is owner or admin
      const isOwner = org.owner_user_id === ctx.user.id;
      const { data: roleAssignments } = await ctx.supabase
        .schema("core")
        .from("role_assignments")
        .select("role:roles(name, scope), scope_org_id")
        .eq("user_id", ctx.user.id);

      const isAdmin = roleAssignments?.some(
        (assignment: {
          role: { name: string; scope: string } | null
          scope_org_id: string | null
        }) =>
          assignment.role &&
          (assignment.scope_org_id === input.organization_id ||
            (assignment.role.name === "admin" &&
              assignment.role.scope === "platform") ||
            (assignment.role.name === "super_admin" &&
              assignment.role.scope === "platform")),
      );

      if (!isOwner && !isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Only organization admins can update location visibility settings",
        });
      }

      const { data: organization, error } = await ctx.supabase
        .schema("core")
        .from("organizations")
        .update({
          default_project_location_visibility:
            input.default_project_location_visibility,
        })
        .eq("id", input.organization_id)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to update location visibility: ${error.message}`,
        });
      }

      return { organization };
    }),

  /**
   * Get projects that override organization's default location visibility
   */
  getProjectsWithOverrides: protectedProcedure
    .input(
      z.object({
        organization_id: z.string().uuid(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // Check if user is organization admin
      const { data: org } = await ctx.supabase
        .schema("core")
        .from("organizations")
        .select("owner_user_id")
        .eq("id", input.organization_id)
        .single();

      if (!org) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organization not found",
        });
      }

      const isOwner = org.owner_user_id === ctx.user.id;
      const { data: roleAssignments } = await ctx.supabase
        .schema("core")
        .from("role_assignments")
        .select("role:roles(name, scope), scope_org_id")
        .eq("user_id", ctx.user.id);

      const isAdmin = roleAssignments?.some(
        (assignment: {
          role: { name: string; scope: string } | null
          scope_org_id: string | null
        }) =>
          assignment.role &&
          (assignment.scope_org_id === input.organization_id ||
            (assignment.role.name === "admin" &&
              assignment.role.scope === "platform") ||
            (assignment.role.name === "super_admin" &&
              assignment.role.scope === "platform")),
      );

      if (!isOwner && !isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only organization admins can view projects with overrides",
        });
      }

      const { data: projects, error } = await ctx.supabase
        .schema("core")
        .from("projects")
        .select(
          "id, name, status, location_visibility, location_visibility_override, created_at",
        )
        .eq("organization_id", input.organization_id)
        .eq("location_visibility_override", true)
        .order("created_at", { ascending: false });

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch projects with overrides: ${error.message}`,
        });
      }

      return { projects: projects || [] };
    }),

  /**
   * Invitation management
   */
  listInvitations: protectedProcedure.input(listInvitationsSchema).query(
    async ({ ctx, input }) => {
      await ensureOrganizationAccess(ctx, input.organizationId, {
        requireAdmin: true,
      });

      let query = ctx.supabase
        .schema("core")
        .from("invites")
        .select(
          `
          id,
          invitee_email,
          role_name,
          status,
          message,
          personal_note,
          viewed_at,
          expires_at,
          created_at,
          resent_count
        `,
        )
        .eq("target_type", "organization")
        .eq("organization_id", input.organizationId)
        .order("created_at", { ascending: false });

      if (input.statuses?.length) {
        query = query.in("status", input.statuses);
      }

      const { data, error } = await query;
      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to load invitations: ${error.message}`,
        });
      }

      return data ?? [];
    },
  ),

  inviteMember: protectedProcedure
    .input(inviteMemberInputSchema)
    .mutation(async ({ ctx, input }) => {
      await ensureOrganizationAccess(ctx, input.organizationId, {
        requireAdmin: true,
      });

      const normalizedEmail = input.email.trim().toLowerCase();
      const expiresAt = new Date(
        Date.now() + DEFAULT_INVITE_EXPIRATION_DAYS * 24 * 60 * 60 * 1000,
      ).toISOString();
      const token = crypto.randomUUID();

      const { data: invite, error } = await ctx.supabase
        .schema("core")
        .from("invites")
        .insert({
          organization_id: input.organizationId,
          issuer_user_id: ctx.user.id,
          target_type: "organization",
          target_id: input.organizationId,
          invitee_email: normalizedEmail,
          role_name: input.roleName,
          message: input.message ?? null,
          personal_note: input.personalNote ?? null,
          status: "sent",
          token,
          expires_at: expiresAt,
        })
        .select("id, token, expires_at, invitee_email, role_name")
        .single();

      if (error) {
        if (error.code === "23505") {
          throw new TRPCError({
            code: "CONFLICT",
            message: "An active invite already exists for this email address.",
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to create invitation: ${error.message}`,
        });
      }

      await recordOrganizationAuditLog(ctx, input.organizationId, {
        actionType: "invitation.create",
        targetType: "invite",
        targetId: invite.id,
        description: `Invited ${normalizedEmail} as ${input.roleName}`,
        metadata: {
          email: normalizedEmail,
          role: input.roleName,
          expiresAt,
        },
      });

      return invite;
    }),

  resendInvitation: protectedProcedure
    .input(updateInvitationSchema)
    .mutation(async ({ ctx, input }) => {
      await ensureOrganizationAccess(ctx, input.organizationId, {
        requireAdmin: true,
      });

      const { data: invite, error } = await ctx.supabase
        .schema("core")
        .from("invites")
        .select("id, resent_count, status, invitee_email")
        .eq("id", input.inviteId)
        .eq("organization_id", input.organizationId)
        .single();

      if (error || !invite) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invitation not found",
        });
      }

      if (["accepted", "declined", "canceled"].includes(invite.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only open invitations can be resent.",
        });
      }

      const { data: updated, error: updateError } = await ctx.supabase
        .schema("core")
        .from("invites")
        .update({
          resent_count: (invite.resent_count ?? 0) + 1,
          status: "sent",
        })
        .eq("id", input.inviteId)
        .select("id, resent_count, status, invitee_email")
        .single();

      if (updateError || !updated) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to resend invitation: ${updateError?.message}`,
        });
      }

      await recordOrganizationAuditLog(ctx, input.organizationId, {
        actionType: "invitation.resend",
        targetType: "invite",
        targetId: updated.id,
        description: `Resent invitation to ${invite.invitee_email}`,
      });

      return updated;
    }),

  cancelInvitation: protectedProcedure
    .input(updateInvitationSchema)
    .mutation(async ({ ctx, input }) => {
      await ensureOrganizationAccess(ctx, input.organizationId, {
        requireAdmin: true,
      });

      const { data: invite, error } = await ctx.supabase
        .schema("core")
        .from("invites")
        .select("id, status, invitee_email")
        .eq("id", input.inviteId)
        .eq("organization_id", input.organizationId)
        .single();

      if (error || !invite) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invitation not found",
        });
      }

      if (invite.status === "accepted") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Accepted invitations cannot be canceled.",
        });
      }

      const { data: updated, error: updateError } = await ctx.supabase
        .schema("core")
        .from("invites")
        .update({ status: "canceled" })
        .eq("id", input.inviteId)
        .select("id, status")
        .single();

      if (updateError || !updated) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to cancel invitation: ${updateError?.message}`,
        });
      }

      await recordOrganizationAuditLog(ctx, input.organizationId, {
        actionType: "invitation.cancel",
        targetType: "invite",
        targetId: updated.id,
        description: `Canceled invitation for ${invite.invitee_email}`,
      });

      return updated;
    }),

  markInvitationViewed: t.procedure.input(viewInvitationSchema).mutation(
    async ({ ctx, input }) => {
      const { data: invite, error } = await ctx.supabase
        .schema("core")
        .from("invites")
        .select("id, status, viewed_at")
        .eq("token", input.token)
        .single();

      if (error || !invite) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invitation not found",
        });
      }

      if (!["pending", "sent"].includes(invite.status)) {
        return invite;
      }

      const { data: updated, error: updateError } = await ctx.supabase
        .schema("core")
        .from("invites")
        .update({
          status: "viewed",
          viewed_at: new Date().toISOString(),
        })
        .eq("id", invite.id)
        .select("id, status, viewed_at")
        .single();

      if (updateError || !updated) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to update invitation: ${updateError?.message}`,
        });
      }

      return updated;
    },
  ),

  acceptInvitation: protectedProcedure
    .input(respondInvitationSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.email) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Please sign in to accept the invitation.",
        });
      }

      const { data: invite, error } = await ctx.supabase
        .schema("core")
        .from("invites")
        .select(
          `
          id,
          organization_id,
          invitee_email,
          status,
          expires_at,
          role_name,
          metadata
        `,
        )
        .eq("token", input.token)
        .single();

      if (error || !invite) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invitation not found",
        });
      }

      if (!["pending", "sent", "viewed"].includes(invite.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Invitation already ${invite.status}.`,
        });
      }

      if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
        await ctx.supabase
          .schema("core")
          .from("invites")
          .update({ status: "expired" })
          .eq("id", invite.id);
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invitation has expired.",
        });
      }

      const normalizedEmail = invite.invitee_email.toLowerCase();
      const userEmail = ctx.user.email.toLowerCase();

      if (normalizedEmail !== userEmail) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This invitation is linked to a different email address.",
        });
      }

      const roleName = invite.role_name ?? "member";
      const { data: role } = await ctx.supabase
        .schema("core")
        .from("roles")
        .select("id")
        .eq("scope", "organization")
        .eq("name", roleName)
        .maybeSingle();

      if (!role) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Role "${roleName}" is not available.`,
        });
      }

      const { error: assignmentError } = await ctx.supabase
        .schema("core")
        .from("role_assignments")
        .insert({
          role_id: role.id,
          user_id: ctx.user.id,
          scope_org_id: invite.organization_id,
        });

      if (assignmentError && assignmentError.code !== "23505") {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to add member: ${assignmentError.message}`,
        });
      }

      await ctx.supabase
        .schema("core")
        .from("invites")
        .update({
          status: "accepted",
          consumed_at: new Date().toISOString(),
        })
        .eq("id", invite.id);

      await recordOrganizationAuditLog(ctx, invite.organization_id, {
        actionType: "invitation.accept",
        targetType: "invite",
        targetId: invite.id,
        description: `${ctx.user.email} accepted an invitation as ${roleName}`,
      });

      return { success: true };
    }),

  declineInvitation: protectedProcedure
    .input(respondInvitationSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.email) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Please sign in to decline the invitation.",
        });
      }

      const { data: invite, error } = await ctx.supabase
        .schema("core")
        .from("invites")
        .select("id, organization_id, invitee_email, status, metadata")
        .eq("token", input.token)
        .single();

      if (error || !invite) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invitation not found",
        });
      }

      if (!["pending", "sent", "viewed"].includes(invite.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Invitation already ${invite.status}.`,
        });
      }

      const metadata = invite.metadata ?? {};
      metadata.decline_reason = input.reason ?? null;

      await ctx.supabase
        .schema("core")
        .from("invites")
        .update({
          status: "declined",
          metadata,
        })
        .eq("id", invite.id);

      await recordOrganizationAuditLog(ctx, invite.organization_id, {
        actionType: "invitation.decline",
        targetType: "invite",
        targetId: invite.id,
        description: `${ctx.user.email} declined an invitation`,
        metadata: { reason: input.reason ?? null },
      });

      return { success: true };
    }),

  listMembers: protectedProcedure.input(listMembersSchema).query(
    async ({ ctx, input }) => {
      await ensureOrganizationAccess(ctx, input.organizationId);

      const { data, error } = await ctx.supabase
        .schema("core")
        .from("role_assignments")
        .select(
          `
          id,
          user_id,
          scope_org_id,
          created_at,
          role:roles(name, scope, description),
          user:users(
            id,
            display_name,
            username,
            avatar_url,
            avatar_path,
            headline
          )
        `,
        )
        .eq("scope_org_id", input.organizationId);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to load members: ${error.message}`,
        });
      }

      const members = new Map<string, Record<string, unknown>>();
      (data ?? []).forEach(
        (
          assignment: {
            user_id?: string | null;
            user?: unknown;
            created_at: string;
            role?: { name?: string | null } | null;
            [key: string]: unknown;
          },
        ) => {
          const userId = assignment.user_id;
          if (!userId) return;
          if (!members.has(userId)) {
            members.set(userId, {
              userId,
              profile: assignment.user,
              roles: [],
              joinedAt: assignment.created_at,
            });
          }

          const entry = members.get(userId);
          if (
            assignment.role?.name && !entry.roles.includes(assignment.role.name)
          ) {
            entry.roles.push(assignment.role.name);
          }
        },
      );

      let results = Array.from(members.values());

      if (input.roleNames?.length) {
        const roleSet = new Set(input.roleNames.map((role) =>
          role.toLowerCase()
        ));
        results = results.filter((member) =>
          member.roles.some((role: string) => roleSet.has(role.toLowerCase()))
        );
      }

      if (input.search?.trim()) {
        const term = input.search.trim().toLowerCase();
        results = results.filter((member) => {
          const display = member.profile?.display_name?.toLowerCase() ?? "";
          const username = member.profile?.username?.toLowerCase() ?? "";
          return display.includes(term) || username.includes(term);
        });
      }

      return results;
    },
  ),

  getMemberActivity: protectedProcedure
    .input(memberActivitySchema)
    .query(async ({ ctx, input }) => {
      await ensureOrganizationAccess(ctx, input.organizationId);

      const since = new Date(
        Date.now() - input.lookbackDays * 24 * 60 * 60 * 1000,
      ).toISOString();

      const { data, error } = await ctx.supabase
        .schema("core")
        .from("organization_audit_log")
        .select("actor_user_id, action_type, created_at")
        .eq("organization_id", input.organizationId)
        .gte("created_at", since);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to load activity: ${error.message}`,
        });
      }

      const activityMap = new Map<
        string,
        { userId: string; actions: number; lastActionAt: string }
      >();
      (data ?? []).forEach(
        (
          entry: {
            actor_user_id?: string | null;
            created_at: string;
            [key: string]: unknown;
          },
        ) => {
          if (!entry.actor_user_id) return;
          if (!activityMap.has(entry.actor_user_id)) {
            activityMap.set(entry.actor_user_id, {
              userId: entry.actor_user_id,
              actions: 0,
              lastActionAt: entry.created_at,
            });
          }
          const stats = activityMap.get(entry.actor_user_id)
          if (!stats) {
            throw new Error(`Missing activity stats for user ${entry.actor_user_id}`)
          }
          stats.actions += 1;
          if (entry.created_at && stats.lastActionAt < entry.created_at) {
            stats.lastActionAt = entry.created_at;
          }
        },
      );

      return Array.from(activityMap.values());
    }),

  removeMember: protectedProcedure.input(removeMemberSchema).mutation(
    async ({ ctx, input }) => {
      await ensureOrganizationAccess(ctx, input.organizationId, {
        requireAdmin: true,
      });

      const { data: org } = await ctx.supabase
        .schema("core")
        .from("organizations")
        .select("owner_user_id")
        .eq("id", input.organizationId)
        .single();

      if (org?.owner_user_id === input.userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Transfer ownership before removing the current owner.",
        });
      }

      const { data, error } = await ctx.supabase
        .schema("core")
        .from("role_assignments")
        .delete()
        .eq("user_id", input.userId)
        .eq("scope_org_id", input.organizationId)
        .select("id");

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to remove member: ${error.message}`,
        });
      }

      await recordOrganizationAuditLog(ctx, input.organizationId, {
        actionType: "member.remove",
        targetType: "user",
        targetId: input.userId,
        description: `Removed member ${input.userId}`,
        metadata: { reason: input.reason ?? null },
      });

      return { removed: (data ?? []).length > 0 };
    },
  ),

  transferOwnership: protectedProcedure
    .input(transferOwnershipSchema)
    .mutation(async ({ ctx, input }) => {
      const access = await ensureOrganizationAccess(ctx, input.organizationId, {
        requireAdmin: true,
      });

      if (!access.isOwner && !access.superAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the current owner can transfer ownership.",
        });
      }

      if (input.newOwnerUserId === ctx.user?.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You are already the owner.",
        });
      }

      await ctx.supabase
        .schema("core")
        .from("organizations")
        .update({ owner_user_id: input.newOwnerUserId })
        .eq("id", input.organizationId);

      await recordOrganizationAuditLog(ctx, input.organizationId, {
        actionType: "member.transfer_ownership",
        targetType: "user",
        targetId: input.newOwnerUserId,
        description: `Transferred ownership to ${input.newOwnerUserId}`,
      });

      return { success: true };
    }),

  createDocumentUploadSession: protectedProcedure
    .input(documentUploadRequestSchema)
    .mutation(async ({ ctx, input }) => {
      await ensureOrganizationAccess(ctx, input.organizationId, {
        requireAdmin: true,
      });

      let documentId = input.documentId ?? null;
      let isNewDocument = false;

      if (documentId) {
        const { data: existingDoc, error: docError } = await ctx.supabase
          .schema("core")
          .from("organization_documents")
          .select("id, organization_id")
          .eq("id", documentId)
          .single();

        if (docError || !existingDoc) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Document not found",
          });
        }

        if (existingDoc.organization_id !== input.organizationId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Document belongs to a different organization.",
          });
        }
      } else {
        const { data: doc, error: insertError } = await ctx.supabase
          .schema("core")
          .from("organization_documents")
          .insert({
            organization_id: input.organizationId,
            name: input.name,
            description: input.description ?? null,
            folder_id: input.folderId ?? null,
            category: input.category,
            tags: input.tags ?? [],
            is_template: input.isTemplate ?? false,
            created_by: ctx.user.id,
            updated_by: ctx.user.id,
            storage_bucket: ORG_DOCUMENT_BUCKET,
            storage_prefix: `${input.organizationId}`,
            template_variables: [],
          })
          .select("id")
          .single();

        if (insertError || !doc) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to create document: ${insertError?.message}`,
          });
        }

        documentId = doc.id;
        isNewDocument = true;
      }

      const versionId = crypto.randomUUID();
      const sanitizedFileName = sanitizeFileName(input.fileName);
      const storagePath =
        `${input.organizationId}/${documentId}/${versionId}/${sanitizedFileName}`;

      const [policy, usage] = await Promise.all([
        getStoragePolicy(ctx, input.organizationId),
        getStorageUsage(ctx, input.organizationId),
      ]);

      if (input.fileSize > policy.maxFileBytes) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "File exceeds the maximum allowable size for this tier.",
        });
      }

      if (usage.storage_bytes + input.fileSize > policy.maxStorageBytes) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Uploading this document would exceed the organization's storage limit.",
        });
      }

      const { data: signedUrl, error: signedError } = await ctx.supabase.storage
        .from(ORG_DOCUMENT_BUCKET)
        .createSignedUploadUrl(storagePath, DOCUMENT_UPLOAD_URL_TTL_SECONDS);

      if (signedError || !signedUrl) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to create upload URL: ${signedError?.message}`,
        });
      }

      return {
        documentId,
        versionId,
        storagePath,
        uploadUrl: signedUrl.signedUrl,
        uploadToken: signedUrl.token,
        expiresIn: DOCUMENT_UPLOAD_URL_TTL_SECONDS,
        isNewDocument,
      };
    }),

  commitDocumentVersion: protectedProcedure
    .input(commitDocumentVersionSchema)
    .mutation(async ({ ctx, input }) => {
      await ensureOrganizationAccess(ctx, input.organizationId, {
        requireAdmin: true,
      });

      const { data: document, error: docError } = await ctx.supabase
        .schema("core")
        .from("organization_documents")
        .select("id, organization_id, version_count")
        .eq("id", input.documentId)
        .single();

      if (docError || !document) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Document not found",
        });
      }

      if (document.organization_id !== input.organizationId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Document belongs to a different organization.",
        });
      }

      const { data: version, error: versionError } = await ctx.supabase
        .schema("core")
        .from("organization_document_versions")
        .insert({
          id: input.versionId,
          document_id: input.documentId,
          organization_id: input.organizationId,
          storage_object_path: input.storagePath,
          size_bytes: input.fileSize,
          mime_type: input.mimeType,
          checksum: input.checksum ?? null,
          uploaded_by: ctx.user.id,
          notes: input.notes ?? null,
        })
        .select("id, version_number, created_at, storage_object_path")
        .single();

      if (versionError || !version) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            `Failed to record document version: ${versionError?.message}`,
        });
      }

      await incrementStorageUsage(ctx, input.organizationId, input.fileSize, {
        incrementDocumentCount: document.version_count === 0,
      });

      await recordOrganizationAuditLog(ctx, input.organizationId, {
        actionType: "document.upload",
        targetType: "document",
        targetId: input.documentId,
        description:
          `Uploaded version ${version.version_number} (${input.mimeType})`,
        metadata: {
          versionId: version.id,
          size: input.fileSize,
        },
      });

      return version;
    }),

  listDocuments: protectedProcedure.input(listDocumentsSchema).query(
    async ({ ctx, input }) => {
      await ensureOrganizationAccess(ctx, input.organizationId);

      let query = ctx.supabase
        .schema("core")
        .from("organization_documents")
        .select(
          `
          id,
          name,
          category,
          tags,
          folder_id,
          latest_version_number,
          latest_size_bytes,
          latest_mime_type,
          updated_at,
          created_at,
          version_count,
          is_template
        `,
        )
        .eq("organization_id", input.organizationId)
        .eq("is_deleted", false)
        .order("updated_at", { ascending: false })
        .limit(input.limit);

      if (input.folderId === null) {
        query = query.is("folder_id", null);
      } else if (input.folderId) {
        query = query.eq("folder_id", input.folderId);
      }

      if (input.category) {
        query = query.eq("category", input.category);
      }

      if (input.search?.trim()) {
        const term = input.search.trim();
        query = query.ilike("name", `%${term}%`);
      }

      const { data, error } = await query;

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to load documents: ${error.message}`,
        });
      }

      return data ?? [];
    },
  ),

  getDocument: protectedProcedure.input(documentIdentifierSchema).query(
    async ({ ctx, input }) => {
      await ensureOrganizationAccess(ctx, input.organizationId);

      const { data, error } = await ctx.supabase
        .schema("core")
        .from("organization_documents")
        .select(
          `
          id,
          name,
          description,
          category,
          tags,
          folder_id,
          latest_version_id,
          latest_version_number,
          latest_size_bytes,
          latest_mime_type,
          version_count,
          updated_at,
          created_at,
          is_template
        `,
        )
        .eq("organization_id", input.organizationId)
        .eq("id", input.documentId)
        .single();

      if (error || !data) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Document not found",
        });
      }

      return data;
    },
  ),

  listDocumentVersions: protectedProcedure
    .input(documentIdentifierSchema)
    .query(async ({ ctx, input }) => {
      await ensureOrganizationAccess(ctx, input.organizationId);

      const { data, error } = await ctx.supabase
        .schema("core")
        .from("organization_document_versions")
        .select(
          `
          id,
          version_number,
          size_bytes,
          mime_type,
          checksum,
          created_at,
          uploaded_by
        `,
        )
        .eq("organization_id", input.organizationId)
        .eq("document_id", input.documentId)
        .order("version_number", { ascending: false });

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to load versions: ${error.message}`,
        });
      }

      return data ?? [];
    }),

  createDocumentDownloadUrl: protectedProcedure
    .input(downloadDocumentSchema)
    .mutation(async ({ ctx, input }) => {
      await ensureOrganizationAccess(ctx, input.organizationId);

      let versionQuery = ctx.supabase
        .schema("core")
        .from("organization_document_versions")
        .select("id, document_id, storage_object_path, organization_id")
        .eq("organization_id", input.organizationId)
        .eq("document_id", input.documentId);

      if (input.versionId) {
        versionQuery = versionQuery.eq("id", input.versionId);
      } else {
        versionQuery = versionQuery
          .order("version_number", {
            ascending: false,
          })
          .limit(1);
      }

      const { data: version, error } = await versionQuery.single();

      if (error || !version) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Document version not found",
        });
      }

      const { data: signed, error: signedError } = await ctx.supabase.storage
        .from(ORG_DOCUMENT_BUCKET)
        .createSignedUrl(version.storage_object_path, 60 * 5);

      if (signedError || !signed) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to create download link: ${signedError?.message}`,
        });
      }

      return {
        downloadUrl: signed.signedUrl,
        expiresIn: 60 * 5,
      };
    }),

  listDocumentShares: protectedProcedure
    .input(documentIdentifierSchema)
    .query(async ({ ctx, input }) => {
      await ensureOrganizationAccess(ctx, input.organizationId, {
        requireAdmin: true,
      });

      const { data, error } = await ctx.supabase
        .schema("core")
        .from("organization_document_shares")
        .select(
          `
          id,
          share_type,
          permission,
          target_user_id,
          external_email,
          expires_at,
          revoked_at,
          created_at,
          metadata
        `,
        )
        .eq("organization_id", input.organizationId)
        .eq("document_id", input.documentId)
        .is("revoked_at", null);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to load document shares: ${error.message}`,
        });
      }

      return data ?? [];
    }),

  shareDocument: protectedProcedure.input(shareDocumentSchema).mutation(
    async ({ ctx, input }) => {
      await ensureOrganizationAccess(ctx, input.organizationId, {
        requireAdmin: true,
      });

      if (input.shareType === "organization_member" && !input.targetUserId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Target user is required for organization member shares.",
        });
      }

      if (input.shareType === "external" && !input.externalEmail) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Email is required for external shares.",
        });
      }

      const { data: share, error } = await ctx.supabase
        .schema("core")
        .from("organization_document_shares")
        .insert({
          organization_id: input.organizationId,
          document_id: input.documentId,
          share_type: input.shareType,
          permission: input.permission,
          target_user_id: input.targetUserId ?? null,
          external_email: input.externalEmail ?? null,
          expires_at: input.expiresAt ?? null,
          created_by: ctx.user.id,
        })
        .select("*")
        .single();

      if (error || !share) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to share document: ${error?.message}`,
        });
      }

      await recordOrganizationAuditLog(ctx, input.organizationId, {
        actionType: "document.share",
        targetType: "document",
        targetId: input.documentId,
        description: `Shared document (${input.permission})`,
        metadata: {
          shareId: share.id,
          shareType: input.shareType,
        },
      });

      return share;
    },
  ),

  updateDocumentShare: protectedProcedure
    .input(updateShareSchema)
    .mutation(async ({ ctx, input }) => {
      await ensureOrganizationAccess(ctx, input.organizationId, {
        requireAdmin: true,
      });

      const updates: Record<string, unknown> = {};
      if (input.permission) updates.permission = input.permission;
      if (input.expiresAt !== undefined) updates.expires_at = input.expiresAt;

      const { data, error } = await ctx.supabase
        .schema("core")
        .from("organization_document_shares")
        .update(updates)
        .eq("id", input.shareId)
        .eq("organization_id", input.organizationId)
        .select("*")
        .single();

      if (error || !data) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Share not found",
        });
      }

      await recordOrganizationAuditLog(ctx, input.organizationId, {
        actionType: "document.share.update",
        targetType: "share",
        targetId: input.shareId,
        description: "Updated document share permissions",
      });

      return data;
    }),

  revokeDocumentShare: protectedProcedure
    .input(revokeShareSchema)
    .mutation(async ({ ctx, input }) => {
      await ensureOrganizationAccess(ctx, input.organizationId, {
        requireAdmin: true,
      });

      const { data, error } = await ctx.supabase
        .schema("core")
        .from("organization_document_shares")
        .update({ revoked_at: new Date().toISOString() })
        .eq("id", input.shareId)
        .eq("organization_id", input.organizationId)
        .select("id")
        .single();

      if (error || !data) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Share not found",
        });
      }

      await recordOrganizationAuditLog(ctx, input.organizationId, {
        actionType: "document.share.revoke",
        targetType: "share",
        targetId: input.shareId,
        description: "Revoked document share",
      });

      return { success: true };
    }),

  listFolders: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
      }),
    )
    .query(async ({ ctx, input }) => {
      await ensureOrganizationAccess(ctx, input.organizationId);

      const { data, error } = await ctx.supabase
        .schema("core")
        .from("organization_folders")
        .select(
          `
          id,
          name,
          description,
          parent_folder_id,
          depth,
          created_at
        `,
        )
        .eq("organization_id", input.organizationId)
        .eq("is_deleted", false)
        .order("name", { ascending: true });

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to load folders: ${error.message}`,
        });
      }

      return data ?? [];
    }),

  upsertFolder: protectedProcedure.input(folderUpsertSchema).mutation(
    async ({ ctx, input }) => {
      await ensureOrganizationAccess(ctx, input.organizationId, {
        requireAdmin: true,
      });

      let depth = 0;
      if (input.parentFolderId) {
        const { data: parent } = await ctx.supabase
          .schema("core")
          .from("organization_folders")
          .select("depth")
          .eq("id", input.parentFolderId)
          .maybeSingle();
        depth = (parent?.depth ?? 0) + 1;
      }

      if (input.folderId) {
        const { data, error } = await ctx.supabase
          .schema("core")
          .from("organization_folders")
          .update({
            name: input.name,
            description: input.description ?? null,
            parent_folder_id: input.parentFolderId ?? null,
            depth,
            updated_by: ctx.user.id,
          })
          .eq("id", input.folderId)
          .select("*")
          .single();

        if (error || !data) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Folder not found",
          });
        }

        return data;
      }

      const { data, error } = await ctx.supabase
        .schema("core")
        .from("organization_folders")
        .insert({
          organization_id: input.organizationId,
          name: input.name,
          description: input.description ?? null,
          parent_folder_id: input.parentFolderId ?? null,
          depth,
          created_by: ctx.user.id,
          updated_by: ctx.user.id,
        })
        .select("*")
        .single();

      if (error || !data) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to create folder: ${error?.message}`,
        });
      }

      return data;
    },
  ),

  deleteFolder: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
        folderId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ensureOrganizationAccess(ctx, input.organizationId, {
        requireAdmin: true,
      });

      const { data: docCount } = await ctx.supabase
        .schema("core")
        .from("organization_documents")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", input.organizationId)
        .eq("folder_id", input.folderId);

      if ((docCount ?? 0) > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Move or delete documents before removing the folder.",
        });
      }

      const { error } = await ctx.supabase
        .schema("core")
        .from("organization_folders")
        .delete()
        .eq("id", input.folderId)
        .eq("organization_id", input.organizationId);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to delete folder: ${error.message}`,
        });
      }

      return { success: true };
    }),

  searchDocuments: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
        query: z.string().min(1),
        limit: z.number().min(1).max(25).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      await ensureOrganizationAccess(ctx, input.organizationId);

      const { data, error } = await ctx.supabase
        .schema("core")
        .from("organization_documents")
        .select("id, name, category, updated_at")
        .eq("organization_id", input.organizationId)
        .eq("is_deleted", false)
        .ilike("name", `%${input.query}%`)
        .order("updated_at", { ascending: false })
        .limit(input.limit);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to search documents: ${error.message}`,
        });
      }

      return data ?? [];
    }),

  listLocations: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
        includeInactive: z.boolean().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      await ensureOrganizationAccess(ctx, input.organizationId);

      let query = ctx.supabase
        .schema("core")
        .from("organization_locations")
        .select(
          `
          id,
          name,
          location_type,
          address,
          latitude,
          longitude,
          timezone,
          phone,
          email,
          is_active,
          metadata,
          created_at
        `,
        )
        .eq("organization_id", input.organizationId)
        .order("name", { ascending: true });

      if (!input.includeInactive) {
        query = query.eq("is_active", true);
      }

      const { data, error } = await query;

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to load locations: ${error.message}`,
        });
      }

      return data ?? [];
    }),

  upsertLocation: protectedProcedure
    .input(locationUpsertSchema)
    .mutation(async ({ ctx, input }) => {
      await ensureOrganizationAccess(ctx, input.organizationId, {
        requireAdmin: true,
      });

      const payload = {
        organization_id: input.organizationId,
        name: input.name,
        location_type: input.locationType,
        address: input.address ?? {},
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        timezone: input.timezone ?? null,
        phone: input.phone ?? null,
        email: input.email ?? null,
        is_active: input.isActive ?? true,
        metadata: {},
        updated_by: ctx.user.id,
      };

      if (input.locationId) {
        const { data, error } = await ctx.supabase
          .schema("core")
          .from("organization_locations")
          .update(payload)
          .eq("id", input.locationId)
          .eq("organization_id", input.organizationId)
          .select("*")
          .single();

        if (error || !data) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Location not found",
          });
        }

        return data;
      }

      const { data, error } = await ctx.supabase
        .schema("core")
        .from("organization_locations")
        .insert({
          ...payload,
          created_by: ctx.user.id,
        })
        .select("*")
        .single();

      if (error || !data) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to create location: ${error?.message}`,
        });
      }

      return data;
    }),

  archiveLocation: protectedProcedure
    .input(locationArchiveSchema)
    .mutation(async ({ ctx, input }) => {
      await ensureOrganizationAccess(ctx, input.organizationId, {
        requireAdmin: true,
      });

      const { data, error } = await ctx.supabase
        .schema("core")
        .from("organization_locations")
        .update({ is_active: input.isActive })
        .eq("id", input.locationId)
        .eq("organization_id", input.organizationId)
        .select("id, is_active")
        .single();

      if (error || !data) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Location not found",
        });
      }

      await recordOrganizationAuditLog(ctx, input.organizationId, {
        actionType: "location.update",
        targetType: "location",
        targetId: input.locationId,
        description: input.isActive
          ? "Reactivated location"
          : "Archived location",
      });

      return data;
    }),

  getSettings: protectedProcedure
    .input(z.object({ organizationId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      await ensureOrganizationAccess(ctx, input.organizationId);

      const { data } = await ctx.supabase
        .schema("core")
        .from("organization_settings")
        .select(
          `
          organization_id,
          timezone,
          locale,
          default_currency,
          business_hours,
          holiday_calendar,
          notification_preferences,
          security_preferences,
          privacy_preferences,
          enforce_mfa,
          session_timeout_minutes,
          ip_allow_list,
          storage_warning_thresholds
        `,
        )
        .eq("organization_id", input.organizationId)
        .maybeSingle();

      return (
        data ?? {
          organization_id: input.organizationId,
          timezone: "UTC",
          locale: "en-US",
          default_currency: "USD",
          business_hours: [],
          holiday_calendar: [],
          notification_preferences: {},
          security_preferences: {},
          privacy_preferences: {},
          enforce_mfa: false,
          session_timeout_minutes: 60,
          ip_allow_list: [],
          storage_warning_thresholds: STORAGE_WARNING_LEVELS,
        }
      );
    }),

  updateSettings: protectedProcedure
    .input(updateSettingsSchema)
    .mutation(async ({ ctx, input }) => {
      await ensureOrganizationAccess(ctx, input.organizationId, {
        requireAdmin: true,
      });

      const { data: existing } = await ctx.supabase
        .schema("core")
        .from("organization_settings")
        .select("organization_id, created_by")
        .eq("organization_id", input.organizationId)
        .maybeSingle();

      const payload = {
        organization_id: input.organizationId,
        timezone: input.timezone ?? existing?.timezone ?? "UTC",
        locale: input.locale ?? existing?.locale ?? "en-US",
        default_currency: input.defaultCurrency ?? existing?.default_currency ??
          "USD",
        business_hours: input.businessHours ?? existing?.business_hours ?? [],
        holiday_calendar: input.holidayCalendar ?? existing?.holiday_calendar ??
          [],
        notification_preferences: input.notificationPreferences ??
          existing?.notification_preferences ?? {},
        security_preferences: input.securityPreferences ??
          existing?.security_preferences ?? {},
        privacy_preferences: input.privacyPreferences ??
          existing?.privacy_preferences ?? {},
        enforce_mfa: input.enforceMfa ?? existing?.enforce_mfa ?? false,
        session_timeout_minutes: input.sessionTimeoutMinutes ??
          existing?.session_timeout_minutes ?? 60,
        ip_allow_list: input.ipAllowList ?? existing?.ip_allow_list ?? [],
        storage_warning_thresholds: STORAGE_WARNING_LEVELS,
        created_by: existing?.created_by ?? ctx.user.id,
        updated_by: ctx.user.id,
      };

      const { data, error } = await ctx.supabase
        .schema("core")
        .from("organization_settings")
        .upsert(payload, { onConflict: "organization_id" })
        .select("*")
        .single();

      if (error || !data) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to update settings: ${error?.message}`,
        });
      }

      await recordOrganizationAuditLog(ctx, input.organizationId, {
        actionType: "settings.update",
        targetType: "settings",
        targetId: data.organization_id,
        description: "Updated organization settings",
      });

      return data;
    }),

  /**
   * Get inquiry reminder settings for an organization
   */
  getReminderSettings: protectedProcedure
    .input(z.object({ organizationId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      await ensureOrganizationAccess(ctx, input.organizationId, {
        requireAdmin: true,
      });

      const { data: org, error } = await ctx.supabase
        .schema("core")
        .from("organizations")
        .select("inquiry_reminder_enabled, inquiry_reminder_days")
        .eq("id", input.organizationId)
        .single();

      if (error || !org) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organization not found",
        });
      }

      return {
        reminderEnabled: org.inquiry_reminder_enabled ?? true,
        reminderDays: org.inquiry_reminder_days ?? 3,
      };
    }),

  /**
   * Update inquiry reminder settings for an organization
   */
  updateReminderSettings: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
        reminderEnabled: z.boolean(),
        reminderDays: z.number().int().min(1).max(14),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ensureOrganizationAccess(ctx, input.organizationId, {
        requireAdmin: true,
      });

      const { data: org, error } = await ctx.supabase
        .schema("core")
        .from("organizations")
        .update({
          inquiry_reminder_enabled: input.reminderEnabled,
          inquiry_reminder_days: input.reminderDays,
        })
        .eq("id", input.organizationId)
        .select("inquiry_reminder_enabled, inquiry_reminder_days")
        .single();

      if (error || !org) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to update reminder settings: ${error?.message}`,
        });
      }

      await recordOrganizationAuditLog(ctx, input.organizationId, {
        actionType: "settings.update",
        targetType: "settings",
        targetId: input.organizationId,
        description: `Updated inquiry reminder settings: ${
          input.reminderEnabled ? "enabled" : "disabled"
        }, ${input.reminderDays} days`,
      });

      return {
        reminderEnabled: org.inquiry_reminder_enabled ?? true,
        reminderDays: org.inquiry_reminder_days ?? 3,
      };
    }),

  listAuditLog: protectedProcedure.input(auditLogListSchema).query(
    async ({ ctx, input }) => {
      await ensureOrganizationAccess(ctx, input.organizationId, {
        requireAdmin: true,
      });

      let query = ctx.supabase
        .schema("core")
        .from("organization_audit_log")
        .select(
          `
          id,
          action_type,
          target_type,
          target_id,
          actor_user_id,
          description,
          metadata,
          created_at
        `,
        )
        .eq("organization_id", input.organizationId)
        .order("created_at", { ascending: false })
        .limit(input.limit);

      if (input.cursor) {
        query = query.lt("created_at", input.cursor);
      }

      if (input.actionTypes?.length) {
        query = query.in("action_type", input.actionTypes);
      }

      const { data, error } = await query;

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to load audit log: ${error.message}`,
        });
      }

      const items = data ?? [];
      const nextCursor = items.length === input.limit
        ? items[items.length - 1].created_at
        : null;

      return { items, nextCursor };
    },
  ),

  exportAuditLog: protectedProcedure
    .input(auditLogExportSchema)
    .mutation(async ({ ctx, input }) => {
      await ensureOrganizationAccess(ctx, input.organizationId, {
        requireAdmin: true,
      });

      let query = ctx.supabase
        .schema("core")
        .from("organization_audit_log")
        .select(
          `
          created_at,
          action_type,
          target_type,
          target_id,
          actor_user_id,
          description
        `,
        )
        .eq("organization_id", input.organizationId)
        .order("created_at", { ascending: false })
        .limit(500);

      if (input.since) {
        query = query.gte("created_at", input.since);
      }

      const { data, error } = await query;

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to export audit log: ${error.message}`,
        });
      }

      if (input.format === "json") {
        return { format: "json", payload: data ?? [] };
      }

      const header = "timestamp,action,target_type,target_id,actor,description";
      const rows = (data ?? []).map((row: { created_at: string; action_type?: string | null; target_type?: string | null; target_id?: string | null; actor_user_id?: string | null; description?: string | null; [key: string]: unknown }) => {
        const values = [
          row.created_at,
          row.action_type,
          row.target_type ?? "",
          row.target_id ?? "",
          row.actor_user_id ?? "",
          (row.description ?? "").replace(/"/g, '""'),
        ];
        return values.map((value) => `"${value}"`).join(",");
      });

      return {
        format: "csv",
        payload: [header, ...rows].join("\n"),
      };
    }),

  getStorageUsageSummary: protectedProcedure
    .input(z.object({ organizationId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      await ensureOrganizationAccess(ctx, input.organizationId);

      const [usage, policy] = await Promise.all([
        getStorageUsage(ctx, input.organizationId),
        getStoragePolicy(ctx, input.organizationId),
      ]);

      const percentUsed = usage.storage_bytes / policy.maxStorageBytes;
      const warnings = policy.warningThresholds.filter((level: number) =>
        percentUsed >= level
      );

      return {
        usageBytes: usage.storage_bytes,
        maxBytes: policy.maxStorageBytes,
        percentUsed: Number((percentUsed * 100).toFixed(2)),
        documentCount: usage.document_count,
        versionCount: usage.version_count,
        warnings,
        maxFileBytes: policy.maxFileBytes,
        updatedAt: usage.updated_at,
      };
    }),
});
