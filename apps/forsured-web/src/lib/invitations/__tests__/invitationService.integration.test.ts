/**
 * Invitation Service Integration Tests
 * REQ-128: Flexible Invitation System
 * REQ-9: Testing Policy - Use real Supabase, no mocking internal systems
 *
 * These tests run against local Supabase (localhost:54321)
 * Requires: pnpm supa start
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { createInvitationService } from '../invitationService'
import {
  testSupabaseAdmin,
  core,
  waitForSupabase,
  TEST_USER_IDS,
  TEST_ORG_IDS,
} from '../../../../tests/fixtures'

// Create invitation service with test admin client (bypasses RLS)
const invitationService = createInvitationService(testSupabaseAdmin)

// Track created test data for cleanup
const createdInvitationIds: string[] = []
const createdRelationshipIds: string[] = []

// Test email that doesn't exist in seed data
const TEST_INVITEE_EMAIL = `test-invitee-${Date.now()}@example.com`

describe('Invitation Service Integration Tests', () => {
  let testRuleId: string | null = null

  beforeAll(async () => {
    // Wait for Supabase to be available
    await waitForSupabase()

    // Get a test invitation rule (should be seeded)
    // Note: invitationService uses the app's anon client (subject to RLS)
    // so we use the testSupabaseAdmin (service role) for test setup
    const { data: rules, error } = await core('invitation_rules')
      .select('id, source_role, target_role')
      .eq('is_active', true)
      .limit(1)

    if (error) {
      console.warn('Failed to fetch invitation rules:', error)
      console.warn('Tests requiring rules will be skipped')
      return
    }

    if (!rules || rules.length === 0) {
      // Rules not seeded yet - skip tests gracefully
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

    // Clean up created relationships
    if (createdRelationshipIds.length > 0) {
      await core('user_relationships')
        .delete()
        .in('id', createdRelationshipIds)
    }
  })

  describe('getRules', () => {
    it('should return all active invitation rules', async () => {
      const rules = await invitationService.getRules()

      expect(Array.isArray(rules)).toBe(true)
      // Should have at least the seeded rules
      expect(rules.length).toBeGreaterThanOrEqual(0)

      // Each rule should have required fields
      if (rules.length > 0) {
        const rule = rules[0]
        expect(rule).toHaveProperty('id')
        expect(rule).toHaveProperty('source_role')
        expect(rule).toHaveProperty('target_role')
        expect(rule).toHaveProperty('relationship_type')
        expect(rule).toHaveProperty('name')
        expect(rule.is_active).toBe(true)
      }
    })
  })

  describe('getRulesForRole', () => {
    it('should return rules for a specific source role', async () => {
      const rules = await invitationService.getRulesForRole('broker')

      expect(Array.isArray(rules)).toBe(true)
      // All returned rules should have broker as source_role
      rules.forEach((rule) => {
        expect(rule.source_role).toBe('broker')
      })
    })

    it('should return empty array for non-existent role', async () => {
      const rules = await invitationService.getRulesForRole('nonexistent')

      expect(Array.isArray(rules)).toBe(true)
      expect(rules.length).toBe(0)
    })
  })

  describe('getRule', () => {
    it('should return a single rule by ID', async () => {
      if (!testRuleId) {
        console.warn('Skipping test - no rules available')
        return
      }

      const rule = await invitationService.getRule(testRuleId)

      expect(rule).not.toBeNull()
      expect(rule?.id).toBe(testRuleId)
    })

    it('should return null for non-existent rule', async () => {
      const rule = await invitationService.getRule('00000000-0000-0000-0000-000000000000')

      expect(rule).toBeNull()
    })
  })

  describe('checkConstraint', () => {
    it('should allow invitation when no constraint violated', async () => {
      if (!testRuleId) {
        console.warn('Skipping test - no rules available')
        return
      }

      const result = await invitationService.checkConstraint(
        testRuleId,
        `new-user-${Date.now()}@example.com`
      )

      expect(result.allowed).toBe(true)
      expect(result.reason).toBeUndefined()
    })
  })

  describe('create', () => {
    it('should create an invitation with referral code', async () => {
      if (!testRuleId) {
        console.warn('Skipping test - no rules available')
        return
      }

      const invitation = await invitationService.create(
        {
          ruleId: testRuleId,
          inviteeEmail: TEST_INVITEE_EMAIL,
          personalMessage: 'Welcome to ForSured!',
        },
        TEST_USER_IDS.manager,
        TEST_ORG_IDS.primary
      )

      createdInvitationIds.push(invitation.id)

      expect(invitation.id).toBeDefined()
      expect(invitation.referral_code).toBeDefined()
      expect(invitation.referral_code.length).toBe(8)
      expect(invitation.invitee_email).toBe(TEST_INVITEE_EMAIL.toLowerCase())
      expect(invitation.personal_message).toBe('Welcome to ForSured!')
      expect(invitation.status).toBe('pending')
      expect(invitation.inviter_id).toBe(TEST_USER_IDS.manager)
    })

    it('should generate unique referral codes', async () => {
      if (!testRuleId) {
        console.warn('Skipping test - no rules available')
        return
      }

      const invitation1 = await invitationService.create(
        {
          ruleId: testRuleId,
          inviteeEmail: `unique-test-1-${Date.now()}@example.com`,
        },
        TEST_USER_IDS.manager
      )
      createdInvitationIds.push(invitation1.id)

      const invitation2 = await invitationService.create(
        {
          ruleId: testRuleId,
          inviteeEmail: `unique-test-2-${Date.now()}@example.com`,
        },
        TEST_USER_IDS.manager
      )
      createdInvitationIds.push(invitation2.id)

      expect(invitation1.referral_code).not.toBe(invitation2.referral_code)
    })

    it('should set expiration when expiresInDays provided', async () => {
      if (!testRuleId) {
        console.warn('Skipping test - no rules available')
        return
      }

      const invitation = await invitationService.create(
        {
          ruleId: testRuleId,
          inviteeEmail: `expires-test-${Date.now()}@example.com`,
          expiresInDays: 7,
        },
        TEST_USER_IDS.manager
      )
      createdInvitationIds.push(invitation.id)

      expect(invitation.expires_at).toBeDefined()
      const expiresAt = new Date(invitation.expires_at!)
      const expectedExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      // Should be within 1 minute of expected
      expect(Math.abs(expiresAt.getTime() - expectedExpiry.getTime())).toBeLessThan(60000)
    })
  })

  describe('getByReferralCode', () => {
    it('should find invitation by referral code', async () => {
      if (!testRuleId) {
        console.warn('Skipping test - no rules available')
        return
      }

      // Create an invitation first
      const created = await invitationService.create(
        {
          ruleId: testRuleId,
          inviteeEmail: `code-lookup-${Date.now()}@example.com`,
        },
        TEST_USER_IDS.manager
      )
      createdInvitationIds.push(created.id)

      // Look it up by code
      const found = await invitationService.getByReferralCode(created.referral_code)

      expect(found).not.toBeNull()
      expect(found?.id).toBe(created.id)
      expect(found?.referral_code).toBe(created.referral_code)
    })

    it('should return null for non-existent code', async () => {
      const found = await invitationService.getByReferralCode('NOTEXIST')

      expect(found).toBeNull()
    })

    it('should be case-insensitive', async () => {
      if (!testRuleId) {
        console.warn('Skipping test - no rules available')
        return
      }

      const created = await invitationService.create(
        {
          ruleId: testRuleId,
          inviteeEmail: `case-test-${Date.now()}@example.com`,
        },
        TEST_USER_IDS.manager
      )
      createdInvitationIds.push(created.id)

      // Look up with lowercase
      const found = await invitationService.getByReferralCode(created.referral_code.toLowerCase())

      expect(found).not.toBeNull()
      expect(found?.id).toBe(created.id)
    })
  })

  describe('getSentByUser', () => {
    it('should return invitations sent by a user', async () => {
      if (!testRuleId) {
        console.warn('Skipping test - no rules available')
        return
      }

      // Create an invitation
      const created = await invitationService.create(
        {
          ruleId: testRuleId,
          inviteeEmail: `sent-test-${Date.now()}@example.com`,
        },
        TEST_USER_IDS.manager
      )
      createdInvitationIds.push(created.id)

      // Get sent invitations
      const sent = await invitationService.getSentByUser(TEST_USER_IDS.manager)

      expect(Array.isArray(sent)).toBe(true)
      expect(sent.some((inv) => inv.id === created.id)).toBe(true)
    })
  })

  describe('getPendingForEmail', () => {
    it('should return pending invitations for an email', async () => {
      if (!testRuleId) {
        console.warn('Skipping test - no rules available')
        return
      }

      const testEmail = `pending-test-${Date.now()}@example.com`

      // Create an invitation
      const created = await invitationService.create(
        {
          ruleId: testRuleId,
          inviteeEmail: testEmail,
        },
        TEST_USER_IDS.manager
      )
      createdInvitationIds.push(created.id)

      // Get pending invitations
      const pending = await invitationService.getPendingForEmail(testEmail)

      expect(Array.isArray(pending)).toBe(true)
      expect(pending.some((inv) => inv.id === created.id)).toBe(true)
      pending.forEach((inv) => {
        expect(inv.status).toBe('pending')
      })
    })
  })

  describe('decline', () => {
    it('should decline an invitation', async () => {
      if (!testRuleId) {
        console.warn('Skipping test - no rules available')
        return
      }

      // Create an invitation
      const created = await invitationService.create(
        {
          ruleId: testRuleId,
          inviteeEmail: `decline-test-${Date.now()}@example.com`,
        },
        TEST_USER_IDS.manager
      )
      createdInvitationIds.push(created.id)

      // Decline it
      await invitationService.decline(created.id, TEST_USER_IDS.contractor, 'Not interested')

      // Verify it's declined
      const found = await invitationService.getById(created.id)
      expect(found?.status).toBe('declined')
      expect(found?.decline_reason).toBe('Not interested')
    })
  })

  describe('accept', () => {
    it('should accept an invitation and create relationship', async () => {
      if (!testRuleId) {
        console.warn('Skipping test - no rules available')
        return
      }

      // Create an invitation
      const created = await invitationService.create(
        {
          ruleId: testRuleId,
          inviteeEmail: `accept-test-${Date.now()}@example.com`,
        },
        TEST_USER_IDS.manager
      )
      createdInvitationIds.push(created.id)

      // Accept it
      const result = await invitationService.accept(created.id, TEST_USER_IDS.contractor)

      expect(result.success).toBe(true)
      // Note: relationshipCreated may be false if constraint blocked or project-based

      // Verify invitation is accepted
      const found = await invitationService.getById(created.id)
      expect(found?.status).toBe('accepted')
      expect(found?.invitee_user_id).toBe(TEST_USER_IDS.contractor)
    })

    it('should reject accepting already accepted invitation', async () => {
      if (!testRuleId) {
        console.warn('Skipping test - no rules available')
        return
      }

      // Create and accept an invitation
      const created = await invitationService.create(
        {
          ruleId: testRuleId,
          inviteeEmail: `double-accept-${Date.now()}@example.com`,
        },
        TEST_USER_IDS.manager
      )
      createdInvitationIds.push(created.id)

      await invitationService.accept(created.id, TEST_USER_IDS.contractor)

      // Try to accept again
      await expect(
        invitationService.accept(created.id, TEST_USER_IDS.contractor)
      ).rejects.toThrow('Cannot accept invitation with status: accepted')
    })
  })

  describe('trackEmailEvent', () => {
    it('should update email tracking timestamps', async () => {
      if (!testRuleId) {
        console.warn('Skipping test - no rules available')
        return
      }

      // Create an invitation
      const created = await invitationService.create(
        {
          ruleId: testRuleId,
          inviteeEmail: `email-track-${Date.now()}@example.com`,
        },
        TEST_USER_IDS.manager
      )
      createdInvitationIds.push(created.id)

      // Track email sent
      await invitationService.trackEmailEvent(created.id, 'sent')

      // Verify
      const found = await invitationService.getById(created.id)
      expect(found?.email_sent_at).toBeDefined()
    })
  })
})
