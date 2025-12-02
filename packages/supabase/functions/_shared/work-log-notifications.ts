import type {
  NotificationSeverity,
  NotificationSupabaseClient,
  NotificationType,
} from './notifications/types.ts'
import { insertNotification } from './notifications/utils.ts'

export type WorkLogCollaboratorAction = 'added' | 'removed' | 'permission_changed' | 'comment'

interface WorkLogNotificationContext {
  supabase: NotificationSupabaseClient
  recipientId: string
  actorId: string
  workLogId: string
  entryType: string
  logDate: string | null
  permissionLevel?: 'view' | 'edit'
  commentPreview?: string
}

interface NotificationTemplate {
  type: NotificationType
  severity: NotificationSeverity
  title: string
  buildMessage: (ctx: WorkLogNotificationContext) => string
}

function formatLogDate(logDate: string | null): string {
  if (!logDate) return 'this work log'
  try {
    const date = new Date(`${logDate}T00:00:00Z`)
    if (Number.isNaN(date.valueOf())) {
      return `the work log on ${logDate}`
    }
    return `the work log on ${date.toLocaleDateString('en-US', { dateStyle: 'medium' })}`
  } catch {
    return `the work log on ${logDate}`
  }
}

const actionTemplates: Record<WorkLogCollaboratorAction, NotificationTemplate> = {
  added: {
    type: 'info',
    severity: 'important',
    title: 'Added as Collaborator',
    buildMessage: (ctx) =>
      `You were added to ${formatLogDate(ctx.logDate)} with ${ctx.permissionLevel === 'edit' ? 'edit' : 'view'} access.`,
  },
  removed: {
    type: 'info',
    severity: 'info',
    title: 'Collaborator Access Removed',
    buildMessage: (ctx) =>
      `Your collaborator access was removed for ${formatLogDate(ctx.logDate)}.`,
  },
  permission_changed: {
    type: 'info',
    severity: 'important',
    title: 'Collaborator Access Updated',
    buildMessage: (ctx) =>
      `Your collaborator access level was updated to ${ctx.permissionLevel ?? 'view'} for ${formatLogDate(ctx.logDate)}.`,
  },
  comment: {
    type: 'message.received',
    severity: 'info',
    title: 'New Work Log Comment',
    buildMessage: (ctx) =>
      ctx.commentPreview
        ? `A new comment was posted on ${formatLogDate(ctx.logDate)}: "${ctx.commentPreview}"`
        : `A new comment was posted on ${formatLogDate(ctx.logDate)}.`,
  },
}

export async function notifyWorkLogCollaborator(
  action: WorkLogCollaboratorAction,
  ctx: WorkLogNotificationContext
): Promise<void> {
  const template = actionTemplates[action]
  const message = template.buildMessage(ctx)

  await insertNotification(ctx.supabase, {
    user_id: ctx.recipientId,
    type: template.type,
    severity: template.severity,
    title: template.title,
    message,
    metadata: {
      workLogId: ctx.workLogId,
      actorId: ctx.actorId,
      action,
      entryType: ctx.entryType,
      logDate: ctx.logDate,
      permissionLevel: ctx.permissionLevel ?? null,
    },
    preview: action === 'comment' ? (ctx.commentPreview ?? null) : null,
    routed_channels: ['in_app'],
  })
}
