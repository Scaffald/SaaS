import type { Database } from '@app/supabase/types'
import { createSupabaseClientStub } from '@app/test-utils'
import { TRPCError } from '@trpc/server'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ensureAdminAccess } from '../access'
import {
  buildIlikeFilter,
  mapPrivateUpdates,
  mapProfileUpdates,
  mapPublicUpdates,
  mergeUpdatePayloads,
  normaliseVerificationStatus,
  type WorkerVerificationStatus,
} from '../mappers'
import type {
  WorkerPrivateUpdateInput,
  WorkerProfileUpdateInput,
  WorkerPublicUpdateInput,
} from '../schema'


afterEach(() => {
  vi.restoreAllMocks()
})

describe('normaliseVerificationStatus', () => {
  it('returns a well-formed status when payload fields use snake_case', () => {
    const payload = {
      status: 'verified',
      verified_at: '2024-01-01T00:00:00Z',
      verified_by: 'admin',
      revoked_at: null,
    }

    const result = normaliseVerificationStatus(payload)

    expect(result).toEqual<WorkerVerificationStatus>({
      status: 'verified',
      verifiedAt: '2024-01-01T00:00:00Z',
      verifiedBy: 'admin',
      revokedAt: null,
    })
  })

  it('falls back to camelCase fields and coerces unknown status values', () => {
    const payload = {
      current_status: 'not-a-status',
      verifiedAt: '2024-01-01T00:00:00Z',
      verifiedBy: 'admin',
      revokedAt: '2024-02-01T00:00:00Z',
    }

    const result = normaliseVerificationStatus(payload)

    expect(result).toEqual<WorkerVerificationStatus>({
      status: 'unknown',
      verifiedAt: '2024-01-01T00:00:00Z',
      verifiedBy: 'admin',
      revokedAt: '2024-02-01T00:00:00Z',
    })
  })

  it('returns the unknown status for non-object payloads', () => {
    const result = normaliseVerificationStatus(undefined)

    expect(result).toEqual<WorkerVerificationStatus>({
      status: 'unknown',
      verifiedAt: null,
      verifiedBy: null,
      revokedAt: null,
    })
  })
})

describe('buildIlikeFilter', () => {
  it('escapes wildcard characters for LIKE queries', () => {
    const result = buildIlikeFilter('100% match_value')

    expect(result).toBe('%100\\% match\\_value%')
  })
})

describe('mapPublicUpdates', () => {
  it('maps camelCase fields to database columns', () => {
    const input: WorkerPublicUpdateInput = {
      displayName: 'Worker',
      openToWork: true,
      skillsSummary: { languages: ['TypeScript'] },
      avatarMediaId: 'media-id',
    }

    const result = mapPublicUpdates(input)

    expect(result).toEqual({
      display_name: 'Worker',
      open_to_work: true,
      skills_summary: { languages: ['TypeScript'] },
      avatar_media_id: 'media-id',
    })
  })

  it('returns null when no fields are provided', () => {
    const result = mapPublicUpdates({} as WorkerPublicUpdateInput)

    expect(result).toBeNull()
  })
})

describe('mapPrivateUpdates', () => {
  it('normalises nullable fields and converts casing', () => {
    const input: WorkerPrivateUpdateInput = {
      address: { line1: '123 Main St' },
      phoneOs: 'ios',
      driversLicenseClass: null,
      contactPrefs: ['email'],
    }

    const result = mapPrivateUpdates(input)

    expect(result).toEqual({
      address: { line1: '123 Main St' },
      phone_os: 'ios',
      drivers_license_class: null,
      contact_prefs: ['email'],
    })
  })

  it('returns null when the payload is empty', () => {
    const result = mapPrivateUpdates({} as WorkerPrivateUpdateInput)

    expect(result).toBeNull()
  })
})

describe('mapProfileUpdates', () => {
  it('maps profile fields to their database columns', () => {
    const input: WorkerProfileUpdateInput = {
      name: 'Admin',
      about: 'About',
    }

    const result = mapProfileUpdates(input)

    expect(result).toEqual({
      name: 'Admin',
      about: 'About',
    })
  })

  it('returns null when there are no profile fields to update', () => {
    const result = mapProfileUpdates({} as WorkerProfileUpdateInput)

    expect(result).toBeNull()
  })
})

describe('mergeUpdatePayloads', () => {
  it('combines update payloads while ignoring null values', () => {
    const result = mergeUpdatePayloads({ a: 1 }, null, undefined, { b: 2 }, { c: 3 })

    expect(result).toEqual({ a: 1, b: 2, c: 3 })
  })

  it('returns null when all payloads are falsy', () => {
    const result = mergeUpdatePayloads(null, undefined)

    expect(result).toBeNull()
  })
})

describe('ensureAdminAccess', () => {
  it('allows super administrators and applies organization context when provided', async () => {
    const { client: supabase, rpc } = createSupabaseClientStub<Database>()
    rpc
      .mockResolvedValueOnce({ data: true, error: null })
      .mockResolvedValueOnce({ data: null, error: null })

    const result = await ensureAdminAccess(supabase, 'user-id', 'org-id')

    expect(result).toEqual({ role: 'super_admin', organizationId: 'org-id' })
    expect(rpc).toHaveBeenNthCalledWith(1, 'user_has_role', {
      p_user_id: 'user-id',
      p_role_name: 'super_admin',
    })
    expect(rpc).toHaveBeenNthCalledWith(2, 'set_org_context', { p_org_id: 'org-id' })
  })

  it('allows partner administrators when they belong to the target organization', async () => {
    const { client: supabase, rpc } = createSupabaseClientStub<Database>()
    rpc
      .mockResolvedValueOnce({ data: false, error: null })
      .mockResolvedValueOnce({ data: true, error: null })
      .mockResolvedValueOnce({ data: null, error: null })

    const result = await ensureAdminAccess(supabase, 'user-id', 'org-id')

    expect(result).toEqual({ role: 'partner_admin', organizationId: 'org-id' })
    expect(rpc).toHaveBeenNthCalledWith(2, 'user_has_role', {
      p_user_id: 'user-id',
      p_role_name: 'partner_admin',
      p_org_id: 'org-id',
    })
  })

  it('rejects partner administrators when no organization is supplied', async () => {
    const { client: supabase, rpc } = createSupabaseClientStub<Database>()
    rpc.mockResolvedValue({ data: false, error: null })

    await expect(ensureAdminAccess(supabase, 'user-id', undefined)).rejects.toHaveProperty(
      'code',
      'FORBIDDEN'
    )
  })

  it('propagates RPC errors when verifying administrator roles', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { client: supabase, rpc } = createSupabaseClientStub<Database>()
    rpc.mockResolvedValue({ data: null, error: new Error('boom') })

    await expect(ensureAdminAccess(supabase, 'user-id', undefined)).rejects.toBeInstanceOf(
      TRPCError
    )
    expect(consoleErrorSpy).toHaveBeenCalled()
  })
})
