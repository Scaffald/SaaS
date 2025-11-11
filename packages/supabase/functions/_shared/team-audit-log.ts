import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "./database.types.ts";

type ServiceSupabaseClient = SupabaseClient<Database>;

export type TeamAuditAction =
  | "invited"
  | "joined"
  | "role_changed"
  | "removed"
  | "reinstated"
  | "left"
  | "invitation_rescinded";

interface RecordTeamAuditLogOptions {
  supabaseAdmin: ServiceSupabaseClient;
  teamId: string;
  action: TeamAuditAction;
  actorUserId?: string | null;
  memberUserId?: string | null;
  metadata?: Json;
}

export async function recordTeamAuditLog({
  supabaseAdmin,
  teamId,
  action,
  actorUserId,
  memberUserId,
  metadata,
}: RecordTeamAuditLogOptions): Promise<void> {
  const { error } = await supabaseAdmin
    .schema("core")
    .from("team_member_audit_log")
    .insert({
      team_id: teamId,
      action,
      actor_user_id: actorUserId ?? null,
      member_user_id: memberUserId ?? null,
      metadata: metadata ?? {},
    });

  if (error) {
    console.error("[team-audit-log] Failed to record audit event", {
      teamId,
      action,
      actorUserId,
      memberUserId,
      message: error.message,
    });
  }
}


