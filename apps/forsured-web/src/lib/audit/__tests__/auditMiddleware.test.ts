/**
 * Audit Middleware Tests
 *
 * REQ-130: Comprehensive Audit Logging with 7-Year Retention
 *
 * Tests for tRPC audit middleware that automatically logs all procedure calls.
 * Follows the testing pyramid with thorough unit tests for all functions.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createAuditMiddleware,
  auditMiddleware,
  sensitiveAuditMiddleware,
  createTRPCAuditMiddleware,
  type AuditContext,
  type AuditMiddlewareOptions,
} from '../auditMiddleware';
import { auditService } from '../AuditService';

// Mock the entire module - hoisted, so define mock inside
vi.mock('../AuditService', () => ({
  auditService: {
    log: vi.fn(() => Promise.resolve()),
  },
}));

// Get reference to the mock after module setup
const getMockAuditLog = () => vi.mocked(auditService.log);

// Mock crypto.randomUUID for consistent testing
const mockUUID = 'test-uuid-1234-5678-abcd-ef0123456789';
vi.stubGlobal('crypto', {
  randomUUID: vi.fn(() => mockUUID),
});

// Mock performance.now for consistent timing
let mockTime = 0;
vi.stubGlobal('performance', {
  now: vi.fn(() => {
    mockTime += 100; // Simulate 100ms per call
    return mockTime;
  }),
});

describe('Audit Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTime = 0;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Convenience accessor for the mock
  const mockAuditLog = () => getMockAuditLog();

  // ==========================================================================
  // sanitizeInput Tests
  // ==========================================================================
  describe('sanitizeInput (via middleware)', () => {
    // We test sanitization by observing what gets logged

    it('should redact password fields', async () => {
      const middleware = createAuditMiddleware({ logInput: true });
      const ctx: AuditContext = { user: { id: 'user-1' } };
      const next = vi.fn().mockResolvedValue({ ok: true, data: {} });

      await middleware({
        ctx,
        path: 'users.create',
        type: 'mutation',
        input: { email: 'test@example.com', password: 'secret123' },
        next,
      });

      expect(mockAuditLog()).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            input: expect.objectContaining({
              email: 'test@example.com',
              password: '[REDACTED]',
            }),
          }),
        })
      );
    });

    it('should redact token fields', async () => {
      const middleware = createAuditMiddleware({ logInput: true });
      const ctx: AuditContext = { user: { id: 'user-1' } };
      const next = vi.fn().mockResolvedValue({ ok: true, data: {} });

      await middleware({
        ctx,
        path: 'auth.verify',
        type: 'mutation',
        input: { token: 'jwt-token-abc', userId: 'user-1' },
        next,
      });

      expect(mockAuditLog()).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            input: expect.objectContaining({
              token: '[REDACTED]',
              userId: 'user-1',
            }),
          }),
        })
      );
    });

    it('should redact apiKey and api_key fields', async () => {
      const middleware = createAuditMiddleware({ logInput: true });
      const ctx: AuditContext = { user: { id: 'user-1' } };
      const next = vi.fn().mockResolvedValue({ ok: true, data: {} });

      await middleware({
        ctx,
        path: 'integrations.setup',
        type: 'mutation',
        input: { apiKey: 'key-123', api_key: 'key-456', service: 'stripe' },
        next,
      });

      expect(mockAuditLog()).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            input: expect.objectContaining({
              apiKey: '[REDACTED]',
              api_key: '[REDACTED]',
              service: 'stripe',
            }),
          }),
        })
      );
    });

    it('should redact SSN and credit card fields', async () => {
      const middleware = createAuditMiddleware({ logInput: true });
      const ctx: AuditContext = { user: { id: 'user-1' } };
      const next = vi.fn().mockResolvedValue({ ok: true, data: {} });

      await middleware({
        ctx,
        path: 'users.updateProfile',
        type: 'mutation',
        input: { ssn: '123-45-6789', creditCard: '4111111111111111', cvv: '123', name: 'John' },
        next,
      });

      expect(mockAuditLog()).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            input: expect.objectContaining({
              ssn: '[REDACTED]',
              creditCard: '[REDACTED]',
              cvv: '[REDACTED]',
              name: 'John',
            }),
          }),
        })
      );
    });

    it('should handle nested objects with sensitive fields', async () => {
      const middleware = createAuditMiddleware({ logInput: true });
      const ctx: AuditContext = { user: { id: 'user-1' } };
      const next = vi.fn().mockResolvedValue({ ok: true, data: {} });

      await middleware({
        ctx,
        path: 'config.update',
        type: 'mutation',
        input: {
          settings: {
            auth: { password: 'nested-secret', accessToken: 'token-123' },
            display: { theme: 'dark' },
          },
        },
        next,
      });

      expect(mockAuditLog()).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            input: expect.objectContaining({
              settings: expect.objectContaining({
                auth: expect.objectContaining({
                  password: '[REDACTED]',
                  accessToken: '[REDACTED]',
                }),
                display: { theme: 'dark' },
              }),
            }),
          }),
        })
      );
    });

    it('should handle arrays with sensitive fields', async () => {
      const middleware = createAuditMiddleware({ logInput: true });
      const ctx: AuditContext = { user: { id: 'user-1' } };
      const next = vi.fn().mockResolvedValue({ ok: true, data: {} });

      await middleware({
        ctx,
        path: 'users.bulkCreate',
        type: 'mutation',
        input: [
          { email: 'a@test.com', password: 'pass1' },
          { email: 'b@test.com', password: 'pass2' },
        ],
        next,
      });

      expect(mockAuditLog()).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            input: [
              { email: 'a@test.com', password: '[REDACTED]' },
              { email: 'b@test.com', password: '[REDACTED]' },
            ],
          }),
        })
      );
    });

    it('should handle null and undefined inputs', async () => {
      const middleware = createAuditMiddleware({ logInput: true });
      const ctx: AuditContext = { user: { id: 'user-1' } };
      const next = vi.fn().mockResolvedValue({ ok: true, data: {} });

      await middleware({
        ctx,
        path: 'data.fetch',
        type: 'query',
        input: null,
        next,
      });

      expect(mockAuditLog()).toHaveBeenCalled();
    });

    it('should handle primitive inputs', async () => {
      const middleware = createAuditMiddleware({ logInput: true });
      const ctx: AuditContext = { user: { id: 'user-1' } };
      const next = vi.fn().mockResolvedValue({ ok: true, data: {} });

      await middleware({
        ctx,
        path: 'data.getById',
        type: 'query',
        input: 'some-id-123',
        next,
      });

      expect(mockAuditLog()).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            input: 'some-id-123',
          }),
        })
      );
    });
  });

  // ==========================================================================
  // inferCategory Tests
  // ==========================================================================
  describe('inferCategory (via middleware)', () => {
    it('should categorize auth paths as authentication', async () => {
      const middleware = createAuditMiddleware();
      const ctx: AuditContext = { user: { id: 'user-1' } };
      const next = vi.fn().mockResolvedValue({ ok: true, data: {} });

      await middleware({
        ctx,
        path: 'auth.login',
        type: 'mutation',
        input: {},
        next,
      });

      expect(mockAuditLog()).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'authentication',
        })
      );
    });

    it('should categorize logout paths as authentication', async () => {
      const middleware = createAuditMiddleware();
      const ctx: AuditContext = { user: { id: 'user-1' } };
      const next = vi.fn().mockResolvedValue({ ok: true, data: {} });

      await middleware({
        ctx,
        path: 'session.logout',
        type: 'mutation',
        input: {},
        next,
      });

      expect(mockAuditLog()).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'authentication',
        })
      );
    });

    it('should categorize role paths as authorization', async () => {
      const middleware = createAuditMiddleware();
      const ctx: AuditContext = { user: { id: 'user-1' } };
      const next = vi.fn().mockResolvedValue({ ok: true, data: {} });

      await middleware({
        ctx,
        path: 'users.updateRole',
        type: 'mutation',
        input: {},
        next,
      });

      expect(mockAuditLog()).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'authorization',
        })
      );
    });

    it('should categorize permission paths as authorization', async () => {
      const middleware = createAuditMiddleware();
      const ctx: AuditContext = { user: { id: 'user-1' } };
      const next = vi.fn().mockResolvedValue({ ok: true, data: {} });

      await middleware({
        ctx,
        path: 'permissions.grant',
        type: 'mutation',
        input: {},
        next,
      });

      expect(mockAuditLog()).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'authorization',
        })
      );
    });

    it('should categorize admin paths as admin', async () => {
      const middleware = createAuditMiddleware();
      const ctx: AuditContext = { user: { id: 'user-1' } };
      const next = vi.fn().mockResolvedValue({ ok: true, data: {} });

      await middleware({
        ctx,
        path: 'admin.manageUsers',
        type: 'mutation',
        input: {},
        next,
      });

      expect(mockAuditLog()).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'admin',
        })
      );
    });

    it('should categorize office paths as admin', async () => {
      const middleware = createAuditMiddleware();
      const ctx: AuditContext = { user: { id: 'user-1' } };
      const next = vi.fn().mockResolvedValue({ ok: true, data: {} });

      await middleware({
        ctx,
        path: 'office.settings',
        type: 'mutation',
        input: {},
        next,
      });

      expect(mockAuditLog()).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'admin',
        })
      );
    });

    it('should categorize compliance paths as compliance', async () => {
      const middleware = createAuditMiddleware();
      const ctx: AuditContext = { user: { id: 'user-1' } };
      const next = vi.fn().mockResolvedValue({ ok: true, data: {} });

      await middleware({
        ctx,
        path: 'compliance.exportReport',
        type: 'mutation',
        input: {},
        next,
      });

      expect(mockAuditLog()).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'compliance',
        })
      );
    });

    it('should categorize audit paths as compliance', async () => {
      const middleware = createAuditMiddleware();
      const ctx: AuditContext = { user: { id: 'user-1' } };
      const next = vi.fn().mockResolvedValue({ ok: true, data: {} });

      await middleware({
        ctx,
        path: 'audit.query',
        type: 'query',
        input: {},
        next,
      });

      expect(mockAuditLog()).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'compliance',
        })
      );
    });

    it('should categorize security paths as security', async () => {
      const middleware = createAuditMiddleware();
      const ctx: AuditContext = { user: { id: 'user-1' } };
      const next = vi.fn().mockResolvedValue({ ok: true, data: {} });

      await middleware({
        ctx,
        path: 'security.checkBreach',
        type: 'query',
        input: {},
        next,
      });

      expect(mockAuditLog()).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'security',
        })
      );
    });

    it('should categorize mutations as data_modification', async () => {
      const middleware = createAuditMiddleware();
      const ctx: AuditContext = { user: { id: 'user-1' } };
      const next = vi.fn().mockResolvedValue({ ok: true, data: {} });

      await middleware({
        ctx,
        path: 'projects.create',
        type: 'mutation',
        input: {},
        next,
      });

      expect(mockAuditLog()).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'data_modification',
        })
      );
    });

    it('should categorize queries as data_access', async () => {
      const middleware = createAuditMiddleware();
      const ctx: AuditContext = { user: { id: 'user-1' } };
      const next = vi.fn().mockResolvedValue({ ok: true, data: {} });

      await middleware({
        ctx,
        path: 'projects.list',
        type: 'query',
        input: {},
        next,
      });

      expect(mockAuditLog()).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'data_access',
        })
      );
    });

    it('should respect category overrides', async () => {
      const middleware = createAuditMiddleware({
        categoryOverrides: {
          'projects.create': 'admin',
        },
      });
      const ctx: AuditContext = { user: { id: 'user-1' } };
      const next = vi.fn().mockResolvedValue({ ok: true, data: {} });

      await middleware({
        ctx,
        path: 'projects.create',
        type: 'mutation',
        input: {},
        next,
      });

      expect(mockAuditLog()).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'admin',
        })
      );
    });
  });

  // ==========================================================================
  // inferSeverity Tests
  // ==========================================================================
  describe('inferSeverity (via middleware)', () => {
    it('should assign high severity to failed auth operations', async () => {
      const middleware = createAuditMiddleware();
      const ctx: AuditContext = { user: { id: 'user-1' } };
      const next = vi.fn().mockRejectedValue(new Error('Auth failed'));

      await expect(
        middleware({
          ctx,
          path: 'auth.login',
          type: 'mutation',
          input: {},
          next,
        })
      ).rejects.toThrow('Auth failed');

      expect(mockAuditLog()).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'high',
          status: 'failure',
        })
      );
    });

    it('should assign high severity to failed security operations', async () => {
      const middleware = createAuditMiddleware();
      const ctx: AuditContext = { user: { id: 'user-1' } };
      const next = vi.fn().mockRejectedValue(new Error('Security check failed'));

      await expect(
        middleware({
          ctx,
          path: 'security.verify',
          type: 'mutation',
          input: {},
          next,
        })
      ).rejects.toThrow('Security check failed');

      expect(mockAuditLog()).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'high',
          status: 'failure',
        })
      );
    });

    it('should assign medium severity to other failed operations', async () => {
      const middleware = createAuditMiddleware();
      const ctx: AuditContext = { user: { id: 'user-1' } };
      const next = vi.fn().mockRejectedValue(new Error('Database error'));

      await expect(
        middleware({
          ctx,
          path: 'projects.create',
          type: 'mutation',
          input: {},
          next,
        })
      ).rejects.toThrow('Database error');

      expect(mockAuditLog()).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'medium',
          status: 'failure',
        })
      );
    });

    it('should assign high severity to successful delete operations', async () => {
      const middleware = createAuditMiddleware();
      const ctx: AuditContext = { user: { id: 'user-1' } };
      const next = vi.fn().mockResolvedValue({ ok: true, data: {} });

      await middleware({
        ctx,
        path: 'projects.delete',
        type: 'mutation',
        input: {},
        next,
      });

      expect(mockAuditLog()).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'high',
          status: 'success',
        })
      );
    });

    it('should assign high severity to successful remove operations', async () => {
      const middleware = createAuditMiddleware();
      const ctx: AuditContext = { user: { id: 'user-1' } };
      const next = vi.fn().mockResolvedValue({ ok: true, data: {} });

      await middleware({
        ctx,
        path: 'users.remove',
        type: 'mutation',
        input: {},
        next,
      });

      expect(mockAuditLog()).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'high',
          status: 'success',
        })
      );
    });

    it('should assign medium severity to successful admin operations', async () => {
      const middleware = createAuditMiddleware();
      const ctx: AuditContext = { user: { id: 'user-1' } };
      const next = vi.fn().mockResolvedValue({ ok: true, data: {} });

      await middleware({
        ctx,
        path: 'admin.updateSettings',
        type: 'mutation',
        input: {},
        next,
      });

      expect(mockAuditLog()).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'medium',
          status: 'success',
        })
      );
    });

    it('should assign medium severity to successful mutations', async () => {
      const middleware = createAuditMiddleware();
      const ctx: AuditContext = { user: { id: 'user-1' } };
      const next = vi.fn().mockResolvedValue({ ok: true, data: {} });

      await middleware({
        ctx,
        path: 'projects.update',
        type: 'mutation',
        input: {},
        next,
      });

      expect(mockAuditLog()).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'medium',
          status: 'success',
        })
      );
    });

    it('should assign low severity to successful queries', async () => {
      const middleware = createAuditMiddleware();
      const ctx: AuditContext = { user: { id: 'user-1' } };
      const next = vi.fn().mockResolvedValue({ ok: true, data: {} });

      await middleware({
        ctx,
        path: 'projects.list',
        type: 'query',
        input: {},
        next,
      });

      expect(mockAuditLog()).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'low',
          status: 'success',
        })
      );
    });
  });

  // ==========================================================================
  // createAuditMiddleware Tests
  // ==========================================================================
  describe('createAuditMiddleware', () => {
    it('should skip configured paths', async () => {
      const middleware = createAuditMiddleware({
        skipPaths: ['healthcheck', 'ping'],
      });
      const ctx: AuditContext = { user: { id: 'user-1' } };
      const next = vi.fn().mockResolvedValue({ ok: true, data: 'pong' });

      const result = await middleware({
        ctx,
        path: 'system.healthcheck',
        type: 'query',
        input: {},
        next,
      });

      expect(result).toEqual({ ok: true, data: 'pong' });
      expect(mockAuditLog()).not.toHaveBeenCalled();
    });

    it('should skip paths case-insensitively', async () => {
      const middleware = createAuditMiddleware({
        skipPaths: ['Healthcheck'],
      });
      const ctx: AuditContext = { user: { id: 'user-1' } };
      const next = vi.fn().mockResolvedValue({ ok: true, data: {} });

      await middleware({
        ctx,
        path: 'system.HEALTHCHECK',
        type: 'query',
        input: {},
        next,
      });

      expect(mockAuditLog()).not.toHaveBeenCalled();
    });

    it('should not log input when logInput is false', async () => {
      const middleware = createAuditMiddleware({ logInput: false });
      const ctx: AuditContext = { user: { id: 'user-1' } };
      const next = vi.fn().mockResolvedValue({ ok: true, data: {} });

      await middleware({
        ctx,
        path: 'users.create',
        type: 'mutation',
        input: { email: 'test@example.com' },
        next,
      });

      const logCall = mockAuditLog().mock.calls[0][0];
      expect(logCall.metadata).not.toHaveProperty('input');
    });

    it('should include duration_ms in metadata', async () => {
      const middleware = createAuditMiddleware();
      const ctx: AuditContext = { user: { id: 'user-1' } };
      const next = vi.fn().mockResolvedValue({ ok: true, data: {} });

      await middleware({
        ctx,
        path: 'users.list',
        type: 'query',
        input: {},
        next,
      });

      expect(mockAuditLog()).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            duration_ms: expect.any(Number),
          }),
        })
      );
    });

    it('should use requestId from context when available', async () => {
      const middleware = createAuditMiddleware();
      const ctx: AuditContext = {
        user: { id: 'user-1' },
        requestId: 'custom-request-id-123',
      };
      const next = vi.fn().mockResolvedValue({ ok: true, data: {} });

      await middleware({
        ctx,
        path: 'users.list',
        type: 'query',
        input: {},
        next,
      });

      expect(mockAuditLog()).toHaveBeenCalledWith(
        expect.objectContaining({
          request_id: 'custom-request-id-123',
        })
      );
    });

    it('should generate requestId when not in context', async () => {
      const middleware = createAuditMiddleware();
      const ctx: AuditContext = { user: { id: 'user-1' } };
      const next = vi.fn().mockResolvedValue({ ok: true, data: {} });

      await middleware({
        ctx,
        path: 'users.list',
        type: 'query',
        input: {},
        next,
      });

      expect(mockAuditLog()).toHaveBeenCalledWith(
        expect.objectContaining({
          request_id: mockUUID,
        })
      );
    });

    it('should include all context fields in audit log', async () => {
      const middleware = createAuditMiddleware();
      const ctx: AuditContext = {
        user: { id: 'user-123', email: 'user@example.com' },
        organizationId: 'org-456',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      };
      const next = vi.fn().mockResolvedValue({ ok: true, data: {} });

      await middleware({
        ctx,
        path: 'projects.list',
        type: 'query',
        input: {},
        next,
      });

      expect(mockAuditLog()).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-123',
          organization_id: 'org-456',
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0',
        })
      );
    });

    it('should log error details on failure', async () => {
      const middleware = createAuditMiddleware();
      const ctx: AuditContext = { user: { id: 'user-1' } };
      const error = new Error('Something went wrong');
      (error as any).code = 'ERR_VALIDATION';
      const next = vi.fn().mockRejectedValue(error);

      await expect(
        middleware({
          ctx,
          path: 'users.create',
          type: 'mutation',
          input: {},
          next,
        })
      ).rejects.toThrow('Something went wrong');

      expect(mockAuditLog()).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'failure',
          error_message: 'Something went wrong',
          metadata: expect.objectContaining({
            error_code: 'ERR_VALIDATION',
            error_message: 'Something went wrong',
          }),
        })
      );
    });

    it('should handle non-Error thrown values', async () => {
      const middleware = createAuditMiddleware();
      const ctx: AuditContext = { user: { id: 'user-1' } };
      const next = vi.fn().mockRejectedValue('string error');

      await expect(
        middleware({
          ctx,
          path: 'users.create',
          type: 'mutation',
          input: {},
          next,
        })
      ).rejects.toBe('string error');

      expect(mockAuditLog()).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'failure',
          error_message: 'string error',
        })
      );
    });

    it('should re-throw errors after logging', async () => {
      const middleware = createAuditMiddleware();
      const ctx: AuditContext = { user: { id: 'user-1' } };
      const error = new Error('Original error');
      const next = vi.fn().mockRejectedValue(error);

      await expect(
        middleware({
          ctx,
          path: 'users.create',
          type: 'mutation',
          input: {},
          next,
        })
      ).rejects.toBe(error);
    });
  });

  // ==========================================================================
  // Pre-configured Middleware Tests
  // ==========================================================================
  describe('auditMiddleware (default)', () => {
    it('should be a valid middleware function', () => {
      expect(typeof auditMiddleware).toBe('function');
    });

    it('should skip healthcheck and ping by default', async () => {
      const ctx: AuditContext = { user: { id: 'user-1' } };
      const next = vi.fn().mockResolvedValue({ ok: true, data: {} });

      await auditMiddleware({
        ctx,
        path: 'healthcheck',
        type: 'query',
        input: {},
        next,
      });

      expect(mockAuditLog()).not.toHaveBeenCalled();
    });

    it('should log normal operations', async () => {
      const ctx: AuditContext = { user: { id: 'user-1' } };
      const next = vi.fn().mockResolvedValue({ ok: true, data: {} });

      await auditMiddleware({
        ctx,
        path: 'projects.list',
        type: 'query',
        input: {},
        next,
      });

      expect(mockAuditLog()).toHaveBeenCalled();
    });
  });

  describe('sensitiveAuditMiddleware', () => {
    it('should be a valid middleware function', () => {
      expect(typeof sensitiveAuditMiddleware).toBe('function');
    });

    it('should log input for sensitive operations', async () => {
      const ctx: AuditContext = { user: { id: 'user-1' } };
      const next = vi.fn().mockResolvedValue({ ok: true, data: {} });

      await sensitiveAuditMiddleware({
        ctx,
        path: 'admin.deleteUser',
        type: 'mutation',
        input: { userId: 'target-user' },
        next,
      });

      expect(mockAuditLog()).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            input: expect.objectContaining({
              userId: 'target-user',
            }),
          }),
        })
      );
    });
  });

  // ==========================================================================
  // createTRPCAuditMiddleware Tests
  // ==========================================================================
  describe('createTRPCAuditMiddleware', () => {
    it('should create a tRPC-compatible middleware', () => {
      const mockT = {
        middleware: vi.fn((fn) => fn),
      };

      const result = createTRPCAuditMiddleware(mockT);

      expect(mockT.middleware).toHaveBeenCalled();
      expect(typeof result).toBe('function');
    });

    it('should skip configured paths', async () => {
      const mockMiddlewareFn = vi.fn();
      const mockT = {
        middleware: vi.fn((fn) => {
          mockMiddlewareFn.mockImplementation(fn);
          return fn;
        }),
      };

      createTRPCAuditMiddleware(mockT, { skipPaths: ['healthcheck'] });

      const ctx: AuditContext = { user: { id: 'user-1' } };
      const next = vi.fn().mockResolvedValue({ ok: true, data: {} });

      await mockMiddlewareFn({
        ctx,
        path: 'healthcheck',
        type: 'query',
        input: {},
        next,
      });

      expect(mockAuditLog()).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('should log successful operations (fire and forget)', async () => {
      const mockMiddlewareFn = vi.fn();
      const mockT = {
        middleware: vi.fn((fn) => {
          mockMiddlewareFn.mockImplementation(fn);
          return fn;
        }),
      };

      createTRPCAuditMiddleware(mockT);

      const ctx: AuditContext = { user: { id: 'user-1' } };
      const next = vi.fn().mockResolvedValue({ ok: true, data: { success: true } });

      const result = await mockMiddlewareFn({
        ctx,
        path: 'projects.create',
        type: 'mutation',
        input: { name: 'Test Project' },
        next,
      });

      expect(result).toEqual({ ok: true, data: { success: true } });
      expect(mockAuditLog()).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'trpc.projects.create',
          status: 'success',
        })
      );
    });

    it('should log failed operations and re-throw', async () => {
      const mockMiddlewareFn = vi.fn();
      const mockT = {
        middleware: vi.fn((fn) => {
          mockMiddlewareFn.mockImplementation(fn);
          return fn;
        }),
      };

      createTRPCAuditMiddleware(mockT);

      const ctx: AuditContext = { user: { id: 'user-1' } };
      const error = new Error('Database connection failed');
      const next = vi.fn().mockRejectedValue(error);

      await expect(
        mockMiddlewareFn({
          ctx,
          path: 'projects.create',
          type: 'mutation',
          input: {},
          next,
        })
      ).rejects.toBe(error);

      expect(mockAuditLog()).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'trpc.projects.create',
          status: 'failure',
        })
      );
    });
  });

  // ==========================================================================
  // Edge Cases and Error Handling
  // ==========================================================================
  describe('Edge Cases', () => {
    it('should handle empty context gracefully', async () => {
      const middleware = createAuditMiddleware();
      const ctx: AuditContext = {};
      const next = vi.fn().mockResolvedValue({ ok: true, data: {} });

      await middleware({
        ctx,
        path: 'projects.list',
        type: 'query',
        input: {},
        next,
      });

      expect(mockAuditLog()).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: undefined,
          organization_id: undefined,
        })
      );
    });

    it('should handle subscription type', async () => {
      const middleware = createAuditMiddleware();
      const ctx: AuditContext = { user: { id: 'user-1' } };
      const next = vi.fn().mockResolvedValue({ ok: true, data: {} });

      await middleware({
        ctx,
        path: 'notifications.subscribe',
        type: 'subscription',
        input: {},
        next,
      });

      expect(mockAuditLog()).toHaveBeenCalledWith(
        expect.objectContaining({
          // subscription maps to EXECUTE in the AuditOperation type
          operation: 'EXECUTE',
          metadata: expect.objectContaining({
            procedure_type: 'subscription',
          }),
        })
      );
    });

    it('should preserve procedure path in metadata', async () => {
      const middleware = createAuditMiddleware();
      const ctx: AuditContext = { user: { id: 'user-1' } };
      const next = vi.fn().mockResolvedValue({ ok: true, data: {} });

      await middleware({
        ctx,
        path: 'deeply.nested.procedure.path',
        type: 'query',
        input: {},
        next,
      });

      expect(mockAuditLog()).toHaveBeenCalledWith(
        expect.objectContaining({
          resource_name: 'deeply.nested.procedure.path',
          metadata: expect.objectContaining({
            procedure_path: 'deeply.nested.procedure.path',
          }),
        })
      );
    });
  });
});
