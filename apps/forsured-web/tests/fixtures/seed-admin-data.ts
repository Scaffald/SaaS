/**
 * Admin Test Data Seed Script
 * Use real Supabase, no mocking internal systems
 *
 * Creates test data for admin E2E tests:
 * - Broker invitations
 * - Admin audit log entries
 *
 * Usage:
 * ```typescript
 * import { seedAdminTestData, cleanupAdminTestData } from '../fixtures/seed-admin-data';
 *
 * beforeAll(async () => {
 *   await seedAdminTestData();
 * });
 *
 * afterAll(async () => {
 *   await cleanupAdminTestData();
 * });
 * ```
 */

import { forsured, TEST_USER_IDS, testSupabaseAdmin } from "./supabase";

export interface SeededAdminData {
  brokerInvitations: Array<{ id: string; code: string }>;
  auditLogs: Array<{ id: string; action: string }>;
}

const seededData: SeededAdminData = {
  brokerInvitations: [],
  auditLogs: [],
};

/**
 * Create test broker invitations
 */
async function createTestBrokerInvitations(): Promise<
  Array<{ id: string; code: string }>
> {
  const invitations: Array<{ id: string; code: string }> = [];

  // Generate unique codes with timestamp
  const timestamp = Date.now();

  // Active invitation
  const inv1 = await forsured("broker_invitations")
    .insert({
      code: `TESTCODE${timestamp}`,
      email: "broker-test@example.com",
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      max_uses: 5,
      use_count: 0,
      created_by: TEST_USER_IDS.admin,
    })
    .select("id, code")
    .single();

  // Used invitation
  const inv2 = await forsured("broker_invitations")
    .insert({
      code: `USEDCODE${timestamp}`,
      email: "used-broker@example.com",
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      max_uses: 1,
      use_count: 1,
      created_by: TEST_USER_IDS.admin,
    })
    .select("id, code")
    .single();

  if (inv1.error) {
    console.warn(`Failed to create broker invitation 1: ${inv1.error.message}`);
  } else if (inv1.data) {
    invitations.push({ id: inv1.data.id, code: inv1.data.code });
  }

  if (inv2.error) {
    console.warn(`Failed to create broker invitation 2: ${inv2.error.message}`);
  } else if (inv2.data) {
    invitations.push({ id: inv2.data.id, code: inv2.data.code });
  }

  return invitations;
}

/**
 * Create test admin audit log entries
 */
async function createTestAuditLogs(): Promise<
  Array<{ id: string; action: string }>
> {
  const logs: Array<{ id: string; action: string }> = [];

  // Invitation created log
  const log1 = await forsured("admin_audit_log")
    .insert({
      admin_user_id: TEST_USER_IDS.admin,
      action: "CREATE_INVITATION",
      target_type: "broker_invitation",
      target_id: "test-inv-1",
      old_value: null,
      new_value: { code: "TESTCODE123" },
    })
    .select("id, action")
    .single();

  // User role changed log
  const log2 = await forsured("admin_audit_log")
    .insert({
      admin_user_id: TEST_USER_IDS.admin,
      action: "UPDATE_USER_ROLE",
      target_type: "user",
      target_id: TEST_USER_IDS.manager,
      old_value: { user_type: "gc" },
      new_value: { user_type: "broker" },
    })
    .select("id, action")
    .single();

  // Enum deleted log
  const log3 = await forsured("admin_audit_log")
    .insert({
      admin_user_id: TEST_USER_IDS.admin,
      action: "DELETE_ENUM",
      target_type: "enum_value",
      target_id: "test-enum-1",
      old_value: { is_active: true },
      new_value: { is_active: false },
    })
    .select("id, action")
    .single();

  if (log1.error) {
    console.warn(`Failed to create audit log 1: ${log1.error.message}`);
  } else if (log1.data) {
    logs.push({ id: log1.data.id, action: log1.data.action });
  }

  if (log2.error) {
    console.warn(`Failed to create audit log 2: ${log2.error.message}`);
  } else if (log2.data) {
    logs.push({ id: log2.data.id, action: log2.data.action });
  }

  if (log3.error) {
    console.warn(`Failed to create audit log 3: ${log3.error.message}`);
  } else if (log3.data) {
    logs.push({ id: log3.data.id, action: log3.data.action });
  }

  return logs;
}

/**
 * Seed all admin test data
 */
export async function seedAdminTestData(): Promise<SeededAdminData> {
  // Create broker invitations
  let brokerInvitations: Array<{ id: string; code: string }> = [];
  try {
    brokerInvitations = await createTestBrokerInvitations();
  } catch (error) {
    console.warn(
      "[seed-admin-data] Failed to create broker invitations:",
      error,
    );
  }

  // Create audit logs
  let auditLogs: Array<{ id: string; action: string }> = [];
  try {
    auditLogs = await createTestAuditLogs();
  } catch (error) {
    console.warn("[seed-admin-data] Failed to create audit logs:", error);
  }

  // Store seeded data for cleanup
  seededData.brokerInvitations = brokerInvitations;
  seededData.auditLogs = auditLogs;

  return seededData;
}

/**
 * Clean up all seeded admin test data
 */
export async function cleanupAdminTestData() {
  // Delete audit logs
  for (const log of seededData.auditLogs) {
    await forsured("admin_audit_log").delete().eq("id", log.id);
  }

  // Delete broker invitations
  for (const inv of seededData.brokerInvitations) {
    await forsured("broker_invitations").delete().eq("id", inv.id);
  }

  // Clear seeded data
  seededData.brokerInvitations = [];
  seededData.auditLogs = [];
}

/**
 * Get seeded data (for use in tests)
 */
export function getSeededAdminData(): SeededAdminData {
  return { ...seededData };
}
