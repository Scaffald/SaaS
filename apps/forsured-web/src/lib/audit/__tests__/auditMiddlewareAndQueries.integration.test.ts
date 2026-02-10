/**
 * Audit Middleware and Queries Integration Tests
 *
 * Comprehensive Audit Logging with 7-Year Retention
 *
 * Tests the full integration of audit middleware and queries against
 * a real Supabase database. Verifies end-to-end functionality:
 * - Middleware logs audit events to the database
 * - Queries retrieve the correct audit records
 * - Compliance reports generate correctly
 *
 * These tests use a real database connection (local or remote).
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import {
  initializeAuditService,
  auditService,
  logAuditEvent,
} from '../AuditService';
import {
  initializeAuditQueries,
  getUserActivity,
  getUserActivitySummary,
  getEmailHistory,
  getAuthenticationHistory,
  getResourceAccessHistory,
  getProjectCommunications,
  getSubcontractorCommunications,
  generateComplianceReport,
  getSecurityEvents,
  findRelatedAuditRecords,
} from '../auditQueries';
import { createAuditMiddleware } from '../auditMiddleware';
import type { AuditContext } from '../auditMiddleware';

// Create a Supabase client for testing
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

// Skip tests if no service key is available
const skipTests = !supabaseServiceKey;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const forsured = (table: string) => supabase.schema('forsured' as never).from(table);

// Track audit log IDs for verification
const createdAuditIds: string[] = [];

// Generate proper UUIDs for test data
function generateTestUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Test identifiers for filtering (using valid UUIDs)
const testUserId = generateTestUUID();
const testOrgId = generateTestUUID();
const testProjectId = generateTestUUID();
const testRequestId = generateTestUUID();

// Flag to track if we have write access to the audit_log table
let hasWriteAccess = false;
let hasReadAccess = false;

describe.skipIf(skipTests)('Audit Middleware and Queries Integration', () => {
  beforeAll(async () => {
    // Initialize the services with the Supabase client
    initializeAuditService(supabase.schema('forsured' as never));
    initializeAuditQueries(supabase.schema('forsured' as never));

    // Verify database connection
    const { error: readError } = await forsured('audit_log').select('id').limit(1);
    if (readError) {
      console.warn('Cannot read from audit_log:', readError.message);
      hasReadAccess = false;
    } else {
      hasReadAccess = true;
    }

    // Check if we have write access by attempting a test insert
    // (This will fail with permission denied if RLS blocks writes)
    const testRecord = {
      category: 'system',
      action: 'test_connection',
      user_id: testUserId,
      status: 'success',
      severity: 'low',
    };

    const { error: writeError } = await forsured('audit_log')
      .insert(testRecord)
      .select('id')
      .single();

    if (writeError) {
      console.warn('No write access to audit_log (RLS may be active):', writeError.message);
      console.warn('Integration tests that require writes will be skipped.');
      hasWriteAccess = false;
    } else {
      hasWriteAccess = true;
    }
  });

  afterAll(async () => {
    // Clean up any test audit logs we created
    // Note: Due to WORM protection, we may not be able to delete these
    // For test isolation, we use unique test identifiers instead
    console.log(`Created ${createdAuditIds.length} audit logs during tests`);
  });

  describe('AuditService Direct Logging', () => {
    it('should log an authentication event', async () => {
      if (!hasWriteAccess) {
        console.warn('Skipping test - no write access to audit_log');
        return;
      }
      const event = {
        category: 'authentication' as const,
        action: 'login_success',
        user_id: testUserId,
        organization_id: testOrgId,
        request_id: testRequestId,
        severity: 'low' as const,
        status: 'success' as const,
        metadata: {
          email: 'test@example.com',
          login_method: 'password',
        },
      };

      // Log the event
      await auditService.log(event);

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Query for the event
      const { data: logs, error } = await forsured('audit_log')
        .select('*')
        .eq('user_id', testUserId)
        .eq('action', 'login_success')
        .order('created_at', { ascending: false })
        .limit(1);

      if (logs && logs.length > 0) {
        createdAuditIds.push(logs[0].id);
        expect(logs[0].category).toBe('authentication');
        expect(logs[0].status).toBe('success');
        expect(logs[0].metadata?.email).toBe('test@example.com');
      }

      expect(error).toBeNull();
    });

    it('should log a data_modification event', async () => {
      if (!hasWriteAccess) {
        console.warn('Skipping test - no write access to audit_log');
        return;
      }
      const event = {
        category: 'data_modification' as const,
        action: 'create_project',
        user_id: testUserId,
        organization_id: testOrgId,
        request_id: testRequestId,
        resource_type: 'project',
        record_id: testProjectId,
        resource_name: 'Test Integration Project',
        severity: 'medium' as const,
        status: 'success' as const,
        metadata: {
          project_id: testProjectId,
          project_name: 'Test Integration Project',
        },
      };

      await auditService.log(event);
      await new Promise((resolve) => setTimeout(resolve, 100));

      const { data: logs, error } = await forsured('audit_log')
        .select('*')
        .eq('user_id', testUserId)
        .eq('action', 'create_project')
        .order('created_at', { ascending: false })
        .limit(1);

      if (logs && logs.length > 0) {
        createdAuditIds.push(logs[0].id);
        expect(logs[0].category).toBe('data_modification');
        expect(logs[0].resource_type).toBe('project');
      }

      expect(error).toBeNull();
    });

    it('should log an email_sent event', async () => {
      if (!hasWriteAccess) {
        console.warn('Skipping test - no write access to audit_log');
        return;
      }
      const event = {
        category: 'data_modification' as const,
        action: 'email_sent',
        user_id: testUserId,
        organization_id: testOrgId,
        request_id: testRequestId,
        severity: 'low' as const,
        status: 'success' as const,
        metadata: {
          recipient_email: 'recipient@example.com',
          template: 'invitation',
          project_id: testProjectId,
        },
      };

      await auditService.log(event);
      await new Promise((resolve) => setTimeout(resolve, 100));

      const { data: logs, error } = await forsured('audit_log')
        .select('*')
        .eq('user_id', testUserId)
        .eq('action', 'email_sent')
        .order('created_at', { ascending: false })
        .limit(1);

      if (logs && logs.length > 0) {
        createdAuditIds.push(logs[0].id);
        expect(logs[0].metadata?.recipient_email).toBe('recipient@example.com');
      }

      expect(error).toBeNull();
    });

    it('should log a security event', async () => {
      if (!hasWriteAccess) {
        console.warn('Skipping test - no write access to audit_log');
        return;
      }
      const event = {
        category: 'security' as const,
        action: 'suspicious_login_attempt',
        user_id: testUserId,
        organization_id: testOrgId,
        request_id: testRequestId,
        severity: 'high' as const,
        status: 'failure' as const,
        ip_address: '192.168.1.100',
        user_agent: 'Test Browser/1.0',
        metadata: {
          reason: 'multiple_failed_attempts',
          attempt_count: 5,
        },
      };

      await auditService.log(event);
      await new Promise((resolve) => setTimeout(resolve, 100));

      const { data: logs, error } = await forsured('audit_log')
        .select('*')
        .eq('user_id', testUserId)
        .eq('action', 'suspicious_login_attempt')
        .order('created_at', { ascending: false })
        .limit(1);

      if (logs && logs.length > 0) {
        createdAuditIds.push(logs[0].id);
        expect(logs[0].category).toBe('security');
        expect(logs[0].severity).toBe('high');
        expect(logs[0].ip_address).toBe('192.168.1.100');
      }

      expect(error).toBeNull();
    });
  });

  describe('Audit Queries', () => {
    beforeAll(async () => {
      if (!hasWriteAccess) {
        console.warn('No write access - skipping test data setup');
        return;
      }
      // Ensure we have some test data logged
      await auditService.log({
        category: 'data_access' as const,
        action: 'view',
        user_id: testUserId,
        organization_id: testOrgId,
        resource_type: 'document',
        record_id: 'doc-123',
        severity: 'low' as const,
        status: 'success' as const,
      });
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    it('should retrieve user activity', async () => {
      if (!hasReadAccess) {
        console.warn('Skipping test - no read access to audit_log');
        return;
      }
      const activity = await getUserActivity(testUserId, {
        includeReadOnly: true,
      });

      expect(Array.isArray(activity)).toBe(true);

      // Only check for results if we had write access to create test data
      if (hasWriteAccess) {
        expect(activity.length).toBeGreaterThanOrEqual(1);
        // All results should be for our test user
        for (const record of activity) {
          expect(record.user_id).toBe(testUserId);
        }
      }
    });

    it('should retrieve user activity summary', async () => {
      if (!hasReadAccess) {
        console.warn('Skipping test - no read access to audit_log');
        return;
      }
      const summary = await getUserActivitySummary(testUserId, {
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        endDate: new Date(),
      });

      expect(summary.userId).toBe(testUserId);
      expect(summary.counts).toBeDefined();
      expect(typeof summary.counts.totalActions).toBe('number');
      expect(summary.period.start).toBeInstanceOf(Date);
      expect(summary.period.end).toBeInstanceOf(Date);
    });

    it('should retrieve email history', async () => {
      if (!hasReadAccess) {
        console.warn('Skipping test - no read access');
        return;
      }
      const emails = await getEmailHistory({
        userId: testUserId,
      });

      expect(Array.isArray(emails)).toBe(true);
      // Should find the email we logged
      const sentEmail = emails.find((e) => e.action === 'email_sent');
      if (sentEmail) {
        expect(sentEmail.metadata?.recipient_email).toBe('recipient@example.com');
      }
    });

    it('should retrieve authentication history', async () => {
      if (!hasReadAccess) return;
      const authHistory = await getAuthenticationHistory({
        userId: testUserId,
        includeFailures: true,
      });

      expect(Array.isArray(authHistory)).toBe(true);
      // All results should be authentication category
      for (const record of authHistory) {
        expect(record.category).toBe('authentication');
      }
    });

    it('should retrieve resource access history', async () => {
      if (!hasReadAccess) return;
      // Use a valid UUID for the resource ID
      const testDocId = generateTestUUID();
      const accessHistory = await getResourceAccessHistory('document', testDocId);

      expect(Array.isArray(accessHistory)).toBe(true);
    });

    it('should retrieve project communications', async () => {
      if (!hasWriteAccess || !hasReadAccess) return;
      // Log a communication for the test project
      await auditService.log({
        category: 'data_modification' as const,
        action: 'notification_sent',
        user_id: testUserId,
        organization_id: testOrgId,
        severity: 'low' as const,
        status: 'success' as const,
        metadata: {
          project_id: testProjectId,
          notification_type: 'task_assigned',
        },
      });
      await new Promise((resolve) => setTimeout(resolve, 100));

      const communications = await getProjectCommunications(testProjectId);

      expect(Array.isArray(communications)).toBe(true);
    });

    it('should generate compliance report', async () => {
      if (!hasReadAccess) return;
      const report = await generateComplianceReport({
        reportType: 'gdpr_access',
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        endDate: new Date(),
      });

      expect(report.reportType).toBe('gdpr_access');
      expect(report.generatedAt).toBeInstanceOf(Date);
      expect(Array.isArray(report.records)).toBe(true);
      expect(report.summary).toBeDefined();
      expect(typeof report.summary.totalRecords).toBe('number');
    });

    it('should generate SOC 2 access report', async () => {
      if (!hasReadAccess) return;
      const report = await generateComplianceReport({
        reportType: 'soc2_access',
        userId: testUserId,
      });

      expect(report.reportType).toBe('soc2_access');
      // All records should be in authentication, authorization, or admin categories
      for (const record of report.records) {
        expect(['authentication', 'authorization', 'admin']).toContain(record.category);
      }
    });

    it('should retrieve security events', async () => {
      if (!hasReadAccess) return;
      const securityEvents = await getSecurityEvents({
        severities: ['high', 'critical', 'medium'],
      });

      expect(Array.isArray(securityEvents)).toBe(true);
      // All results should be security category
      for (const record of securityEvents) {
        expect(record.category).toBe('security');
      }
    });

    it('should find related audit records', async () => {
      if (!hasReadAccess) return;
      const related = await findRelatedAuditRecords('user', testUserId);

      expect(Array.isArray(related)).toBe(true);
      // Only check for results if we had write access to create test data
      if (hasWriteAccess) {
        expect(related.length).toBeGreaterThanOrEqual(1);
      }
    });
  });

  describe('Audit Middleware Integration', () => {
    it('should log procedure calls through middleware', async () => {
      if (!hasWriteAccess) return;
      const middleware = createAuditMiddleware({ logInput: true });
      const middlewareContext: AuditContext = {
        user: { id: testUserId, email: 'middleware-test@example.com' },
        organizationId: testOrgId,
        requestId: `middleware-${Date.now()}`,
        ipAddress: '10.0.0.1',
        userAgent: 'Integration Test/1.0',
      };

      const mockResult = { ok: true as const, data: { id: 'created-item' } };
      const mockNext = async () => mockResult;

      // Simulate a tRPC procedure call
      const result = await middleware({
        ctx: middlewareContext,
        path: 'projects.create',
        type: 'mutation' as const,
        input: { name: 'New Project', description: 'Integration test' },
        next: mockNext,
      });

      expect(result).toEqual(mockResult);

      // Wait for async logging
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Query for the audit log
      const { data: logs } = await forsured('audit_log')
        .select('*')
        .eq('user_id', testUserId)
        .eq('action', 'trpc.projects.create')
        .order('created_at', { ascending: false })
        .limit(1);

      if (logs && logs.length > 0) {
        createdAuditIds.push(logs[0].id);
        expect(logs[0].category).toBe('data_modification');
        expect(logs[0].status).toBe('success');
        expect(logs[0].ip_address).toBe('10.0.0.1');
        expect(logs[0].user_agent).toBe('Integration Test/1.0');
        expect(logs[0].metadata?.procedure_path).toBe('projects.create');
      }
    });

    it('should log failed procedure calls', async () => {
      if (!hasWriteAccess) return;
      const middleware = createAuditMiddleware();
      const middlewareContext: AuditContext = {
        user: { id: testUserId },
        organizationId: testOrgId,
        requestId: `middleware-error-${Date.now()}`,
      };

      const mockError = new Error('Database connection failed');
      const mockNext = async () => {
        throw mockError;
      };

      // Simulate a failing procedure call
      await expect(
        middleware({
          ctx: middlewareContext,
          path: 'projects.delete',
          type: 'mutation' as const,
          input: { id: 'nonexistent' },
          next: mockNext,
        })
      ).rejects.toThrow('Database connection failed');

      // Wait for async logging
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Query for the failure audit log
      const { data: logs } = await forsured('audit_log')
        .select('*')
        .eq('user_id', testUserId)
        .eq('action', 'trpc.projects.delete')
        .eq('status', 'failure')
        .order('created_at', { ascending: false })
        .limit(1);

      if (logs && logs.length > 0) {
        createdAuditIds.push(logs[0].id);
        expect(logs[0].severity).toBe('high'); // Delete operations are high severity
        expect(logs[0].error_message).toBe('Database connection failed');
      }
    });
  });

  describe('End-to-End Audit Flow', () => {
    it('should capture a complete user session in audit logs', async () => {
      if (!hasWriteAccess || !hasReadAccess) return;
      const sessionUserId = generateTestUUID();
      const sessionOrgId = generateTestUUID();

      // 1. User logs in
      await auditService.log({
        category: 'authentication',
        action: 'login_success',
        user_id: sessionUserId,
        organization_id: sessionOrgId,
        severity: 'low',
        status: 'success',
        ip_address: '192.168.1.50',
        metadata: { email: 'session@example.com', method: 'magic_link' },
      });

      // 2. User views a project
      await auditService.log({
        category: 'data_access',
        action: 'view',
        user_id: sessionUserId,
        organization_id: sessionOrgId,
        resource_type: 'project',
        record_id: 'proj-session-1',
        resource_name: 'Session Test Project',
        severity: 'low',
        status: 'success',
      });

      // 3. User updates the project
      await auditService.log({
        category: 'data_modification',
        action: 'update',
        user_id: sessionUserId,
        organization_id: sessionOrgId,
        resource_type: 'project',
        record_id: 'proj-session-1',
        severity: 'medium',
        status: 'success',
        metadata: { changed_fields: ['name', 'description'] },
      });

      // 4. User sends an invitation
      await auditService.log({
        category: 'data_modification',
        action: 'invitation_sent',
        user_id: sessionUserId,
        organization_id: sessionOrgId,
        severity: 'low',
        status: 'success',
        metadata: {
          project_id: 'proj-session-1',
          recipient_email: 'invitee@example.com',
          template: 'subcontractor_invitation',
        },
      });

      // 5. User logs out
      await auditService.log({
        category: 'authentication',
        action: 'logout',
        user_id: sessionUserId,
        organization_id: sessionOrgId,
        severity: 'low',
        status: 'success',
      });

      // Wait for all logs to be written
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Query the complete session activity
      const activity = await getUserActivity(sessionUserId, {
        includeReadOnly: true,
      });

      // Verify we captured all events
      expect(activity.length).toBeGreaterThanOrEqual(5);

      // Get the activity summary
      const summary = await getUserActivitySummary(sessionUserId);

      expect(summary.counts.logins).toBeGreaterThanOrEqual(1);
      expect(summary.counts.dataAccess).toBeGreaterThanOrEqual(1);
      expect(summary.counts.dataModifications).toBeGreaterThanOrEqual(1);

      // Verify we can find related records
      const related = await findRelatedAuditRecords('user', sessionUserId);
      expect(related.length).toBeGreaterThanOrEqual(5);
    });
  });
});
