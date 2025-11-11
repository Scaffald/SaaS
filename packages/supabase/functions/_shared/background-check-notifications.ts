import { z } from "zod";

import {
  insertNotification,
  ensureChannelArray,
} from "./notifications/utils.ts";
import type {
  NotificationSeverity,
  NotificationSupabaseClient,
  NotificationType,
} from "./notifications/types.ts";
import { backgroundCheckStatusEnum } from "./background-check-schemas.ts";

type BackgroundCheckStatus = z.infer<typeof backgroundCheckStatusEnum>;

interface StatusTemplateContext {
  status: BackgroundCheckStatus;
  packageName?: string | null;
  summary?: string | null;
}

interface StatusTemplate {
  type: NotificationType;
  severity: NotificationSeverity;
  workerTitle: string;
  workerMessage: (ctx: StatusTemplateContext) => string;
  requesterTitle?: string;
  requesterMessage?: (ctx: StatusTemplateContext) => string;
}

const COMPLETION_STATUSES = new Set<BackgroundCheckStatus>([
  "completed_clear",
  "completed_consider",
  "completed_not_clear",
  "partially_completed",
]);

const NEGATIVE_STATUSES = new Set<BackgroundCheckStatus>([
  "failed",
  "cancelled",
  "disputed",
  "expired",
  "refunded",
]);

const IN_APP_ONLY = ["in_app"] as const;

const statusTemplates: Partial<Record<BackgroundCheckStatus, StatusTemplate>> = {
  invited: {
    type: "info",
    severity: "important",
    workerTitle: "Background Check Invitation",
    workerMessage: ({ packageName }) =>
      packageName
        ? `You have been invited to start the ${packageName} background check package.`
        : "You have been invited to start a background check. Begin the process to keep your profile active.",
    requesterTitle: "Background Check Invitation Sent",
    requesterMessage: ({ packageName }) =>
      packageName
        ? `The ${packageName} background check package was sent to the worker.`
        : "A background check invitation was sent to the worker.",
  },
  submitted: {
    type: "info",
    severity: "info",
    workerTitle: "Background Check Submitted",
    workerMessage: () =>
      "Thanks! We received your background check submission. We’ll let you know when results are ready.",
    requesterTitle: "Background Check Submitted",
    requesterMessage: () =>
      "The worker has submitted their background check information. You’ll be notified when results are available.",
  },
  in_progress: {
    type: "info",
    severity: "info",
    workerTitle: "Background Check In Progress",
    workerMessage: () =>
      "Your background check is being processed. You’ll receive an update once we have results.",
    requesterTitle: "Background Check In Progress",
    requesterMessage: () =>
      "The background check is now processing. We’ll notify you when the results are ready.",
  },
  under_review: {
    type: "info",
    severity: "important",
    workerTitle: "Background Check Under Review",
    workerMessage: () =>
      "Your background check requires additional review. We’ll update you once the review is complete.",
    requesterTitle: "Background Check Under Review",
    requesterMessage: () =>
      "The background check moved into manual review. We’ll notify you once it’s resolved.",
  },
  completed_clear: {
    type: "bgcheck.completed",
    severity: "info",
    workerTitle: "Background Check Completed",
    workerMessage: () =>
      "Great news! Your background check is complete and no issues were found.",
    requesterTitle: "Background Check Completed",
    requesterMessage: () =>
      "The background check finished with a clear result. Review the findings in the dashboard.",
  },
  completed_consider: {
    type: "bgcheck.completed",
    severity: "important",
    workerTitle: "Background Check Requires Attention",
    workerMessage: ({ summary }) =>
      summary
        ? `Your background check is complete. Notes: ${summary}`
        : "Your background check is complete. Please review the details and follow up if requested.",
    requesterTitle: "Background Check Requires Review",
    requesterMessage: ({ summary }) =>
      summary
        ? `The background check finished with items to review: ${summary}`
        : "The background check finished with items to review. Please review the report.",
  },
  completed_not_clear: {
    type: "bgcheck.completed",
    severity: "critical",
    workerTitle: "Background Check Flagged",
    workerMessage: ({ summary }) =>
      summary
        ? `Your background check completed with issues: ${summary}`
        : "Your background check completed with issues that need attention. Please review and respond if requested.",
    requesterTitle: "Background Check Flagged",
    requesterMessage: ({ summary }) =>
      summary
        ? `The background check completed with critical findings: ${summary}`
        : "The background check completed with critical findings. Review the report as soon as possible.",
  },
  partially_completed: {
    type: "bgcheck.completed",
    severity: "important",
    workerTitle: "Partial Background Check Results",
    workerMessage: ({ summary }) =>
      summary
        ? `Partial results are ready: ${summary}`
        : "Partial background check results are available. We’ll share updates as remaining components finish.",
    requesterTitle: "Partial Background Check Results",
    requesterMessage: ({ summary }) =>
      summary
        ? `Partial background check results need review: ${summary}`
        : "Partial background check results are available. Monitor for completion.",
  },
  failed: {
    type: "info",
    severity: "critical",
    workerTitle: "Background Check Failed",
    workerMessage: ({ summary }) =>
      summary
        ? `We couldn’t complete your background check: ${summary}`
        : "We couldn’t complete your background check. Please contact support to resolve the issue.",
    requesterTitle: "Background Check Failed",
    requesterMessage: ({ summary }) =>
      summary
        ? `The background check failed to complete: ${summary}`
        : "The background check couldn’t be completed. Review the record for next steps.",
  },
  cancelled: {
    type: "info",
    severity: "important",
    workerTitle: "Background Check Cancelled",
    workerMessage: ({ summary }) =>
      summary
        ? `Your background check was cancelled: ${summary}`
        : "Your background check was cancelled. Reach out if you expected it to continue.",
    requesterTitle: "Background Check Cancelled",
    requesterMessage: ({ summary }) =>
      summary
        ? `The background check was cancelled: ${summary}`
        : "The background check was cancelled. Review the record if further action is needed.",
  },
  disputed: {
    type: "info",
    severity: "important",
    workerTitle: "Background Check Dispute Submitted",
    workerMessage: () =>
      "We received your dispute. Our team will review the details and follow up shortly.",
    requesterTitle: "Background Check Dispute Filed",
    requesterMessage: () =>
      "The worker filed a dispute on their background check results. Review the record to respond.",
  },
  expired: {
    type: "info",
    severity: "important",
    workerTitle: "Background Check Expired",
    workerMessage: ({ packageName }) =>
      packageName
        ? `The ${packageName} background check has expired. Start a new check if ongoing access is required.`
        : "Your background check has expired. Start a new check if ongoing access is required.",
    requesterTitle: "Background Check Expired",
    requesterMessage: ({ packageName }) =>
      packageName
        ? `The ${packageName} background check for this worker expired. Re-run the check if access is still needed.`
        : "The background check for this worker expired. Re-run the check if access is still required.",
  },
  refunded: {
    type: "info",
    severity: "info",
    workerTitle: "Background Check Refunded",
    workerMessage: () =>
      "We processed a refund for your background check payment. Contact support if this was unexpected.",
    requesterTitle: "Background Check Refunded",
    requesterMessage: () =>
      "The background check payment was refunded. Review billing records for details.",
  },
};

function buildStatusMessage(
  audience: "worker" | "requester",
  ctx: StatusTemplateContext,
): StatusTemplate | null {
  const template = statusTemplates[ctx.status];

  if (template) {
    return template;
  }

  // Provide sensible defaults for statuses without explicit templates
  if (COMPLETION_STATUSES.has(ctx.status)) {
    return {
      type: "bgcheck.completed",
      severity: "info",
      workerTitle: "Background Check Update",
      workerMessage: ({ summary }) =>
        summary
          ? `Your background check status changed: ${summary}`
          : "Your background check status has been updated. Review the latest details.",
      requesterTitle: "Background Check Update",
      requesterMessage: ({ summary }) =>
        summary
          ? `The background check status changed: ${summary}`
          : "The background check status has been updated. Review the record for details.",
    };
  }

  if (NEGATIVE_STATUSES.has(ctx.status)) {
    return {
      type: "info",
      severity: "important",
      workerTitle: "Background Check Update",
      workerMessage: ({ summary }) =>
        summary
          ? `There’s an update on your background check: ${summary}`
          : "There’s an important update on your background check. Review the record for details.",
      requesterTitle: "Background Check Update",
      requesterMessage: ({ summary }) =>
        summary
          ? `There’s an update on the background check: ${summary}`
          : "There’s an important update on the background check. Review the record for details.",
    };
  }

  return {
    type: "info",
    severity: "info",
    workerTitle: "Background Check Update",
    workerMessage: ({ summary }) =>
      summary
        ? `Your background check status changed: ${summary}`
        : "Your background check status changed. We’ll keep you posted as it progresses.",
    requesterTitle: "Background Check Update",
    requesterMessage: ({ summary }) =>
      summary
        ? `The background check status changed: ${summary}`
        : "The background check status changed. Monitor the record for next steps.",
  };
}

interface BaseNotificationPayload extends StatusTemplateContext {
  supabase: NotificationSupabaseClient;
  checkId: string;
  actorId?: string | null;
}

interface StatusNotificationPayload extends BaseNotificationPayload {
  status: BackgroundCheckStatus;
  workerId: string;
  requesterId?: string | null;
}

export async function notifyBackgroundCheckStatusChange(
  payload: StatusNotificationPayload,
): Promise<void> {
  const {
    supabase,
    status,
    workerId,
    requesterId,
    checkId,
    packageName,
    summary,
    actorId,
  } = payload;

  const ctx: StatusTemplateContext = { status, packageName, summary };
  const template = buildStatusMessage("worker", ctx);

  const dedupeBase = `bgcheck:${checkId}:${status}`;

  if (template) {
    try {
      await insertNotification(
        supabase,
        {
          user_id: workerId,
          type: template.type,
          severity: template.severity,
          title: template.workerTitle,
          message: template.workerMessage(ctx),
          preview: summary ?? template.workerMessage(ctx),
          body: {
            background_check_id: checkId,
            status,
            summary,
            audience: "worker",
          },
          metadata: {
            background_check_id: checkId,
            status,
            packageName,
            actorId,
          },
          routed_channels: ensureChannelArray([...IN_APP_ONLY]),
        },
        `${dedupeBase}:worker:${workerId}`,
      );
    } catch (error) {
      console.error("[background-checks] failed to create worker notification", error);
    }
  }

  if (requesterId && requesterId !== workerId) {
    const requesterTemplate = buildStatusMessage("requester", ctx);
    if (requesterTemplate) {
      try {
        await insertNotification(
          supabase,
          {
            user_id: requesterId,
            type: requesterTemplate.type,
            severity: requesterTemplate.severity,
            title: requesterTemplate.requesterTitle ?? requesterTemplate.workerTitle,
            message:
              requesterTemplate.requesterMessage?.(ctx) ??
                requesterTemplate.workerMessage(ctx),
            preview:
              requesterTemplate.requesterMessage?.(ctx) ??
                requesterTemplate.workerMessage(ctx),
            body: {
              background_check_id: checkId,
              status,
              summary,
              audience: "requester",
            },
            metadata: {
              background_check_id: checkId,
              status,
              packageName,
              actorId,
            },
            routed_channels: ensureChannelArray([...IN_APP_ONLY]),
          },
          `${dedupeBase}:requester:${requesterId}`,
        );
      } catch (error) {
        console.error(
          "[background-checks] failed to create requester notification",
          error,
        );
      }
    }
  }
}

interface InvitationNotificationPayload extends BaseNotificationPayload {
  workerId: string;
  invitedById?: string | null;
}

export async function notifyBackgroundCheckInvitation(
  payload: InvitationNotificationPayload,
): Promise<void> {
  const { supabase, workerId, invitedById, checkId, packageName, actorId } = payload;

  const title = "Action Required: Background Check";
  const message = packageName
    ? `Please complete the ${packageName} background check to keep your opportunities moving.`
    : "Please complete your background check to keep your opportunities moving.";

  try {
    await insertNotification(
      supabase,
      {
        user_id: workerId,
        type: "info",
        severity: "important",
        title,
        message,
        preview: message,
        body: {
          background_check_id: checkId,
          status: "invited",
          audience: "worker",
        },
        metadata: {
          background_check_id: checkId,
          packageName,
          invitedById,
          actorId,
        },
        routed_channels: ensureChannelArray([...IN_APP_ONLY]),
      },
      `bgcheck:${checkId}:invited:${workerId}`,
    );
  } catch (error) {
    console.error("[background-checks] failed to create invitation notification", error);
  }

  if (invitedById && invitedById !== workerId) {
    try {
      await insertNotification(
        supabase,
        {
          user_id: invitedById,
          type: "info",
          severity: "info",
          title: "Background Check Invitation Sent",
          message: packageName
            ? `You invited a worker to complete the ${packageName} background check package.`
            : "You invited a worker to complete a background check package.",
          preview: packageName
            ? `Invitation sent for ${packageName}`
            : "Background check invitation sent",
          body: {
            background_check_id: checkId,
            status: "invited",
            audience: "requester",
          },
          metadata: {
            background_check_id: checkId,
            packageName,
            workerId,
            actorId,
          },
          routed_channels: ensureChannelArray([...IN_APP_ONLY]),
        },
        `bgcheck:${checkId}:invited:${invitedById}`,
      );
    } catch (error) {
      console.error(
        "[background-checks] failed to create requester invitation notification",
        error,
      );
    }
  }
}

