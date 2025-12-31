/**
 * User Factory
 *
 * Creates test users via Supabase Auth
 */

import { testSupabase } from '../testDb';
import type { FactoryOptions } from './index';
import { testEmail } from './index';

export interface TestUser {
  id: string;
  email: string;
  password: string;
}

export interface CreateTestUserOptions extends FactoryOptions {
  email?: string;
  password?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Create a test user via Supabase Auth
 *
 * @example
 * const tracker = createTestDataTracker();
 * const user = await createTestUser({ tracker });
 * // Use user.id, user.email, user.password in tests
 * await cleanupTestData(tracker); // Auto-deletes user
 */
export async function createTestUser(options: CreateTestUserOptions = {}): Promise<TestUser> {
  const {
    email = testEmail('user'),
    password = 'TestPassword123!',
    metadata = {},
    tracker,
  } = options;

  // Create user via Supabase Auth Admin API
  const { data, error } = await testSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-confirm email
    user_metadata: metadata,
  });

  if (error || !data.user) {
    throw new Error(`Failed to create test user: ${error?.message}`);
  }

  // Track for cleanup
  if (tracker) {
    tracker.users.push(data.user.id);
  }

  return {
    id: data.user.id,
    email,
    password,
  };
}

/**
 * Create multiple test users at once
 *
 * @example
 * const tracker = createTestDataTracker();
 * const [user1, user2, user3] = await createTestUsers(3, { tracker });
 */
export async function createTestUsers(
  count: number,
  options: CreateTestUserOptions = {}
): Promise<TestUser[]> {
  const users: TestUser[] = [];

  for (let i = 0; i < count; i++) {
    const user = await createTestUser({
      ...options,
      email: testEmail(`user${i}`),
    });
    users.push(user);
  }

  return users;
}
