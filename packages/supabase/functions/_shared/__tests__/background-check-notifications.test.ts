import { beforeEach, describe, expect, it, vi } from 'vitest'

// Ensure a stable base URL for email templates before importing modules
const ensuredProcess =
  (globalThis as { process?: { env?: Record<string, string> } }).process ??
  (() => {
    const created = { env: {} as Record<string, string> }
    ;(globalThis as { process: { env: Record<string, string> } }).process = created
    return created
  })()

ensuredProcess.env ??= {}
ensuredProcess.env.EXPO_PUBLIC_URL = 'https://example.com'

vi.mock('../notifications/utils.ts', async () => {
  const actual = await vi.importActual<typeof import('../notifications/utils.ts')>(
    '../notifications/utils.ts',
  )

  return {
    ...actual,
    insertNotification: vi.fn(),
    enqueueDelivery: vi.fn(),
    getUserContacts: vi.fn(),
  }
})

import {
  notifyBackgroundCheckExpirationReminder,
  notifyBackgroundCheckInvitation,
  notifyBackgroundCheckStatusChange,
} from '../background-check-notifications';
import {
  enqueueDelivery,
  getUserContacts,
  insertNotification,
} from '../notifications/utils';

const mockedInsertNotification = vi.mocked(insertNotification)
const mockedEnqueueDelivery = vi.mocked(enqueueDelivery)
const mockedGetUserContacts = vi.mocked(getUserContacts)

describe('notifyBackgroundCheckStatusChange', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('routes adverse status updates through email for worker and requester', async () => {
    mockedInsertNotification
      .mockResolvedValueOnce({ id: 'notif-worker' } as any)
      .mockResolvedValueOnce({ id: 'notif-requester' } as any)

    mockedGetUserContacts
      .mockResolvedValueOnce({ email: 'worker@example.com', phone: null })
      .mockResolvedValueOnce({ email: 'requester@example.com', phone: null })

    await notifyBackgroundCheckStatusChange({
      supabase: {} as any,
      status: 'completed_not_clear',
      workerId: 'worker-uuid',
      requesterId: 'requester-uuid',
      checkId: 'check-uuid',
      packageName: 'Executive',
      summary: 'Record requires review',
      actorId: 'admin-uuid',
    })

    expect(mockedInsertNotification).toHaveBeenCalledTimes(2)
    expect(mockedEnqueueDelivery).toHaveBeenCalledTimes(2)

    const workerChannels = mockedInsertNotification.mock.calls[0]?.[1]?.routed_channels
    expect(workerChannels).toContain('email')

    const workerEmailPayload = mockedEnqueueDelivery.mock.calls[0]?.[4]
    expect(workerEmailPayload.email).toBe('worker@example.com')
    const workerTemplateData = workerEmailPayload
      .templateData as Record<string, unknown> | undefined
    expect(workerTemplateData).toBeDefined()
    expect(workerTemplateData?.summaryOfRightsUrl).toEqual(
      expect.stringContaining('consumerfinance'),
    )

    const requesterChannels = mockedInsertNotification.mock.calls[1]?.[1]?.routed_channels
    expect(requesterChannels).toContain('email')
  })

  it('falls back to in-app only when no worker email is available', async () => {
    mockedInsertNotification.mockResolvedValueOnce({ id: 'notif-worker' } as any)
    mockedGetUserContacts.mockResolvedValueOnce({ email: null, phone: null })

    await notifyBackgroundCheckStatusChange({
      supabase: {} as any,
      status: 'completed_consider',
      workerId: 'worker-uuid',
      requesterId: null,
      checkId: 'check-uuid',
      packageName: 'Entry Level',
      summary: null,
      actorId: 'admin-uuid',
    })

    expect(mockedInsertNotification).toHaveBeenCalledTimes(1)
    const workerChannels = mockedInsertNotification.mock.calls[0]?.[1]?.routed_channels
    expect(workerChannels).not.toContain('email')
    expect(mockedEnqueueDelivery).not.toHaveBeenCalled()
  })
})

describe('notifyBackgroundCheckInvitation', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('sends invitation emails to worker and inviter when addresses exist', async () => {
    mockedInsertNotification
      .mockResolvedValueOnce({ id: 'notif-worker' } as any)
      .mockResolvedValueOnce({ id: 'notif-inviter' } as any)

    mockedGetUserContacts
      .mockResolvedValueOnce({ email: 'worker@example.com', phone: null })
      .mockResolvedValueOnce({ email: 'inviter@example.com', phone: null })

    await notifyBackgroundCheckInvitation({
      supabase: {} as any,
      workerId: 'worker-uuid',
      invitedById: 'inviter-uuid',
      checkId: 'check-uuid',
      packageName: 'Executive',
      actorId: 'admin-uuid',
      status: 'invited',
    })

    expect(mockedInsertNotification).toHaveBeenCalledTimes(2)
    expect(mockedEnqueueDelivery).toHaveBeenCalledTimes(2)

    const workerEmailPayload = mockedEnqueueDelivery.mock.calls[0]?.[4]
    expect(workerEmailPayload.email).toBe('worker@example.com')
    expect(workerEmailPayload.subject).toContain('Background Check')

    const inviterEmailPayload = mockedEnqueueDelivery.mock.calls[1]?.[4]
    expect(inviterEmailPayload.email).toBe('inviter@example.com')
  })
})

describe('notifyBackgroundCheckExpirationReminder', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('queues worker and requester reminder emails', async () => {
    mockedInsertNotification
      .mockResolvedValueOnce({ id: 'worker-reminder' } as any)
      .mockResolvedValueOnce({ id: 'requester-reminder' } as any)

    mockedGetUserContacts
      .mockResolvedValueOnce({ email: 'worker@example.com', phone: null })
      .mockResolvedValueOnce({ email: 'requester@example.com', phone: null })

    await notifyBackgroundCheckExpirationReminder({
      supabase: {} as any,
      checkId: 'check-uuid',
      workerId: 'worker-uuid',
      requesterId: 'requester-uuid',
      packageName: 'Executive',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      windowDays: 30,
    })

    expect(mockedInsertNotification).toHaveBeenCalledTimes(2)
    expect(mockedEnqueueDelivery).toHaveBeenCalledTimes(2)

    const workerArgs = mockedInsertNotification.mock.calls[0]?.[1]
    const workerMetadata = workerArgs?.metadata as Record<string, unknown> | undefined
    expect(workerMetadata?.reminder_window_days).toBe(30)

    const workerEmailPayload = mockedEnqueueDelivery.mock.calls[0]?.[4]
    expect(workerEmailPayload.email).toBe('worker@example.com')
    const workerTemplateData = workerEmailPayload
      .templateData as Record<string, unknown> | undefined
    expect(workerTemplateData?.windowDays).toBe(30)

    const requesterArgs = mockedInsertNotification.mock.calls[1]?.[1]
    const requesterMetadata = requesterArgs?.metadata as Record<string, unknown> | undefined
    expect(requesterMetadata?.reminder_window_days).toBe(30)
  })

  it('skips requester reminder when requester is absent', async () => {
    mockedInsertNotification.mockResolvedValueOnce({ id: 'worker-reminder' } as any)
    mockedGetUserContacts.mockResolvedValueOnce({ email: 'worker@example.com', phone: null })

    await notifyBackgroundCheckExpirationReminder({
      supabase: {} as any,
      checkId: 'check-uuid',
      workerId: 'worker-uuid',
      packageName: null,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      windowDays: 7,
    })

    expect(mockedInsertNotification).toHaveBeenCalledTimes(1)
    expect(mockedEnqueueDelivery).toHaveBeenCalledTimes(1)
    const workerPayload = mockedEnqueueDelivery.mock.calls[0]?.[4]
    const templateData = workerPayload.templateData as Record<string, unknown> | undefined
    expect(templateData?.windowDays).toBe(7)
  })
})

