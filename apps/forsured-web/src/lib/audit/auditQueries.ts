/**
 * Audit Queries - Fine-Grained Audit Log Queries for Compliance Reporting
 *
 * REQ-130: Comprehensive Audit Logging with 7-Year Retention
 *
 * This module provides specialized query functions for:
 * - Compliance reporting (GDPR, CCPA, SOC 2)
 * - User activity tracking
 * - Data access auditing
 * - Communication tracking (emails, invitations)
 * - Authentication history
 * - Security incident investigation
 *
 * Usage:
 * ```typescript
 * import { auditQueries } from '../lib/audit/auditQueries';
 *
 * // Get all actions by a user
 * const userActivity = await auditQueries.getUserActivity(userId, {
 *   startDate: new Date('2024-01-01'),
 *   endDate: new Date('2024-12-31'),
 * });
 *
 * // Get email communication history
 * const emails = await auditQueries.getEmailHistory({
 *   recipientEmail: 'user@example.com',
 *   projectId: 'proj-123',
 * });
 * ```
 */

import type {
  AuditLogRecord,
  AuditLogFilters,
  AuditCategory,
  AuditSeverity,
} from './types';

// Supabase client - will be injected or imported based on project setup
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let supabaseClient: any = null;

/**
 * Initialize the queries module with a Supabase client
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function initializeAuditQueries(client: any) {
  supabaseClient = client;
}

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface DateRange {
  startDate?: Date | string;
  endDate?: Date | string;
}

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

export interface UserActivityOptions extends DateRange, PaginationOptions {
  categories?: AuditCategory[];
  includeReadOnly?: boolean;
}

export interface EmailAuditRecord {
  id: string;
  timestamp: Date;
  template: string;
  recipientEmail: string;
  recipientName?: string;
  senderContext: {
    userId?: string;
    organizationId?: string;
    projectId?: string;
  };
  status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed';
  messageId?: string;
  provider: string;
  metadata?: Record<string, unknown>;
}

export interface AuthenticationHistoryRecord {
  id: string;
  timestamp: Date;
  action: 'login_success' | 'login_failure' | 'logout' | 'magic_link_requested' | 'magic_link_used' | 'session_expired';
  userId?: string;
  email?: string;
  ipAddress?: string;
  userAgent?: string;
  location?: {
    country?: string;
    region?: string;
    city?: string;
  };
  metadata?: Record<string, unknown>;
}

export interface DataAccessRecord {
  id: string;
  timestamp: Date;
  userId: string;
  resourceType: string;
  resourceId: string;
  resourceName?: string;
  action: 'view' | 'list' | 'export' | 'download';
  organizationId?: string;
  projectId?: string;
  metadata?: Record<string, unknown>;
}

export interface CommunicationRecord {
  id: string;
  timestamp: Date;
  type: 'email' | 'invitation' | 'notification' | 'webhook';
  direction: 'inbound' | 'outbound';
  participants: {
    from?: { userId?: string; email?: string; name?: string };
    to: Array<{ userId?: string; email?: string; name?: string }>;
  };
  context: {
    projectId?: string;
    organizationId?: string;
    taskId?: string;
    subcontractorId?: string;
  };
  status: string;
  content?: {
    subject?: string;
    template?: string;
  };
  metadata?: Record<string, unknown>;
}

export interface ComplianceReportOptions extends DateRange {
  organizationId?: string;
  reportType: 'gdpr_access' | 'ccpa_disclosure' | 'soc2_access' | 'custom';
  userId?: string;
}

export interface ActivitySummary {
  userId: string;
  userEmail?: string;
  period: { start: Date; end: Date };
  counts: {
    totalActions: number;
    logins: number;
    dataAccess: number;
    dataModifications: number;
    communications: number;
  };
  lastActivity?: Date;
  topResources: Array<{ resourceType: string; count: number }>;
}

// =============================================================================
// QUERY FUNCTIONS
// =============================================================================

/**
 * Get all activity for a specific user
 */
export async function getUserActivity(
  userId: string,
  options: UserActivityOptions = {}
): Promise<AuditLogRecord[]> {
  if (!supabaseClient) {
    throw new Error('Audit queries not initialized. Call initializeAuditQueries() first.');
  }

  let query = supabaseClient
    .from('audit_log')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (options.startDate) {
    query = query.gte('created_at', toISOString(options.startDate));
  }
  if (options.endDate) {
    query = query.lte('created_at', toISOString(options.endDate));
  }
  if (options.categories?.length) {
    query = query.in('category', options.categories);
  }
  if (!options.includeReadOnly) {
    // Exclude read-only operations by default
    query = query.neq('category', 'data_access');
  }

  const limit = options.limit || 1000;
  const offset = options.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get user activity: ${error.message}`);
  }

  return data || [];
}

/**
 * Get activity summary for a user
 */
export async function getUserActivitySummary(
  userId: string,
  options: DateRange = {}
): Promise<ActivitySummary> {
  if (!supabaseClient) {
    throw new Error('Audit queries not initialized. Call initializeAuditQueries() first.');
  }

  const startDate = options.startDate ? new Date(options.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate = options.endDate ? new Date(options.endDate) : new Date();

  // Get all activity in the period
  let query = supabaseClient
    .from('audit_log')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get user activity summary: ${error.message}`);
  }

  const records = (data || []) as AuditLogRecord[];

  // Calculate counts
  const counts = {
    totalActions: records.length,
    logins: records.filter((r) => r.category === 'authentication' && r.action?.includes('login')).length,
    dataAccess: records.filter((r) => r.category === 'data_access').length,
    dataModifications: records.filter((r) => r.category === 'data_modification').length,
    communications: records.filter((r) =>
      r.action?.includes('email') || r.action?.includes('invitation') || r.action?.includes('notification')
    ).length,
  };

  // Get top resources
  const resourceCounts: Record<string, number> = {};
  for (const record of records) {
    if (record.resource_type) {
      resourceCounts[record.resource_type] = (resourceCounts[record.resource_type] || 0) + 1;
    }
  }
  const topResources = Object.entries(resourceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([resourceType, count]) => ({ resourceType, count }));

  // Get last activity
  const lastActivity = records.length > 0 ? new Date(records[0].created_at!) : undefined;

  // Get user email from records
  const userEmail = records.find((r) => r.metadata?.email)?.metadata?.email as string | undefined;

  return {
    userId,
    userEmail,
    period: { start: startDate, end: endDate },
    counts,
    lastActivity,
    topResources,
  };
}

/**
 * Get email communication history
 */
export async function getEmailHistory(
  options: {
    recipientEmail?: string;
    userId?: string;
    projectId?: string;
    organizationId?: string;
    template?: string;
  } & DateRange & PaginationOptions
): Promise<AuditLogRecord[]> {
  if (!supabaseClient) {
    throw new Error('Audit queries not initialized. Call initializeAuditQueries() first.');
  }

  let query = supabaseClient
    .from('audit_log')
    .select('*')
    .eq('action', 'email_sent')
    .order('created_at', { ascending: false });

  if (options.startDate) {
    query = query.gte('created_at', toISOString(options.startDate));
  }
  if (options.endDate) {
    query = query.lte('created_at', toISOString(options.endDate));
  }
  if (options.userId) {
    query = query.eq('user_id', options.userId);
  }
  if (options.organizationId) {
    query = query.eq('organization_id', options.organizationId);
  }

  // Filter by metadata fields
  if (options.recipientEmail) {
    query = query.contains('metadata', { recipient_email: options.recipientEmail });
  }
  if (options.projectId) {
    query = query.contains('metadata', { project_id: options.projectId });
  }
  if (options.template) {
    query = query.contains('metadata', { template: options.template });
  }

  const limit = options.limit || 100;
  const offset = options.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get email history: ${error.message}`);
  }

  return data || [];
}

/**
 * Get authentication history for a user or email
 */
export async function getAuthenticationHistory(
  options: {
    userId?: string;
    email?: string;
    ipAddress?: string;
    includeFailures?: boolean;
  } & DateRange & PaginationOptions
): Promise<AuditLogRecord[]> {
  if (!supabaseClient) {
    throw new Error('Audit queries not initialized. Call initializeAuditQueries() first.');
  }

  let query = supabaseClient
    .from('audit_log')
    .select('*')
    .eq('category', 'authentication')
    .order('created_at', { ascending: false });

  if (options.startDate) {
    query = query.gte('created_at', toISOString(options.startDate));
  }
  if (options.endDate) {
    query = query.lte('created_at', toISOString(options.endDate));
  }
  if (options.userId) {
    query = query.eq('user_id', options.userId);
  }
  if (options.ipAddress) {
    query = query.eq('ip_address', options.ipAddress);
  }
  if (options.email) {
    query = query.contains('metadata', { email: options.email });
  }
  if (!options.includeFailures) {
    query = query.eq('status', 'success');
  }

  const limit = options.limit || 100;
  const offset = options.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get authentication history: ${error.message}`);
  }

  return data || [];
}

/**
 * Get data access logs for a specific resource
 */
export async function getResourceAccessHistory(
  resourceType: string,
  resourceId: string,
  options: DateRange & PaginationOptions = {}
): Promise<AuditLogRecord[]> {
  if (!supabaseClient) {
    throw new Error('Audit queries not initialized. Call initializeAuditQueries() first.');
  }

  let query = supabaseClient
    .from('audit_log')
    .select('*')
    .eq('resource_type', resourceType)
    .eq('record_id', resourceId)
    .order('created_at', { ascending: false });

  if (options.startDate) {
    query = query.gte('created_at', toISOString(options.startDate));
  }
  if (options.endDate) {
    query = query.lte('created_at', toISOString(options.endDate));
  }

  const limit = options.limit || 100;
  const offset = options.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get resource access history: ${error.message}`);
  }

  return data || [];
}

/**
 * Get all communications related to a project
 */
export async function getProjectCommunications(
  projectId: string,
  options: {
    types?: Array<'email' | 'invitation' | 'notification'>;
  } & DateRange & PaginationOptions = {}
): Promise<AuditLogRecord[]> {
  if (!supabaseClient) {
    throw new Error('Audit queries not initialized. Call initializeAuditQueries() first.');
  }

  let query = supabaseClient
    .from('audit_log')
    .select('*')
    .contains('metadata', { project_id: projectId })
    .order('created_at', { ascending: false });

  // Filter by communication types
  if (options.types?.length) {
    const actionPatterns = options.types.map((t) => `${t}%`);
    query = query.or(actionPatterns.map((p) => `action.like.${p}`).join(','));
  } else {
    // Default to all communication types
    query = query.or('action.like.email%,action.like.invitation%,action.like.notification%');
  }

  if (options.startDate) {
    query = query.gte('created_at', toISOString(options.startDate));
  }
  if (options.endDate) {
    query = query.lte('created_at', toISOString(options.endDate));
  }

  const limit = options.limit || 100;
  const offset = options.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get project communications: ${error.message}`);
  }

  return data || [];
}

/**
 * Get all communications related to a subcontractor
 */
export async function getSubcontractorCommunications(
  subcontractorId: string,
  options: DateRange & PaginationOptions = {}
): Promise<AuditLogRecord[]> {
  if (!supabaseClient) {
    throw new Error('Audit queries not initialized. Call initializeAuditQueries() first.');
  }

  let query = supabaseClient
    .from('audit_log')
    .select('*')
    .contains('metadata', { subcontractor_id: subcontractorId })
    .order('created_at', { ascending: false });

  if (options.startDate) {
    query = query.gte('created_at', toISOString(options.startDate));
  }
  if (options.endDate) {
    query = query.lte('created_at', toISOString(options.endDate));
  }

  const limit = options.limit || 100;
  const offset = options.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get subcontractor communications: ${error.message}`);
  }

  return data || [];
}

/**
 * Generate a compliance report
 */
export async function generateComplianceReport(
  options: ComplianceReportOptions
): Promise<{
  reportType: string;
  generatedAt: Date;
  period: DateRange;
  records: AuditLogRecord[];
  summary: {
    totalRecords: number;
    categoryCounts: Record<AuditCategory, number>;
    actionCounts: Record<string, number>;
  };
}> {
  if (!supabaseClient) {
    throw new Error('Audit queries not initialized. Call initializeAuditQueries() first.');
  }

  let query = supabaseClient
    .from('audit_log')
    .select('*')
    .order('created_at', { ascending: false });

  if (options.startDate) {
    query = query.gte('created_at', toISOString(options.startDate));
  }
  if (options.endDate) {
    query = query.lte('created_at', toISOString(options.endDate));
  }
  if (options.organizationId) {
    query = query.eq('organization_id', options.organizationId);
  }
  if (options.userId) {
    query = query.eq('user_id', options.userId);
  }

  // Apply report-specific filters
  switch (options.reportType) {
    case 'gdpr_access':
      // GDPR data access report - focus on data access and export
      query = query.in('category', ['data_access', 'data_modification']);
      break;
    case 'ccpa_disclosure':
      // CCPA disclosure report - all user data activities
      query = query.in('action', ['view', 'export', 'download', 'delete', 'update']);
      break;
    case 'soc2_access':
      // SOC 2 access control report
      query = query.in('category', ['authentication', 'authorization', 'admin']);
      break;
    // 'custom' uses no additional filters
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to generate compliance report: ${error.message}`);
  }

  const records = (data || []) as AuditLogRecord[];

  // Calculate summary
  const categoryCounts: Record<string, number> = {};
  const actionCounts: Record<string, number> = {};

  for (const record of records) {
    if (record.category) {
      categoryCounts[record.category] = (categoryCounts[record.category] || 0) + 1;
    }
    if (record.action) {
      actionCounts[record.action] = (actionCounts[record.action] || 0) + 1;
    }
  }

  return {
    reportType: options.reportType,
    generatedAt: new Date(),
    period: {
      startDate: options.startDate,
      endDate: options.endDate,
    },
    records,
    summary: {
      totalRecords: records.length,
      categoryCounts: categoryCounts as Record<AuditCategory, number>,
      actionCounts,
    },
  };
}

/**
 * Get security-relevant events (high/critical severity)
 */
export async function getSecurityEvents(
  options: {
    organizationId?: string;
    severities?: AuditSeverity[];
    includeResolved?: boolean;
  } & DateRange & PaginationOptions = {}
): Promise<AuditLogRecord[]> {
  if (!supabaseClient) {
    throw new Error('Audit queries not initialized. Call initializeAuditQueries() first.');
  }

  let query = supabaseClient
    .from('audit_log')
    .select('*')
    .eq('category', 'security')
    .order('created_at', { ascending: false });

  if (options.startDate) {
    query = query.gte('created_at', toISOString(options.startDate));
  }
  if (options.endDate) {
    query = query.lte('created_at', toISOString(options.endDate));
  }
  if (options.organizationId) {
    query = query.eq('organization_id', options.organizationId);
  }
  if (options.severities?.length) {
    query = query.in('severity', options.severities);
  } else {
    query = query.in('severity', ['high', 'critical']);
  }

  const limit = options.limit || 100;
  const offset = options.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get security events: ${error.message}`);
  }

  return data || [];
}

/**
 * Find all audit records related to a specific entity
 * Useful for investigation and compliance
 */
export async function findRelatedAuditRecords(
  entityType: 'user' | 'project' | 'subcontractor' | 'organization' | 'document' | 'task',
  entityId: string,
  options: DateRange & PaginationOptions = {}
): Promise<AuditLogRecord[]> {
  if (!supabaseClient) {
    throw new Error('Audit queries not initialized. Call initializeAuditQueries() first.');
  }

  // Map entity types to their possible locations in audit records
  const searchFields: Record<typeof entityType, string[]> = {
    user: ['user_id'],
    project: ['metadata->>project_id', 'record_id'],
    subcontractor: ['metadata->>subcontractor_id', 'record_id'],
    organization: ['organization_id'],
    document: ['record_id', 'metadata->>document_id'],
    task: ['record_id', 'metadata->>task_id'],
  };

  const fields = searchFields[entityType];

  // Build OR query for all possible field locations
  let query = supabaseClient
    .from('audit_log')
    .select('*')
    .order('created_at', { ascending: false });

  // For simple fields, use eq; for metadata, use contains
  const conditions = fields.map((field) => {
    if (field.includes('->>')) {
      // JSONB field in metadata
      const metadataKey = field.replace('metadata->>', '');
      return `metadata.cs.{"${metadataKey}":"${entityId}"}`;
    }
    return `${field}.eq.${entityId}`;
  });

  query = query.or(conditions.join(','));

  if (options.startDate) {
    query = query.gte('created_at', toISOString(options.startDate));
  }
  if (options.endDate) {
    query = query.lte('created_at', toISOString(options.endDate));
  }

  const limit = options.limit || 500;
  const offset = options.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to find related audit records: ${error.message}`);
  }

  return data || [];
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function toISOString(date: Date | string): string {
  return date instanceof Date ? date.toISOString() : date;
}

// =============================================================================
// EXPORTS
// =============================================================================

export const auditQueries = {
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
};

export default auditQueries;
