import { afterEach, describe, expect, it, vi } from 'vitest'

import * as service from '../service'
import { verificationSubjectTypes } from '../schema'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('fetchVerificationStatus', () => {
  it('returns the normalized verification status when the RPC succeeds', async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: {
        status: 'verified',
        verified_at: '2024-01-01T00:00:00Z',
        verified_by: 'admin-user',
        revoked_at: null,
      },
      error: null,
    })

    const supabase = { rpc } as never

    const result = await service.fetchVerificationStatus(supabase, 'worker-1', 'org-1')

    expect(rpc).toHaveBeenCalledWith('admin_get_worker_verification_status', {
      worker_id: 'worker-1',
      organization_id: 'org-1',
    })
    expect(result).toEqual({
      status: 'verified',
      verifiedAt: '2024-01-01T00:00:00Z',
      verifiedBy: 'admin-user',
      revokedAt: null,
    })
  })

  it('returns the unknown status when the RPC fails', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = new Error('boom')
    const rpc = vi.fn().mockResolvedValue({ data: null, error })

    const supabase = { rpc } as never

    const result = await service.fetchVerificationStatus(supabase, 'worker-1', 'org-1')

    expect(result).toEqual({
      status: 'unknown',
      verifiedAt: null,
      verifiedBy: null,
      revokedAt: null,
    })
    expect(consoleWarnSpy).toHaveBeenCalledWith('Unable to load verification status', error)
  })
})

describe('loadActiveVerificationFields', () => {
  it('returns an empty map when no worker IDs are provided', async () => {
    const supabase = { from: vi.fn() }

    const result = await service.loadActiveVerificationFields(supabase as never, [])

    expect(result.size).toBe(0)
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('aggregates verification fields for each worker when the query succeeds', async () => {
    const rows = [
      { subject_id: 'worker-1', field: 'email' },
      { subject_id: 'worker-1', field: 'email' },
      { subject_id: 'worker-1', field: 'phone' },
      { subject_id: 'worker-2', field: 'license' },
    ]

    const chain = (() => {
      const builder: Record<string, ReturnType<typeof vi.fn>> & {
        select: ReturnType<typeof vi.fn>
        in: ReturnType<typeof vi.fn>
        is: ReturnType<typeof vi.fn>
      } = {
        select: vi.fn(),
        in: vi.fn(),
        is: vi.fn(),
      }

      builder.select.mockImplementation(() => builder)
      builder.in.mockImplementation(() => builder)
      builder.is.mockResolvedValue({ data: rows, error: null })

      return builder
    })()

    const supabase = { from: vi.fn().mockReturnValue(chain) }

    const result = await service.loadActiveVerificationFields(supabase as never, ['worker-1', 'worker-2'])

    expect(supabase.from).toHaveBeenCalledWith('profile_verifications')
    expect(chain.in).toHaveBeenNthCalledWith(1, 'subject_id', ['worker-1', 'worker-2'])
    expect(chain.in).toHaveBeenNthCalledWith(2, 'subject_type', verificationSubjectTypes)
    expect(chain.is).toHaveBeenCalledWith('revoked_at', null)
    expect(result.get('worker-1')).toEqual(['email', 'phone'])
    expect(result.get('worker-2')).toEqual(['license'])
  })

  it('returns an empty map and logs a warning when the query fails', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const chain = (() => {
      const builder: Record<string, ReturnType<typeof vi.fn>> & {
        select: ReturnType<typeof vi.fn>
        in: ReturnType<typeof vi.fn>
        is: ReturnType<typeof vi.fn>
      } = {
        select: vi.fn(),
        in: vi.fn(),
        is: vi.fn(),
      }

      builder.select.mockImplementation(() => builder)
      builder.in.mockImplementation(() => builder)
      builder.is.mockResolvedValue({ data: null, error: new Error('query failed') })

      return builder
    })()

    const supabase = { from: vi.fn().mockReturnValue(chain) }

    const result = await service.loadActiveVerificationFields(supabase as never, ['worker-1'])

    expect(result.size).toBe(0)
    expect(consoleWarnSpy).toHaveBeenCalledWith('Failed to load active verification fields', expect.any(Error))
  })
})

describe('loadWorkerDetail', () => {
  it('returns the worker record with profile, private, and verification details', async () => {
    const userRow = {
      id: 'worker-1',
      display_name: 'Worker One',
      username: 'worker1',
      slug: 'worker-one',
      headline: 'Skilled Worker',
      bio: 'Bio',
      industry_id: 'industry-1',
      avatar_url: 'https://cdn/avatar.png',
      avatar_media_id: 'media-1',
      open_to_work: true,
      years_of_experience: 5,
      skills_summary: { skills: ['TypeScript'] },
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
      profile: { name: 'Worker One', about: 'About', avatar_url: 'https://cdn/profile.png' },
      user_private: {
        user_id: 'worker-1',
        email: 'worker@example.com',
        phone: '123-456-7890',
        address: { city: 'New York' },
        contact_prefs: ['email'],
        veteran: true,
        us_resident: true,
        us_passport: false,
        travel_mileage: 20,
        education_level: 'college',
        hourly_rate_cents: 7500,
        location: 'New York',
        open_to_travel: true,
        drivers_license_class: 'C',
        phone_os: 'ios',
        availability: ['full-time'],
        certifications: ['osha'],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      },
    }

    const userQuery = {
      select: vi.fn(),
      eq: vi.fn(),
      maybeSingle: vi.fn().mockResolvedValue({ data: userRow, error: null }),
    }
    userQuery.select.mockReturnValue(userQuery)
    userQuery.eq.mockReturnValue(userQuery)

    const ledgerRows = [
      {
        id: 'ledger-1',
        subject_type: 'profile',
        field: 'email',
        verified_at: '2024-02-01T00:00:00Z',
        verified_by: 'admin',
        revoked_at: null,
        source: 'manual',
        notes: 'Verified manually',
      },
    ]

    const profileBuilderFactory = () => {
      const builder = {
        select: vi.fn(),
        eq: vi.fn(),
        in: vi.fn(),
        is: vi.fn(),
        order: vi.fn(),
      }

      builder.select.mockReturnValue(builder)
      builder.eq.mockReturnValue(builder)
      builder.in.mockReturnValue(builder)
      builder.is.mockResolvedValue({
        data: [
          { subject_id: 'worker-1', field: 'email' },
        ],
        error: null,
      })
      builder.order.mockResolvedValue({ data: ledgerRows, error: null })

      return builder
    }

    const supabase = {
      rpc: vi.fn().mockImplementation((fn: string) => {
        if (fn === 'admin_get_worker_verification_status') {
          return Promise.resolve({
            data: {
              status: 'verified',
              verified_at: '2024-02-01T00:00:00Z',
              verified_by: 'admin',
              revoked_at: null,
            },
            error: null,
          })
        }
        return Promise.reject(new Error(`Unexpected RPC: ${fn}`))
      }),
      from: vi.fn((table: string) => {
        if (table === 'users') {
          return userQuery
        }
        if (table === 'profile_verifications') {
          return profileBuilderFactory()
        }
        throw new Error(`Unexpected table: ${table}`)
      }),
    }

    const result = await service.loadWorkerDetail(supabase as never, 'worker-1', 'org-1')
    expect(result).toMatchObject({
      id: 'worker-1',
      displayName: 'Worker One',
      username: 'worker1',
      slug: 'worker-one',
      headline: 'Skilled Worker',
      bio: 'Bio',
      industryId: 'industry-1',
      avatarUrl: 'https://cdn/avatar.png',
      avatarMediaId: 'media-1',
      openToWork: true,
      yearsOfExperience: 5,
      skillsSummary: { skills: ['TypeScript'] },
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
      profile: { name: 'Worker One', about: 'About', avatarUrl: 'https://cdn/profile.png' },
      privateData: expect.objectContaining({
        userId: 'worker-1',
        email: 'worker@example.com',
        openToTravel: true,
        driversLicenseClass: 'C',
      }),
      verification: {
        status: 'verified',
        verifiedAt: '2024-02-01T00:00:00Z',
        verifiedBy: 'admin',
        revokedAt: null,
        fields: ['email'],
        history: [
          {
            id: 'ledger-1',
            subjectType: 'profile',
            field: 'email',
            verifiedAt: '2024-02-01T00:00:00Z',
            verifiedBy: 'admin',
            revokedAt: null,
            source: 'manual',
            notes: 'Verified manually',
          },
        ],
      },
    })
  })

  it('throws an internal server error when the user query fails', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const userQuery = {
      select: vi.fn(),
      eq: vi.fn(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: new Error('query failed') }),
    }
    userQuery.select.mockReturnValue(userQuery)
    userQuery.eq.mockReturnValue(userQuery)

    const supabase = {
      from: vi.fn(() => userQuery),
    }

    await expect(service.loadWorkerDetail(supabase as never, 'worker-1', 'org-1')).rejects.toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Unable to fetch worker details.',
    })
    expect(consoleErrorSpy).toHaveBeenCalled()
  })

  it('throws a not found error when the worker record is missing', async () => {
    const userQuery = {
      select: vi.fn(),
      eq: vi.fn(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    userQuery.select.mockReturnValue(userQuery)
    userQuery.eq.mockReturnValue(userQuery)

    const supabase = {
      from: vi.fn(() => userQuery),
    }

    await expect(service.loadWorkerDetail(supabase as never, 'worker-1', 'org-1')).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'Worker not found.',
    })
  })
})

describe('verifyWorker', () => {
  it('verifies the worker and returns the updated status', async () => {
    const rpc = vi.fn().mockImplementation((fn: string, params: Record<string, unknown>) => {
      if (fn === 'admin_verify_worker') {
        expect(params).toEqual({
          worker_id: 'worker-1',
          organization_id: 'org-1',
          field: 'email',
          subject_type: 'profile',
          reason: 'all good',
        })
        return Promise.resolve({ data: null, error: null })
      }
      if (fn === 'admin_get_worker_verification_status') {
        expect(params).toEqual({
          worker_id: 'worker-1',
          organization_id: 'org-1',
        })
        return Promise.resolve({
          data: {
            status: 'verified',
            verified_at: '2024-02-01T00:00:00Z',
            verified_by: 'admin',
            revoked_at: null,
          },
          error: null,
        })
      }
      return Promise.reject(new Error(`Unexpected RPC: ${fn}`))
    })

    const supabase = { rpc } as never

    const result = await service.verifyWorker(
      supabase,
      {
        workerId: 'worker-1',
        organizationId: 'org-1',
        field: 'email',
        subjectType: 'profile',
        reason: 'all good',
      }
    )

    expect(rpc).toHaveBeenNthCalledWith(1, 'admin_verify_worker', expect.any(Object))
    expect(rpc).toHaveBeenNthCalledWith(2, 'admin_get_worker_verification_status', {
      worker_id: 'worker-1',
      organization_id: 'org-1',
    })
    expect(result).toEqual({
      status: 'verified',
      verifiedAt: '2024-02-01T00:00:00Z',
      verifiedBy: 'admin',
      revokedAt: null,
    })
  })

  it('throws an error when the verification RPC fails', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const rpc = vi.fn().mockResolvedValue({ data: null, error: new Error('rpc failed') })

    const supabase = { rpc } as never

    await expect(
      service.verifyWorker(supabase, {
        workerId: 'worker-1',
        organizationId: 'org-1',
        field: 'email',
        subjectType: 'profile',
      })
    ).rejects.toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Unable to verify worker.',
    })

    expect(consoleErrorSpy).toHaveBeenCalled()
  })
})

describe('revokeWorkerVerification', () => {
  it('revokes verification and returns the updated status', async () => {
    const rpc = vi.fn().mockImplementation((fn: string, params: Record<string, unknown>) => {
      if (fn === 'admin_revoke_worker_verification') {
        expect(params).toEqual({
          worker_id: 'worker-1',
          organization_id: 'org-1',
          field: 'email',
          subject_type: 'profile',
          reason: 'expired',
        })
        return Promise.resolve({ data: null, error: null })
      }
      if (fn === 'admin_get_worker_verification_status') {
        expect(params).toEqual({
          worker_id: 'worker-1',
          organization_id: 'org-1',
        })
        return Promise.resolve({
          data: {
            status: 'revoked',
            verified_at: '2024-02-01T00:00:00Z',
            verified_by: 'admin',
            revoked_at: '2024-02-02T00:00:00Z',
          },
          error: null,
        })
      }
      return Promise.reject(new Error(`Unexpected RPC: ${fn}`))
    })

    const supabase = { rpc } as never

    const result = await service.revokeWorkerVerification(
      supabase,
      {
        workerId: 'worker-1',
        organizationId: 'org-1',
        field: 'email',
        subjectType: 'profile',
        reason: 'expired',
      }
    )

    expect(rpc).toHaveBeenNthCalledWith(1, 'admin_revoke_worker_verification', expect.any(Object))
    expect(rpc).toHaveBeenNthCalledWith(2, 'admin_get_worker_verification_status', {
      worker_id: 'worker-1',
      organization_id: 'org-1',
    })
    expect(result).toEqual({
      status: 'revoked',
      verifiedAt: '2024-02-01T00:00:00Z',
      verifiedBy: 'admin',
      revokedAt: '2024-02-02T00:00:00Z',
    })
  })

  it('throws an error when the revoke RPC fails', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const rpc = vi.fn().mockResolvedValue({ data: null, error: new Error('rpc failed') })

    const supabase = { rpc } as never

    await expect(
      service.revokeWorkerVerification(supabase, {
        workerId: 'worker-1',
        organizationId: 'org-1',
        field: 'email',
        subjectType: 'profile',
      })
    ).rejects.toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Unable to revoke worker verification.',
    })

    expect(consoleErrorSpy).toHaveBeenCalled()
  })
})
