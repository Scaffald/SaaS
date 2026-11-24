/**
 * NevarMail delivery events (#1393, #1389).
 *
 * NevarMail identifies a message only by `email_id`, the id its send call
 * returned; payloads do not echo our metadata. So an event is matched by that
 * id: first to a worker invite (generic_invitations.nevarmail_email_id), then
 * to a notification delivery (notification_deliveries.provider_msg_id, which
 * #1389 sets for notifications sent through NevarMail).
 */
import type { NevarMailEmailEvent } from '../../_shared/nevarmail.ts'

// deno-lint-ignore no-explicit-any
// biome-ignore lint/suspicious/noExplicitAny: untyped Deno Supabase client (#477)
type Supabase = any

export type InviteEventResult =
  | { matched: false }
  | { matched: true; invitationId: string; changed: string[] }

const FAILURE_TYPES = new Set(['email.bounced', 'email.dropped', 'email.complained'])

/**
 * Applies an `email.*` event to the invite it belongs to, if any. Opens and
 * clicks keep their FIRST time; a failure is recorded in metadata and leaves
 * the invite pending (the inviter can still send the link another way).
 */
export async function applyInviteEvent(
  supabase: Supabase,
  event: NevarMailEmailEvent
): Promise<InviteEventResult> {
  if (!event.email_id) return { matched: false }
  const core = supabase.schema('core')
  const { data: invite, error } = await core
    .from('generic_invitations')
    .select('id, email_opened_at, email_clicked_at, metadata')
    .eq('nevarmail_email_id', event.email_id)
    .maybeSingle()
  if (error) throw new Error(`invite lookup failed: ${error.message}`)
  if (!invite) return { matched: false }

  const at = event.occurred_at ?? new Date().toISOString()
  const updates: Record<string, unknown> = {}
  if (event.type === 'email.opened' && !invite.email_opened_at) updates.email_opened_at = at
  if (event.type === 'email.clicked') {
    if (!invite.email_clicked_at) updates.email_clicked_at = at
    // A click implies an open, even when the open pixel was blocked.
    if (!invite.email_opened_at) updates.email_opened_at = at
  }
  if (FAILURE_TYPES.has(event.type)) {
    updates.metadata = {
      ...(invite.metadata ?? {}),
      delivery_failure: { type: event.type, reason: event.reason ?? null, at },
    }
  }

  const changed = Object.keys(updates)
  if (changed.length) {
    const { error: updateError } = await core
      .from('generic_invitations')
      .update(updates)
      .eq('id', invite.id)
    if (updateError) throw new Error(`invite update failed: ${updateError.message}`)
  }
  return { matched: true, invitationId: invite.id, changed }
}
