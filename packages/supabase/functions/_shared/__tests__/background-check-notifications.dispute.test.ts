import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('../notifications/utils.ts', async () => {
  const actual = await vi.importActual<typeof import('../notifications/utils.ts')>(
    '../notifications/utils.ts'
  )

  return {
    ...actual,
    insertNotification: vi.fn(),
    enqueueDelivery: vi.fn(),
    getUserContacts: vi.fn(),
  }
})

import {
  notifyBackgroundCheckStatusChange,
} from '../background-check-notifications.ts';
import {
  enqueueDelivery,
  getUserContacts,
  insertNotification,
} from '../notifications/utils.ts';

const mockedInsertNotification = vi.mocked(insertNotification)
const mockedEnqueueDelivery = vi.mocked(enqueueDelivery)
const mockedGetUserContacts = vi.mocked(getUserContacts)

describe('notifyBackgroundCheckStatusChange dispute handling', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('includes dispute follow-up guidance when a worker files a dispute', async () => {
    mockedInsertNotification
      .mockResolvedValueOnce({ id: 'notif-worker' } as any)
      .mockResolvedValueOnce({ id: 'notif-requester' } as any)

    mockedGetUserContacts
      .mockResolvedValueOnce({ email: 'worker@example.com', phone: null })
      .mockResolvedValueOnce({ email: 'requester@example.com', phone: null })

    await notifyBackgroundCheckStatusChange({
      supabase: {} as any,
      status: 'disputed',
      workerId: 'worker-uuid',
      requesterId: 'requester-uuid',
      checkId: 'check-uuid',
      packageName: 'Executive',
      summary: 'Worker submitted dispute evidence',
      actorId: 'worker-uuid',
    })

    expect(mockedInsertNotification).toHaveBeenCalledTimes(2)
    expect(mockedEnqueueDelivery).toHaveBeenCalledTimes(2)

    const workerEmailPayload = mockedEnqueueDelivery.mock.calls[0]?.[4]
    expect(workerEmailPayload.email).toBe('worker@example.com')
    expect(workerEmailPayload.text).toContain('reviewing your dispute')

    const requesterEmailPayload = mockedEnqueueDelivery.mock.calls[1]?.[4]
    expect(requesterEmailPayload.email).toBe('requester@example.com')
    expect(requesterEmailPayload.text).toContain('has disputed the findings')
    expect(requesterEmailPayload.text).toContain('5 business days')
  })
})
