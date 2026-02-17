/**
 * Conversation Email Notifications
 *
 * Sends notification emails to conversation participants when new messages arrive.
 * Respects org-level email policy (full_content vs links_only).
 * Includes broker upsell for non-account brokers.
 */

import { sendEmail } from './emailConfig';
import { forsured } from '../supabase';

const APP_URL = process.env.VITE_APP_URL || 'https://app.forsured.com';

const CONFIDENTIALITY_FOOTER = `
  <p style="font-size: 12px; color: #666; margin-top: 24px; border-top: 1px solid #eee; padding-top: 12px;">
    Conversations are confidential between the members of this conversation, encrypted in flight and at rest within Forsured's systems.
  </p>
`;

const BROKER_UPSELL_BANNER = (clientName: string) => `
  <div style="background: #f0f7ff; border: 1px solid #d0e3ff; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
    <p style="margin: 0; font-size: 14px;">You're receiving this because <strong>${clientName}</strong> uses Forsured to manage insurance compliance.</p>
  </div>
`;

const BROKER_UPSELL_CTA = `
  <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin-top: 16px; text-align: center;">
    <p style="margin: 0 0 8px;">Sign up for Forsured to see all your tasks, manage documents, and communicate with your clients in one place.</p>
    <a href="${APP_URL}/signup?ref=conversation-email" style="display: inline-block; background: #2563eb; color: white; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">Create your free account</a>
  </div>
`;

interface NotifyParams {
  conversationId: string;
  senderUserId: string;
  senderName: string;
  messageContent: string;
  taskName: string;
  projectName?: string;
  attachmentNames?: string[];
}

export function buildConversationEmailHtml(params: {
  policy: 'full_content' | 'links_only';
  senderName: string;
  messageContent: string;
  taskName: string;
  conversationUrl: string;
  attachmentNames?: string[];
  isBrokerWithoutAccount: boolean;
  clientName?: string;
}): string {
  const { policy, senderName, messageContent, taskName, conversationUrl, attachmentNames, isBrokerWithoutAccount, clientName } = params;

  let html = '';

  if (isBrokerWithoutAccount && clientName) {
    html += BROKER_UPSELL_BANNER(clientName);
  }

  if (policy === 'full_content') {
    html += `
      <p><strong>${senderName}</strong> sent a message on <strong>${taskName}</strong>:</p>
      <div style="background: #f8f9fa; border-left: 4px solid #2563eb; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
        ${messageContent.replace(/\n/g, '<br>')}
      </div>
    `;

    if (attachmentNames && attachmentNames.length > 0) {
      html += `<p>Attachments: ${attachmentNames.join(', ')}</p>`;
    }

    html += `<p><a href="${conversationUrl}">View in Forsured</a></p>`;
  } else {
    html += `
      <p><strong>${senderName}</strong> sent you a message about <strong>${taskName}</strong>.</p>
      <p style="text-align: center; margin: 24px 0;">
        <a href="${conversationUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: 600;">View Message</a>
      </p>
    `;
  }

  if (isBrokerWithoutAccount) {
    html += BROKER_UPSELL_CTA;
  }

  html += CONFIDENTIALITY_FOOTER;

  return html;
}

export async function notifyConversationParticipants(params: NotifyParams): Promise<void> {
  // Get conversation with participants and org policy
  const { data: conversation } = await forsured('conversations')
    .select(`
      *,
      conversation_participants(
        user_id,
        user:forsured.users(id, email, name, display_name)
      ),
      organization:forsured.organizations(conversation_email_policy)
    `)
    .eq('id', params.conversationId)
    .single();

  if (!conversation) return;

  const policy = conversation.organization?.conversation_email_policy ?? 'full_content';
  const conversationUrl = `${APP_URL}/tasks/${conversation.task_id}/conversations/${conversation.id}`;

  // Get participants excluding the sender
  const recipients = conversation.conversation_participants
    .filter((p: { user_id: string }) => p.user_id !== params.senderUserId)
    .map((p: { user: { id: string; email: string; name: string | null; display_name: string | null } }) => p.user);

  // Check which users have real accounts (non-manual users)
  // Manual users will have a specific flag or lack auth records
  for (const recipient of recipients) {
    if (!recipient?.email) continue;

    // Check if this is a manual user (broker without account)
    const { data: userProfile } = await forsured('user_profiles')
      .select('id')
      .eq('user_id', recipient.id)
      .single();

    const isBrokerWithoutAccount = !userProfile;

    const subject = policy === 'full_content'
      ? `[Forsured] New message on ${params.taskName} from ${params.senderName}`
      : `[Forsured] New message on ${params.taskName}`;

    const html = buildConversationEmailHtml({
      policy,
      senderName: params.senderName,
      messageContent: params.messageContent,
      taskName: params.taskName,
      conversationUrl,
      attachmentNames: params.attachmentNames,
      isBrokerWithoutAccount,
      clientName: params.senderName,
    });

    await sendEmail({
      to: [recipient.email],
      subject,
      html,
      replyTo: conversation.inbound_email_address,
    });
  }
}
