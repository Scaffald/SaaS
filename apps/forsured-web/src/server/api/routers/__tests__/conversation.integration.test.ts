/**
 * Conversation Database Integration Tests
 * Task 10: Integration Tests - Database Layer
 *
 * Verifies that the conversation schema tables, functions, storage bucket,
 * and column additions exist and are accessible via the Supabase client.
 *
 * These tests use the real database via the Supabase service role key.
 * They gracefully skip if no database connection is available.
 *
 * Environment variables required (loaded from .env.test by setup.ts):
 *   VITE_SUPABASE_URL            - Supabase project URL
 *   VITE_SUPABASE_SERVICE_ROLE_KEY - Service role key (bypasses RLS)
 */

import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// Tests only run when both env vars are set (local Supabase instance running)
const canRunIntegration = !!(supabaseUrl && serviceRoleKey);

describe('conversation database integration', () => {
  // =========================================================================
  // Test 1: conversations table exists and is queryable
  // =========================================================================
  it.skipIf(!canRunIntegration)('conversations table exists', async () => {
    const supabase = createClient(supabaseUrl!, serviceRoleKey!);
    const { error } = await supabase
      .schema('forsured')
      .from('conversations')
      .select('id')
      .limit(0);
    expect(error).toBeNull();
  });

  // =========================================================================
  // Test 2: conversation_participants table exists
  // =========================================================================
  it.skipIf(!canRunIntegration)('conversation_participants table exists', async () => {
    const supabase = createClient(supabaseUrl!, serviceRoleKey!);
    const { error } = await supabase
      .schema('forsured')
      .from('conversation_participants')
      .select('id')
      .limit(0);
    expect(error).toBeNull();
  });

  // =========================================================================
  // Test 3: conversation_messages table exists
  // =========================================================================
  it.skipIf(!canRunIntegration)('conversation_messages table exists', async () => {
    const supabase = createClient(supabaseUrl!, serviceRoleKey!);
    const { error } = await supabase
      .schema('forsured')
      .from('conversation_messages')
      .select('id')
      .limit(0);
    expect(error).toBeNull();
  });

  // =========================================================================
  // Test 4: conversation_attachments table exists
  // =========================================================================
  it.skipIf(!canRunIntegration)('conversation_attachments table exists', async () => {
    const supabase = createClient(supabaseUrl!, serviceRoleKey!);
    const { error } = await supabase
      .schema('forsured')
      .from('conversation_attachments')
      .select('id')
      .limit(0);
    expect(error).toBeNull();
  });

  // =========================================================================
  // Test 5: verify_conversation_email_sender function exists and is callable
  // =========================================================================
  it.skipIf(!canRunIntegration)('verify_conversation_email_sender function exists', async () => {
    const supabase = createClient(supabaseUrl!, serviceRoleKey!);
    const { error } = await supabase
      .schema('forsured')
      .rpc('verify_conversation_email_sender', {
        p_conversation_id: '00000000-0000-0000-0000-000000000000',
        p_sender_email: 'test@example.com',
      });
    // The function should execute without error (it will return empty results for
    // a non-existent conversation_id, which is the expected behavior)
    expect(error).toBeNull();
  });

  // =========================================================================
  // Test 6: notify_conversation_message function exists and is callable
  // =========================================================================
  it.skipIf(!canRunIntegration)('notify_conversation_message function exists', async () => {
    const supabase = createClient(supabaseUrl!, serviceRoleKey!);
    const { error } = await supabase
      .schema('forsured')
      .rpc('notify_conversation_message', {
        p_conversation_id: '00000000-0000-0000-0000-000000000000',
        p_message_id: '00000000-0000-0000-0000-000000000001',
        p_sender_user_id: '00000000-0000-0000-0000-000000000002',
      });
    // The function sends a pg_notify and returns void - no error expected
    expect(error).toBeNull();
  });

  // =========================================================================
  // Test 7: conversation-attachments storage bucket exists
  // =========================================================================
  it.skipIf(!canRunIntegration)('conversation-attachments storage bucket exists', async () => {
    const supabase = createClient(supabaseUrl!, serviceRoleKey!);
    // List with limit 1 to verify the bucket is accessible (Storage API requires limit >= 1)
    const { error } = await supabase.storage
      .from('conversation-attachments')
      .list('', { limit: 1 });
    expect(error).toBeNull();
  });

  // =========================================================================
  // Test 8: organizations table has conversation_email_policy column
  // =========================================================================
  it.skipIf(!canRunIntegration)('organizations table has conversation_email_policy column', async () => {
    const supabase = createClient(supabaseUrl!, serviceRoleKey!);
    // Select the column explicitly - if it doesn't exist, Supabase will return an error
    const { data, error } = await supabase
      .schema('forsured')
      .from('organizations')
      .select('conversation_email_policy')
      .limit(1);
    expect(error).toBeNull();
    // data will be an array (empty or with rows) - the important check is no error
    expect(Array.isArray(data)).toBe(true);
  });
});
