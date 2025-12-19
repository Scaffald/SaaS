// src/services/auditLogService.ts
// REQ-126: Admin audit logging service
//
// Logs admin actions to the forsured.admin_audit_log table for compliance and security.

import { forsured } from '../lib/supabase';

export interface AuditLogEntry {
  admin_user_id: string;
  action: string;
  target_type?: string;
  target_id?: string;
  old_value?: Record<string, unknown>;
  new_value?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
}

export interface AuditLogRecord extends AuditLogEntry {
  id: string;
  created_at: string;
}

export interface AuditLogFilters {
  admin_user_id?: string;
  action?: string;
  target_type?: string;
  target_id?: string;
  from_date?: string;
  to_date?: string;
  limit?: number;
  offset?: number;
}

/**
 * Log an admin action to the audit log
 *
 * @param entry - The audit log entry to create
 * @returns The created audit log record
 */
export async function logAdminAction(entry: AuditLogEntry): Promise<AuditLogRecord> {
  console.log('[AuditLog] Logging action:', entry.action);

  const { data, error } = await forsured('admin_audit_log')
    .insert({
      admin_user_id: entry.admin_user_id,
      action: entry.action,
      target_type: entry.target_type || null,
      target_id: entry.target_id || null,
      old_value: entry.old_value || null,
      new_value: entry.new_value || null,
      ip_address: entry.ip_address || null,
      user_agent: entry.user_agent || null,
    })
    .select()
    .single();

  if (error) {
    console.error('[AuditLog] Failed to log action:', error);
    throw new Error(`Failed to log admin action: ${error.message}`);
  }

  console.log('[AuditLog] Action logged:', data.id);
  return data as AuditLogRecord;
}

/**
 * Get audit log entries with optional filters
 *
 * @param filters - Optional filters to apply
 * @returns Array of audit log records
 */
export async function getAuditLogs(filters: AuditLogFilters = {}): Promise<AuditLogRecord[]> {
  console.log('[AuditLog] Fetching audit logs with filters:', filters);

  let query = forsured('admin_audit_log')
    .select('*')
    .order('created_at', { ascending: false });

  // Apply filters
  if (filters.admin_user_id) {
    query = query.eq('admin_user_id', filters.admin_user_id);
  }
  if (filters.action) {
    query = query.eq('action', filters.action);
  }
  if (filters.target_type) {
    query = query.eq('target_type', filters.target_type);
  }
  if (filters.target_id) {
    query = query.eq('target_id', filters.target_id);
  }
  if (filters.from_date) {
    query = query.gte('created_at', filters.from_date);
  }
  if (filters.to_date) {
    query = query.lte('created_at', filters.to_date);
  }

  // Apply pagination
  if (filters.limit) {
    query = query.limit(filters.limit);
  }
  if (filters.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[AuditLog] Failed to fetch audit logs:', error);
    throw new Error(`Failed to fetch audit logs: ${error.message}`);
  }

  return (data || []) as AuditLogRecord[];
}

/**
 * Get a single audit log entry by ID
 *
 * @param id - The audit log entry ID
 * @returns The audit log record or null if not found
 */
export async function getAuditLogById(id: string): Promise<AuditLogRecord | null> {
  const { data, error } = await forsured('admin_audit_log')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('[AuditLog] Failed to fetch audit log:', error);
    throw new Error(`Failed to fetch audit log: ${error.message}`);
  }

  return data as AuditLogRecord | null;
}

/**
 * Get distinct action types from the audit log
 * Useful for populating filter dropdowns
 *
 * @returns Array of unique action types
 */
export async function getDistinctActions(): Promise<string[]> {
  const { data, error } = await forsured('admin_audit_log')
    .select('action')
    .order('action');

  if (error) {
    console.error('[AuditLog] Failed to fetch distinct actions:', error);
    return [];
  }

  // Get unique values
  const uniqueActions = [...new Set((data || []).map((d: { action: string }) => d.action))];
  return uniqueActions;
}

/**
 * Get distinct target types from the audit log
 * Useful for populating filter dropdowns
 *
 * @returns Array of unique target types
 */
export async function getDistinctTargetTypes(): Promise<string[]> {
  const { data, error } = await forsured('admin_audit_log')
    .select('target_type')
    .not('target_type', 'is', null)
    .order('target_type');

  if (error) {
    console.error('[AuditLog] Failed to fetch distinct target types:', error);
    return [];
  }

  // Get unique values
  const uniqueTargetTypes = [...new Set((data || []).map((d: { target_type: string }) => d.target_type))];
  return uniqueTargetTypes;
}

// Common action types for admin operations
export const AUDIT_ACTIONS = {
  // User management
  USER_TYPE_CHANGED: 'user.type_changed',
  USER_ENABLED: 'user.enabled',
  USER_DISABLED: 'user.disabled',

  // Broker management
  INVITATION_CREATED: 'invitation.created',
  INVITATION_REVOKED: 'invitation.revoked',
  INVITATION_RESENT: 'invitation.resent',
  BROKER_DISABLED: 'broker.disabled',

  // Enum management
  ENUM_CREATED: 'enum.created',
  ENUM_UPDATED: 'enum.updated',
  ENUM_DELETED: 'enum.deleted',
  ENUM_REORDERED: 'enum.reordered',

  // System
  ADMIN_LOGIN: 'admin.login',
  SETTINGS_UPDATED: 'settings.updated',
} as const;
