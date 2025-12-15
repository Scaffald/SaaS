/**
 * ForSured Test Seeds
 *
 * This module provides:
 * - Fixed UUID constants for deterministic testing
 * - Programmatic seeding functions for test setup
 *
 * Usage in tests:
 *   import { FORSURED_USER_IDS, FORSURED_ORG_IDS } from '@scf/supabase/seeds/forsured';
 *
 * Usage for seeding:
 *   import { seedForsuredTestData, clearForsuredTestData } from '@scf/supabase/seeds/forsured';
 */

// Re-export all test IDs
export {
  FORSURED_USER_IDS,
  FORSURED_ORG_IDS,
  FORSURED_PROJECT_IDS,
  FORSURED_SUBCONTRACTOR_IDS,
  FORSURED_DOCUMENT_IDS,
  FORSURED_POLICY_IDS,
  FORSURED_REQUIREMENT_IDS,
  FORSURED_TASK_IDS,
  FORSURED_COMPLIANCE_IDS,
  type ForsuredUserId,
  type ForsuredOrgId,
  type ForsuredProjectId,
  type ForsuredSubcontractorId,
  type ForsuredDocumentId,
  type ForsuredPolicyId,
  type ForsuredRequirementId,
  type ForsuredTaskId,
  type ForsuredComplianceId,
} from './test-ids';

// Re-export seeding functions
export {
  seedForsuredTestData,
  clearForsuredTestData,
  resetForsuredTestData,
} from './seed-forsured';

/**
 * Test credentials for ForSured test users
 */
export const FORSURED_TEST_CREDENTIALS = {
  password: 'ForsuredTest123!',
  users: {
    gcFresh: { email: 'gc-fresh@forsured-test.com', password: 'ForsuredTest123!' },
    gcOnboarding: { email: 'gc-onboarding@forsured-test.com', password: 'ForsuredTest123!' },
    gcActive: { email: 'gc-active@forsured-test.com', password: 'ForsuredTest123!' },
    gcMultiproject: { email: 'gc-multiproject@forsured-test.com', password: 'ForsuredTest123!' },
    contractorFresh: { email: 'contractor-fresh@forsured-test.com', password: 'ForsuredTest123!' },
    contractorActive: { email: 'contractor-active@forsured-test.com', password: 'ForsuredTest123!' },
    contractorNoncompliant: {
      email: 'contractor-noncompliant@forsured-test.com',
      password: 'ForsuredTest123!',
    },
    contractorMultiproject: {
      email: 'contractor-multiproject@forsured-test.com',
      password: 'ForsuredTest123!',
    },
    brokerFresh: { email: 'broker-fresh@forsured-test.com', password: 'ForsuredTest123!' },
    brokerActive: { email: 'broker-active@forsured-test.com', password: 'ForsuredTest123!' },
    admin: { email: 'admin@forsured-test.com', password: 'ForsuredTest123!' },
    superAdmin: { email: 'superadmin@forsured-test.com', password: 'ForsuredTest123!' },
  },
} as const;
