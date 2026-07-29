import type { Json } from './database.types.ts'
import type { NotificationSupabaseClient } from './notifications/types.ts'
import {
  enqueueDelivery,
  ensureChannelArray,
  getUserContacts,
  insertNotification,
} from './notifications/utils.ts'

const DASHBOARD_PATH = '/profile/verification'

function getEnvValue(key: string): string | undefined {
  if (typeof Deno !== 'undefined' && typeof Deno.env?.get === 'function') {
    const value = Deno.env.get(key)
    if (value) return value
  }
  const nodeProcess = (globalThis as { process?: { env?: Record<string, string | undefined> } })
    .process
  return nodeProcess?.env?.[key]
}

function normalizeBaseUrl(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value
}

const APP_BASE_URL = normalizeBaseUrl(
  getEnvValue('EXPO_PUBLIC_URL') ??
    getEnvValue('SUPABASE_SITE_URL') ??
    getEnvValue('SITE_URL') ??
    'https://scaffald.com'
)

const PORTAL_URL = `${APP_BASE_URL}${DASHBOARD_PATH}`

type ReminderWindow = '30' | '7' | 'expired'

interface ReminderPayload {
  supabase: NotificationSupabaseClient
  verificationId: string
  workerId: string
  expiresAt: string
  window: ReminderWindow
}

function buildSubject(window: ReminderWindow): string {
  switch (window) {
    case '30':
      return 'Your ID verification badge expires in 30 days'
    case '7':
      return 'Your ID verification badge expires in 7 days'
    case 'expired':
      return 'Your ID verification badge has expired'
    default:
      return 'ID verification badge status update'
  }
}

function formatDate(value: string): string {
  try {
    return new Date(value).toLocaleDateString('en-US', { dateStyle: 'medium' })
  } catch {
    return value
  }
}

function buildBodyLines(window: ReminderWindow, expiresAt: string): string[] {
  const formattedDate = formatDate(expiresAt)
  if (window === 'expired') {
    return [
      `Your ID verification badge expired on ${formattedDate}.`,
      'Start a new verification to keep your profile highlighted in search and job matches.',
      `Open your badge dashboard: ${PORTAL_URL}`,
    ]
  }

  return [
    `Your ID verification badge will expire on ${formattedDate}.`,
    'Renew now to keep the “Verified Identity” badge on your profile.',
    `Open your badge dashboard: ${PORTAL_URL}`,
  ]
}

export async function notifyIdVerificationExpirationReminder(
  payload: ReminderPayload
): Promise<void> {
  const { supabase, verificationId, workerId, expiresAt, window } = payload

  const subject = buildSubject(window)
  const lines = buildBodyLines(window, expiresAt)
  const message = lines[0] ?? subject

  const reminderMetadata: Record<string, Json | undefined> = {
    verification_id: verificationId,
    reminder_window: window,
    expires_at: expiresAt,
    portal_url: PORTAL_URL,
  }

  const channels = ensureChannelArray(['in_app', 'email'])
  const notification = await insertNotification(
    supabase,
    {
      user_id: workerId,
      title: subject,
      message,
      type: 'info',
      severity: window === 'expired' ? 'important' : 'info',
      preview: message,
      body: { verification_id: verificationId, reminder_window: window },
      metadata: reminderMetadata,
      routed_channels: channels,
    },
    `id_verification:${verificationId}:${window}`
  )

  if (!notification) {
    return
  }

  const { email } = await getUserContacts(supabase, workerId)
  if (!email) {
    return
  }

  await enqueueDelivery(supabase, notification.id, 'email', 'sendgrid', {
    email,
    subject,
    text: lines.join('\n\n'),
    html: lines.map((line) => `<p>${line}</p>`).join(''),
  })
}
