-- =========================================================
-- 011_seed-conversations.sql - Conversation Seed Data
-- Seeds forsured.conversations, conversation_participants,
-- and conversation_messages for development testing.
-- =========================================================
-- Uses NO encryption for seed data:
--   encrypted_content = '{"plaintext_seed": "message text"}'::jsonb
-- =========================================================

DO $$
DECLARE
  v_contractor_id   UUID;
  v_broker_id       UUID;
  v_manager_id      UUID;
  v_task_id         UUID;
  v_org_id          UUID;
  v_private_conv_id UUID;
  v_cross_conv_id   UUID;
BEGIN

  -- =========================================================
  -- 1. Resolve existing users by role
  -- =========================================================
  SELECT id INTO v_contractor_id
    FROM forsured.users
   WHERE role = 'contractor'
   ORDER BY id
   LIMIT 1;

  SELECT id INTO v_broker_id
    FROM forsured.users
   WHERE role = 'broker'
   ORDER BY id
   LIMIT 1;

  -- Manager = GC role in this application
  SELECT id INTO v_manager_id
    FROM forsured.users
   WHERE role = 'gc'
   ORDER BY id
   LIMIT 1;

  -- =========================================================
  -- 2. Resolve a task and its owning organization
  -- =========================================================
  SELECT id, organization_id INTO v_task_id, v_org_id
    FROM forsured.tasks
   ORDER BY id
   LIMIT 1;

  -- =========================================================
  -- 3. Graceful skip if required records are missing
  -- =========================================================
  IF v_contractor_id IS NULL THEN
    RAISE NOTICE 'seed conversations: no contractor user found, skipping.';
    RETURN;
  END IF;

  IF v_broker_id IS NULL THEN
    RAISE NOTICE 'seed conversations: no broker user found, skipping.';
    RETURN;
  END IF;

  IF v_task_id IS NULL OR v_org_id IS NULL THEN
    RAISE NOTICE 'seed conversations: no task/org found, skipping.';
    RETURN;
  END IF;

  -- =========================================================
  -- 4. Private broker conversation (contractor <-> broker)
  -- =========================================================
  INSERT INTO forsured.conversations (
    task_id,
    organization_id,
    type,
    created_by_user_id,
    status,
    inbound_email_address
  )
  VALUES (
    v_task_id,
    v_org_id,
    'private_broker',
    v_contractor_id,
    'active',
    'conv-seed-private@chat.forsured.com'
  )
  ON CONFLICT (inbound_email_address) DO NOTHING
  RETURNING id INTO v_private_conv_id;

  -- If the row already existed, fetch its ID
  IF v_private_conv_id IS NULL THEN
    SELECT id INTO v_private_conv_id
      FROM forsured.conversations
     WHERE inbound_email_address = 'conv-seed-private@chat.forsured.com';
  END IF;

  -- =========================================================
  -- 5. Participants: contractor (owner) + broker (participant)
  -- =========================================================
  INSERT INTO forsured.conversation_participants (
    conversation_id,
    user_id,
    role_in_conversation,
    added_by_user_id
  )
  VALUES
    (v_private_conv_id, v_contractor_id, 'owner',       v_contractor_id),
    (v_private_conv_id, v_broker_id,     'participant',  v_contractor_id)
  ON CONFLICT (conversation_id, user_id) DO NOTHING;

  -- =========================================================
  -- 6. Messages on the private broker conversation
  -- =========================================================
  INSERT INTO forsured.conversation_messages (
    conversation_id,
    sender_user_id,
    encrypted_content,
    source,
    created_at
  )
  VALUES
    (
      v_private_conv_id,
      v_contractor_id,
      '{"plaintext_seed": "Hi, I need to renew my GL policy before the project deadline. Can you help?"}'::jsonb,
      'app',
      NOW() - INTERVAL '3 days'
    ),
    (
      v_private_conv_id,
      v_broker_id,
      '{"plaintext_seed": "Absolutely, I have started the renewal process. Expect the updated COI within 48 hours."}'::jsonb,
      'app',
      NOW() - INTERVAL '2 days 22 hours'
    ),
    (
      v_private_conv_id,
      v_contractor_id,
      '{"plaintext_seed": "Thank you! Please make sure the coverage limits meet the $2M GL requirement."}'::jsonb,
      'app',
      NOW() - INTERVAL '2 days 20 hours'
    );

  -- =========================================================
  -- 7. Optional cross_party conversation (contractor <-> manager/GC)
  -- =========================================================
  IF v_manager_id IS NOT NULL THEN

    INSERT INTO forsured.conversations (
      task_id,
      organization_id,
      type,
      created_by_user_id,
      status,
      inbound_email_address
    )
    VALUES (
      v_task_id,
      v_org_id,
      'cross_party',
      v_manager_id,
      'active',
      'conv-seed-crossparty@chat.forsured.com'
    )
    ON CONFLICT (inbound_email_address) DO NOTHING
    RETURNING id INTO v_cross_conv_id;

    -- If row already existed, fetch its ID
    IF v_cross_conv_id IS NULL THEN
      SELECT id INTO v_cross_conv_id
        FROM forsured.conversations
       WHERE inbound_email_address = 'conv-seed-crossparty@chat.forsured.com';
    END IF;

    -- Participants: manager (owner) + contractor (participant)
    INSERT INTO forsured.conversation_participants (
      conversation_id,
      user_id,
      role_in_conversation,
      added_by_user_id
    )
    VALUES
      (v_cross_conv_id, v_manager_id,    'owner',       v_manager_id),
      (v_cross_conv_id, v_contractor_id, 'participant', v_manager_id)
    ON CONFLICT (conversation_id, user_id) DO NOTHING;

    -- Messages on the cross-party conversation
    INSERT INTO forsured.conversation_messages (
      conversation_id,
      sender_user_id,
      encrypted_content,
      source,
      created_at
    )
    VALUES
      (
        v_cross_conv_id,
        v_manager_id,
        '{"plaintext_seed": "We need the updated insurance documents before you can continue on site."}'::jsonb,
        'app',
        NOW() - INTERVAL '1 day'
      ),
      (
        v_cross_conv_id,
        v_contractor_id,
        '{"plaintext_seed": "Understood. My broker is processing the renewal and I will upload as soon as it arrives."}'::jsonb,
        'app',
        NOW() - INTERVAL '23 hours'
      );

  END IF;

  RAISE NOTICE 'seed conversations: successfully seeded conversations for task % in org %.',
    v_task_id, v_org_id;

END $$;

-- =========================================================
-- NOTES:
-- =========================================================
-- 1. Uses DO $$ ... $$ block for procedural logic (graceful skips).
-- 2. ON CONFLICT makes this seed idempotent.
-- 3. encrypted_content uses {"plaintext_seed": "..."} for seeds only.
--    In production, all content is encrypted client-side before storage.
-- 4. Conversation types:
--    - private_broker: Between contractor and their insurance broker
--    - cross_party:    Between contractor and the GC/manager
-- 5. inbound_email_address values are unique per conversation and allow
--    reply-by-email to route messages back into the correct conversation.
-- =========================================================
