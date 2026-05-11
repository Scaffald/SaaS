/**
 * Organizations Extended REST API
 * Invitations, member activity, ownership transfer, documents (versions/shares),
 * folders, locations, audit log, and storage usage.
 */

import { Hono } from "hono";
import { createClient } from "@supabase/supabase-js";
import { authMiddleware } from "../middleware/auth.ts";

const app = new Hono();
app.use("*", authMiddleware);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type SupabaseClient = any;

async function getOrgAccess(
  supabase: SupabaseClient,
  userId: string,
  orgId: string,
  requireAdmin = false,
): Promise<
  { error?: string; status?: number; isOwner?: boolean; isAdmin?: boolean }
> {
  const { data: org } = await supabase
    .schema("core")
    .from("organizations")
    .select("id, owner_user_id")
    .eq("id", orgId)
    .single();

  if (!org) return { error: "Organization not found", status: 404 };

  const isOwner = org.owner_user_id === userId;

  const { data: assignments } = await supabase
    .schema("core")
    .from("role_assignments")
    .select("role:roles(name, scope), scope_org_id")
    .eq("user_id", userId);

  const isAdmin = isOwner ||
    (assignments ?? []).some((a: any) =>
      (a.scope_org_id === orgId &&
        ["owner", "admin"].includes(a.role?.name ?? "")) ||
      (["admin", "super_admin"].includes(a.role?.name ?? "") &&
        a.role?.scope === "platform")
    );

  const isMember = isAdmin ||
    (assignments ?? []).some((a: any) => a.scope_org_id === orgId);

  if (requireAdmin && !isAdmin) return { error: "Forbidden", status: 403 };
  if (!requireAdmin && !isMember) return { error: "Forbidden", status: 403 };

  return { isOwner, isAdmin };
}

function getServiceClient() {
  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  return createClient(url, key);
}

// ---------------------------------------------------------------------------
// Invitations
// ---------------------------------------------------------------------------

/**
 * GET /v1/organizations/:id/invitations
 * List organization invitations (admin only)
 */
app.get("/:id/invitations", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { id } = c.req.param();

  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const access = await getOrgAccess(supabase, user.id, id, true);
  if (access.error) {
    return c.json({ error: access.error }, access.status as 403 | 404);
  }

  const statusesParam = c.req.query("statuses");
  const statuses = statusesParam ? statusesParam.split(",") : null;

  let query = supabase
    .schema("core")
    .from("invites")
    .select(
      "id, invitee_email, role_name, status, message, personal_note, viewed_at, expires_at, created_at, resent_count",
    )
    .eq("target_type", "organization")
    .eq("organization_id", id)
    .order("created_at", { ascending: false });

  if (statuses?.length) {
    query = query.in("status", statuses);
  }

  const { data, error } = await query;

  if (error) {
    return c.json({
      error: "Failed to load invitations",
      message: error.message,
    }, 500);
  }

  return c.json(data ?? []);
});

/**
 * POST /v1/organizations/:id/invitations/:inviteId/resend
 * Resend an invitation (admin only)
 */
app.post("/:id/invitations/:inviteId/resend", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { id, inviteId } = c.req.param();

  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const access = await getOrgAccess(supabase, user.id, id, true);
  if (access.error) {
    return c.json({ error: access.error }, access.status as 403 | 404);
  }

  const { data: invite, error: fetchError } = await supabase
    .schema("core")
    .from("invites")
    .select("id, resent_count, status, invitee_email")
    .eq("id", inviteId)
    .eq("organization_id", id)
    .single();

  if (fetchError || !invite) {
    return c.json({ error: "Invitation not found" }, 404);
  }

  if (["accepted", "declined", "canceled"].includes(invite.status)) {
    return c.json({ error: "Only open invitations can be resent." }, 400);
  }

  const { data: updated, error: updateError } = await supabase
    .schema("core")
    .from("invites")
    .update({ resent_count: (invite.resent_count ?? 0) + 1, status: "sent" })
    .eq("id", inviteId)
    .select("id, resent_count, status, invitee_email")
    .single();

  if (updateError || !updated) {
    return c.json({
      error: "Failed to resend invitation",
      message: updateError?.message,
    }, 500);
  }

  return c.json(updated);
});

/**
 * POST /v1/organizations/:id/invitations/:inviteId/cancel
 * Cancel an invitation (admin only)
 */
app.post("/:id/invitations/:inviteId/cancel", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { id, inviteId } = c.req.param();

  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const access = await getOrgAccess(supabase, user.id, id, true);
  if (access.error) {
    return c.json({ error: access.error }, access.status as 403 | 404);
  }

  const { data: invite, error: fetchError } = await supabase
    .schema("core")
    .from("invites")
    .select("id, status")
    .eq("id", inviteId)
    .eq("organization_id", id)
    .single();

  if (fetchError || !invite) {
    return c.json({ error: "Invitation not found" }, 404);
  }

  if (invite.status === "accepted") {
    return c.json({ error: "Accepted invitations cannot be canceled." }, 400);
  }

  const { data: updated, error: updateError } = await supabase
    .schema("core")
    .from("invites")
    .update({ status: "canceled" })
    .eq("id", inviteId)
    .select("id, status")
    .single();

  if (updateError || !updated) {
    return c.json({
      error: "Failed to cancel invitation",
      message: updateError?.message,
    }, 500);
  }

  return c.json(updated);
});

/**
 * POST /v1/organizations/invitations/accept
 * Accept an invitation by token
 */
app.post("/invitations/accept", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  if (!user?.email) {
    return c.json({ error: "Please sign in to accept the invitation." }, 401);
  }

  const body = await c.req.json();
  const { token, reason: _reason } = body;

  if (!token) return c.json({ error: "Token is required" }, 400);

  const { data: invite, error } = await supabase
    .schema("core")
    .from("invites")
    .select(
      "id, organization_id, invitee_email, status, expires_at, role_name, metadata",
    )
    .eq("token", token)
    .single();

  if (error || !invite) return c.json({ error: "Invitation not found" }, 404);

  if (!["pending", "sent", "viewed"].includes(invite.status)) {
    return c.json({ error: `Invitation already ${invite.status}.` }, 400);
  }

  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    await supabase
      .schema("core")
      .from("invites")
      .update({ status: "expired" })
      .eq("id", invite.id);
    return c.json({ error: "Invitation has expired." }, 400);
  }

  if (invite.invitee_email.toLowerCase() !== user.email.toLowerCase()) {
    return c.json({
      error: "This invitation is linked to a different email address.",
    }, 403);
  }

  const roleName = invite.role_name ?? "member";
  const { data: role } = await supabase
    .schema("core")
    .from("roles")
    .select("id")
    .eq("scope", "organization")
    .eq("name", roleName)
    .maybeSingle();

  if (!role) {
    return c.json({ error: `Role "${roleName}" is not available.` }, 400);
  }

  // Use service client to bypass RLS on role_assignments insert
  const adminClient = getServiceClient();
  const { error: assignmentError } = await adminClient
    .schema("core")
    .from("role_assignments")
    .insert({
      role_id: role.id,
      user_id: user.id,
      scope_org_id: invite.organization_id,
    });

  if (assignmentError && assignmentError.code !== "23505") {
    return c.json({
      error: "Failed to add member",
      message: assignmentError.message,
    }, 500);
  }

  await supabase
    .schema("core")
    .from("invites")
    .update({ status: "accepted", consumed_at: new Date().toISOString() })
    .eq("id", invite.id);

  return c.json({ success: true });
});

/**
 * POST /v1/organizations/invitations/decline
 * Decline an invitation by token
 */
app.post("/invitations/decline", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  if (!user?.email) {
    return c.json({ error: "Please sign in to decline the invitation." }, 401);
  }

  const body = await c.req.json();
  const { token, reason } = body;

  if (!token) return c.json({ error: "Token is required" }, 400);

  const { data: invite, error } = await supabase
    .schema("core")
    .from("invites")
    .select("id, organization_id, invitee_email, status, metadata")
    .eq("token", token)
    .single();

  if (error || !invite) return c.json({ error: "Invitation not found" }, 404);

  if (!["pending", "sent", "viewed"].includes(invite.status)) {
    return c.json({ error: `Invitation already ${invite.status}.` }, 400);
  }

  const metadata = invite.metadata ?? {};
  metadata.decline_reason = reason ?? null;

  await supabase
    .schema("core")
    .from("invites")
    .update({ status: "declined", metadata })
    .eq("id", invite.id);

  return c.json({ success: true });
});

// ---------------------------------------------------------------------------
// Member Management
// ---------------------------------------------------------------------------

/**
 * GET /v1/organizations/:id/member-activity
 * Get member activity for the past N days
 */
app.get("/:id/member-activity", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { id } = c.req.param();

  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const access = await getOrgAccess(supabase, user.id, id);
  if (access.error) {
    return c.json({ error: access.error }, access.status as 403 | 404);
  }

  const lookbackDays = Math.min(
    90,
    Math.max(1, parseInt(c.req.query("lookbackDays") ?? "30", 10)),
  );
  const since = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000)
    .toISOString();

  const { data, error } = await supabase
    .schema("core")
    .from("organization_audit_log")
    .select("actor_user_id, action_type, created_at")
    .eq("organization_id", id)
    .gte("created_at", since);

  if (error) {
    return c.json(
      { error: "Failed to load activity", message: error.message },
      500,
    );
  }

  const activityMap = new Map<
    string,
    { userId: string; actions: number; lastActionAt: string }
  >();
  for (const entry of (data ?? []) as any[]) {
    if (!entry.actor_user_id) continue;
    if (!activityMap.has(entry.actor_user_id)) {
      activityMap.set(entry.actor_user_id, {
        userId: entry.actor_user_id,
        actions: 0,
        lastActionAt: entry.created_at,
      });
    }
    const stats = activityMap.get(entry.actor_user_id);
    if (stats) {
      stats.actions += 1;
      if (entry.created_at && stats.lastActionAt < entry.created_at) {
        stats.lastActionAt = entry.created_at;
      }
    }
  }

  return c.json(Array.from(activityMap.values()));
});

/**
 * POST /v1/organizations/:id/transfer-ownership
 * Transfer organization ownership (owner only)
 */
app.post("/:id/transfer-ownership", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { id } = c.req.param();

  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const access = await getOrgAccess(supabase, user.id, id, true);
  if (access.error) {
    return c.json({ error: access.error }, access.status as 403 | 404);
  }

  if (!access.isOwner) {
    return c.json(
      { error: "Only the current owner can transfer ownership." },
      403,
    );
  }

  const body = await c.req.json();
  const { newOwnerUserId } = body;

  if (!newOwnerUserId) {
    return c.json({ error: "newOwnerUserId is required" }, 400);
  }
  if (newOwnerUserId === user.id) {
    return c.json({ error: "You are already the owner." }, 400);
  }

  await supabase
    .schema("core")
    .from("organizations")
    .update({ owner_user_id: newOwnerUserId })
    .eq("id", id);

  return c.json({ success: true });
});

// ---------------------------------------------------------------------------
// Document Versions & Shares
// ---------------------------------------------------------------------------

/**
 * POST /v1/organizations/:id/documents/:documentId/commit-version
 * Commit an uploaded document version
 */
app.post("/:id/documents/:documentId/commit-version", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { id, documentId } = c.req.param();

  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const access = await getOrgAccess(supabase, user.id, id, true);
  if (access.error) {
    return c.json({ error: access.error }, access.status as 403 | 404);
  }

  const body = await c.req.json();
  const {
    versionId,
    storagePath,
    fileName: _fileName,
    mimeType,
    fileSize,
    checksum,
    notes,
  } = body;

  if (!versionId || !storagePath || !mimeType || !fileSize) {
    return c.json({
      error: "versionId, storagePath, mimeType, fileSize are required",
    }, 400);
  }

  const { data: document, error: docError } = await supabase
    .schema("core")
    .from("organization_documents")
    .select("id, organization_id, version_count")
    .eq("id", documentId)
    .single();

  if (docError || !document) {
    return c.json({ error: "Document not found" }, 404);
  }
  if (document.organization_id !== id) {
    return c.json(
      { error: "Document belongs to a different organization." },
      403,
    );
  }

  const { data: version, error: versionError } = await supabase
    .schema("core")
    .from("organization_document_versions")
    .insert({
      id: versionId,
      document_id: documentId,
      organization_id: id,
      storage_object_path: storagePath,
      size_bytes: fileSize,
      mime_type: mimeType,
      checksum: checksum ?? null,
      uploaded_by: user.id,
      notes: notes ?? null,
    })
    .select("id, version_number, created_at, storage_object_path")
    .single();

  if (versionError || !version) {
    return c.json({
      error: "Failed to record document version",
      message: versionError?.message,
    }, 500);
  }

  // Update storage usage via service client (bypasses RLS)
  const adminClient = getServiceClient();
  const { data: existing } = await adminClient
    .schema("core")
    .from("organization_storage_usage")
    .select("storage_bytes, document_count, version_count")
    .eq("organization_id", id)
    .maybeSingle();

  const existingBytes = existing?.storage_bytes ?? 0;
  const existingDocCount = existing?.document_count ?? 0;
  const existingVersionCount = existing?.version_count ?? 0;
  const isNewDoc = (document.version_count ?? 0) === 0;

  await adminClient
    .schema("core")
    .from("organization_storage_usage")
    .upsert({
      organization_id: id,
      storage_bytes: Math.max(0, existingBytes + fileSize),
      document_count: Math.max(0, existingDocCount + (isNewDoc ? 1 : 0)),
      version_count: existingVersionCount + 1,
      updated_at: new Date().toISOString(),
    }, { onConflict: "organization_id" });

  return c.json(version);
});

/**
 * GET /v1/organizations/:id/documents/:documentId/versions
 * List document versions
 */
app.get("/:id/documents/:documentId/versions", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { id, documentId } = c.req.param();

  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const access = await getOrgAccess(supabase, user.id, id);
  if (access.error) {
    return c.json({ error: access.error }, access.status as 403 | 404);
  }

  const { data, error } = await supabase
    .schema("core")
    .from("organization_document_versions")
    .select(
      "id, version_number, size_bytes, mime_type, checksum, created_at, uploaded_by",
    )
    .eq("organization_id", id)
    .eq("document_id", documentId)
    .order("version_number", { ascending: false });

  if (error) {
    return c.json(
      { error: "Failed to load versions", message: error.message },
      500,
    );
  }

  return c.json(data ?? []);
});

/**
 * GET /v1/organizations/:id/documents/:documentId/shares
 * List document shares (admin only)
 */
app.get("/:id/documents/:documentId/shares", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { id, documentId } = c.req.param();

  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const access = await getOrgAccess(supabase, user.id, id, true);
  if (access.error) {
    return c.json({ error: access.error }, access.status as 403 | 404);
  }

  const { data, error } = await supabase
    .schema("core")
    .from("organization_document_shares")
    .select(
      "id, share_type, permission, target_user_id, external_email, expires_at, revoked_at, created_at, metadata",
    )
    .eq("organization_id", id)
    .eq("document_id", documentId)
    .is("revoked_at", null);

  if (error) {
    return c.json({
      error: "Failed to load document shares",
      message: error.message,
    }, 500);
  }

  return c.json(data ?? []);
});

/**
 * POST /v1/organizations/:id/documents/:documentId/shares
 * Share a document (admin only)
 */
app.post("/:id/documents/:documentId/shares", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { id, documentId } = c.req.param();

  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const access = await getOrgAccess(supabase, user.id, id, true);
  if (access.error) {
    return c.json({ error: access.error }, access.status as 403 | 404);
  }

  const body = await c.req.json();
  const {
    permission = "view",
    shareType = "organization_member",
    targetUserId,
    externalEmail,
    expiresAt,
  } = body;

  if (shareType === "organization_member" && !targetUserId) {
    return c.json({
      error: "Target user is required for organization member shares.",
    }, 400);
  }
  if (shareType === "external" && !externalEmail) {
    return c.json({ error: "Email is required for external shares." }, 400);
  }

  const { data: share, error } = await supabase
    .schema("core")
    .from("organization_document_shares")
    .insert({
      organization_id: id,
      document_id: documentId,
      share_type: shareType,
      permission,
      target_user_id: targetUserId ?? null,
      external_email: externalEmail ?? null,
      expires_at: expiresAt ?? null,
      created_by: user.id,
    })
    .select("*")
    .single();

  if (error || !share) {
    return c.json({
      error: "Failed to share document",
      message: error?.message,
    }, 500);
  }

  return c.json(share, 201);
});

/**
 * PATCH /v1/organizations/:id/documents/:documentId/shares/:shareId
 * Update document share permissions (admin only)
 */
app.patch("/:id/documents/:documentId/shares/:shareId", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { id, documentId: _documentId, shareId } = c.req.param();

  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const access = await getOrgAccess(supabase, user.id, id, true);
  if (access.error) {
    return c.json({ error: access.error }, access.status as 403 | 404);
  }

  const body = await c.req.json();
  const updates: Record<string, unknown> = {};
  if (body.permission) updates.permission = body.permission;
  if (body.expiresAt !== undefined) updates.expires_at = body.expiresAt;

  const { data, error } = await supabase
    .schema("core")
    .from("organization_document_shares")
    .update(updates)
    .eq("id", shareId)
    .eq("organization_id", id)
    .select("*")
    .single();

  if (error || !data) return c.json({ error: "Share not found" }, 404);

  return c.json(data);
});

/**
 * POST /v1/organizations/:id/documents/:documentId/shares/:shareId/revoke
 * Revoke a document share (admin only)
 */
app.post("/:id/documents/:documentId/shares/:shareId/revoke", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { id, documentId: _documentId, shareId } = c.req.param();

  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const access = await getOrgAccess(supabase, user.id, id, true);
  if (access.error) {
    return c.json({ error: access.error }, access.status as 403 | 404);
  }

  const { data, error } = await supabase
    .schema("core")
    .from("organization_document_shares")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", shareId)
    .eq("organization_id", id)
    .select("id")
    .single();

  if (error || !data) return c.json({ error: "Share not found" }, 404);

  return c.json({ success: true });
});

// ---------------------------------------------------------------------------
// Folders
// ---------------------------------------------------------------------------

/**
 * GET /v1/organizations/:id/folders
 * List organization folders
 */
app.get("/:id/folders", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { id } = c.req.param();

  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const access = await getOrgAccess(supabase, user.id, id);
  if (access.error) {
    return c.json({ error: access.error }, access.status as 403 | 404);
  }

  const { data, error } = await supabase
    .schema("core")
    .from("organization_folders")
    .select("id, name, description, parent_folder_id, depth, created_at")
    .eq("organization_id", id)
    .eq("is_deleted", false)
    .order("name", { ascending: true });

  if (error) {
    return c.json(
      { error: "Failed to load folders", message: error.message },
      500,
    );
  }

  return c.json(data ?? []);
});

/**
 * POST /v1/organizations/:id/folders
 * Create or update a folder (admin only)
 */
app.post("/:id/folders", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { id } = c.req.param();

  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const access = await getOrgAccess(supabase, user.id, id, true);
  if (access.error) {
    return c.json({ error: access.error }, access.status as 403 | 404);
  }

  const body = await c.req.json();
  const { folderId, name, description, parentFolderId } = body;

  if (!name) return c.json({ error: "name is required" }, 400);

  let depth = 0;
  if (parentFolderId) {
    const { data: parent } = await supabase
      .schema("core")
      .from("organization_folders")
      .select("depth")
      .eq("id", parentFolderId)
      .maybeSingle();
    depth = (parent?.depth ?? 0) + 1;
  }

  if (folderId) {
    const { data, error } = await supabase
      .schema("core")
      .from("organization_folders")
      .update({
        name,
        description: description ?? null,
        parent_folder_id: parentFolderId ?? null,
        depth,
        updated_by: user.id,
      })
      .eq("id", folderId)
      .select("*")
      .single();

    if (error || !data) return c.json({ error: "Folder not found" }, 404);
    return c.json(data);
  }

  const { data, error } = await supabase
    .schema("core")
    .from("organization_folders")
    .insert({
      organization_id: id,
      name,
      description: description ?? null,
      parent_folder_id: parentFolderId ?? null,
      depth,
      created_by: user.id,
      updated_by: user.id,
    })
    .select("*")
    .single();

  if (error || !data) {
    return c.json(
      { error: "Failed to create folder", message: error?.message },
      500,
    );
  }

  return c.json(data, 201);
});

/**
 * DELETE /v1/organizations/:id/folders/:folderId
 * Delete a folder (admin only, must be empty)
 */
app.delete("/:id/folders/:folderId", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { id, folderId } = c.req.param();

  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const access = await getOrgAccess(supabase, user.id, id, true);
  if (access.error) {
    return c.json({ error: access.error }, access.status as 403 | 404);
  }

  const { count: docCount } = await supabase
    .schema("core")
    .from("organization_documents")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", id)
    .eq("folder_id", folderId);

  if (typeof docCount === "number" && docCount > 0) {
    return c.json({
      error: "Move or delete documents before removing the folder.",
    }, 400);
  }

  const { error } = await supabase
    .schema("core")
    .from("organization_folders")
    .delete()
    .eq("id", folderId)
    .eq("organization_id", id);

  if (error) {
    return c.json(
      { error: "Failed to delete folder", message: error.message },
      500,
    );
  }

  return c.json({ success: true });
});

/**
 * GET /v1/organizations/:id/documents/search
 * Search documents by name
 */
app.get("/:id/documents/search", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { id } = c.req.param();

  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const access = await getOrgAccess(supabase, user.id, id);
  if (access.error) {
    return c.json({ error: access.error }, access.status as 403 | 404);
  }

  const query = c.req.query("query");
  const limit = Math.min(
    25,
    Math.max(1, parseInt(c.req.query("limit") ?? "10", 10)),
  );

  if (!query) return c.json({ error: "query parameter is required" }, 400);

  const { data, error } = await supabase
    .schema("core")
    .from("organization_documents")
    .select("id, name, category, updated_at")
    .eq("organization_id", id)
    .eq("is_deleted", false)
    .ilike("name", `%${query}%`)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    return c.json({
      error: "Failed to search documents",
      message: error.message,
    }, 500);
  }

  return c.json(data ?? []);
});

// ---------------------------------------------------------------------------
// Locations
// ---------------------------------------------------------------------------

/**
 * GET /v1/organizations/:id/locations
 * List organization locations
 */
app.get("/:id/locations", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { id } = c.req.param();

  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const access = await getOrgAccess(supabase, user.id, id);
  if (access.error) {
    return c.json({ error: access.error }, access.status as 403 | 404);
  }

  const includeInactive = c.req.query("includeInactive") === "true";

  let query = supabase
    .schema("core")
    .from("organization_locations")
    .select(
      "id, name, location_type, address, latitude, longitude, timezone, phone, email, is_active, metadata, created_at",
    )
    .eq("organization_id", id)
    .order("name", { ascending: true });

  if (!includeInactive) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error) {
    return c.json(
      { error: "Failed to load locations", message: error.message },
      500,
    );
  }

  return c.json(data ?? []);
});

/**
 * POST /v1/organizations/:id/locations
 * Create or update a location (admin only)
 */
app.post("/:id/locations", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { id } = c.req.param();

  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const access = await getOrgAccess(supabase, user.id, id, true);
  if (access.error) {
    return c.json({ error: access.error }, access.status as 403 | 404);
  }

  const body = await c.req.json();
  const {
    locationId,
    name,
    locationType = "other",
    address,
    latitude,
    longitude,
    timezone,
    phone,
    email,
    isActive,
  } = body;

  if (!name) return c.json({ error: "name is required" }, 400);

  const payload = {
    organization_id: id,
    name,
    location_type: locationType,
    address: address ?? {},
    latitude: latitude ?? null,
    longitude: longitude ?? null,
    timezone: timezone ?? null,
    phone: phone ?? null,
    email: email ?? null,
    is_active: isActive ?? true,
    metadata: {},
    updated_by: user.id,
  };

  if (locationId) {
    const { data, error } = await supabase
      .schema("core")
      .from("organization_locations")
      .update(payload)
      .eq("id", locationId)
      .eq("organization_id", id)
      .select("*")
      .single();

    if (error || !data) return c.json({ error: "Location not found" }, 404);
    return c.json(data);
  }

  const { data, error } = await supabase
    .schema("core")
    .from("organization_locations")
    .insert({ ...payload, created_by: user.id })
    .select("*")
    .single();

  if (error || !data) {
    return c.json({
      error: "Failed to create location",
      message: error?.message,
    }, 500);
  }

  return c.json(data, 201);
});

/**
 * PATCH /v1/organizations/:id/locations/:locationId/archive
 * Archive or reactivate a location (admin only)
 */
app.patch("/:id/locations/:locationId/archive", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { id, locationId } = c.req.param();

  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const access = await getOrgAccess(supabase, user.id, id, true);
  if (access.error) {
    return c.json({ error: access.error }, access.status as 403 | 404);
  }

  const body = await c.req.json();
  const isActive = body.isActive ?? false;

  const { data, error } = await supabase
    .schema("core")
    .from("organization_locations")
    .update({ is_active: isActive })
    .eq("id", locationId)
    .eq("organization_id", id)
    .select("id, is_active")
    .single();

  if (error || !data) return c.json({ error: "Location not found" }, 404);

  return c.json(data);
});

// ---------------------------------------------------------------------------
// Audit Log
// ---------------------------------------------------------------------------

/**
 * GET /v1/organizations/:id/audit-log
 * List audit log entries (admin only, cursor-paginated)
 */
app.get("/:id/audit-log", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { id } = c.req.param();

  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const access = await getOrgAccess(supabase, user.id, id, true);
  if (access.error) {
    return c.json({ error: access.error }, access.status as 403 | 404);
  }

  const limit = Math.min(
    200,
    Math.max(1, parseInt(c.req.query("limit") ?? "50", 10)),
  );
  const cursor = c.req.query("cursor");
  const actionTypesParam = c.req.query("actionTypes");
  const actionTypes = actionTypesParam ? actionTypesParam.split(",") : null;

  let query = supabase
    .schema("core")
    .from("organization_audit_log")
    .select(
      "id, action_type, target_type, target_id, actor_user_id, description, metadata, created_at",
    )
    .eq("organization_id", id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  if (actionTypes?.length) {
    query = query.in("action_type", actionTypes);
  }

  const { data, error } = await query;

  if (error) {
    return c.json(
      { error: "Failed to load audit log", message: error.message },
      500,
    );
  }

  const items = data ?? [];
  const nextCursor = items.length === limit
    ? items[items.length - 1]?.created_at ?? null
    : null;

  return c.json({ items, nextCursor });
});

/**
 * POST /v1/organizations/:id/audit-log/export
 * Export audit log as CSV or JSON (admin only)
 */
app.post("/:id/audit-log/export", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { id } = c.req.param();

  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const access = await getOrgAccess(supabase, user.id, id, true);
  if (access.error) {
    return c.json({ error: access.error }, access.status as 403 | 404);
  }

  const body = await c.req.json();
  const { format = "csv", since } = body;

  let query = supabase
    .schema("core")
    .from("organization_audit_log")
    .select(
      "created_at, action_type, target_type, target_id, actor_user_id, description",
    )
    .eq("organization_id", id)
    .order("created_at", { ascending: false })
    .limit(500);

  if (since) {
    query = query.gte("created_at", since);
  }

  const { data, error } = await query;

  if (error) {
    return c.json({
      error: "Failed to export audit log",
      message: error.message,
    }, 500);
  }

  if (format === "json") {
    return c.json({ format: "json", payload: data ?? [] });
  }

  const header = "timestamp,action,target_type,target_id,actor,description";
  const rows = (data ?? []).map(
    (
      row: {
        created_at: string;
        action_type?: string | null;
        target_type?: string | null;
        target_id?: string | null;
        actor_user_id?: string | null;
        description?: string | null;
      },
    ) => {
      const values = [
        row.created_at,
        row.action_type ?? "",
        row.target_type ?? "",
        row.target_id ?? "",
        row.actor_user_id ?? "",
        (row.description ?? "").replace(/'/g, '""'),
      ];
      return values.map((v) => `"${v}"`).join(",");
    },
  );

  return c.json({ format: "csv", payload: [header, ...rows].join("\n") });
});

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

/**
 * GET /v1/organizations/:id/storage-usage
 * Get storage usage summary
 */
app.get("/:id/storage-usage", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { id } = c.req.param();

  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const access = await getOrgAccess(supabase, user.id, id);
  if (access.error) {
    return c.json({ error: access.error }, access.status as 403 | 404);
  }

  const [{ data: usage }, { data: tier }, { data: override }] = await Promise
    .all([
      supabase
        .schema("core")
        .from("organization_storage_usage")
        .select("storage_bytes, document_count, version_count, updated_at")
        .eq("organization_id", id)
        .maybeSingle(),
      supabase
        .schema("core")
        .from("subscription_tier_limits")
        .select("max_storage_bytes, max_file_bytes, soft_warning_thresholds")
        .eq("tier", "starter")
        .maybeSingle(),
      supabase
        .schema("core")
        .from("organization_limit_overrides")
        .select("storage_bytes, file_bytes")
        .eq("organization_id", id)
        .eq("active", true)
        .maybeSingle(),
    ]);

  const storageBytes = usage?.storage_bytes ?? 0;
  const docCount = usage?.document_count ?? 0;
  const versionCount = usage?.version_count ?? 0;
  const updatedAt = usage?.updated_at ?? new Date().toISOString();

  const maxStorageBytes = override?.storage_bytes ?? tier?.max_storage_bytes ??
    10 * 1024 * 1024 * 1024;
  const maxFileBytes = override?.file_bytes ?? tier?.max_file_bytes ??
    25 * 1024 * 1024;
  const warningThresholds = tier?.soft_warning_thresholds ??
    [0.75, 0.9, 0.95, 0.99];

  const percentUsed = storageBytes / maxStorageBytes;
  const warnings = warningThresholds.filter((level: number) =>
    percentUsed >= level
  );

  return c.json({
    usageBytes: storageBytes,
    maxBytes: maxStorageBytes,
    percentUsed: Number((percentUsed * 100).toFixed(2)),
    documentCount: docCount,
    versionCount,
    warnings,
    maxFileBytes,
    updatedAt,
  });
});

export default app;
