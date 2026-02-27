/**
 * Broker Invitation Router Tests
 * REQ-13: Contractor Invitation Email with Insurance Document Upload
 * Task 8: Testing Suite - API Router Tests
 */

import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest'
import { brokerInvitationRouter } from '../brokerInvitation'
import * as supabaseModule from '../../../../lib/supabase'
import { TRPCError } from '@trpc/server'

// Mock the supabase module
vi.mock('../../../../lib/supabase', () => ({
  supabase: {
    schema: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    storage: {
      from: vi.fn().mockReturnThis(),
      upload: vi.fn(),
      remove: vi.fn(),
    },
  },
  supabaseServiceRole: {
    schema: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    insert: vi.fn().mockReturnThis(),
    upsert: vi.fn(),
    storage: {
      from: vi.fn().mockReturnThis(),
      upload: vi.fn(),
      remove: vi.fn(),
    },
  },
}))

// Test data
const TEST_CONTRACTOR_ID = '550e8400-e29b-41d4-a716-446655440001'
const TEST_BROKER_ID = '550e8400-e29b-41d4-a716-446655440002'
const TEST_USER_ID = '7c9e6679-7425-40de-944b-e07fc1f90ae7'
const TEST_SCAFFALD_USER_ID = '8c9e6679-7425-40de-944b-e07fc1f90ae8'

const mockContractor = {
  id: TEST_CONTRACTOR_ID,
  name: 'Test Contractor',
  email: 'contractor@example.com',
  company_name: 'Test Contractor Inc',
  user_type: 'contractor',
  scaffald_user_id: TEST_SCAFFALD_USER_ID,
}

const mockBrokerInfo = {
  name: 'John Broker',
  email: 'broker@example.com',
  phone: '555-1234',
  company: 'Insurance Co',
  createAccount: false,
}

const mockFile = {
  name: 'test-document.pdf',
  type: 'application/pdf',
  size: 1024 * 1024, // 1MB
  data: btoa('test file content'), // base64 encoded
}

describe('brokerInvitationRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getByReferralCode', () => {
    it('should return contractor info for valid referral code', async () => {
      // Setup: Mock service role client to return contractor
      const mockServiceClient = {
        schema: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockContractor, error: null }),
              }),
            }),
          }),
        }),
      }

      vi.mocked(supabaseModule.supabaseServiceRole).schema = mockServiceClient.schema as any

      // Create caller without context (public procedure)
      const caller = brokerInvitationRouter.createCaller({} as any)

      // Action: Call getByReferralCode
      const result = await caller.getByReferralCode({ code: TEST_CONTRACTOR_ID })

      // Expect: Returns contractor info
      expect(result).toEqual({
        contractorId: TEST_CONTRACTOR_ID,
        contractorName: 'Test Contractor',
        contractorCompany: 'Test Contractor Inc',
      })
    })

    it('should throw NOT_FOUND for invalid referral code', async () => {
      // Setup: Mock service role client to return no contractor
      const mockServiceClient = {
        schema: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
              }),
            }),
          }),
        }),
      }

      vi.mocked(supabaseModule.supabaseServiceRole).schema = mockServiceClient.schema as any

      // Create caller
      const caller = brokerInvitationRouter.createCaller({} as any)

      // Action & Expect: Should throw NOT_FOUND error
      await expect(caller.getByReferralCode({ code: 'invalid-code' })).rejects.toThrow(TRPCError)
      await expect(caller.getByReferralCode({ code: 'invalid-code' })).rejects.toMatchObject({
        code: 'NOT_FOUND',
      })
    })

    it('should throw NOT_FOUND for non-contractor user type', async () => {
      // Setup: Mock service role client to return a broker (not contractor)
      const brokerProfile = { ...mockContractor, user_type: 'broker' }
      const mockServiceClient = {
        schema: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: brokerProfile, error: null }),
              }),
            }),
          }),
        }),
      }

      vi.mocked(supabaseModule.supabaseServiceRole).schema = mockServiceClient.schema as any

      // Create caller
      const caller = brokerInvitationRouter.createCaller({} as any)

      // Action & Expect: Should throw NOT_FOUND
      await expect(caller.getByReferralCode({ code: TEST_CONTRACTOR_ID })).rejects.toThrow(TRPCError)
    })

    it('should accept manual user type for referral code', async () => {
      // Setup: Mock service role client to return a manual user
      const manualUser = { ...mockContractor, user_type: 'manual' }
      const mockServiceClient = {
        schema: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: manualUser, error: null }),
              }),
            }),
          }),
        }),
      }

      vi.mocked(supabaseModule.supabaseServiceRole).schema = mockServiceClient.schema as any

      // Create caller
      const caller = brokerInvitationRouter.createCaller({} as any)

      // Action: Call getByReferralCode
      const result = await caller.getByReferralCode({ code: TEST_CONTRACTOR_ID })

      // Expect: Returns contractor info
      expect(result).toEqual({
        contractorId: TEST_CONTRACTOR_ID,
        contractorName: 'Test Contractor',
        contractorCompany: 'Test Contractor Inc',
      })
    })
  })

  describe('submitDocuments', () => {
    it('should validate file size limit', async () => {
      // Setup: Mock contractor lookup
      const mockServiceClient = {
        schema: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockContractor, error: null }),
              }),
            }),
          }),
        }),
      }

      vi.mocked(supabaseModule.supabaseServiceRole).schema = mockServiceClient.schema as any

      const caller = brokerInvitationRouter.createCaller({} as any)

      // Action: Submit with oversized file
      const oversizedFile = {
        ...mockFile,
        size: 3 * 1024 * 1024, // 3MB - over limit
      }

      // Expect: Should throw BAD_REQUEST
      await expect(
        caller.submitDocuments({
          referralCode: TEST_CONTRACTOR_ID,
          brokerInfo: mockBrokerInfo,
          files: [oversizedFile],
        })
      ).rejects.toThrow(TRPCError)
    })

    it('should validate file type', async () => {
      // Setup: Mock contractor lookup
      const mockServiceClient = {
        schema: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockContractor, error: null }),
              }),
            }),
          }),
        }),
      }

      vi.mocked(supabaseModule.supabaseServiceRole).schema = mockServiceClient.schema as any

      const caller = brokerInvitationRouter.createCaller({} as any)

      // Action: Submit with invalid file type
      const invalidFile = {
        ...mockFile,
        type: 'application/x-executable',
      }

      // Expect: Should throw BAD_REQUEST
      await expect(
        caller.submitDocuments({
          referralCode: TEST_CONTRACTOR_ID,
          brokerInfo: mockBrokerInfo,
          files: [invalidFile],
        })
      ).rejects.toThrow(TRPCError)
    })

    it('should require at least one file', async () => {
      const caller = brokerInvitationRouter.createCaller({} as any)

      // Action & Expect: Should throw validation error for empty files array
      await expect(
        caller.submitDocuments({
          referralCode: TEST_CONTRACTOR_ID,
          brokerInfo: mockBrokerInfo,
          files: [],
        })
      ).rejects.toThrow()
    })

    it('should throw NOT_FOUND for invalid contractor', async () => {
      // Setup: Mock contractor not found
      const mockServiceClient = {
        schema: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
              }),
            }),
          }),
        }),
      }

      vi.mocked(supabaseModule.supabaseServiceRole).schema = mockServiceClient.schema as any

      const caller = brokerInvitationRouter.createCaller({} as any)

      // Expect: Should throw NOT_FOUND
      await expect(
        caller.submitDocuments({
          referralCode: 'invalid-contractor',
          brokerInfo: mockBrokerInfo,
          files: [mockFile],
        })
      ).rejects.toThrow(TRPCError)
    })
  })

  describe('getUploadsForContractor', () => {
    it('should require authentication', async () => {
      // Create caller without user context
      const caller = brokerInvitationRouter.createCaller({
        user: null,
      } as any)

      // Expect: Should throw UNAUTHORIZED
      await expect(
        caller.getUploadsForContractor({ contractorId: TEST_CONTRACTOR_ID })
      ).rejects.toThrow()
    })

    it('should allow contractor to view their own uploads', async () => {
      // Setup: Mock user profile lookup
      const userProfile = { id: TEST_CONTRACTOR_ID, user_type: 'contractor' }
      const mockUploads = [
        { id: 'upload-1', file_name: 'doc1.pdf', uploaded_at: '2024-01-01' },
        { id: 'upload-2', file_name: 'doc2.pdf', uploaded_at: '2024-01-02' },
      ]

      vi.mocked(supabaseModule.supabase).schema = vi.fn().mockReturnValue({
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'user_profiles') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: userProfile, error: null }),
                }),
              }),
            }
          }
          if (table === 'insurance_uploads') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({ data: mockUploads, error: null }),
                }),
              }),
            }
          }
          return {}
        }),
      }) as any

      // Create caller with proper authenticated context (session + userId required)
      const caller = brokerInvitationRouter.createCaller({
        user: { id: TEST_USER_ID, email: 'test@example.com' },
        session: { id: TEST_USER_ID, email: 'test@example.com' },
        userId: TEST_USER_ID,
      } as any)

      // Action: Get uploads
      const result = await caller.getUploadsForContractor({ contractorId: TEST_CONTRACTOR_ID })

      // Expect: Returns uploads
      expect(result).toEqual(mockUploads)
    })

    it('should allow broker with relationship to view uploads', async () => {
      // Setup: Mock user profile as broker
      const brokerProfile = { id: TEST_BROKER_ID, user_type: 'broker' }
      const mockRelationship = { id: 'rel-1' }
      const mockUploads = [{ id: 'upload-1', file_name: 'doc1.pdf' }]

      vi.mocked(supabaseModule.supabase).schema = vi.fn().mockReturnValue({
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'user_profiles') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: brokerProfile, error: null }),
                }),
              }),
            }
          }
          if (table === 'broker_contractor_relationships') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                      single: vi.fn().mockResolvedValue({ data: mockRelationship, error: null }),
                    }),
                  }),
                }),
              }),
            }
          }
          if (table === 'insurance_uploads') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({ data: mockUploads, error: null }),
                }),
              }),
            }
          }
          return {}
        }),
      }) as any

      // Create caller with proper authenticated context (session + userId required)
      const caller = brokerInvitationRouter.createCaller({
        user: { id: TEST_USER_ID, email: 'test@example.com' },
        session: { id: TEST_USER_ID, email: 'test@example.com' },
        userId: TEST_USER_ID,
      } as any)

      // Action: Get uploads
      const result = await caller.getUploadsForContractor({ contractorId: TEST_CONTRACTOR_ID })

      // Expect: Returns uploads
      expect(result).toEqual(mockUploads)
    })

    it('should deny broker without relationship', async () => {
      // Setup: Mock user profile as broker with no relationship
      const brokerProfile = { id: TEST_BROKER_ID, user_type: 'broker' }

      vi.mocked(supabaseModule.supabase).schema = vi.fn().mockReturnValue({
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'user_profiles') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: brokerProfile, error: null }),
                }),
              }),
            }
          }
          if (table === 'broker_contractor_relationships') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                      single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
                    }),
                  }),
                }),
              }),
            }
          }
          return {}
        }),
      }) as any

      // Create caller with proper authenticated context (session + userId required)
      const caller = brokerInvitationRouter.createCaller({
        user: { id: TEST_USER_ID, email: 'test@example.com' },
        session: { id: TEST_USER_ID, email: 'test@example.com' },
        userId: TEST_USER_ID,
      } as any)

      // Expect: Should throw FORBIDDEN
      await expect(
        caller.getUploadsForContractor({ contractorId: TEST_CONTRACTOR_ID })
      ).rejects.toThrow(TRPCError)
    })
  })
})

describe('Input Validation', () => {
  it('should require valid email in brokerInfo', async () => {
    const caller = brokerInvitationRouter.createCaller({} as any)

    // Expect: Should throw validation error for invalid email
    await expect(
      caller.submitDocuments({
        referralCode: TEST_CONTRACTOR_ID,
        brokerInfo: { ...mockBrokerInfo, email: 'invalid-email' },
        files: [mockFile],
      })
    ).rejects.toThrow()
  })

  it('should require broker name', async () => {
    const caller = brokerInvitationRouter.createCaller({} as any)

    // Expect: Should throw validation error for empty name
    await expect(
      caller.submitDocuments({
        referralCode: TEST_CONTRACTOR_ID,
        brokerInfo: { ...mockBrokerInfo, name: '' },
        files: [mockFile],
      })
    ).rejects.toThrow()
  })

  it('should require UUID for contractorId in getUploadsForContractor', async () => {
    // Create caller with proper authenticated context (session + userId required)
    const caller = brokerInvitationRouter.createCaller({
      user: { id: TEST_USER_ID, email: 'test@example.com' },
      session: { id: TEST_USER_ID, email: 'test@example.com' },
      userId: TEST_USER_ID,
    } as any)

    // Expect: Should throw validation error for non-UUID
    await expect(
      caller.getUploadsForContractor({ contractorId: 'not-a-uuid' })
    ).rejects.toThrow()
  })
})
