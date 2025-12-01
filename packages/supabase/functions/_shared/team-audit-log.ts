import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from './database.types';

type ServiceSupabaseClient = SupabaseClient<Database>;

/**
 * Team audit action types for logging purposes.
 *
 * NOTE: The team_member_audit_log table was removed in migration 040.
 * This function now logs to console for observability but does not persist to database.
 * If audit logging is needed again, create a new migration to add the table back.
 */
export type TeamAuditAction =
  | "invited"
  | "joined"
  | "role_changed"
  | "removed"
  | "reinstated"
  | "left"
  | "invitation_rescinded"
  | "job_assigned"
  | "job_unassigned"
  | "ownership_transferred"
  | "workload_rebalanced";

interface RecordTeamAuditLogOptions {
  supabaseAdmin: ServiceSupabaseClient;
  teamId: string;
  action: TeamAuditAction;
  actorUserId?: string | null;
  memberUserId?: string | null;
  metadata?: Json;
}

/**
 * Records a team audit log event.
 *
 * NOTE: The team_member_audit_log table was removed in migration 040 as part of
 * the team management schema refactor. This function now logs to console for
 * observability purposes only.
 *
 * If persistent audit logging is required in the future, create a new migration
 * to add back the core.team_member_audit_log table with appropriate schema.
 */
export async function recordTeamAuditLog({
  supabaseAdmin: _supabaseAdmin,
  teamId,
  action,
  actorUserId,
  memberUserId,
  metadata,
}: RecordTeamAuditLogOptions): Promise<void> {
  // Log to console for observability (table was removed in migration 040)
  console.log("[team-audit-log] Event recorded", {
    teamId,
    action,
    actorUserId: actorUserId ?? null,
    memberUserId: memberUserId ?? null,
    metadata: metadata ?? {},
    timestamp: new Date().toISOString(),
  });
}
