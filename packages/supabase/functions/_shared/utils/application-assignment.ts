import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '../database.types';

type SupabaseAdminClient = SupabaseClient<Database>

const ASSIGNABLE_ROLE_KEYS = ['admin', 'lead', 'recruiter']

export async function autoAssignApplicationToTeam(options: {
  supabaseAdmin: SupabaseAdminClient
  applicationId: string
  teamId: string
  jobId?: string | null
  organizationId?: string | null
}): Promise<{ assignedUserId: string | null }> {
  const { supabaseAdmin, applicationId, teamId, jobId, organizationId } = options

  const memberQuery = supabaseAdmin
    .schema('core')
    .from('team_members')
    .select(
      `
        user_id,
        status,
        role:team_roles(key)
      `
    )
    .eq('team_id', teamId)
    .eq('status', 'active')

  const { data: members, error: membersError } = (await memberQuery) as {
    data: Array<{ user_id: string; role?: { key?: string } | null }> | null
    error: PostgrestError | null
  }

  if (membersError || !members || members.length === 0) {
    return { assignedUserId: null }
  }

  const eligibleMembers = members.filter((member) =>
    member.role?.key ? ASSIGNABLE_ROLE_KEYS.includes(member.role.key) : false
  )

  if (eligibleMembers.length === 0) {
    return { assignedUserId: null }
  }

  const randomIndex = Math.floor(Math.random() * eligibleMembers.length)
  const assignee = eligibleMembers[randomIndex]

  await assignApplicationToMember({
    supabaseAdmin,
    applicationId,
    teamId,
    assigneeUserId: assignee.user_id,
    organizationId: organizationId ?? null,
    source: 'auto',
    metadata: jobId ? { jobId } : {},
  })

  return { assignedUserId: assignee.user_id }
}

export async function assignApplicationToMember(options: {
  supabaseAdmin: SupabaseAdminClient
  applicationId: string
  teamId: string
  assigneeUserId: string
  actorUserId?: string | null
  organizationId?: string | null
  source?: 'manual' | 'auto'
  metadata?: Record<string, unknown>
}): Promise<void> {
  const {
    supabaseAdmin,
    applicationId,
    teamId,
    assigneeUserId,
    actorUserId,
    organizationId,
    source = 'manual',
    metadata = {},
  } = options

  const { error: updateError } = await supabaseAdmin
    .schema('core')
    .from('applications')
    .update({
      assigned_to: assigneeUserId,
      assigned_at: new Date().toISOString(),
      assigned_by: actorUserId ?? null,
    })
    .eq('id', applicationId)

  if (updateError) {
    throw new Error(`[applications] Failed to assign application: ${updateError.message}`)
  }

  const { error: historyError } = await supabaseAdmin
    .schema('core')
    .from('application_assignment_history')
    .insert({
      application_id: applicationId,
      team_id: teamId,
      assigned_to: assigneeUserId,
      assigned_by: actorUserId ?? null,
      source,
      metadata,
    })

  if (historyError) {
    console.error('[applications] Failed to record assignment history', {
      applicationId,
      teamId,
      assigneeUserId,
      error: historyError.message,
    })
  }

  const { error: activityError } = await supabaseAdmin
    .schema('core')
    .from('team_activity_events')
    .insert({
      team_id: teamId,
      organization_id: organizationId ?? null,
      event_type: source === 'auto' ? 'application.assigned' : 'application.reassigned',
      actor_user_id: actorUserId ?? null,
      related_application_id: applicationId,
      payload: {
        assignedTo: assigneeUserId,
        source,
        metadata,
      },
    })

  if (activityError) {
    console.error('[applications] Failed to record team activity for assignment', {
      applicationId,
      teamId,
      assigneeUserId,
      error: activityError.message,
    })
  }
}
