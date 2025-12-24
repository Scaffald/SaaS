/**
 * Audit Queries Tests
 *
 * REQ-130: Comprehensive Audit Logging with 7-Year Retention
 *
 * Tests for fine-grained audit log queries for compliance reporting.
 * Tests verify that queries are built correctly with all filters and options.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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
  auditQueries,
} from '../auditQueries';
import type { AuditLogRecord, AuditCategory } from '../types';

// =============================================================================
// Mock Supabase Client Setup
// =============================================================================

/**
 * Create a chainable mock for Supabase query builder
 * This allows testing that queries are built correctly
 */
function createMockQueryBuilder(mockData: unknown[] = [], mockError: Error | null = null) {
  const queryState = {
    table: '',
    selectCols: '',
    filters: [] as { method: string; args: unknown[] }[],
    orderBy: null as { column: string; options?: { ascending: boolean } } | null,
    rangeStart: 0,
    rangeEnd: 999,
  };

  const builder = {
    from: vi.fn((table: string) => {
      queryState.table = table;
      return builder;
    }),
    select: vi.fn((cols: string) => {
      queryState.selectCols = cols;
      return builder;
    }),
    eq: vi.fn((column: string, value: unknown) => {
      queryState.filters.push({ method: 'eq', args: [column, value] });
      return builder;
    }),
    neq: vi.fn((column: string, value: unknown) => {
      queryState.filters.push({ method: 'neq', args: [column, value] });
      return builder;
    }),
    in: vi.fn((column: string, values: unknown[]) => {
      queryState.filters.push({ method: 'in', args: [column, values] });
      return builder;
    }),
    gte: vi.fn((column: string, value: unknown) => {
      queryState.filters.push({ method: 'gte', args: [column, value] });
      return builder;
    }),
    lte: vi.fn((column: string, value: unknown) => {
      queryState.filters.push({ method: 'lte', args: [column, value] });
      return builder;
    }),
    contains: vi.fn((column: string, value: unknown) => {
      queryState.filters.push({ method: 'contains', args: [column, value] });
      return builder;
    }),
    or: vi.fn((condition: string) => {
      queryState.filters.push({ method: 'or', args: [condition] });
      return builder;
    }),
    order: vi.fn((column: string, options?: { ascending: boolean }) => {
      queryState.orderBy = { column, options };
      return builder;
    }),
    range: vi.fn((start: number, end: number) => {
      queryState.rangeStart = start;
      queryState.rangeEnd = end;
      return builder;
    }),
    then: vi.fn((resolve) => {
      if (mockError) {
        resolve({ data: null, error: mockError });
      } else {
        resolve({ data: mockData, error: null });
      }
    }),
    // Direct resolution for await
    get data() {
      return mockError ? null : mockData;
    },
    get error() {
      return mockError;
    },
    // Make it thenable for async/await
    [Symbol.toStringTag]: 'Promise',
  };

  // Make the builder thenable
  Object.defineProperty(builder, 'then', {
    value: (resolve: (value: { data: unknown[] | null; error: Error | null }) => void) => {
      resolve({ data: mockError ? null : mockData, error: mockError });
      return Promise.resolve({ data: mockError ? null : mockData, error: mockError });
    },
  });

  return { builder, queryState };
}

// Helper to create a mock client
function createMockClient(mockData: unknown[] = [], mockError: Error | null = null) {
  const { builder, queryState } = createMockQueryBuilder(mockData, mockError);
  return {
    client: builder,
    queryState,
    builder,
  };
}

// Sample audit log records for testing
function createSampleAuditRecord(overrides: Partial<AuditLogRecord> = {}): AuditLogRecord {
  return {
    id: 'audit-' + Math.random().toString(36).substr(2, 9),
    created_at: new Date().toISOString(),
    category: 'data_access',
    action: 'view',
    user_id: 'user-123',
    status: 'success',
    severity: 'low',
    resource_type: 'project',
    record_id: 'proj-123',
    metadata: {},
    ...overrides,
  };
}

describe('Audit Queries', () => {
  describe('Initialization', () => {
    beforeEach(() => {
      // Reset the module's client
      initializeAuditQueries(null);
    });

    it('should throw error when queries are called without initialization', async () => {
      await expect(getUserActivity('user-123')).rejects.toThrow(
        'Audit queries not initialized. Call initializeAuditQueries() first.'
      );
    });

    it('should throw error for each query function without initialization', async () => {
      await expect(getUserActivitySummary('user-123')).rejects.toThrow(
        'Audit queries not initialized'
      );
      await expect(getEmailHistory({})).rejects.toThrow('Audit queries not initialized');
      await expect(getAuthenticationHistory({})).rejects.toThrow('Audit queries not initialized');
      await expect(getResourceAccessHistory('project', 'proj-123')).rejects.toThrow(
        'Audit queries not initialized'
      );
      await expect(getProjectCommunications('proj-123')).rejects.toThrow(
        'Audit queries not initialized'
      );
      await expect(getSubcontractorCommunications('sub-123')).rejects.toThrow(
        'Audit queries not initialized'
      );
      await expect(generateComplianceReport({ reportType: 'gdpr_access' })).rejects.toThrow(
        'Audit queries not initialized'
      );
      await expect(getSecurityEvents({})).rejects.toThrow('Audit queries not initialized');
      await expect(findRelatedAuditRecords('user', 'user-123')).rejects.toThrow(
        'Audit queries not initialized'
      );
    });

    it('should work after initialization', async () => {
      const { client } = createMockClient([]);
      initializeAuditQueries(client);

      const result = await getUserActivity('user-123');
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getUserActivity', () => {
    it('should query audit_log table with user_id filter', async () => {
      const mockRecords = [createSampleAuditRecord({ user_id: 'user-123' })];
      const { client, builder } = createMockClient(mockRecords);
      initializeAuditQueries(client);

      await getUserActivity('user-123');

      expect(builder.from).toHaveBeenCalledWith('audit_log');
      expect(builder.select).toHaveBeenCalledWith('*');
      expect(builder.eq).toHaveBeenCalledWith('user_id', 'user-123');
    });

    it('should apply date range filters', async () => {
      const { client, builder } = createMockClient([]);
      initializeAuditQueries(client);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      await getUserActivity('user-123', { startDate, endDate });

      expect(builder.gte).toHaveBeenCalledWith('created_at', startDate.toISOString());
      expect(builder.lte).toHaveBeenCalledWith('created_at', endDate.toISOString());
    });

    it('should accept string dates', async () => {
      const { client, builder } = createMockClient([]);
      initializeAuditQueries(client);

      await getUserActivity('user-123', {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      });

      expect(builder.gte).toHaveBeenCalledWith('created_at', '2024-01-01');
      expect(builder.lte).toHaveBeenCalledWith('created_at', '2024-12-31');
    });

    it('should filter by categories when specified', async () => {
      const { client, builder } = createMockClient([]);
      initializeAuditQueries(client);

      await getUserActivity('user-123', {
        categories: ['authentication', 'data_modification'],
      });

      expect(builder.in).toHaveBeenCalledWith('category', ['authentication', 'data_modification']);
    });

    it('should exclude data_access by default', async () => {
      const { client, builder } = createMockClient([]);
      initializeAuditQueries(client);

      await getUserActivity('user-123');

      expect(builder.neq).toHaveBeenCalledWith('category', 'data_access');
    });

    it('should include data_access when includeReadOnly is true', async () => {
      const { client, builder } = createMockClient([]);
      initializeAuditQueries(client);

      await getUserActivity('user-123', { includeReadOnly: true });

      expect(builder.neq).not.toHaveBeenCalled();
    });

    it('should apply pagination correctly', async () => {
      const { client, builder } = createMockClient([]);
      initializeAuditQueries(client);

      await getUserActivity('user-123', { limit: 50, offset: 100 });

      expect(builder.range).toHaveBeenCalledWith(100, 149);
    });

    it('should use default pagination of 1000', async () => {
      const { client, builder } = createMockClient([]);
      initializeAuditQueries(client);

      await getUserActivity('user-123');

      expect(builder.range).toHaveBeenCalledWith(0, 999);
    });

    it('should order by created_at descending', async () => {
      const { client, builder } = createMockClient([]);
      initializeAuditQueries(client);

      await getUserActivity('user-123');

      expect(builder.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('should throw on database error', async () => {
      const { client } = createMockClient([], new Error('Connection failed'));
      initializeAuditQueries(client);

      await expect(getUserActivity('user-123')).rejects.toThrow(
        'Failed to get user activity: Connection failed'
      );
    });

    it('should return empty array when no data', async () => {
      const { client } = createMockClient(null as unknown as unknown[]);
      initializeAuditQueries(client);

      const result = await getUserActivity('user-123');
      expect(result).toEqual([]);
    });
  });

  describe('getUserActivitySummary', () => {
    it('should calculate counts for different activity types', async () => {
      const mockRecords = [
        createSampleAuditRecord({
          category: 'authentication',
          action: 'login_success',
        }),
        createSampleAuditRecord({
          category: 'authentication',
          action: 'login_success',
        }),
        createSampleAuditRecord({
          category: 'data_access',
          action: 'view',
        }),
        createSampleAuditRecord({
          category: 'data_modification',
          action: 'update',
        }),
        createSampleAuditRecord({
          category: 'data_modification',
          action: 'email_sent',
        }),
      ];
      const { client } = createMockClient(mockRecords);
      initializeAuditQueries(client);

      const result = await getUserActivitySummary('user-123');

      expect(result.counts.totalActions).toBe(5);
      expect(result.counts.logins).toBe(2);
      expect(result.counts.dataAccess).toBe(1);
      expect(result.counts.dataModifications).toBe(2);
      expect(result.counts.communications).toBe(1);
    });

    it('should use default 30-day date range', async () => {
      const { client, builder } = createMockClient([]);
      initializeAuditQueries(client);

      const beforeCall = Date.now();
      await getUserActivitySummary('user-123');
      const afterCall = Date.now();

      // Check that gte was called with a date ~30 days ago
      expect(builder.gte).toHaveBeenCalled();
      const gteCall = builder.gte.mock.calls[0];
      const startDateArg = new Date(gteCall[1]).getTime();
      const thirtyDaysAgo = beforeCall - 30 * 24 * 60 * 60 * 1000;

      // Allow some tolerance for test execution time
      expect(startDateArg).toBeGreaterThanOrEqual(thirtyDaysAgo - 1000);
      expect(startDateArg).toBeLessThanOrEqual(afterCall);
    });

    it('should calculate top resources', async () => {
      const mockRecords = [
        createSampleAuditRecord({ resource_type: 'project' }),
        createSampleAuditRecord({ resource_type: 'project' }),
        createSampleAuditRecord({ resource_type: 'project' }),
        createSampleAuditRecord({ resource_type: 'document' }),
        createSampleAuditRecord({ resource_type: 'document' }),
        createSampleAuditRecord({ resource_type: 'task' }),
      ];
      const { client } = createMockClient(mockRecords);
      initializeAuditQueries(client);

      const result = await getUserActivitySummary('user-123');

      expect(result.topResources).toHaveLength(3);
      expect(result.topResources[0]).toEqual({ resourceType: 'project', count: 3 });
      expect(result.topResources[1]).toEqual({ resourceType: 'document', count: 2 });
      expect(result.topResources[2]).toEqual({ resourceType: 'task', count: 1 });
    });

    it('should limit top resources to 10', async () => {
      const resourceTypes = Array.from({ length: 15 }, (_, i) => `type-${i}`);
      const mockRecords = resourceTypes.map((type) =>
        createSampleAuditRecord({ resource_type: type })
      );
      const { client } = createMockClient(mockRecords);
      initializeAuditQueries(client);

      const result = await getUserActivitySummary('user-123');

      expect(result.topResources).toHaveLength(10);
    });

    it('should return lastActivity from most recent record', async () => {
      const latestDate = new Date('2024-06-15T10:00:00Z');
      const mockRecords = [
        createSampleAuditRecord({ created_at: latestDate.toISOString() }),
        createSampleAuditRecord({ created_at: new Date('2024-06-14').toISOString() }),
      ];
      const { client } = createMockClient(mockRecords);
      initializeAuditQueries(client);

      const result = await getUserActivitySummary('user-123');

      expect(result.lastActivity).toEqual(latestDate);
    });

    it('should extract userEmail from metadata', async () => {
      const mockRecords = [
        createSampleAuditRecord({ metadata: { email: 'user@example.com' } }),
      ];
      const { client } = createMockClient(mockRecords);
      initializeAuditQueries(client);

      const result = await getUserActivitySummary('user-123');

      expect(result.userEmail).toBe('user@example.com');
    });
  });

  describe('getEmailHistory', () => {
    it('should query for email_sent action', async () => {
      const { client, builder } = createMockClient([]);
      initializeAuditQueries(client);

      await getEmailHistory({});

      expect(builder.eq).toHaveBeenCalledWith('action', 'email_sent');
    });

    it('should filter by recipient email in metadata', async () => {
      const { client, builder } = createMockClient([]);
      initializeAuditQueries(client);

      await getEmailHistory({ recipientEmail: 'recipient@example.com' });

      expect(builder.contains).toHaveBeenCalledWith('metadata', {
        recipient_email: 'recipient@example.com',
      });
    });

    it('should filter by project ID in metadata', async () => {
      const { client, builder } = createMockClient([]);
      initializeAuditQueries(client);

      await getEmailHistory({ projectId: 'proj-456' });

      expect(builder.contains).toHaveBeenCalledWith('metadata', { project_id: 'proj-456' });
    });

    it('should filter by template in metadata', async () => {
      const { client, builder } = createMockClient([]);
      initializeAuditQueries(client);

      await getEmailHistory({ template: 'invitation' });

      expect(builder.contains).toHaveBeenCalledWith('metadata', { template: 'invitation' });
    });

    it('should filter by organization ID', async () => {
      const { client, builder } = createMockClient([]);
      initializeAuditQueries(client);

      await getEmailHistory({ organizationId: 'org-789' });

      expect(builder.eq).toHaveBeenCalledWith('organization_id', 'org-789');
    });

    it('should use default limit of 100', async () => {
      const { client, builder } = createMockClient([]);
      initializeAuditQueries(client);

      await getEmailHistory({});

      expect(builder.range).toHaveBeenCalledWith(0, 99);
    });
  });

  describe('getAuthenticationHistory', () => {
    it('should query for authentication category', async () => {
      const { client, builder } = createMockClient([]);
      initializeAuditQueries(client);

      await getAuthenticationHistory({});

      expect(builder.eq).toHaveBeenCalledWith('category', 'authentication');
    });

    it('should filter by user ID', async () => {
      const { client, builder } = createMockClient([]);
      initializeAuditQueries(client);

      await getAuthenticationHistory({ userId: 'user-123' });

      expect(builder.eq).toHaveBeenCalledWith('user_id', 'user-123');
    });

    it('should filter by IP address', async () => {
      const { client, builder } = createMockClient([]);
      initializeAuditQueries(client);

      await getAuthenticationHistory({ ipAddress: '192.168.1.1' });

      expect(builder.eq).toHaveBeenCalledWith('ip_address', '192.168.1.1');
    });

    it('should filter by email in metadata', async () => {
      const { client, builder } = createMockClient([]);
      initializeAuditQueries(client);

      await getAuthenticationHistory({ email: 'user@example.com' });

      expect(builder.contains).toHaveBeenCalledWith('metadata', { email: 'user@example.com' });
    });

    it('should filter out failures by default', async () => {
      const { client, builder } = createMockClient([]);
      initializeAuditQueries(client);

      await getAuthenticationHistory({});

      expect(builder.eq).toHaveBeenCalledWith('status', 'success');
    });

    it('should include failures when includeFailures is true', async () => {
      const { client, builder } = createMockClient([]);
      initializeAuditQueries(client);

      await getAuthenticationHistory({ includeFailures: true });

      // eq should not be called with 'status' = 'success'
      const statusCalls = builder.eq.mock.calls.filter(
        (call: unknown[]) => call[0] === 'status' && call[1] === 'success'
      );
      expect(statusCalls).toHaveLength(0);
    });
  });

  describe('getResourceAccessHistory', () => {
    it('should filter by resource type and record ID', async () => {
      const { client, builder } = createMockClient([]);
      initializeAuditQueries(client);

      await getResourceAccessHistory('project', 'proj-123');

      expect(builder.eq).toHaveBeenCalledWith('resource_type', 'project');
      expect(builder.eq).toHaveBeenCalledWith('record_id', 'proj-123');
    });

    it('should apply date range filters', async () => {
      const { client, builder } = createMockClient([]);
      initializeAuditQueries(client);

      await getResourceAccessHistory('document', 'doc-456', {
        startDate: '2024-01-01',
        endDate: '2024-06-30',
      });

      expect(builder.gte).toHaveBeenCalledWith('created_at', '2024-01-01');
      expect(builder.lte).toHaveBeenCalledWith('created_at', '2024-06-30');
    });
  });

  describe('getProjectCommunications', () => {
    it('should filter by project ID in metadata', async () => {
      const { client, builder } = createMockClient([]);
      initializeAuditQueries(client);

      await getProjectCommunications('proj-123');

      expect(builder.contains).toHaveBeenCalledWith('metadata', { project_id: 'proj-123' });
    });

    it('should filter for communication action types by default', async () => {
      const { client, builder } = createMockClient([]);
      initializeAuditQueries(client);

      await getProjectCommunications('proj-123');

      expect(builder.or).toHaveBeenCalledWith(
        'action.like.email%,action.like.invitation%,action.like.notification%'
      );
    });

    it('should filter by specific communication types', async () => {
      const { client, builder } = createMockClient([]);
      initializeAuditQueries(client);

      await getProjectCommunications('proj-123', { types: ['email', 'invitation'] });

      expect(builder.or).toHaveBeenCalledWith(
        'action.like.email%,action.like.invitation%'
      );
    });
  });

  describe('getSubcontractorCommunications', () => {
    it('should filter by subcontractor ID in metadata', async () => {
      const { client, builder } = createMockClient([]);
      initializeAuditQueries(client);

      await getSubcontractorCommunications('sub-123');

      expect(builder.contains).toHaveBeenCalledWith('metadata', { subcontractor_id: 'sub-123' });
    });

    it('should order by created_at descending', async () => {
      const { client, builder } = createMockClient([]);
      initializeAuditQueries(client);

      await getSubcontractorCommunications('sub-123');

      expect(builder.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });
  });

  describe('generateComplianceReport', () => {
    it('should generate GDPR access report', async () => {
      const mockRecords = [
        createSampleAuditRecord({ category: 'data_access' }),
        createSampleAuditRecord({ category: 'data_modification' }),
      ];
      const { client, builder } = createMockClient(mockRecords);
      initializeAuditQueries(client);

      const report = await generateComplianceReport({ reportType: 'gdpr_access' });

      expect(builder.in).toHaveBeenCalledWith('category', ['data_access', 'data_modification']);
      expect(report.reportType).toBe('gdpr_access');
      expect(report.summary.totalRecords).toBe(2);
    });

    it('should generate CCPA disclosure report', async () => {
      const { client, builder } = createMockClient([]);
      initializeAuditQueries(client);

      await generateComplianceReport({ reportType: 'ccpa_disclosure' });

      expect(builder.in).toHaveBeenCalledWith('action', [
        'view',
        'export',
        'download',
        'delete',
        'update',
      ]);
    });

    it('should generate SOC 2 access report', async () => {
      const { client, builder } = createMockClient([]);
      initializeAuditQueries(client);

      await generateComplianceReport({ reportType: 'soc2_access' });

      expect(builder.in).toHaveBeenCalledWith('category', [
        'authentication',
        'authorization',
        'admin',
      ]);
    });

    it('should apply organization filter', async () => {
      const { client, builder } = createMockClient([]);
      initializeAuditQueries(client);

      await generateComplianceReport({
        reportType: 'gdpr_access',
        organizationId: 'org-123',
      });

      expect(builder.eq).toHaveBeenCalledWith('organization_id', 'org-123');
    });

    it('should apply user filter', async () => {
      const { client, builder } = createMockClient([]);
      initializeAuditQueries(client);

      await generateComplianceReport({
        reportType: 'gdpr_access',
        userId: 'user-123',
      });

      expect(builder.eq).toHaveBeenCalledWith('user_id', 'user-123');
    });

    it('should calculate category counts in summary', async () => {
      const mockRecords = [
        createSampleAuditRecord({ category: 'data_access', action: 'view' }),
        createSampleAuditRecord({ category: 'data_access', action: 'view' }),
        createSampleAuditRecord({ category: 'data_modification', action: 'update' }),
      ];
      const { client } = createMockClient(mockRecords);
      initializeAuditQueries(client);

      const report = await generateComplianceReport({ reportType: 'custom' });

      expect(report.summary.categoryCounts.data_access).toBe(2);
      expect(report.summary.categoryCounts.data_modification).toBe(1);
    });

    it('should calculate action counts in summary', async () => {
      const mockRecords = [
        createSampleAuditRecord({ action: 'view' }),
        createSampleAuditRecord({ action: 'view' }),
        createSampleAuditRecord({ action: 'update' }),
        createSampleAuditRecord({ action: 'delete' }),
      ];
      const { client } = createMockClient(mockRecords);
      initializeAuditQueries(client);

      const report = await generateComplianceReport({ reportType: 'custom' });

      expect(report.summary.actionCounts.view).toBe(2);
      expect(report.summary.actionCounts.update).toBe(1);
      expect(report.summary.actionCounts.delete).toBe(1);
    });

    it('should include generatedAt timestamp', async () => {
      const { client } = createMockClient([]);
      initializeAuditQueries(client);

      const beforeCall = new Date();
      const report = await generateComplianceReport({ reportType: 'custom' });
      const afterCall = new Date();

      expect(report.generatedAt.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
      expect(report.generatedAt.getTime()).toBeLessThanOrEqual(afterCall.getTime());
    });
  });

  describe('getSecurityEvents', () => {
    it('should filter for security category', async () => {
      const { client, builder } = createMockClient([]);
      initializeAuditQueries(client);

      await getSecurityEvents({});

      expect(builder.eq).toHaveBeenCalledWith('category', 'security');
    });

    it('should filter for high and critical severity by default', async () => {
      const { client, builder } = createMockClient([]);
      initializeAuditQueries(client);

      await getSecurityEvents({});

      expect(builder.in).toHaveBeenCalledWith('severity', ['high', 'critical']);
    });

    it('should use custom severity filters when specified', async () => {
      const { client, builder } = createMockClient([]);
      initializeAuditQueries(client);

      await getSecurityEvents({ severities: ['medium', 'high'] });

      expect(builder.in).toHaveBeenCalledWith('severity', ['medium', 'high']);
    });

    it('should filter by organization ID', async () => {
      const { client, builder } = createMockClient([]);
      initializeAuditQueries(client);

      await getSecurityEvents({ organizationId: 'org-123' });

      expect(builder.eq).toHaveBeenCalledWith('organization_id', 'org-123');
    });
  });

  describe('findRelatedAuditRecords', () => {
    it('should search by user_id for user entity type', async () => {
      const { client, builder } = createMockClient([]);
      initializeAuditQueries(client);

      await findRelatedAuditRecords('user', 'user-123');

      expect(builder.or).toHaveBeenCalled();
      const orCall = builder.or.mock.calls[0][0];
      expect(orCall).toContain('user_id.eq.user-123');
    });

    it('should search by organization_id for organization entity type', async () => {
      const { client, builder } = createMockClient([]);
      initializeAuditQueries(client);

      await findRelatedAuditRecords('organization', 'org-123');

      expect(builder.or).toHaveBeenCalled();
      const orCall = builder.or.mock.calls[0][0];
      expect(orCall).toContain('organization_id.eq.org-123');
    });

    it('should search in metadata for project entity type', async () => {
      const { client, builder } = createMockClient([]);
      initializeAuditQueries(client);

      await findRelatedAuditRecords('project', 'proj-123');

      expect(builder.or).toHaveBeenCalled();
      const orCall = builder.or.mock.calls[0][0];
      expect(orCall).toContain('record_id.eq.proj-123');
    });

    it('should use default limit of 500', async () => {
      const { client, builder } = createMockClient([]);
      initializeAuditQueries(client);

      await findRelatedAuditRecords('user', 'user-123');

      expect(builder.range).toHaveBeenCalledWith(0, 499);
    });

    it('should apply custom pagination', async () => {
      const { client, builder } = createMockClient([]);
      initializeAuditQueries(client);

      await findRelatedAuditRecords('user', 'user-123', { limit: 100, offset: 200 });

      expect(builder.range).toHaveBeenCalledWith(200, 299);
    });
  });

  describe('auditQueries namespace export', () => {
    it('should export all query functions', () => {
      expect(typeof auditQueries.getUserActivity).toBe('function');
      expect(typeof auditQueries.getUserActivitySummary).toBe('function');
      expect(typeof auditQueries.getEmailHistory).toBe('function');
      expect(typeof auditQueries.getAuthenticationHistory).toBe('function');
      expect(typeof auditQueries.getResourceAccessHistory).toBe('function');
      expect(typeof auditQueries.getProjectCommunications).toBe('function');
      expect(typeof auditQueries.getSubcontractorCommunications).toBe('function');
      expect(typeof auditQueries.generateComplianceReport).toBe('function');
      expect(typeof auditQueries.getSecurityEvents).toBe('function');
      expect(typeof auditQueries.findRelatedAuditRecords).toBe('function');
    });
  });

  describe('Error Handling', () => {
    it('should provide meaningful error messages for each function', async () => {
      const testCases = [
        {
          fn: () => getUserActivity('user-123'),
          expectedMsg: 'Failed to get user activity:',
        },
        {
          fn: () => getUserActivitySummary('user-123'),
          expectedMsg: 'Failed to get user activity summary:',
        },
        {
          fn: () => getEmailHistory({}),
          expectedMsg: 'Failed to get email history:',
        },
        {
          fn: () => getAuthenticationHistory({}),
          expectedMsg: 'Failed to get authentication history:',
        },
        {
          fn: () => getResourceAccessHistory('project', 'proj-123'),
          expectedMsg: 'Failed to get resource access history:',
        },
        {
          fn: () => getProjectCommunications('proj-123'),
          expectedMsg: 'Failed to get project communications:',
        },
        {
          fn: () => getSubcontractorCommunications('sub-123'),
          expectedMsg: 'Failed to get subcontractor communications:',
        },
        {
          fn: () => generateComplianceReport({ reportType: 'custom' }),
          expectedMsg: 'Failed to generate compliance report:',
        },
        {
          fn: () => getSecurityEvents({}),
          expectedMsg: 'Failed to get security events:',
        },
        {
          fn: () => findRelatedAuditRecords('user', 'user-123'),
          expectedMsg: 'Failed to find related audit records:',
        },
      ];

      for (const testCase of testCases) {
        const { client } = createMockClient([], new Error('DB error'));
        initializeAuditQueries(client);

        await expect(testCase.fn()).rejects.toThrow(testCase.expectedMsg);
      }
    });
  });
});
