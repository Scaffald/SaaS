/**
 * Conversation Router - Module Export & Procedure Key Tests
 *
 * Verifies that the conversation router module exports the expected router
 * and that all required procedure keys are defined.
 */

import { describe, it, expect } from 'vitest';
import { conversationRouter } from '../conversation';

describe('conversationRouter', () => {
  it('should export conversationRouter', () => {
    expect(conversationRouter).toBeDefined();
  });

  it('should be a valid tRPC router with _def property', () => {
    expect(conversationRouter._def).toBeDefined();
    expect(conversationRouter._def.procedures).toBeDefined();
  });

  it('should have all expected procedure keys', () => {
    const procedureKeys = Object.keys(conversationRouter._def.procedures);

    expect(procedureKeys).toContain('listByTask');
    expect(procedureKeys).toContain('get');
    expect(procedureKeys).toContain('create');
    expect(procedureKeys).toContain('addParticipant');
    expect(procedureKeys).toContain('archive');
  });

  it('should have exactly 5 procedures', () => {
    const procedureKeys = Object.keys(conversationRouter._def.procedures);
    expect(procedureKeys).toHaveLength(5);
  });
});
