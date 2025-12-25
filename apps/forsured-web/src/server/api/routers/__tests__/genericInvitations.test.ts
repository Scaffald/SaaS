/**
 * Generic Invitations Router Tests
 * REQ-128: Flexible Invitation System
 * REQ-9: Testing Policy - Use real Supabase, no mocking internal systems
 *
 * These tests run against local Supabase (localhost:54321)
 * Requires: pnpm supa start
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { genericInvitationsRouter } from '../genericInvitations'
import { TRPCError } from '@trpc/server'
import type { User } from '@supabase/supabase-js'
import {
  testSupabaseAdmin,
  core,
  waitForSupabase,
  TEST_USER_IDS,
  TEST_ORG_IDS,
} from '../../../../../tests/fixtures'

// Track created test data for cleanup
const createdInvitationIds: string[] = []

describe('Generic Invitations Router', () => {
  let testRuleId: string | null = null

  beforeAll(async () => {
    // Wait for Supabase to be available
    await waitForSupabase()

    // Get a test invitation rule
    const { data: rules, error } = await core('invitation_rules')
      .select('id, source_role, target_role')
      .eq('is_active', true)
      .limit(1)

    if (error || !rules || rules.length === 0) {
      console.warn('No invitation rules found - migration may not have run')
      return
    }

    testRuleId = rules[0].id
  })

  afterAll(async () => {
    // Clean up created invitations
    if (createdInvitationIds.length > 0) {
      await core('generic_invitations')
        .delete()
        .in('id', createdInvitationIds)
    }
  })

  // Helper to create caller context
  const createContext = (
    userId: string | null = TEST_USER_IDS.manager,
    organizationId: string | null = TEST_ORG_IDS.primary
  ) => {
    const mockUser: User | null = userId
      ? ({
          id: userId,
          email: 'test@example.com',
        } as User)
      : null

    return {
      db: testSupabaseAdmin as unknown,
      session: mockUser ? { user: mockUser } : null,
      userId,
      organizationId,
    }
  }

  // Helper to create a router caller
  const createCaller = (ctx: ReturnType<typeof createContext>) => {
    return genericInvitationsRouter.createCaller(ctx as never)
  }

  describe('getRules', () => {
    it('should return active invitation rules', async () => {
      const caller = createCaller(createContext())
      const rules = await caller.getRules()

      expect(Array.isArray(rules)).toBe(true)
    })

    it('should require authentication', async () => {
      const caller = createCaller(createContext(null, null))

      await expect(caller.getRules()).rejects.toThrow(TRPCError)
    })
  })

  describe('getRulesForRole', () => {
    it('should return rules for a specific role', async () => {
      const caller = createCaller(createContext())
      const rules = await caller.getRulesForRole({ sourceRole: 'broker' })

      expect(Array.isArray(rules)).toBe(true)
      rules.forEach((rule) => {
        expect(rule.source_role).toBe('broker')
      })
    })
  })

  describe('checkConstraint', () => {
    it('should check constraint for an email', async () => {
      if (!testRuleId) {
        console.warn('Skipping test - no rules available')
        return
      }

      const caller = createCaller(createContext())
      const result = await caller.checkConstraint({
        ruleId: testRuleId,
        inviteeEmail: `constraint-check-${Date.now()}@example.com`,
      })

      expect(result).toHaveProperty('allowed')
      expect(typeof result.allowed).toBe('boolean')
    })

    it('should validate email format', async () => {
      if (!testRuleId) {
        console.warn('Skipping test - no rules available')
        return
      }

      const caller = createCaller(createContext())

      await expect(
        caller.checkConstraint({
          ruleId: testRuleId,
          inviteeEmail: 'not-an-email',
        })
      ).rejects.toThrow()
    })
  })

  describe('create', () => {
    it('should create an invitation', async () => {
      if (!testRuleId) {
        console.warn('Skipping test - no rules available')
        return
      }

      const caller = createCaller(createContext())
      const invitation = await caller.create({
        ruleId: testRuleId,
        inviteeEmail: `router-create-${Date.now()}@example.com`,
        personalMessage: 'Test message',
      })

      createdInvitationIds.push(invitation.id)

      expect(invitation.id).toBeDefined()
      expect(invitation.referral_code).toBeDefined()
      expect(invitation.personal_message).toBe('Test message')
      expect(invitation.status).toBe('pending')
    })

    it('should validate personal message length', async () => {
      if (!testRuleId) {
        console.warn('Skipping test - no rules available')
        return
      }

      const caller = createCaller(createContext())
      const longMessage = 'x'.repeat(1001) // Over 1000 char limit

      await expect(
        caller.create({
          ruleId: testRuleId,
          inviteeEmail: `long-msg-${Date.now()}@example.com`,
          personalMessage: longMessage,
        })
      ).rejects.toThrow()
    })
  })

  describe('getPending', () => {
    it('should return pending invitations for current user', async () => {
      const caller = createCaller(createContext())
      const pending = await caller.getPending()

      expect(Array.isArray(pending)).toBe(true)
    })
  })

  describe('getSent', () => {
    it('should return invitations sent by current user', async () => {
      const caller = createCaller(createContext())
      const sent = await caller.getSent()

      expect(Array.isArray(sent)).toBe(true)
    })
  })

  describe('getByCode (public)', () => {
    it('should find invitation by code', async () => {
      if (!testRuleId) {
        console.warn('Skipping test - no rules available')
        return
      }

      // Create an invitation first
      const caller = createCaller(createContext())
      const created = await caller.create({
        ruleId: testRuleId,
        inviteeEmail: `code-lookup-${Date.now()}@example.com`,
      })
      createdInvitationIds.push(created.id)

      // Look up with public endpoint (no auth required)
      const publicCaller = createCaller(createContext(null, null))
      const found = await publicCaller.getByCode({ code: created.referral_code })

      expect(found.id).toBe(created.id)
      expect(found.status).toBe('pending')
      // Should have limited info
      expect(found).toHaveProperty('inviter')
      expect(found).toHaveProperty('rule')
    })

    it('should throw NOT_FOUND for invalid code', async () => {
      const publicCaller = createCaller(createContext(null, null))

      await expect(
        publicCaller.getByCode({ code: 'NOTEXIST' })
      ).rejects.toThrow(TRPCError)
    })
  })

  describe('accept', () => {
    it('should accept an invitation', async () => {
      if (!testRuleId) {
        console.warn('Skipping test - no rules available')
        return
      }

      // Create an invitation as manager
      const managerCaller = createCaller(createContext(TEST_USER_IDS.manager))
      const created = await managerCaller.create({
        ruleId: testRuleId,
        inviteeEmail: `accept-router-${Date.now()}@example.com`,
      })
      createdInvitationIds.push(created.id)

      // Accept as contractor
      const contractorCaller = createCaller(createContext(TEST_USER_IDS.contractor))
      const result = await contractorCaller.accept({ invitationId: created.id })

      expect(result.success).toBe(true)
    })
  })

  describe('decline', () => {
    it('should decline an invitation with reason', async () => {
      if (!testRuleId) {
        console.warn('Skipping test - no rules available')
        return
      }

      // Create an invitation
      const caller = createCaller(createContext(TEST_USER_IDS.manager))
      const created = await caller.create({
        ruleId: testRuleId,
        inviteeEmail: `decline-router-${Date.now()}@example.com`,
      })
      createdInvitationIds.push(created.id)

      // Decline as contractor
      const contractorCaller = createCaller(createContext(TEST_USER_IDS.contractor))
      const result = await contractorCaller.decline({
        invitationId: created.id,
        reason: 'Not interested',
      })

      expect(result.success).toBe(true)
    })
  })

  describe('getRelationships', () => {
    it('should return user relationships', async () => {
      const caller = createCaller(createContext())
      const relationships = await caller.getRelationships({})

      expect(Array.isArray(relationships)).toBe(true)
    })

    it('should filter by relationship type', async () => {
      const caller = createCaller(createContext())
      const relationships = await caller.getRelationships({ type: 'broker_client' })

      expect(Array.isArray(relationships)).toBe(true)
      relationships.forEach((rel) => {
        expect(rel.relationship_type).toBe('broker_client')
      })
    })
  })
})
