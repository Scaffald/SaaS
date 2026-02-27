/**
 * ForSured Email Integration
 *
 * Email communication auditability
 *
 * Wraps @bernierllc/email-manager with:
 * - ForSured-specific context tracking (project, task, subcontractor, etc.)
 * - Automatic audit logging for all email communications
 * - Delivery status tracking via webhook integration
 *
 * This enables showing exactly what was communicated, when, and to whom -
 * critical for claims and compliance in the insurance industry.
 */

import {
  sendEmail as sendEmailViaManager,
  sendTemplatedEmail as sendTemplatedViaManager,
} from "./emailConfig";
import { auditService } from "../audit";

/**
 * ForSured-specific context for email tracking
 * Links emails to projects, tasks, subcontractors for claims/compliance
 */
export interface ForSuredEmailContext {
  projectId?: string;
  taskId?: string;
  subcontractorId?: string;
  organizationId?: string;
  brokerId?: string;
  managerId?: string;
  invitationId?: string;
  invitationType?: "broker" | "relationship" | "referral" | "project";
}

/**
 * Email send result with tracking information
 */
export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  sentAt: Date;
  error?: string;
}

/**
 * Email audit metadata structure
 */
interface EmailAuditMetadata {
  message_id?: string;
  template?: string;
  recipient_email: string | string[];
  recipient_count: number;
  subject?: string;
  provider: "sendgrid";
  // Context links for claims/compliance
  project_id?: string;
  task_id?: string;
  subcontractor_id?: string;
  organization_id?: string;
  broker_id?: string;
  manager_id?: string;
  invitation_id?: string;
  invitation_type?: string;
  // Delivery tracking (updated via webhooks)
  delivery_status?:
    | "pending"
    | "sent"
    | "delivered"
    | "opened"
    | "clicked"
    | "bounced"
    | "failed";
}

/**
 * Log email event to audit trail
 */
async function logEmailAudit(
  action:
    | "email_sent"
    | "email_delivered"
    | "email_opened"
    | "email_clicked"
    | "email_bounced"
    | "email_failed",
  metadata: EmailAuditMetadata,
  context: ForSuredEmailContext,
  userId?: string,
): Promise<void> {
  try {
    await auditService.log({
      category: "system", // Using 'system' since 'communication' isn't in the type
      action,
      severity: action === "email_bounced" || action === "email_failed"
        ? "medium"
        : "info",
      user_id: userId,
      organization_id: context.organizationId,
      resource_type: "email",
      status: action === "email_bounced" || action === "email_failed"
        ? "failure"
        : "success",
      metadata: {
        ...metadata,
        project_id: context.projectId,
        task_id: context.taskId,
        subcontractor_id: context.subcontractorId,
        broker_id: context.brokerId,
        manager_id: context.managerId,
        invitation_id: context.invitationId,
        invitation_type: context.invitationType,
      },
    });
  } catch (error) {
    // Never fail the application due to audit logging
    console.error("[EmailIntegration] Audit logging failed:", error);
  }
}

/**
 * Send an email with ForSured context tracking and audit logging
 */
export async function sendForSuredEmail(options: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  context: ForSuredEmailContext;
  userId?: string;
}): Promise<EmailSendResult> {
  const { to, subject, html, text, context, userId } = options;
  const recipients = Array.isArray(to) ? to : [to];
  const sentAt = new Date();

  try {
    // Send email via @bernierllc/email-manager
    const result = await sendEmailViaManager({
      to: recipients,
      subject,
      html,
      text,
      metadata: {
        // Pass ForSured context as metadata for webhook filtering
        forsured: true,
        project_id: context.projectId,
        task_id: context.taskId,
        subcontractor_id: context.subcontractorId,
        invitation_id: context.invitationId,
      },
    });

    // Log successful send to audit trail
    await logEmailAudit(
      "email_sent",
      {
        message_id: result.messageId,
        recipient_email: to,
        recipient_count: recipients.length,
        subject,
        provider: "sendgrid",
        delivery_status: "sent",
      },
      context,
      userId,
    );

    return {
      success: true,
      messageId: result.messageId,
      sentAt,
    };
  } catch (error) {
    const errorMessage = error instanceof Error
      ? error.message
      : "Unknown error sending email";

    // Log failed send to audit trail
    await logEmailAudit(
      "email_failed",
      {
        recipient_email: to,
        recipient_count: recipients.length,
        subject,
        provider: "sendgrid",
        delivery_status: "failed",
      },
      context,
      userId,
    );

    console.error("[EmailIntegration] Send failed:", errorMessage);

    return {
      success: false,
      sentAt,
      error: errorMessage,
    };
  }
}

/**
 * Send a templated email with ForSured context tracking and audit logging
 */
export async function sendForSuredTemplatedEmail(options: {
  templateId: string;
  to: string | string[];
  templateData: Record<string, unknown>;
  context: ForSuredEmailContext;
  userId?: string;
}): Promise<EmailSendResult> {
  const { templateId, to, templateData, context, userId } = options;
  const recipients = Array.isArray(to) ? to : [to];
  const sentAt = new Date();

  try {
    // Send templated email via @bernierllc/email-manager
    const result = await sendTemplatedViaManager(
      templateId,
      {
        ...templateData,
        // Include ForSured context for webhook filtering
        _forsured_context: {
          project_id: context.projectId,
          task_id: context.taskId,
          subcontractor_id: context.subcontractorId,
          invitation_id: context.invitationId,
        },
      },
      recipients,
      {
        forsured: true,
        project_id: context.projectId,
        task_id: context.taskId,
        subcontractor_id: context.subcontractorId,
        invitation_id: context.invitationId,
      },
    );

    // Log successful send to audit trail
    await logEmailAudit(
      "email_sent",
      {
        message_id: result.messageId,
        template: templateId,
        recipient_email: to,
        recipient_count: recipients.length,
        provider: "sendgrid",
        delivery_status: "sent",
      },
      context,
      userId,
    );

    return {
      success: true,
      messageId: result.messageId,
      sentAt,
    };
  } catch (error) {
    const errorMessage = error instanceof Error
      ? error.message
      : "Unknown error sending email";

    // Log failed send to audit trail
    await logEmailAudit(
      "email_failed",
      {
        template: templateId,
        recipient_email: to,
        recipient_count: recipients.length,
        provider: "sendgrid",
        delivery_status: "failed",
      },
      context,
      userId,
    );

    console.error("[EmailIntegration] Send failed:", errorMessage);

    return {
      success: false,
      sentAt,
      error: errorMessage,
    };
  }
}

/**
 * Process webhook event and update audit trail
 * Called from the SendGrid webhook handler
 */
export async function processEmailWebhookEvent(event: {
  type:
    | "delivered"
    | "opened"
    | "clicked"
    | "bounced"
    | "dropped"
    | "spam_report";
  messageId: string;
  recipient: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const { type, messageId, recipient, timestamp, metadata } = event;

  // Map webhook event types to audit actions
  const actionMap: Record<
    string,
    | "email_delivered"
    | "email_opened"
    | "email_clicked"
    | "email_bounced"
    | "email_failed"
  > = {
    delivered: "email_delivered",
    opened: "email_opened",
    clicked: "email_clicked",
    bounced: "email_bounced",
    dropped: "email_failed",
    spam_report: "email_bounced",
  };

  const action = actionMap[type] || "email_delivered";

  // Extract ForSured context from metadata if available
  const context: ForSuredEmailContext = {
    projectId: metadata?.project_id as string | undefined,
    taskId: metadata?.task_id as string | undefined,
    subcontractorId: metadata?.subcontractor_id as string | undefined,
    invitationId: metadata?.invitation_id as string | undefined,
  };

  await logEmailAudit(
    action,
    {
      message_id: messageId,
      recipient_email: recipient,
      recipient_count: 1,
      provider: "sendgrid",
      delivery_status: type === "bounced" || type === "dropped"
        ? "failed"
        : type as EmailAuditMetadata["delivery_status"],
    },
    context,
  );
}

// Re-export for convenience
export { auditService };
